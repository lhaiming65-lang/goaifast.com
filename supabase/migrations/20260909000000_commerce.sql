-- Digital commerce: all financial and fulfillment mutations run in locked server RPCs.
-- Apply after existing migrations. Monetary values are integer USD cents; no browser prices are trusted.
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS warranty_days integer NOT NULL DEFAULT 7 CHECK (warranty_days BETWEEN 0 AND 3650);
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS auto_replace boolean NOT NULL DEFAULT false;
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS max_replacements integer NOT NULL DEFAULT 1 CHECK (max_replacements BETWEEN 0 AND 5);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE public.commerce_accounts (
  user_id uuid PRIMARY KEY, closed_at timestamptz
);
CREATE TABLE public.commerce_wallets (
  user_id uuid PRIMARY KEY, balance_cents bigint NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  order_number text NOT NULL UNIQUE DEFAULT ('GO-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','paid','processing','delivered','completed','cancelled','refund_pending','refunded')),
  total_cents bigint NOT NULL CHECK (total_cents > 0), currency text NOT NULL DEFAULT 'USD' CHECK(currency = 'USD'),
  payment_method text NOT NULL CHECK(payment_method IN ('wallet','stripe')), idempotency_key text NOT NULL,
  request_fingerprint text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour', paid_at timestamptz, delivered_at timestamptz, completed_at timestamptz,
  UNIQUE(user_id,idempotency_key)
);
CREATE INDEX commerce_orders_user_created ON public.commerce_orders(user_id,created_at DESC);
CREATE TABLE public.commerce_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.commerce_orders(id),
  product_id uuid NOT NULL REFERENCES public.store_products(id), title text NOT NULL,
  quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 100), unit_price_cents bigint NOT NULL CHECK(unit_price_cents>0),
  delivery_method text NOT NULL, warranty_days integer NOT NULL,
  auto_replace boolean NOT NULL, max_replacements integer NOT NULL, replacement_count integer NOT NULL DEFAULT 0,
  UNIQUE(order_id,product_id)
);
CREATE TABLE public.commerce_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES public.store_products(id), secret text NOT NULL CHECK(length(secret) BETWEEN 1 AND 10000),
  secret_fingerprint text GENERATED ALWAYS AS (md5(secret)) STORED,
  status text NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','delivered','disabled','replaced','refunded')),
  order_id uuid REFERENCES public.commerce_orders(id), item_id uuid REFERENCES public.commerce_order_items(id),
  expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz,
  UNIQUE(product_id,secret_fingerprint)
);
CREATE INDEX commerce_inventory_available ON public.commerce_inventory(product_id,status);
CREATE TABLE public.commerce_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, order_id uuid REFERENCES public.commerce_orders(id),
  kind text NOT NULL CHECK(kind IN ('order','topup')), provider text NOT NULL CHECK(provider IN ('stripe','wallet')),
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','succeeded','expired','cancelled','refund_due','refund_pending','refunded')),
  amount_cents bigint NOT NULL CHECK(amount_cents>0), currency text NOT NULL DEFAULT 'USD' CHECK(currency='USD'),
  idempotency_key text NOT NULL, provider_ref text UNIQUE, provider_session_id text UNIQUE, checkout_url text, checkout_claimed_at timestamptz, last_reconciled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour', paid_at timestamptz,
  UNIQUE(user_id,kind,idempotency_key), UNIQUE(order_id)
);
CREATE TABLE public.commerce_wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.commerce_wallets(user_id),
  delta_cents bigint NOT NULL CHECK(delta_cents<>0), balance_after_cents bigint NOT NULL CHECK(balance_after_cents>=0),
  kind text NOT NULL CHECK(kind IN ('topup','purchase','refund','refund_hold','refund_release')),
  payment_id uuid REFERENCES public.commerce_payments(id), order_id uuid REFERENCES public.commerce_orders(id),
  operation_key text NOT NULL UNIQUE, description text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES public.commerce_orders(id),
  item_id uuid NOT NULL REFERENCES public.commerce_order_items(id), inventory_id uuid NOT NULL UNIQUE REFERENCES public.commerce_inventory(id),
  secret text NOT NULL, generation integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','replaced','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid REFERENCES public.commerce_orders(id),
  kind text NOT NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, order_id uuid REFERENCES public.commerce_orders(id),
  item_id uuid REFERENCES public.commerce_order_items(id), kind text NOT NULL CHECK(kind IN ('replacement','refund','complaint','question')),
  status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','resolved','closed','rejected')),
  replacement_applied boolean NOT NULL DEFAULT false, subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 200), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id uuid NOT NULL REFERENCES public.commerce_tickets(id),
  author_id uuid, is_admin boolean NOT NULL DEFAULT false, body text NOT NULL CHECK(length(body) BETWEEN 1 AND 10000), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, payment_id uuid NOT NULL REFERENCES public.commerce_payments(id),
  order_id uuid REFERENCES public.commerce_orders(id), amount_cents bigint NOT NULL CHECK(amount_cents>0), currency text NOT NULL DEFAULT 'USD' CHECK(currency='USD'),
  provider text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','succeeded','failed')),
  reason text NOT NULL, provider_ref text UNIQUE, previous_order_status text, previous_payment_status text, idempotency_key text, failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE UNIQUE INDEX commerce_one_live_refund ON public.commerce_refunds(payment_id) WHERE status='pending';
CREATE UNIQUE INDEX commerce_refund_idempotency ON public.commerce_refunds(user_id,idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE TABLE public.commerce_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid, action text NOT NULL, entity_id uuid, details jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.commerce_webhook_events (
  provider_event_id text PRIMARY KEY, event_type text NOT NULL, processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX commerce_payments_user_created ON public.commerce_payments(user_id,created_at DESC);
CREATE INDEX commerce_payments_pending ON public.commerce_payments(expires_at) WHERE status='pending';
CREATE INDEX commerce_wallet_ledger_user_created ON public.commerce_wallet_ledger(user_id,created_at DESC);
CREATE INDEX commerce_inventory_order ON public.commerce_inventory(order_id);
CREATE INDEX commerce_inventory_item ON public.commerce_inventory(item_id);
CREATE INDEX commerce_deliveries_order ON public.commerce_deliveries(order_id);
CREATE INDEX commerce_deliveries_item ON public.commerce_deliveries(item_id);
CREATE INDEX commerce_events_order ON public.commerce_events(order_id,created_at);
CREATE INDEX commerce_tickets_user ON public.commerce_tickets(user_id,updated_at DESC);
CREATE INDEX commerce_tickets_order ON public.commerce_tickets(order_id);
CREATE INDEX commerce_ticket_messages_ticket ON public.commerce_ticket_messages(ticket_id,created_at);
CREATE INDEX commerce_refunds_payment ON public.commerce_refunds(payment_id);
CREATE INDEX commerce_refunds_user ON public.commerce_refunds(user_id,created_at DESC);

-- Remove historic customer order mutations and authenticated-wide operational access.
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
REVOKE INSERT,UPDATE,DELETE ON public.orders FROM authenticated;
DO $$ DECLARE p record; t text; BEGIN
  FOR p IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE schemaname='public' AND (tablename LIKE 'go\_%' ESCAPE '\' OR tablename='admin_site_store') AND policyname LIKE 'Authenticated%' LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
  END LOOP;
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND (tablename LIKE 'go\_%' ESCAPE '\' OR tablename='admin_site_store') LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY commerce_legacy_admin_only ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))',t);
  END LOOP;
END $$;
-- Legacy order financial records must survive deletion of the auth identity.
-- Cloud schemas may use a different constraint name; match the actual relation
-- and column so account deletion cannot silently cascade into historical orders.
DO $$ DECLARE fk record; BEGIN
 FOR fk IN
  SELECT c.conname FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attname='user_id'
  WHERE c.contype='f' AND c.conrelid='public.orders'::regclass
   AND c.confrelid='auth.users'::regclass AND a.attnum=ANY(c.conkey)
 LOOP
  EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I',fk.conname);
 END LOOP;
END $$;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'commerce\_%' ESCAPE '\' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  END LOOP;
END $$;
-- Reading goes through snapshots, to avoid revealing inventory or third party records.

CREATE OR REPLACE FUNCTION public.commerce_lock_user(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION '请先登录' USING ERRCODE='28000'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,81732));
  IF EXISTS(SELECT 1 FROM commerce_accounts WHERE user_id=p_user_id AND closed_at IS NOT NULL) THEN RAISE EXCEPTION '账号已注销'; END IF;
  INSERT INTO commerce_accounts(user_id) VALUES(p_user_id) ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.commerce_order_snapshot(p_order_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object(
 'order',(SELECT to_jsonb(o) - 'request_fingerprint' FROM commerce_orders o WHERE id=p_order_id),
 'items',COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.id) FROM commerce_order_items i WHERE order_id=p_order_id),'[]'::jsonb),
 'deliveries',COALESCE((SELECT jsonb_agg(to_jsonb(d) - 'inventory_id' ORDER BY d.created_at) FROM commerce_deliveries d WHERE order_id=p_order_id),'[]'::jsonb),
 'events',COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.created_at) FROM commerce_events e WHERE order_id=p_order_id),'[]'::jsonb),
 'payments',COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.created_at) FROM commerce_payments p WHERE order_id=p_order_id),'[]'::jsonb),
 'refunds',COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at) FROM commerce_refunds r WHERE order_id=p_order_id),'[]'::jsonb),
 'tickets',COALESCE((SELECT jsonb_agg(to_jsonb(t)||jsonb_build_object('messages',COALESCE((SELECT jsonb_agg((to_jsonb(m)||jsonb_build_object('message',m.body,'author_role',CASE WHEN m.is_admin THEN 'admin' ELSE 'customer' END)) ORDER BY m.created_at) FROM commerce_ticket_messages m WHERE ticket_id=t.id),'[]'::jsonb)) ORDER BY t.created_at) FROM commerce_tickets t WHERE order_id=p_order_id),'[]'::jsonb))
