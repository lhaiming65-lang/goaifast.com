import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
process.on('unhandledRejection', error => { console.error(error.message, error.where ?? '', error.detail ?? ''); process.exit(1); });
const db = new PGlite();
await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,raw_user_meta_data jsonb DEFAULT '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_user::text $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;
CREATE PUBLICATION supabase_realtime;
`);
for (const name of (await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(x=>x.endsWith('.sql')).sort()) {
  if (name==='20260909000000_commerce.sql' && process.env.COMMERCE_TEST_RENAMED_FK==='1') {
    await db.exec('ALTER TABLE public.orders RENAME CONSTRAINT orders_user_id_fkey TO cloud_custom_order_owner_reference');
  }
  try { await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8')); }
  catch(e) { console.error('MIGRATION FAILED',name,e.message); throw e; }
}
console.log('All project migrations applied successfully');
const admin='00000000-0000-4000-8000-000000000001';
const alice='00000000-0000-4000-8000-000000000002';
const bob='00000000-0000-4000-8000-000000000003';
const carol='00000000-0000-4000-8000-000000000004';
await db.query("INSERT INTO auth.users(id,email) VALUES ($1,'admin@example.test'),($2,'alice@example.test'),($3,'bob@example.test'),($4,'carol@example.test')",[admin,alice,bob,carol]);
await db.query("INSERT INTO user_roles(user_id,role) VALUES($1,'admin')",[admin]);
async function asRole(role,user='') {
 await db.exec('RESET ROLE');
 await db.query("SELECT set_config('request.jwt.claim.sub',$1,false)",[user]);
 await db.exec(`SET ROLE ${role}`);
}
async function api(user,action,payload={}) {
 await asRole(user ? 'authenticated':'anon',user??'');
 return (await db.query('SELECT commerce_api($1,$2::jsonb) AS result',[action,JSON.stringify(payload)])).rows[0].result;
}
async function service(sql,params=[]) { await asRole('service_role'); return (await db.query(sql,params)).rows; }
async function owner(sql,params=[]) { await asRole('postgres'); return (await db.query(sql,params)).rows; }
async function settle(payment,ref='pi_'+payment.id,amount=payment.amount_cents,currency='usd') {
 return (await service('SELECT commerce_settle_payment($1,$2,$3,$4) AS result',[payment.id,ref,amount,currency]))[0].result;
}
async function refundComplete(refund,success=true,ref='re_'+refund.id) {
 return (await service('SELECT commerce_complete_refund($1,$2,$3,$4) AS result',[refund.id,ref,success,success?null:'declined']))[0].result;
}
let cases=0;
async function test(name,body) { try { await body(); console.log('✓',name); cases++; } catch(e) { console.error('FAIL',name,e.message,e.where??''); process.exit(1); } }
async function rejects(fn,pattern) { await assert.rejects(fn,pattern); }
let product, manual, walletTopup, purchase, detail, partial;
await test('anonymous sees public catalog, cannot access wallet or service settlements', async()=>{
 assert.deepEqual((await api(null,'catalog')).products,[]);
 await rejects(()=>api(null,'wallet'),/请先登录/);
 await asRole('authenticated',alice);
 await rejects(()=>db.query("SELECT commerce_settle_payment(gen_random_uuid(),'fake',1,'USD')"),/permission denied/);
 await rejects(()=>db.query('SELECT * FROM commerce_inventory'),/permission denied/);
 await rejects(()=>db.query('SELECT commerce_order_snapshot(gen_random_uuid())'),/permission denied/);
});
await test('profile edits stay owned and verified email follows auth service only',async()=>{
 await asRole('authenticated',alice);
 await db.query("UPDATE profiles SET full_name='Alice',phone='+12345678' WHERE id=$1",[alice]);
 await rejects(()=>db.query("UPDATE profiles SET email='forged@example.test' WHERE id=$1",[alice]),/permission denied/);
 await owner("UPDATE auth.users SET email='verified@example.test' WHERE id=$1",[alice]);
 assert.equal((await owner('SELECT email FROM profiles WHERE id=$1',[alice]))[0].email,'verified@example.test');
 await asRole('authenticated',bob);
 const other=await db.query("UPDATE profiles SET full_name='Hacked' WHERE id=$1",[alice]); assert.equal(other.affectedRows,0);
});
await test('only administrators can configure products and inventory',async()=>{
 await rejects(()=>api(alice,'admin_snapshot'),/管理员/);
 product=(await api(admin,'admin_product',{title:'Test code',slug:'test-code',price_cents:350,status:'active',delivery_method:'automatic',warranty_days:7,auto_replace:true,max_replacements:1})).product;
 manual=(await api(admin,'admin_product',{title:'Manual delivery',slug:'manual-code',price_cents:200,status:'active',delivery_method:'manual'})).product;
 assert.equal(product.price_cents,350);
 await api(admin,'admin_inventory',{product_id:product.id,secrets:['CODE-1','CODE-2','CODE-3','CODE-4','CODE-5','CODE-6','CODE-7','CODE-8']});
 await api(admin,'admin_inventory',{product_id:manual.id,secrets:['MANUAL-1']});
 await rejects(()=>api(admin,'admin_inventory',{product_id:product.id,secrets:['NEW','CODE-1']}),/duplicate key/);
 assert.equal((await api(null,'catalog')).products.find(p=>p.id===product.id).available_stock,8);
 const snap=await api(admin,'admin_snapshot'); assert.equal('secret' in snap.inventory[0],false); assert.equal('secret_fingerprint' in snap.inventory[0],false);
});
await test('legacy self-write orders and broad inventory/settings administration are blocked',async()=>{
 await asRole('authenticated',alice);
 await rejects(()=>db.query("INSERT INTO orders(user_id,order_no,product_title) VALUES($1,'fake','fake')",[alice]),/permission denied/);
 await rejects(()=>db.query("INSERT INTO admin_site_store(id,admin_payload,public_payload) VALUES('attack','{}','{}')"),/row-level security/);
 const rows=await db.query('SELECT * FROM go_inventory_accounts'); assert.equal(rows.rows.length,0);
});
await test('negative/fractional topup rejected and only exact provider amount/currency settles',async()=>{
 await rejects(()=>api(alice,'topup',{amount_cents:-100,idempotency_key:'negative-key'}),/充值/);
 await rejects(()=>api(alice,'topup',{amount_cents:100.5,idempotency_key:'decimal-key'}),/充值/);
 walletTopup=(await api(alice,'topup',{amount_cents:2000,idempotency_key:'alice-topup-1'})).payment;
 await rejects(()=>settle(walletTopup,'pi-wrong',1999),/金额/);
 await rejects(()=>settle(walletTopup,'pi-wrong',2000,'cny'),/币种/);
 assert.equal((await api(alice,'wallet')).wallet.balance_cents,0);
 await settle(walletTopup);
 await settle(walletTopup);
 const wallet=await api(alice,'wallet'); assert.equal(wallet.wallet.balance_cents,2000); assert.equal(wallet.ledger.length,1);
 await rejects(()=>settle(walletTopup,'pi-conflict'),/凭证冲突/);
 await rejects(()=>api(alice,'topup',{amount_cents:3000,idempotency_key:'alice-topup-1'}),/另一金额/);
});
await test('cart trusts server prices, rejects changed review total and insufficient wallet atomically',async()=>{
 const request={items:[{product_id:product.id,quantity:1,price_cents:1}],payment_method:'wallet',idempotency_key:'checkout-alice-1',expected_total_cents:350};
 await rejects(()=>api(alice,'checkout',{...request,expected_total_cents:1}),/价格已变更/);
 await rejects(()=>api(bob,'checkout',request),/余额不足/);
 assert.equal((await api(null,'catalog')).products.find(p=>p.id===product.id).available_stock,8);
 purchase=await api(alice,'checkout',request);
 assert.equal(purchase.order.total_cents,350); assert.equal(purchase.order.status,'delivered');
 const retry=await api(alice,'checkout',request); assert.equal(retry.order.id,purchase.order.id);
 assert.equal((await api(alice,'wallet')).wallet.balance_cents,1650);
 assert.equal((await api(null,'catalog')).products.find(p=>p.id===product.id).available_stock,7);
 await rejects(()=>api(alice,'checkout',{...request,items:[{product_id:product.id,quantity:2}]}),/另一购物车/);
 await rejects(()=>api(alice,'checkout',{...request,idempotency_key:'negative-qty',items:[{product_id:product.id,quantity:-1}]}),/数量无效/);
});
await test('purchased credentials are visible only to buyer/admin; paid cancellation blocked',async()=>{
 detail=await api(alice,'order',{order_id:purchase.order.id});
 assert.equal(detail.deliveries.length,1); assert.ok(detail.deliveries[0].secret.startsWith('CODE-'));
 await rejects(()=>api(bob,'order',{order_id:purchase.order.id}),/无权访问/);
 await rejects(()=>api(bob,'confirm',{order_id:purchase.order.id}),/无权访问/);
 await rejects(()=>api(alice,'cancel',{order_id:purchase.order.id}),/已支付/);
 await api(alice,'confirm',{order_id:purchase.order.id});
});
await test('automatic replacement honors warranty/max and never resells exposed stock',async()=>{
 const request={order_id:purchase.order.id,item_id:detail.items[0].id,kind:'replacement',subject:'Code invalid',message:'The code is invalid'};
 const first=await api(alice,'support_create',request); assert.equal(first.auto_replaced,true); assert.equal(first.ticket.replacement_applied,true);
 const replaced=await api(alice,'order',{order_id:purchase.order.id});
 assert.equal(replaced.deliveries.length,2); assert.equal(replaced.deliveries.filter(d=>d.status==='active').length,1);
 assert.equal(replaced.items[0].replacement_count,1);
 assert.ok(replaced.tickets[0].messages[1].message);
 const second=await api(alice,'support_create',request); assert.equal(second.auto_replaced,false); assert.equal(second.ticket.status,'open');
 await rejects(()=>api(alice,'support_create',request),/已有待处理/);
 await rejects(()=>api(bob,'support_reply',{ticket_id:first.ticket.id,message:'attack'}),/无权访问/);
 await api(admin,'admin_ticket',{ticket_id:second.ticket.id,status:'resolved',reply:'Replacement limit reached; reviewed by support.'});
 const msg=await api(alice,'support_detail',{ticket_id:second.ticket.id}); assert.equal(msg.messages.at(-1).author_role,'admin');
});
await test('partial topup refund holds exact cents and repeated failure releases only once',async()=>{
 partial=await api(alice,'topup_refund',{payment_id:walletTopup.id,amount_cents:300,idempotency_key:'partial-refund-1',reason:'Refund unused balance'});
 assert.equal(partial.refund.amount_cents,300); assert.equal((await api(alice,'wallet')).wallet.balance_cents,1350);
 assert.equal((await api(alice,'topup_refund',{payment_id:walletTopup.id,amount_cents:300,idempotency_key:'partial-refund-1',reason:'retry'})).refund.id,partial.refund.id);
 await rejects(()=>api(alice,'topup_refund',{payment_id:walletTopup.id,amount_cents:301,idempotency_key:'partial-refund-1',reason:'retry'}),/另一笔/);
 await refundComplete(partial.refund,false);
 await refundComplete(partial.refund,false);
 assert.equal((await api(alice,'wallet')).wallet.balance_cents,1650);
 await rejects(()=>refundComplete(partial.refund,true),/人工核对/);
 partial=await api(alice,'topup_refund',{payment_id:walletTopup.id,amount_cents:300,idempotency_key:'partial-refund-2',reason:'Refund unused balance'});
 await refundComplete(partial.refund,true); await refundComplete(partial.refund,true);
 assert.equal((await api(alice,'wallet')).wallet.balance_cents,1350);
 assert.equal((await api(alice,'wallet')).payments.find(p=>p.id===walletTopup.id).status,'succeeded');
 await rejects(()=>api(alice,'topup_refund',{payment_id:walletTopup.id,amount_cents:1800,idempotency_key:'partial-refund-3',reason:'Too much'}),/超出未退款/);
});
await test('wallet order refund is full, immediate, idempotent and inventory is quarantined',async()=>{
 const refunded=await api(admin,'admin_refund',{order_id:purchase.order.id,reason:'Verified defective product'});
 assert.equal(refunded.refund.status,'succeeded');
 const again=await api(admin,'admin_refund',{order_id:purchase.order.id,reason:'Duplicate click'}); assert.equal(again.refund.id,refunded.refund.id);
 assert.equal((await api(alice,'wallet')).wallet.balance_cents,1700);
 const order=await api(alice,'order',{order_id:purchase.order.id}); assert.equal(order.order.status,'refunded'); assert.ok(order.deliveries.every(d=>d.status==='refunded'));
 const inventory=await api(admin,'admin_snapshot'); assert.equal(inventory.inventory.filter(i=>i.order_id===purchase.order.id&&i.status==='refunded').length,2);
});
let stripeOrder;
await test('stock reservations prevent oversell and cancellation safely releases unused stock',async()=>{
 stripeOrder=await api(bob,'checkout',{items:[{product_id:manual.id,quantity:1}],payment_method:'stripe',idempotency_key:'stripe-bob-1'});
 await rejects(()=>api(carol,'checkout',{items:[{product_id:manual.id,quantity:1}],payment_method:'stripe',idempotency_key:'stripe-carol-1'}),/库存不足/);
 await api(bob,'cancel',{order_id:stripeOrder.order.id});
 assert.equal((await api(null,'catalog')).products.find(p=>p.id===manual.id).available_stock,1);
 stripeOrder=await api(bob,'checkout',{items:[{product_id:manual.id,quantity:1}],payment_method:'stripe',idempotency_key:'stripe-bob-2'});
 await service('SELECT commerce_claim_payment($1,$2)',[stripeOrder.payment.id,bob]);
 await rejects(()=>api(bob,'cancel',{order_id:stripeOrder.order.id}),/关闭 Stripe/);
 await service("UPDATE commerce_payments SET provider_session_id='cs_bob' WHERE id=$1",[stripeOrder.payment.id]);
 await rejects(()=>service('SELECT commerce_expire_payment($1,$2)',[stripeOrder.payment.id,'cs_wrong']),/不匹配/);
 await settle(stripeOrder.payment);
 assert.equal((await api(bob,'order',{order_id:stripeOrder.order.id})).order.status,'processing');
 await rejects(()=>api(bob,'admin_fulfill',{order_id:stripeOrder.order.id}),/管理员/);
 await api(admin,'admin_fulfill',{order_id:stripeOrder.order.id});
 assert.equal((await api(bob,'order',{order_id:stripeOrder.order.id})).deliveries[0].secret,'MANUAL-1');
});
await test('late paid event after cancellation is preserved as refund_due without fulfillment',async()=>{
 const late=await api(carol,'checkout',{items:[{product_id:product.id,quantity:1}],payment_method:'stripe',idempotency_key:'late-payment-order'});
 await api(carol,'cancel',{order_id:late.order.id});
 const settled=await settle(late.payment); assert.equal(settled.payment.status,'refund_due');
 assert.equal((await api(carol,'order',{order_id:late.order.id})).deliveries.length,0);
 const refunded=await api(admin,'admin_refund',{payment_id:late.payment.id,reason:'Automatic late charge refund'});
 await refundComplete(refunded.refund);
 assert.equal((await api(carol,'order',{order_id:late.order.id})).order.status,'refunded');
});
await test('complaint conversation supports owner-only list/replies and admin resolution',async()=>{
 const t=(await api(carol,'support_create',{kind:'complaint',subject:'General complaint',message:'Please review the support experience'})).ticket;
 assert.equal((await api(carol,'support_list')).tickets.length,1);
 await api(carol,'support_reply',{ticket_id:t.id,message:'Additional details'});
 await api(admin,'admin_ticket',{ticket_id:t.id,status:'resolved',reply:'We have reviewed the complaint'});
 assert.equal((await api(carol,'support_detail',{ticket_id:t.id})).messages.length,3);
});
await test('closure blocks funds/open business, partial refund clears remaining wallet and closure retains audits',async()=>{
 await owner("INSERT INTO orders(user_id,order_no,product_title,status,delivery_email) VALUES($1,'LEGACY-RETAINED','Historical purchase','delivered','alice@example.test')",[alice]);
 await rejects(()=>service('SELECT commerce_prepare_account_deletion($1)',[alice]),/钱包余额/);
 await rejects(()=>service('SELECT commerce_prepare_account_deletion($1)',[bob]),/订单/);
 const rest=await api(alice,'topup_refund',{payment_id:walletTopup.id,amount_cents:1700,idempotency_key:'refund-wallet-rest',reason:'Close my account'});
 await refundComplete(rest.refund);
 assert.equal((await api(alice,'wallet')).wallet.balance_cents,0);
 assert.equal((await api(alice,'wallet')).payments.find(p=>p.id===walletTopup.id).status,'refunded');
 const closed=(await service('SELECT commerce_prepare_account_deletion($1) AS result',[alice]))[0].result; assert.equal(closed.ready,true);
 assert.equal((await service('SELECT commerce_prepare_account_deletion($1) AS result',[alice]))[0].result.already_closed,true);
 await rejects(()=>api(alice,'topup',{amount_cents:100,idempotency_key:'closed-account'}),/已注销/);
 assert.equal((await owner('SELECT balance_cents FROM commerce_wallets WHERE user_id=$1',[alice]))[0].balance_cents,0);
 assert.equal((await owner('SELECT secret FROM commerce_deliveries WHERE order_id=$1',[purchase.order.id]))[0].secret,'[账号已注销，凭证已移除]');
 await asRole('authenticated',alice);
 const editClosed=await db.query("UPDATE profiles SET full_name='Restored PII' WHERE id=$1",[alice]); assert.equal(editClosed.affectedRows,0);
 await owner("UPDATE auth.users SET email='should-not-restore@example.test' WHERE id=$1",[alice]);
 assert.equal((await owner('SELECT email FROM profiles WHERE id=$1',[alice]))[0].email,null);
 await owner('DELETE FROM auth.users WHERE id=$1',[alice]);
 assert.equal((await owner("SELECT count(*)::integer AS n FROM orders WHERE order_no='LEGACY-RETAINED'"))[0].n,1);
 assert.equal((await owner('SELECT count(*)::integer AS n FROM commerce_wallet_ledger WHERE user_id=$1',[alice]))[0].n>0,true);
});
await test('expired reserved credentials are quarantined; full item waits then delivers fresh stock',async()=>{
 const exp=(await api(admin,'admin_product',{title:'Expiry',slug:'Human slug + valid',price_cents:100,status:'active',delivery_method:'automatic',auto_replace:false,max_replacements:1,warranty_days:7})).product;
 await api(admin,'admin_inventory',{product_id:exp.id,secrets:['EXPIRING-1','VALID-1'],expires_at:new Date(Date.now()+7200000).toISOString()});
 const c=await api(carol,'checkout',{items:[{product_id:exp.id,quantity:2}],payment_method:'stripe',idempotency_key:'expiry-checkout-1'});
 await owner("UPDATE commerce_inventory SET expires_at=now()-interval '1 minute' WHERE secret='EXPIRING-1'");
 await settle(c.payment);
 const processing=await api(carol,'order',{order_id:c.order.id}); assert.equal(processing.order.status,'processing'); assert.equal(processing.deliveries.length,0);
 await api(admin,'admin_inventory',{product_id:exp.id,secrets:['FRESH-1']});
 await api(admin,'admin_fulfill',{order_id:c.order.id});
 const delivered=await api(carol,'order',{order_id:c.order.id}); assert.equal(delivered.order.status,'delivered'); assert.equal(delivered.deliveries.length,2); assert.ok(delivered.deliveries.every(d=>d.secret!=='EXPIRING-1'));
 const ticket=(await api(carol,'support_create',{order_id:c.order.id,item_id:delivered.items[0].id,kind:'replacement',subject:'Replace please',message:'Credentials did not work'})).ticket;
 assert.equal(ticket.status,'open');
 await api(admin,'admin_inventory',{product_id:exp.id,secrets:['MANUAL-REPLACE-1','MANUAL-REPLACE-2']});
 await api(admin,'admin_replace',{ticket_id:ticket.id}); await api(admin,'admin_replace',{ticket_id:ticket.id});
 const replaced=await api(carol,'order',{order_id:c.order.id}); assert.equal(replaced.deliveries.length,4); assert.equal(replaced.items[0].replacement_count,1);
 const limit=(await api(carol,'support_create',{order_id:c.order.id,item_id:delivered.items[0].id,kind:'replacement',subject:'Replace again',message:'Credentials did not work'})).ticket;
 await rejects(()=>api(admin,'admin_replace',{ticket_id:limit.id}),/换货条件/);
 await api(admin,'admin_ticket',{ticket_id:limit.id,status:'resolved'});
 await api(carol,'confirm',{order_id:c.order.id});
});
await test('safe orphan cleanup excludes every claimed session and is idempotent',async()=>{
 const unclaimed=(await api(carol,'topup',{amount_cents:100,idempotency_key:'orphan-unclaimed'})).payment;
 const claimed=(await api(carol,'topup',{amount_cents:100,idempotency_key:'orphan-claimed'})).payment;
 await service('SELECT commerce_claim_payment($1,$2)',[claimed.id,carol]);
 await owner("UPDATE commerce_payments SET expires_at=now()-interval '20 minutes' WHERE id IN ($1,$2)",[unclaimed.id,claimed.id]);
 const cleanup=(await service('SELECT commerce_cleanup_unclaimed_payments() AS result'))[0].result; assert.equal(cleanup.expired,1);
 await rejects(()=>service('SELECT commerce_expire_payment($1,NULL)',[claimed.id]),/核对 Stripe/);
 assert.equal((await service('SELECT commerce_cleanup_unclaimed_payments() AS result'))[0].result.expired,0);
 await service('SELECT commerce_expire_payment($1,NULL,true)',[claimed.id]);
});
await test('late charge after account closure stays refund_due through partial reversals without wallet debit',async()=>{
 const late=(await api(carol,'topup',{amount_cents:200,idempotency_key:'late-closed-topup'})).payment;
 await api(carol,'cancel_payment',{payment_id:late.id});
 await service('SELECT commerce_prepare_account_deletion($1)',[carol]);
 await owner('DELETE FROM auth.users WHERE id=$1',[carol]);
 const paid=await settle(late); assert.equal(paid.payment.status,'refund_due');
 const first=await api(admin,'admin_refund',{payment_id:late.id,amount_cents:50,idempotency_key:'late-refund-part',reason:'Late payment after closure'});
 await refundComplete(first.refund);
 assert.equal((await owner('SELECT status FROM commerce_payments WHERE id=$1',[late.id]))[0].status,'refund_due');
 const last=await api(admin,'admin_refund',{payment_id:late.id,amount_cents:150,idempotency_key:'late-refund-rest',reason:'Late payment remainder'});
 await refundComplete(last.refund);
 assert.equal((await owner('SELECT status FROM commerce_payments WHERE id=$1',[late.id]))[0].status,'refunded');
 assert.equal((await owner('SELECT count(*)::integer AS n FROM commerce_wallet_ledger WHERE user_id=$1',[carol]))[0].n,0);
});
await test('ledger sums exactly match all wallet balances',async()=>{
 const rows=await owner('SELECT w.user_id,w.balance_cents,COALESCE(sum(l.delta_cents),0)::bigint AS ledger_balance FROM commerce_wallets w LEFT JOIN commerce_wallet_ledger l ON l.user_id=w.user_id GROUP BY w.user_id');
 for(const row of rows) assert.equal(row.balance_cents,row.ledger_balance);
});
async function saveOperations(user, changes) {
 await asRole('authenticated', user);
 return (await db.query('SELECT go_admin_apply_changes($1::jsonb) AS result', [JSON.stringify(changes)])).rows[0].result;
}
const ops = (table, upserts = [], deletes = []) => ({ table, upserts, deletes });
await test('integrated workspace rejects ordinary users and non-operations tables', async()=>{
 await rejects(()=>saveOperations(alice, [ops('go_customers', [{id:'blocked',email:'blocked@example.test'}])]), /仅管理员/);
 await rejects(()=>saveOperations(admin, [ops('user_roles', [{id:admin,role:'admin'}])]), /不允许修改该数据表/);
 await rejects(()=>saveOperations(admin, [ops('go_products', [{id:'blocked',commerce_product_id:product.id}])]), /不允许修改字段/);
});
let linkedProduct;
await test('original SKU creates a linked checkout product without creating sellable stock', async()=>{
 await saveOperations(admin, [ops('go_products', [{id:'LEGACY-SKU',title_key:'legacy-linked',category:'digital',price_usd:7.5,original_price_usd:10,cost_usd:3,stock:100,delivery_mode:'mixed'}])]);
 const row=(await owner("SELECT g.id,g.commerce_product_id,s.price,s.delivery_method FROM go_products g JOIN store_products s ON s.id=g.commerce_product_id WHERE g.id='LEGACY-SKU'"))[0];
 linkedProduct=row.commerce_product_id;
 assert.equal(Number(row.price),7.5); assert.equal(row.delivery_method,'auto_manual');
 assert.equal((await owner('SELECT count(*)::int AS n FROM commerce_inventory WHERE product_id=$1',[linkedProduct]))[0].n,0);
});
await test('catalog and original SKU edits sync in both directions while warranty and original IDs survive',async()=>{
 await api(admin,'admin_product',{product_id:linkedProduct,price_cents:900,warranty_days:30,auto_replace:true,max_replacements:3});
 let row=(await owner("SELECT id,price_usd,stock FROM go_products WHERE commerce_product_id=$1",[linkedProduct]))[0];
 assert.equal(row.id,'LEGACY-SKU'); assert.equal(Number(row.price_usd),9); assert.equal(row.stock,100);
 await saveOperations(admin,[ops('go_products',[{id:'LEGACY-SKU',price_usd:12,subtitle:'Updated original editor'}])]);
 row=(await owner('SELECT * FROM store_products WHERE id=$1',[linkedProduct]))[0];
 assert.equal(Number(row.price),12); assert.equal(row.warranty_days,30); assert.equal(row.auto_replace,true); assert.equal(row.max_replacements,3);
 assert.equal(row.subtitle,'Updated original editor');
 await saveOperations(admin,[ops('go_products',[{id:'LEGACY-SKU',title_key:'legacy-renamed'}])]);
 row=(await owner('SELECT id,slug FROM store_products WHERE id=$1',[linkedProduct]))[0];
 assert.equal(row.id,linkedProduct); assert.equal(row.slug,'legacy-renamed');
 assert.equal((await owner("SELECT count(*)::int n FROM store_products WHERE slug IN ('legacy-linked','legacy-renamed')"))[0].n,1);
});
await test('saving another original module preserves catalog, account pool and concurrent unrelated fields',async()=>{
 await saveOperations(admin,[ops('go_customers',[{id:'OPS-USER',email:'ops@example.test',notes:'first'}])]);
 await owner("UPDATE go_customers SET risk_tag='high' WHERE id='OPS-USER'");
 const before=(await owner('SELECT count(*)::int n FROM go_products'))[0].n;
 await saveOperations(admin,[ops('go_customers',[{id:'OPS-USER',notes:'next'}])]);
 assert.equal((await owner("SELECT risk_tag FROM go_customers WHERE id='OPS-USER'"))[0].risk_tag,'high');
 assert.equal((await owner('SELECT count(*)::int n FROM go_products'))[0].n,before);
 assert.equal(Number((await owner('SELECT price FROM store_products WHERE id=$1',[linkedProduct]))[0].price),12);
});
await test('operations batch rolls back entirely on error and deleting original product only archives catalog',async()=>{
 await rejects(()=>saveOperations(admin,[ops('go_products',[{id:'LEGACY-SKU',price_usd:99}]),ops('commerce_wallets',[])]), /不允许修改该数据表/);
 assert.equal(Number((await owner('SELECT price FROM store_products WHERE id=$1',[linkedProduct]))[0].price),12);
 await saveOperations(admin,[ops('go_products',[],['LEGACY-SKU'])]);
 assert.equal((await owner('SELECT status FROM store_products WHERE id=$1',[linkedProduct]))[0].status,'inactive');
});
await test('original global delivery switch pauses paid online orders while manual fulfillment still works',async()=>{
 const p=(await api(admin,'admin_product',{title:'Shared delivery switch',slug:'shared-delivery',price_cents:100,status:'active'})).product;
 await api(admin,'admin_inventory',{product_id:p.id,secrets:['SHARED-SWITCH-ONE']});
 await saveOperations(admin,[ops('go_site_settings',[{id:'default',settings_payload:{autoDelivery:false}}])]);
 const order=await api(admin,'checkout',{items:[{product_id:p.id,quantity:1}],payment_method:'stripe',idempotency_key:'delivery-switch-checkout'});
 await settle(order.payment);
 assert.equal((await owner('SELECT status FROM commerce_orders WHERE id=$1',[order.order.id]))[0].status,'processing');
 assert.equal((await owner('SELECT count(*)::int n FROM commerce_deliveries WHERE order_id=$1',[order.order.id]))[0].n,0);
 await api(admin,'admin_fulfill',{order_id:order.order.id});
 assert.equal((await owner('SELECT status FROM commerce_orders WHERE id=$1',[order.order.id]))[0].status,'delivered');
 await saveOperations(admin,[ops('go_site_settings',[{id:'default',settings_payload:{autoDelivery:true}}])]);
});
console.log(`Passed ${cases} commerce database integration scenarios.`);
console.log('PGlite executes real PostgreSQL SQL, RLS and transactions; external Stripe and multi-connection contention require staging verification.');
await db.close();