$$;

CREATE OR REPLACE FUNCTION public.commerce_deliver(p_order_id uuid,p_manual boolean DEFAULT false) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE o commerce_orders%ROWTYPE; i commerce_order_items%ROWTYPE; n integer; needed integer;
BEGIN
 SELECT * INTO o FROM commerce_orders WHERE id=p_order_id FOR UPDATE;
 IF o.status NOT IN ('paid','processing') THEN RETURN; END IF;
 FOR i IN SELECT * FROM commerce_order_items WHERE order_id=o.id ORDER BY product_id LOOP
  IF p_manual OR i.delivery_method <> 'manual' THEN
   -- A delayed webhook or manual fulfillment must never disclose an expired credential.
   UPDATE commerce_inventory SET status='disabled',order_id=NULL,item_id=NULL WHERE item_id=i.id AND status='reserved' AND expires_at<=now();
   SELECT i.quantity-(SELECT count(*) FROM commerce_deliveries WHERE item_id=i.id AND generation=0)-(SELECT count(*) FROM commerce_inventory WHERE item_id=i.id AND status='reserved') INTO needed;
   IF needed>0 THEN
    UPDATE commerce_inventory SET status='reserved',order_id=o.id,item_id=i.id WHERE id IN
     (SELECT id FROM commerce_inventory WHERE product_id=i.product_id AND status='available' AND (expires_at IS NULL OR expires_at>now()) ORDER BY expires_at ASC NULLS LAST,created_at,id LIMIT needed FOR UPDATE SKIP LOCKED);
   END IF;
   IF (SELECT count(*) FROM commerce_inventory WHERE item_id=i.id AND status='reserved')+(SELECT count(*) FROM commerce_deliveries WHERE item_id=i.id AND generation=0)<i.quantity THEN CONTINUE; END IF;
   INSERT INTO commerce_deliveries(order_id,item_id,inventory_id,secret)
     SELECT o.id,i.id,s.id,s.secret FROM commerce_inventory s WHERE s.item_id=i.id AND s.status='reserved' AND (s.expires_at IS NULL OR s.expires_at>now()) ON CONFLICT(inventory_id) DO NOTHING;
   UPDATE commerce_inventory SET status='delivered',delivered_at=now() WHERE item_id=i.id AND status='reserved' AND (expires_at IS NULL OR expires_at>now());
  END IF;
 END LOOP;
 IF (SELECT count(*) FROM commerce_deliveries WHERE order_id=o.id AND generation=0)=(SELECT sum(quantity) FROM commerce_order_items WHERE order_id=o.id) THEN
  UPDATE commerce_orders SET status='delivered',delivered_at=COALESCE(delivered_at,now()) WHERE id=o.id;
  INSERT INTO commerce_events(order_id,kind,message) VALUES(o.id,'delivered','数字商品已交付，请在订单详情查看并及时验证');
 ELSE
  UPDATE commerce_orders SET status='processing' WHERE id=o.id;
  INSERT INTO commerce_events(order_id,kind,message) SELECT o.id,'delivery_pending','已收款，正在等待人工交付或补充有效库存' WHERE NOT EXISTS(SELECT 1 FROM commerce_events WHERE order_id=o.id AND kind='delivery_pending');
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.commerce_claim_payment(p_payment_id uuid,p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p commerce_payments%ROWTYPE;
BEGIN
 PERFORM commerce_lock_user(p_user_id);
 SELECT * INTO p FROM commerce_payments WHERE id=p_payment_id AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION '支付记录不存在'; END IF;
 IF p.status<>'pending' OR p.provider<>'stripe' THEN RAISE EXCEPTION '支付状态不允许发起收银台'; END IF;
 IF p.expires_at<now()+interval '31 minutes' AND p.provider_session_id IS NULL THEN RAISE EXCEPTION '支付即将过期，请取消后重新下单'; END IF;
 UPDATE commerce_payments SET checkout_claimed_at=COALESCE(checkout_claimed_at,now()) WHERE id=p.id RETURNING * INTO p;
 RETURN to_jsonb(p);
END $$;

CREATE OR REPLACE FUNCTION public.commerce_settle_payment(p_payment_id uuid,p_provider_ref text,p_amount_cents bigint,p_currency text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p commerce_payments%ROWTYPE; b bigint; uid uuid;
BEGIN
 SELECT user_id INTO uid FROM commerce_payments WHERE id=p_payment_id;
 IF uid IS NULL THEN RAISE EXCEPTION '支付记录不存在'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,81732));
 SELECT * INTO p FROM commerce_payments WHERE id=p_payment_id FOR UPDATE;
 IF p.provider<>'stripe' OR p.amount_cents IS DISTINCT FROM p_amount_cents OR p.currency IS DISTINCT FROM upper(p_currency) OR nullif(trim(p_provider_ref),'') IS NULL THEN RAISE EXCEPTION '支付金额、币种或凭证不匹配'; END IF;
 IF p.status IN ('succeeded','refund_pending','refunded','refund_due') THEN
  IF p.provider_ref IS DISTINCT FROM p_provider_ref THEN RAISE EXCEPTION '支付凭证冲突'; END IF;
  RETURN jsonb_build_object('payment',to_jsonb(p),'duplicate',true);
 END IF;
 IF p.status IN ('expired','cancelled') OR EXISTS(SELECT 1 FROM commerce_accounts WHERE user_id=uid AND closed_at IS NOT NULL) THEN
  UPDATE commerce_payments SET status='refund_due',provider_ref=p_provider_ref,paid_at=now() WHERE id=p.id RETURNING * INTO p;
  INSERT INTO commerce_audit(action,entity_id,details) VALUES('late_payment_refund_due',p.id,jsonb_build_object('amount_cents',p.amount_cents));
  RETURN jsonb_build_object('payment',to_jsonb(p),'refund_due',true);
 END IF;
 UPDATE commerce_payments SET status='succeeded',provider_ref=p_provider_ref,paid_at=now() WHERE id=p.id RETURNING * INTO p;
 IF p.kind='topup' THEN
  INSERT INTO commerce_wallets(user_id) VALUES(p.user_id) ON CONFLICT DO NOTHING;
  UPDATE commerce_wallets SET balance_cents=balance_cents+p.amount_cents,updated_at=now() WHERE user_id=p.user_id RETURNING balance_cents INTO b;
  INSERT INTO commerce_wallet_ledger(user_id,delta_cents,balance_after_cents,kind,payment_id,operation_key,description) VALUES(p.user_id,p.amount_cents,b,'topup',p.id,'topup:'||p.id,'Stripe 钱包充值');
 ELSE
  UPDATE commerce_orders SET status='paid',paid_at=now() WHERE id=p.order_id AND status='pending_payment';
  IF NOT FOUND THEN RAISE EXCEPTION '订单支付状态冲突'; END IF;
  INSERT INTO commerce_events(order_id,kind,message) VALUES(p.order_id,'paid','Stripe 支付已由服务端确认');
  PERFORM commerce_deliver(p.order_id);
 END IF;
 RETURN jsonb_build_object('payment',to_jsonb(p));
END $$;

CREATE OR REPLACE FUNCTION public.commerce_expire_payment(p_payment_id uuid,p_provider_session_id text DEFAULT NULL,p_verified_orphan boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p commerce_payments%ROWTYPE; uid uuid;
BEGIN
 SELECT user_id INTO uid FROM commerce_payments WHERE id=p_payment_id;
 IF uid IS NULL THEN RAISE EXCEPTION '支付记录不存在'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,81732));
 SELECT * INTO p FROM commerce_payments WHERE id=p_payment_id FOR UPDATE;
 IF p.provider_session_id IS NOT NULL AND p.provider_session_id IS DISTINCT FROM p_provider_session_id THEN RAISE EXCEPTION 'Stripe 会话不匹配'; END IF;
 IF p.status<>'pending' THEN RETURN jsonb_build_object('payment',to_jsonb(p)); END IF;
 IF p.provider_session_id IS NULL AND p.checkout_claimed_at IS NOT NULL AND (NOT p_verified_orphan OR p.expires_at>now()-interval '10 minutes') THEN RAISE EXCEPTION '已认领的支付必须先核对 Stripe 会话，不能直接释放库存'; END IF;
 UPDATE commerce_payments SET status='expired' WHERE id=p.id RETURNING * INTO p;
 IF p.order_id IS NOT NULL THEN
  UPDATE commerce_orders SET status='cancelled' WHERE id=p.order_id AND status='pending_payment';
  UPDATE commerce_inventory SET status='available',order_id=NULL,item_id=NULL WHERE order_id=p.order_id AND status='reserved';
  INSERT INTO commerce_events(order_id,kind,message) VALUES(p.order_id,'cancelled','支付已关闭，库存已释放');
 END IF;
 RETURN jsonb_build_object('payment',to_jsonb(p));
END $$;

CREATE OR REPLACE FUNCTION public.commerce_request_refund(p_payment_id uuid,p_reason text,p_amount_cents bigint DEFAULT NULL,p_idempotency_key text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p commerce_payments%ROWTYPE; r commerce_refunds%ROWTYPE; b bigint; os text; uid uuid; remaining bigint; amount bigint;
BEGIN
 SELECT user_id INTO uid FROM commerce_payments WHERE id=p_payment_id;
 IF uid IS NULL THEN RAISE EXCEPTION '退款或支付记录不存在'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,81732));
 SELECT * INTO p FROM commerce_payments WHERE id=p_payment_id FOR UPDATE;
 IF p_idempotency_key IS NOT NULL THEN
  IF length(p_idempotency_key) NOT BETWEEN 8 AND 200 THEN RAISE EXCEPTION '退款请求标识无效'; END IF;
  SELECT * INTO r FROM commerce_refunds WHERE user_id=uid AND idempotency_key=p_idempotency_key;
  IF FOUND THEN
   IF r.payment_id<>p.id OR (p_amount_cents IS NOT NULL AND r.amount_cents<>p_amount_cents) THEN RAISE EXCEPTION '退款请求标识已用于另一笔退款'; END IF;
   RETURN jsonb_build_object('refund',to_jsonb(r),'payment',to_jsonb(p));
  END IF;
 END IF;
 SELECT * INTO r FROM commerce_refunds WHERE payment_id=p.id AND status='pending';
 IF FOUND THEN
  IF p_idempotency_key IS NOT NULL AND r.idempotency_key IS DISTINCT FROM p_idempotency_key THEN RAISE EXCEPTION '该支付已有退款处理中，请等待完成'; END IF;
  RETURN jsonb_build_object('refund',to_jsonb(r),'payment',to_jsonb(p));
 END IF;
 IF p.kind='order' THEN
  SELECT * INTO r FROM commerce_refunds WHERE payment_id=p.id AND status='succeeded';
  IF FOUND THEN RETURN jsonb_build_object('refund',to_jsonb(r),'payment',to_jsonb(p)); END IF;
 END IF;
 IF p.status NOT IN ('succeeded','refund_due') THEN RAISE EXCEPTION '该支付不能退款'; END IF;
 IF length(trim(COALESCE(p_reason,''))) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION '请填写 3 至 2000 字的退款原因'; END IF;
 SELECT p.amount_cents-COALESCE(sum(amount_cents),0) INTO remaining FROM commerce_refunds WHERE payment_id=p.id AND status='succeeded';
 amount:=COALESCE(p_amount_cents,remaining);
 IF amount NOT BETWEEN 1 AND remaining OR (p.kind='order' AND amount<>p.amount_cents) THEN RAISE EXCEPTION '退款金额超出未退款金额；商品订单仅支持全额退款'; END IF;
 IF p.kind='topup' AND p.status='succeeded' THEN
  UPDATE commerce_wallets SET balance_cents=balance_cents-amount,updated_at=now() WHERE user_id=p.user_id AND balance_cents>=amount RETURNING balance_cents INTO b;
  IF NOT FOUND THEN RAISE EXCEPTION '可用钱包余额不足，请输入不超过可用余额的退款金额'; END IF;
 END IF;
 SELECT status INTO os FROM commerce_orders WHERE id=p.order_id FOR UPDATE;
 INSERT INTO commerce_refunds(user_id,payment_id,order_id,amount_cents,provider,reason,previous_order_status,previous_payment_status,idempotency_key)
 VALUES(p.user_id,p.id,p.order_id,amount,p.provider,trim(p_reason),os,p.status,p_idempotency_key) RETURNING * INTO r;
 IF p.kind='topup' AND p.status='succeeded' THEN
  INSERT INTO commerce_wallet_ledger(user_id,delta_cents,balance_after_cents,kind,payment_id,operation_key,description) VALUES(p.user_id,-amount,b,'refund_hold',p.id,'refund_hold:'||r.id,'充值退款：冻结退款金额');
 END IF;
 UPDATE commerce_payments SET status='refund_pending' WHERE id=p.id RETURNING * INTO p;
 UPDATE commerce_orders SET status='refund_pending' WHERE id=p.order_id;
 IF p.provider='wallet' THEN
  PERFORM commerce_complete_refund(r.id,'wallet:'||r.id,true,NULL);
  SELECT * INTO r FROM commerce_refunds WHERE id=r.id;
  SELECT * INTO p FROM commerce_payments WHERE id=p.id;
 END IF;
 INSERT INTO commerce_audit(actor_id,action,entity_id) VALUES(auth.uid(),'refund_requested',r.id);
 RETURN jsonb_build_object('refund',to_jsonb(r),'payment',to_jsonb(p));
END $$;

CREATE OR REPLACE FUNCTION public.commerce_complete_refund(p_refund_id uuid,p_provider_ref text,p_succeeded boolean,p_failure_reason text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r commerce_refunds%ROWTYPE; p commerce_payments%ROWTYPE; b bigint; uid uuid;
BEGIN
 SELECT user_id INTO uid FROM commerce_refunds WHERE id=p_refund_id;
 IF uid IS NULL THEN RAISE EXCEPTION '退款或支付记录不存在'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text,81732));
 SELECT * INTO r FROM commerce_refunds WHERE id=p_refund_id FOR UPDATE;
 SELECT * INTO p FROM commerce_payments WHERE id=r.payment_id FOR UPDATE;
 IF r.status<>'pending' THEN
  IF r.status='failed' AND p_succeeded THEN RAISE EXCEPTION '已失败退款收到成功事件，需人工核对，余额未再次变更'; END IF;
  IF r.status='succeeded' AND p_succeeded AND r.provider_ref IS DISTINCT FROM p_provider_ref THEN RAISE EXCEPTION '退款凭证冲突'; END IF;
  RETURN jsonb_build_object('refund',to_jsonb(r),'duplicate',true);
 END IF;
 IF p_succeeded AND nullif(trim(p_provider_ref),'') IS NULL THEN RAISE EXCEPTION '缺少退款凭证'; END IF;
 UPDATE commerce_refunds SET status=CASE WHEN p_succeeded THEN 'succeeded' ELSE 'failed' END,provider_ref=NULLIF(p_provider_ref,''),failure_reason=CASE WHEN p_succeeded THEN NULL ELSE left(p_failure_reason,1000) END,completed_at=now() WHERE id=r.id RETURNING * INTO r;
 IF p_succeeded THEN
  UPDATE commerce_payments SET status=CASE WHEN (SELECT COALESCE(sum(amount_cents),0) FROM commerce_refunds WHERE payment_id=p.id AND status='succeeded')>=p.amount_cents THEN 'refunded' WHEN r.previous_payment_status='refund_due' THEN 'refund_due' ELSE 'succeeded' END WHERE id=p.id;
  IF p.provider='wallet' THEN
   UPDATE commerce_wallets SET balance_cents=balance_cents+r.amount_cents,updated_at=now() WHERE user_id=r.user_id RETURNING balance_cents INTO b;
   INSERT INTO commerce_wallet_ledger(user_id,delta_cents,balance_after_cents,kind,payment_id,order_id,operation_key,description) VALUES(r.user_id,r.amount_cents,b,'refund',p.id,p.order_id,'refund:'||r.id,'订单退款返还钱包');
  END IF;
  UPDATE commerce_orders SET status='refunded' WHERE id=r.order_id;
  -- Revealed codes must never go back on sale; unexposed reservations may be released.
  UPDATE commerce_inventory SET status='available',order_id=NULL,item_id=NULL WHERE order_id=r.order_id AND status='reserved';
  UPDATE commerce_inventory SET status='refunded' WHERE order_id=r.order_id AND status IN ('delivered','replaced');
  UPDATE commerce_deliveries SET status='refunded' WHERE order_id=r.order_id;
  INSERT INTO commerce_events(order_id,kind,message) SELECT r.order_id,'refunded','全额退款已完成' WHERE r.order_id IS NOT NULL;
  UPDATE commerce_tickets SET status='resolved',updated_at=now() WHERE order_id=r.order_id AND kind='refund' AND status IN ('open','in_progress');
 ELSE
  IF p.kind='topup' AND EXISTS(SELECT 1 FROM commerce_wallet_ledger WHERE operation_key='refund_hold:'||r.id) THEN
   UPDATE commerce_wallets SET balance_cents=balance_cents+r.amount_cents,updated_at=now() WHERE user_id=r.user_id RETURNING balance_cents INTO b;
   INSERT INTO commerce_wallet_ledger(user_id,delta_cents,balance_after_cents,kind,payment_id,operation_key,description) VALUES(r.user_id,r.amount_cents,b,'refund_release',p.id,'refund_release:'||r.id,'充值退款失败：释放冻结金额');
  END IF;
  UPDATE commerce_payments SET status=COALESCE(r.previous_payment_status,'succeeded') WHERE id=p.id;
  UPDATE commerce_orders SET status=COALESCE(r.previous_order_status,'paid') WHERE id=r.order_id;
 END IF;
 INSERT INTO commerce_audit(action,entity_id,details) VALUES('refund_'||r.status,r.id,jsonb_build_object('amount_cents',r.amount_cents));
 RETURN jsonb_build_object('refund',to_jsonb(r));
END $$;

-- Shared bounded replacement rule; manual approval skips only the product auto-replace toggle.
CREATE OR REPLACE FUNCTION public.commerce_replace_ticket(p_ticket_id uuid,p_require_auto boolean DEFAULT true) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE t commerce_tickets%ROWTYPE; o commerce_orders%ROWTYPE; i commerce_order_items%ROWTYPE; inv commerce_inventory%ROWTYPE; n integer; uid uuid;
BEGIN
 SELECT user_id INTO uid FROM commerce_tickets WHERE id=p_ticket_id;
 PERFORM commerce_lock_user(uid);
 SELECT * INTO t FROM commerce_tickets WHERE id=p_ticket_id FOR UPDATE;
 IF t.replacement_applied THEN RETURN true; END IF;
 SELECT * INTO o FROM commerce_orders WHERE id=t.order_id FOR UPDATE;
 SELECT * INTO i FROM commerce_order_items WHERE id=t.item_id AND order_id=t.order_id FOR UPDATE;
 IF t.kind<>'replacement' OR t.status NOT IN ('open','in_progress') OR i.id IS NULL OR (p_require_auto AND NOT i.auto_replace) OR i.replacement_count>=i.max_replacements OR o.status NOT IN ('delivered','completed') OR o.delivered_at+make_interval(days=>i.warranty_days)<=now() THEN RETURN false; END IF;
 SELECT count(*) INTO n FROM (SELECT id FROM commerce_inventory WHERE product_id=i.product_id AND status='available' AND (expires_at IS NULL OR expires_at>now()) ORDER BY created_at,id LIMIT i.quantity FOR UPDATE SKIP LOCKED) x;
 IF n<>i.quantity THEN RETURN false; END IF;
 UPDATE commerce_inventory SET status='replaced' WHERE item_id=i.id AND status='delivered';
 UPDATE commerce_deliveries SET status='replaced' WHERE item_id=i.id AND status='active';
 FOR inv IN SELECT * FROM commerce_inventory WHERE product_id=i.product_id AND status='available' AND (expires_at IS NULL OR expires_at>now()) ORDER BY created_at,id LIMIT i.quantity FOR UPDATE SKIP LOCKED LOOP
  UPDATE commerce_inventory SET status='delivered',order_id=o.id,item_id=i.id,delivered_at=now() WHERE id=inv.id;
  INSERT INTO commerce_deliveries(order_id,item_id,inventory_id,secret,generation) VALUES(o.id,i.id,inv.id,inv.secret,i.replacement_count+1);
 END LOOP;
 UPDATE commerce_order_items SET replacement_count=replacement_count+1 WHERE id=i.id;
 UPDATE commerce_tickets SET status='resolved',replacement_applied=true,updated_at=now() WHERE id=t.id;
 INSERT INTO commerce_ticket_messages(ticket_id,author_id,is_admin,body) VALUES(t.id,CASE WHEN p_require_auto THEN NULL ELSE auth.uid() END,true,'已按购买时的保修规则换货，新凭证见订单详情。原凭证仅在本站标记为替换，请停止使用。');
 INSERT INTO commerce_events(order_id,kind,message) VALUES(o.id,'replaced','商品「'||i.title||'」已按保修规则换货');
 INSERT INTO commerce_audit(actor_id,action,entity_id) VALUES(auth.uid(),CASE WHEN p_require_auto THEN 'automatic_replacement' ELSE 'manual_replacement' END,t.id);
 RETURN true;
END $$;

-- Schedule via the service reconciler. Claimed Stripe sessions are never released on a local clock alone.
CREATE OR REPLACE FUNCTION public.commerce_cleanup_unclaimed_payments() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE candidate record; p commerce_payments%ROWTYPE; n integer:=0;
BEGIN
 FOR candidate IN SELECT id,user_id FROM commerce_payments WHERE status='pending' AND expires_at<now() AND checkout_claimed_at IS NULL AND provider_session_id IS NULL ORDER BY user_id,id LIMIT 100 LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended(candidate.user_id::text,81732));
  SELECT * INTO p FROM commerce_payments WHERE id=candidate.id FOR UPDATE;
  IF p.status='pending' AND p.expires_at<now() AND p.checkout_claimed_at IS NULL AND p.provider_session_id IS NULL THEN
   PERFORM commerce_expire_payment(p.id,NULL); n:=n+1;
  END IF;
 END LOOP;
 RETURN jsonb_build_object('expired',n);
END $$;

CREATE OR REPLACE FUNCTION public.commerce_api(p_action text,p_payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
 uid uuid:=auth.uid(); adm boolean; result jsonb; cart jsonb; entry jsonb; fp text; key text; method text;
 o commerce_orders%ROWTYPE; p commerce_payments%ROWTYPE; pr store_products%ROWTYPE; i commerce_order_items%ROWTYPE;
 t commerce_tickets%ROWTYPE; inv commerce_inventory%ROWTYPE; target uuid; qty integer; total bigint:=0; unit bigint; n integer; b bigint; replaced boolean:=false; txt text; ticket_kind text;
BEGIN
 IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION '请求格式无效'; END IF;
 IF p_action='catalog' THEN
  RETURN jsonb_build_object('products',COALESCE((SELECT jsonb_agg((to_jsonb(s)-'cost'-'stock')||jsonb_build_object('price_cents',round(s.price*100)::bigint,'available_stock',(SELECT count(*) FROM commerce_inventory x WHERE x.product_id=s.id AND x.status='available' AND (x.expires_at IS NULL OR x.expires_at>now()+interval '1 hour'))) ORDER BY s.created_at) FROM store_products s WHERE s.status='active'),'[]'::jsonb));
 END IF;
 PERFORM commerce_lock_user(uid);
 adm:=public.has_role(uid,'admin');
 IF left(p_action,6)='admin_' AND NOT adm THEN RAISE EXCEPTION '需要管理员权限' USING ERRCODE='42501'; END IF;

 IF p_action='checkout' THEN
  FOR p IN SELECT * FROM commerce_payments WHERE user_id=uid AND status='pending' AND expires_at<now() AND checkout_claimed_at IS NULL AND provider_session_id IS NULL LOOP PERFORM commerce_expire_payment(p.id,NULL); END LOOP;
  key:=p_payload->>'idempotency_key'; method:=p_payload->>'payment_method';
  IF length(COALESCE(key,'')) NOT BETWEEN 8 AND 200 OR method IS NULL OR method NOT IN ('wallet','stripe') THEN RAISE EXCEPTION '支付方式或请求标识无效'; END IF;
  IF jsonb_typeof(p_payload->'items') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION '购物车不能为空'; END IF;
  IF jsonb_array_length(p_payload->'items') NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION '购物车需包含 1 至 50 种商品'; END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_payload->'items') LOOP
   IF jsonb_typeof(entry) IS DISTINCT FROM 'object' OR entry->>'product_id' IS NULL OR COALESCE(entry->>'quantity','') !~ '^[0-9]{1,3}$' OR (entry->>'quantity')::integer NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION '商品或数量无效'; END IF;
   PERFORM (entry->>'product_id')::uuid;
  END LOOP;
  SELECT jsonb_agg(jsonb_build_object('product_id',product_id,'quantity',quantity) ORDER BY product_id) INTO cart FROM (SELECT (value->>'product_id')::uuid AS product_id,sum((value->>'quantity')::integer) AS quantity FROM jsonb_array_elements(p_payload->'items') GROUP BY 1) c;
  IF (SELECT sum((value->>'quantity')::integer) FROM jsonb_array_elements(cart))>100 THEN RAISE EXCEPTION '每单最多购买 100 件商品'; END IF;
  fp:=md5(cart::text||method);
  SELECT * INTO o FROM commerce_orders WHERE user_id=uid AND idempotency_key=key;
  IF FOUND THEN
   IF o.request_fingerprint<>fp THEN RAISE EXCEPTION '请求标识已用于另一购物车，请重新结算'; END IF;
   SELECT * INTO p FROM commerce_payments WHERE order_id=o.id;
   RETURN jsonb_build_object('order',to_jsonb(o)-'request_fingerprint','payment',to_jsonb(p));
  END IF;
  IF (SELECT count(*) FROM commerce_orders WHERE user_id=uid AND status='pending_payment')>=3 THEN RAISE EXCEPTION '请先支付或关闭已有待支付订单（最多 3 笔）'; END IF;
  -- Product row locks fix the server price; deterministic product ordering avoids deadlocks.
  FOR entry IN SELECT value FROM jsonb_array_elements(cart) LOOP
   SELECT * INTO pr FROM store_products WHERE id=(entry->>'product_id')::uuid AND status='active' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION '商品已下架或不存在'; END IF;
   unit:=round(pr.price*100)::bigint;
   IF unit NOT BETWEEN 1 AND 100000000 THEN RAISE EXCEPTION '商品价格未正确配置'; END IF;
   total:=total+unit*(entry->>'quantity')::integer;
  END LOOP;
  IF p_payload ? 'expected_total_cents' AND total IS DISTINCT FROM (p_payload->>'expected_total_cents')::bigint THEN RAISE EXCEPTION '商品价格已变更，请刷新购物车重新确认'; END IF;
  IF total>100000000 OR (method='stripe' AND total<50) THEN RAISE EXCEPTION '订单金额超出支付范围（Stripe 最低 0.50 USD）'; END IF;
  INSERT INTO commerce_orders(user_id,total_cents,payment_method,idempotency_key,request_fingerprint) VALUES(uid,total,method,key,fp) RETURNING * INTO o;
  FOR entry IN SELECT value FROM jsonb_array_elements(cart) LOOP
   SELECT * INTO pr FROM store_products WHERE id=(entry->>'product_id')::uuid;
   qty:=(entry->>'quantity')::integer;
   INSERT INTO commerce_order_items(order_id,product_id,title,quantity,unit_price_cents,delivery_method,warranty_days,auto_replace,max_replacements)
    VALUES(o.id,pr.id,pr.title,qty,round(pr.price*100)::bigint,CASE WHEN pr.delivery_method='manual' THEN 'manual' ELSE 'automatic' END,pr.warranty_days,pr.auto_replace,pr.max_replacements) RETURNING * INTO i;
   UPDATE commerce_inventory SET status='reserved',order_id=o.id,item_id=i.id WHERE id IN
    (SELECT id FROM commerce_inventory WHERE product_id=pr.id AND status='available' AND (expires_at IS NULL OR expires_at>o.expires_at) ORDER BY expires_at ASC NULLS LAST,created_at,id LIMIT qty FOR UPDATE SKIP LOCKED);
   GET DIAGNOSTICS n=ROW_COUNT;
   IF n<>qty THEN RAISE EXCEPTION '商品「%」可交付库存不足，请调整数量',pr.title; END IF;
  END LOOP;
  INSERT INTO commerce_payments(user_id,order_id,kind,provider,amount_cents,idempotency_key,expires_at) VALUES(uid,o.id,'order',method,total,key,o.expires_at) RETURNING * INTO p;
  INSERT INTO commerce_events(order_id,kind,message) VALUES(o.id,'created','订单已创建，库存保留至支付完成或订单关闭');
  IF method='wallet' THEN
   INSERT INTO commerce_wallets(user_id) VALUES(uid) ON CONFLICT DO NOTHING;
   UPDATE commerce_wallets SET balance_cents=balance_cents-total,updated_at=now() WHERE user_id=uid AND balance_cents>=total RETURNING balance_cents INTO b;
   IF NOT FOUND THEN RAISE EXCEPTION '钱包余额不足，请先充值或选择 Stripe'; END IF;
   UPDATE commerce_payments SET status='succeeded',paid_at=now() WHERE id=p.id RETURNING * INTO p;
   UPDATE commerce_orders SET status='paid',paid_at=now() WHERE id=o.id;
   INSERT INTO commerce_wallet_ledger(user_id,delta_cents,balance_after_cents,kind,payment_id,order_id,operation_key,description) VALUES(uid,-total,b,'purchase',p.id,o.id,'purchase:'||o.id,'订单 '||o.order_number);
   INSERT INTO commerce_events(order_id,kind,message) VALUES(o.id,'paid','钱包支付成功');
   PERFORM commerce_deliver(o.id);
   SELECT * INTO o FROM commerce_orders WHERE id=o.id;
  END IF;
  RETURN jsonb_build_object('order',to_jsonb(o)-'request_fingerprint','payment',to_jsonb(p));

 ELSIF p_action='orders' THEN
  RETURN jsonb_build_object('orders',COALESCE((SELECT jsonb_agg((to_jsonb(x)-'request_fingerprint')||jsonb_build_object('items',COALESCE((SELECT jsonb_agg(to_jsonb(y)) FROM commerce_order_items y WHERE y.order_id=x.id),'[]'::jsonb)) ORDER BY x.created_at DESC) FROM commerce_orders x WHERE user_id=uid),'[]'::jsonb));
 ELSIF p_action='order' THEN
  SELECT * INTO o FROM commerce_orders WHERE id=(p_payload->>'order_id')::uuid AND (user_id=uid OR adm);
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或无权访问' USING ERRCODE='42501'; END IF;
  RETURN commerce_order_snapshot(o.id);
 ELSIF p_action IN ('cancel','confirm') THEN
  SELECT * INTO o FROM commerce_orders WHERE id=(p_payload->>'order_id')::uuid AND user_id=uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或无权访问' USING ERRCODE='42501'; END IF;
  IF p_action='confirm' THEN
   IF o.status='completed' THEN RETURN jsonb_build_object('order',to_jsonb(o)-'request_fingerprint'); END IF;
   IF o.status<>'delivered' THEN RAISE EXCEPTION '订单尚未交付，无法确认'; END IF;
   UPDATE commerce_orders SET status='completed',completed_at=now() WHERE id=o.id RETURNING * INTO o;
   INSERT INTO commerce_events(order_id,kind,message) VALUES(o.id,'completed','顾客已确认收货，售后仍以购买时的保修规则为准');
  ELSE
   IF o.status='cancelled' THEN RETURN jsonb_build_object('order',to_jsonb(o)-'request_fingerprint'); END IF;
   IF o.status<>'pending_payment' THEN RAISE EXCEPTION '已支付订单请申请售后退款'; END IF;
   SELECT * INTO p FROM commerce_payments WHERE order_id=o.id FOR UPDATE;
   IF p.checkout_claimed_at IS NOT NULL OR p.provider_session_id IS NOT NULL THEN RAISE EXCEPTION '收银台已创建，请先通过支付服务关闭 Stripe 会话'; END IF;
   UPDATE commerce_payments SET status='cancelled' WHERE id=p.id;
   UPDATE commerce_orders SET status='cancelled' WHERE id=o.id RETURNING * INTO o;
   UPDATE commerce_inventory SET status='available',order_id=NULL,item_id=NULL WHERE order_id=o.id AND status='reserved';
   INSERT INTO commerce_events(order_id,kind,message) VALUES(o.id,'cancelled','顾客已取消订单，库存已释放');
  END IF;
  RETURN jsonb_build_object('order',to_jsonb(o)-'request_fingerprint');
 ELSIF p_action='wallet' THEN
  INSERT INTO commerce_wallets(user_id) VALUES(uid) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('wallet',(SELECT to_jsonb(w) FROM commerce_wallets w WHERE user_id=uid),
   'ledger',COALESCE((SELECT jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC) FROM commerce_wallet_ledger l WHERE user_id=uid),'[]'::jsonb),
   'payments',COALESCE((SELECT jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC) FROM commerce_payments q WHERE user_id=uid AND kind='topup'),'[]'::jsonb),
   'refunds',COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC) FROM commerce_refunds r WHERE user_id=uid),'[]'::jsonb));
 ELSIF p_action='topup' THEN
  key:=p_payload->>'idempotency_key';
  IF length(COALESCE(key,'')) NOT BETWEEN 8 AND 200 OR COALESCE(p_payload->>'amount_cents','') !~ '^[0-9]{1,7}$' THEN RAISE EXCEPTION '充值金额或请求标识无效'; END IF;
  total:=(p_payload->>'amount_cents')::bigint;
  IF total NOT BETWEEN 100 AND 1000000 THEN RAISE EXCEPTION '单次充值须为 1 至 10,000 USD'; END IF;
  SELECT * INTO p FROM commerce_payments WHERE user_id=uid AND kind='topup' AND idempotency_key=key;
  IF FOUND THEN
   IF p.amount_cents<>total THEN RAISE EXCEPTION '请求标识已用于另一金额'; END IF;
  ELSE
   INSERT INTO commerce_payments(user_id,kind,provider,amount_cents,idempotency_key) VALUES(uid,'topup','stripe',total,key) RETURNING * INTO p;
  END IF;
  RETURN jsonb_build_object('payment',to_jsonb(p));
 ELSIF p_action='cancel_payment' THEN
  SELECT * INTO p FROM commerce_payments WHERE id=(p_payload->>'payment_id')::uuid AND user_id=uid AND kind='topup' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '充值不存在'; END IF;
  IF p.status IN ('cancelled','expired') THEN RETURN jsonb_build_object('payment',to_jsonb(p)); END IF;
  IF p.status<>'pending' THEN RAISE EXCEPTION '该充值不可取消'; END IF;
  IF p.checkout_claimed_at IS NOT NULL OR p.provider_session_id IS NOT NULL THEN RAISE EXCEPTION '请先通过支付服务关闭 Stripe 会话'; END IF;
  UPDATE commerce_payments SET status='cancelled' WHERE id=p.id RETURNING * INTO p;
  RETURN jsonb_build_object('payment',to_jsonb(p));
 ELSIF p_action='topup_refund' THEN
  SELECT * INTO p FROM commerce_payments WHERE id=(p_payload->>'payment_id')::uuid AND user_id=uid AND kind='topup';
  IF NOT FOUND THEN RAISE EXCEPTION '充值不存在或无权访问' USING ERRCODE='42501'; END IF;
  RETURN commerce_request_refund(p.id,p_payload->>'reason',(p_payload->>'amount_cents')::bigint,p_payload->>'idempotency_key');
 ELSIF p_action='support_create' THEN
  ticket_kind:=p_payload->>'kind'; txt:=trim(p_payload->>'message');
  IF ticket_kind IS NULL OR ticket_kind NOT IN ('replacement','refund','complaint','question') OR length(COALESCE(txt,'')) NOT BETWEEN 3 AND 10000 OR length(trim(COALESCE(p_payload->>'subject',''))) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION '请填写有效的问题类型、主题及 3 字以上描述'; END IF;
  IF (SELECT count(*) FROM commerce_tickets WHERE user_id=uid AND created_at>now()-interval '1 day')>=30 THEN RAISE EXCEPTION '今日工单较多，请在已有工单追加说明'; END IF;
  IF nullif(p_payload->>'order_id','') IS NOT NULL THEN
   SELECT * INTO o FROM commerce_orders WHERE id=(p_payload->>'order_id')::uuid AND user_id=uid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION '订单不存在或无权访问' USING ERRCODE='42501'; END IF;
  ELSIF ticket_kind IN ('replacement','refund') THEN RAISE EXCEPTION '换货或退款需要选择订单'; END IF;
  IF ticket_kind IN ('replacement','refund') AND o.status NOT IN ('paid','processing','delivered','completed') THEN RAISE EXCEPTION '当前订单状态不能申请该售后'; END IF;
  IF nullif(p_payload->>'item_id','') IS NOT NULL THEN
   SELECT * INTO i FROM commerce_order_items WHERE id=(p_payload->>'item_id')::uuid AND order_id=o.id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION '售后商品不属于此订单'; END IF;
  ELSIF ticket_kind='replacement' THEN RAISE EXCEPTION '请选择需要换货的商品'; END IF;
  SELECT * INTO t FROM commerce_tickets WHERE user_id=uid AND order_id=o.id AND kind=ticket_kind AND item_id IS NOT DISTINCT FROM i.id AND status IN ('open','in_progress') ORDER BY created_at DESC LIMIT 1;
  -- Keep one open request per order item and issue kind.
  IF FOUND THEN RAISE EXCEPTION '该商品已有待处理工单，请在原工单追加说明'; END IF;
  INSERT INTO commerce_tickets(user_id,order_id,item_id,kind,subject) VALUES(uid,o.id,i.id,ticket_kind,trim(p_payload->>'subject')) RETURNING * INTO t;
  INSERT INTO commerce_ticket_messages(ticket_id,author_id,body) VALUES(t.id,uid,txt);
  IF ticket_kind='replacement' THEN replaced:=commerce_replace_ticket(t.id,true); SELECT * INTO t FROM commerce_tickets WHERE id=t.id; END IF;
  RETURN jsonb_build_object('ticket',to_jsonb(t),'auto_replaced',replaced);
 ELSIF p_action='support_reply' THEN
  SELECT * INTO t FROM commerce_tickets WHERE id=(p_payload->>'ticket_id')::uuid AND (user_id=uid OR adm) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION '工单不存在或无权访问' USING ERRCODE='42501'; END IF;
  PERFORM commerce_lock_user(t.user_id);
  txt:=trim(p_payload->>'message');
  IF length(COALESCE(txt,'')) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION '请输入 1 至 10,000 字的消息'; END IF;
  INSERT INTO commerce_ticket_messages(ticket_id,author_id,is_admin,body) VALUES(t.id,uid,adm,txt);
  UPDATE commerce_tickets SET updated_at=now(),status=CASE WHEN status IN ('resolved','closed','rejected') THEN 'open' ELSE status END WHERE id=t.id RETURNING * INTO t;
  RETURN jsonb_build_object('ticket',to_jsonb(t));
 ELSIF p_action='support_detail' THEN
  SELECT * INTO t FROM commerce_tickets WHERE id=(p_payload->>'ticket_id')::uuid AND (user_id=uid OR adm);
  IF NOT FOUND THEN RAISE EXCEPTION '工单不存在或无权访问' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('ticket',to_jsonb(t),'messages',COALESCE((SELECT jsonb_agg(to_jsonb(m)||jsonb_build_object('message',m.body,'author_role',CASE WHEN m.is_admin THEN 'admin' ELSE 'customer' END) ORDER BY m.created_at) FROM commerce_ticket_messages m WHERE ticket_id=t.id),'[]'::jsonb));
 ELSIF p_action IN ('support','support_list') THEN
  RETURN jsonb_build_object('tickets',COALESCE((SELECT jsonb_agg(to_jsonb(x)||jsonb_build_object('messages',COALESCE((SELECT jsonb_agg((to_jsonb(m)||jsonb_build_object('message',m.body,'author_role',CASE WHEN m.is_admin THEN 'admin' ELSE 'customer' END)) ORDER BY m.created_at) FROM commerce_ticket_messages m WHERE ticket_id=x.id),'[]'::jsonb)) ORDER BY x.updated_at DESC) FROM commerce_tickets x WHERE user_id=uid),'[]'::jsonb));
 ELSIF p_action='admin_snapshot' THEN
  RETURN jsonb_build_object(
   'products',COALESCE((SELECT jsonb_agg(to_jsonb(s)||jsonb_build_object('price_cents',round(s.price*100)::bigint,'available_stock',(SELECT count(*) FROM commerce_inventory x WHERE x.product_id=s.id AND status='available' AND (expires_at IS NULL OR expires_at>now()))) ORDER BY s.created_at DESC) FROM store_products s),'[]'::jsonb),
   'inventory',COALESCE((SELECT jsonb_agg(to_jsonb(x)-'secret'-'secret_fingerprint' ORDER BY x.created_at DESC) FROM commerce_inventory x),'[]'::jsonb),
   'orders',COALESCE((SELECT jsonb_agg(to_jsonb(x)-'request_fingerprint' ORDER BY x.created_at DESC) FROM commerce_orders x),'[]'::jsonb),
   'payments',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM commerce_payments x),'[]'::jsonb),
   'refunds',COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM commerce_refunds x),'[]'::jsonb),
   'tickets',COALESCE((SELECT jsonb_agg(to_jsonb(x)||jsonb_build_object('messages',COALESCE((SELECT jsonb_agg((to_jsonb(m)||jsonb_build_object('message',m.body,'author_role',CASE WHEN m.is_admin THEN 'admin' ELSE 'customer' END)) ORDER BY m.created_at) FROM commerce_ticket_messages m WHERE ticket_id=x.id),'[]'::jsonb)) ORDER BY x.updated_at DESC) FROM commerce_tickets x),'[]'::jsonb));
 ELSIF p_action='admin_product' THEN
  IF nullif(p_payload->>'product_id','') IS NOT NULL THEN
   SELECT * INTO pr FROM store_products WHERE id=(p_payload->>'product_id')::uuid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION '商品不存在'; END IF;
  ELSE pr.id:=gen_random_uuid(); pr.title:=''; pr.slug:=''; pr.price:=0; pr.status:='draft'; pr.delivery_method:='automatic'; pr.warranty_days:=7; pr.auto_replace:=false; pr.max_replacements:=1; END IF;
  pr.title:=COALESCE(p_payload->>'title',pr.title); pr.slug:=COALESCE(p_payload->>'slug',pr.slug);
  IF p_payload ? 'price_cents' THEN
   IF COALESCE(p_payload->>'price_cents','') !~ '^[0-9]{1,9}$' THEN RAISE EXCEPTION '价格必须是整数美分'; END IF;
   pr.price:=(p_payload->>'price_cents')::bigint/100.0;
  END IF;
  pr.status:=COALESCE(p_payload->>'status',pr.status); pr.delivery_method:=COALESCE(p_payload->>'delivery_method',pr.delivery_method);
  pr.warranty_days:=COALESCE((p_payload->>'warranty_days')::integer,pr.warranty_days); pr.auto_replace:=COALESCE((p_payload->>'auto_replace')::boolean,pr.auto_replace); pr.max_replacements:=COALESCE((p_payload->>'max_replacements')::integer,pr.max_replacements);
  IF length(trim(pr.title)) NOT BETWEEN 1 AND 200 OR length(pr.slug) NOT BETWEEN 1 AND 100 OR pr.slug ~ '[[:cntrl:]]' OR pr.price NOT BETWEEN 0.01 AND 1000000 OR pr.status NOT IN ('active','draft','inactive') OR pr.delivery_method NOT IN ('automatic','manual','auto_manual','auto') THEN RAISE EXCEPTION '商品标题、标识、价格、状态或交付方式无效'; END IF;
  INSERT INTO store_products(id,title,slug,price,status,delivery_method,warranty_days,auto_replace,max_replacements,subtitle,detail_description,image_url,category)
  VALUES(pr.id,trim(pr.title),pr.slug,pr.price,pr.status,pr.delivery_method,pr.warranty_days,pr.auto_replace,pr.max_replacements,COALESCE(p_payload->>'subtitle',''),COALESCE(p_payload->>'detail_description',''),COALESCE(p_payload->>'image_url',''),COALESCE(p_payload->>'category','digital'))
  ON CONFLICT(id) DO UPDATE SET title=excluded.title,slug=excluded.slug,price=excluded.price,status=excluded.status,delivery_method=excluded.delivery_method,warranty_days=excluded.warranty_days,auto_replace=excluded.auto_replace,max_replacements=excluded.max_replacements,subtitle=COALESCE(p_payload->>'subtitle',store_products.subtitle),detail_description=COALESCE(p_payload->>'detail_description',store_products.detail_description),image_url=COALESCE(p_payload->>'image_url',store_products.image_url),category=COALESCE(p_payload->>'category',store_products.category) RETURNING * INTO pr;
  INSERT INTO commerce_audit(actor_id,action,entity_id) VALUES(uid,'product_saved',pr.id);
  RETURN jsonb_build_object('product',to_jsonb(pr)||jsonb_build_object('price_cents',round(pr.price*100)::bigint));
 ELSIF p_action='admin_inventory' THEN
  IF p_payload ? 'inventory_id' THEN
   IF COALESCE(p_payload->>'status','') NOT IN ('available','disabled') THEN RAISE EXCEPTION '仅能启用或禁用未售出的库存'; END IF;
   UPDATE commerce_inventory SET status=p_payload->>'status' WHERE id=(p_payload->>'inventory_id')::uuid AND status IN ('available','disabled') RETURNING * INTO inv;
   IF NOT FOUND THEN RAISE EXCEPTION '该库存不存在、已售出或已被订单占用'; END IF;
   INSERT INTO commerce_audit(actor_id,action,entity_id) VALUES(uid,'inventory_status',inv.id);
   RETURN jsonb_build_object('inventory',to_jsonb(inv)-'secret'-'secret_fingerprint');
  END IF;
  target:=(p_payload->>'product_id')::uuid;
  IF NOT EXISTS(SELECT 1 FROM store_products WHERE id=target) THEN RAISE EXCEPTION '商品不存在'; END IF;
  IF jsonb_typeof(p_payload->'secrets') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION '请提供数字商品凭证数组'; END IF;
  IF jsonb_array_length(p_payload->'secrets') NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION '每次导入 1 至 1000 条凭证'; END IF;
  IF nullif(p_payload->>'expires_at','') IS NOT NULL AND (p_payload->>'expires_at')::timestamptz<=now() THEN RAISE EXCEPTION '库存有效期必须晚于当前时间'; END IF;
  n:=0;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_payload->'secrets') LOOP
   IF jsonb_typeof(entry)<>'string' OR length(trim(entry#>>'{}')) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION '库存凭证应为非空文本'; END IF;
   INSERT INTO commerce_inventory(product_id,secret,expires_at) VALUES(target,trim(entry#>>'{}'),nullif(p_payload->>'expires_at','')::timestamptz);
   n:=n+1;
  END LOOP;
  INSERT INTO commerce_audit(actor_id,action,entity_id,details) VALUES(uid,'inventory_import',target,jsonb_build_object('count',n));
  RETURN jsonb_build_object('imported',n);
 ELSIF p_action='admin_fulfill' THEN
  SELECT * INTO o FROM commerce_orders WHERE id=(p_payload->>'order_id')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION '订单不存在'; END IF;
  PERFORM commerce_lock_user(o.user_id);
  IF o.status NOT IN ('paid','processing') THEN RAISE EXCEPTION '仅已付款待交付订单可发货'; END IF;
  PERFORM commerce_deliver(o.id,true);
  INSERT INTO commerce_audit(actor_id,action,entity_id) VALUES(uid,'manual_fulfill',o.id);
  RETURN commerce_order_snapshot(o.id);
 ELSIF p_action='admin_replace' THEN
  replaced:=commerce_replace_ticket((p_payload->>'ticket_id')::uuid,false);
  IF NOT replaced THEN RAISE EXCEPTION '暂不符合换货条件：请检查订单交付状态、保修期、换货次数及有效库存'; END IF;
  SELECT * INTO t FROM commerce_tickets WHERE id=(p_payload->>'ticket_id')::uuid;
  RETURN jsonb_build_object('ticket',to_jsonb(t),'replaced',true);
 ELSIF p_action='admin_ticket' THEN
  IF COALESCE(p_payload->>'status','') NOT IN ('open','in_progress','resolved','closed','rejected') THEN RAISE EXCEPTION '工单状态无效'; END IF;
  SELECT * INTO t FROM commerce_tickets WHERE id=(p_payload->>'ticket_id')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION '工单不存在'; END IF;
  PERFORM commerce_lock_user(t.user_id);
  UPDATE commerce_tickets SET status=p_payload->>'status',updated_at=now() WHERE id=t.id RETURNING * INTO t;
  IF NOT FOUND THEN RAISE EXCEPTION '工单不存在'; END IF;
  IF length(trim(COALESCE(p_payload->>'reply','')))>0 THEN INSERT INTO commerce_ticket_messages(ticket_id,author_id,is_admin,body) VALUES(t.id,uid,true,trim(p_payload->>'reply')); END IF;
  INSERT INTO commerce_audit(actor_id,action,entity_id) VALUES(uid,'ticket_updated',t.id);
  RETURN jsonb_build_object('ticket',to_jsonb(t));
 ELSIF p_action='admin_refund' THEN
  IF nullif(p_payload->>'payment_id','') IS NOT NULL THEN SELECT * INTO p FROM commerce_payments WHERE id=(p_payload->>'payment_id')::uuid;
  ELSE SELECT * INTO p FROM commerce_payments WHERE order_id=(p_payload->>'order_id')::uuid; END IF;
  IF NOT FOUND THEN RAISE EXCEPTION '支付记录不存在'; END IF;
  RETURN commerce_request_refund(p.id,p_payload->>'reason',(p_payload->>'amount_cents')::bigint,p_payload->>'idempotency_key');
 ELSE RAISE EXCEPTION '不支持的业务操作: %',p_action;
 END IF;
END $$;

CREATE OR REPLACE FUNCTION public.commerce_prepare_account_deletion(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p commerce_payments%ROWTYPE;
BEGIN
 IF p_user_id IS NULL THEN RAISE EXCEPTION '缺少账号标识'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text,81732));
 IF EXISTS(SELECT 1 FROM commerce_accounts WHERE user_id=p_user_id AND closed_at IS NOT NULL) THEN RETURN jsonb_build_object('ready',true,'already_closed',true); END IF;
 -- Only sessions never claimed can safely be expired locally.
 FOR p IN SELECT * FROM commerce_payments WHERE user_id=p_user_id AND status='pending' AND checkout_claimed_at IS NULL AND provider_session_id IS NULL AND expires_at<now() LOOP
  PERFORM commerce_expire_payment(p.id,NULL);
 END LOOP;
 IF EXISTS(SELECT 1 FROM commerce_wallets WHERE user_id=p_user_id AND balance_cents<>0) THEN RAISE EXCEPTION '请先使用或原路退回钱包余额后再注销'; END IF;
 IF EXISTS(SELECT 1 FROM commerce_orders WHERE user_id=p_user_id AND status NOT IN ('completed','cancelled','refunded')) THEN RAISE EXCEPTION '请先完成或关闭尚未结清的订单'; END IF;
 IF EXISTS(SELECT 1 FROM commerce_payments WHERE user_id=p_user_id AND status IN ('pending','refund_due','refund_pending')) THEN RAISE EXCEPTION '请先关闭待支付记录或完成退款'; END IF;
 IF EXISTS(SELECT 1 FROM commerce_refunds WHERE user_id=p_user_id AND status='pending') THEN RAISE EXCEPTION '请等待退款处理完成'; END IF;
 IF EXISTS(SELECT 1 FROM commerce_tickets WHERE user_id=p_user_id AND status IN ('open','in_progress')) THEN RAISE EXCEPTION '请先处理完尚未关闭的售后工单'; END IF;
 INSERT INTO commerce_accounts(user_id,closed_at) VALUES(p_user_id,now()) ON CONFLICT(user_id) DO UPDATE SET closed_at=excluded.closed_at;
 UPDATE profiles SET full_name=NULL,email=NULL,phone=NULL,avatar_url=NULL WHERE id=p_user_id;
 UPDATE orders SET delivery_email=NULL WHERE user_id=p_user_id;
 UPDATE commerce_ticket_messages SET body='[账号注销，消息内容已移除]',author_id=NULL WHERE ticket_id IN (SELECT id FROM commerce_tickets WHERE user_id=p_user_id);
 UPDATE commerce_tickets SET subject='[已注销账号的售后记录]' WHERE user_id=p_user_id;
 UPDATE commerce_deliveries SET secret='[账号已注销，凭证已移除]' WHERE order_id IN (SELECT id FROM commerce_orders WHERE user_id=p_user_id);
 UPDATE commerce_inventory SET secret='[removed:'||id||']' WHERE order_id IN (SELECT id FROM commerce_orders WHERE user_id=p_user_id) AND status IN ('delivered','replaced','refunded');
 INSERT INTO commerce_audit(actor_id,action,entity_id) VALUES(p_user_id,'account_closed',p_user_id);
 RETURN jsonb_build_object('ready',true);
END $$;

-- Only the authentication service controls verified contact email.
CREATE OR REPLACE FUNCTION public.sync_commerce_profile_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM commerce_accounts WHERE user_id=NEW.id AND closed_at IS NOT NULL) THEN
  UPDATE profiles SET email=NEW.email WHERE id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER commerce_auth_email_updated AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_commerce_profile_email();
REVOKE ALL ON FUNCTION public.sync_commerce_profile_email() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.commerce_profile_open() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT NOT EXISTS(SELECT 1 FROM commerce_accounts WHERE user_id=auth.uid() AND closed_at IS NOT NULL)
$$;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
 USING (id=auth.uid() AND commerce_profile_open()) WITH CHECK (id=auth.uid() AND commerce_profile_open());
REVOKE INSERT,UPDATE,DELETE ON public.profiles FROM authenticated;
GRANT UPDATE(full_name,avatar_url,phone) ON public.profiles TO authenticated;

-- Never leave SECURITY DEFINER helpers callable via anonymous or normal PostgREST access.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname LIKE 'commerce\_%' ESCAPE '\' LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.commerce_api(text,jsonb) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.commerce_profile_open() TO authenticated;
COMMENT ON TABLE public.commerce_inventory IS 'Secret digital stock; never select directly from browser. Only purchased deliveries are visible through owner-checked RPC.';
COMMENT ON FUNCTION public.commerce_settle_payment(uuid,text,bigint,text) IS 'Service role only. Call after authenticated Stripe webhook amount, currency and payment ownership metadata checks.';
COMMENT ON FUNCTION public.commerce_expire_payment(uuid,text,boolean) IS 'Service role only. Caller MUST verify Stripe session has expired before releasing a claimed reservation.';
COMMENT ON FUNCTION public.commerce_prepare_account_deletion(uuid) IS 'Service role only, after recent password reauthentication. Financial audit is retained under a pseudonymous UUID; then delete auth user.';
NOTIFY pgrst,'reload schema';
