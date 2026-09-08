# Digital commerce database contract

Migration: `supabase/migrations/20260909000000_commerce.sql`. Apply **after every existing project migration**. This file defines the new business engine; historic `orders`, `go_*` admin records are retained, not reinterpreted as settled commerce transactions. Canonical products remain `store_products` UUIDs. Existing product `price` remains decimal USD; API `price_cents` and every commerce money column are integer USD cents.

## Browser RPC

`supabase.rpc('commerce_api', {p_action: action, p_payload: payload})` returns JSON. Only `catalog` is anonymous. Other actions require an authenticated, non-closed account; `admin_*` checks `user_roles` through `has_role`. Errors are PostgreSQL exceptions and roll back all writes. The browser cannot directly write any commerce table, declare a payment paid, set wallet balances, or fetch unpurchased stock secrets.

| Action | Payload | Result |
| --- | --- | --- |
| `catalog` | `{}` | `{products}` active product rows plus `price_cents`, `available_stock`, `warranty_days`, `auto_replace`, `max_replacements`; excludes internal cost and legacy stock count |
| `checkout` | `{items:[{product_id,quantity}],payment_method:'wallet'\|'stripe',idempotency_key,expected_total_cents?}` | `{order,payment}`; wallet immediately debits and fulfills; Stripe reserves actual stock and awaits provider confirmation |
| `orders` | `{}` | `{orders}` with nested `items`; owned orders only |
| `order` | `{order_id}` | `{order,items,deliveries,events,payments,refunds,tickets}`; owner or admin |
| `cancel` / `confirm` | `{order_id}` | `{order}`; pending unclaimed cancellation or delivered receipt confirmation |
| `wallet` | `{}` | `{wallet,ledger,payments,refunds}`; `payments` contains owned topups |
| `topup` | `{amount_cents,idempotency_key}` | `{payment}`; 100–1,000,000 cents, credit only on Stripe settlement |
| `cancel_payment` | `{payment_id}` | `{payment}`; pending unclaimed topup only |
| `topup_refund` | `{payment_id,reason,amount_cents?,idempotency_key?}` | `{refund,payment}`; holds the exact refund amount from available wallet balance; defaults to remaining original amount |
| `support_create` | `{order_id?,item_id?,kind,subject,message}` | `{ticket,auto_replaced}`; kind `replacement`, `refund`, `complaint`, `question`; replacement requires an item, refund requires an order |
| `support_reply` | `{ticket_id,message}` | `{ticket}`; owned/admin; reopens a resolved/closed/rejected ticket |
| `support` / `support_list` | `{}` | `{tickets}` with nested messages; owned only |
| `support_detail` | `{ticket_id}` | `{ticket,messages}`; owner/admin |
| `admin_snapshot` | `{}` | `{products,inventory,orders,payments,refunds,tickets}`; inventory excludes `secret` and its fingerprint |
| `admin_product` | `{product_id?,title?,slug?,price_cents?,status?,delivery_method?,warranty_days?,auto_replace?,max_replacements?,subtitle?,detail_description?,image_url?,category?}` | `{product}`; omit ID to create; status `active`, `draft`, `inactive`; delivery `automatic` or `manual` |
| `admin_inventory` | `{product_id,secrets:[string],expires_at?}` | `{imported}`; 1–1,000 nonduplicate credentials, all-or-nothing import |
| `admin_inventory` | `{inventory_id,status:'available'\|'disabled'}` | `{inventory}`; only unsold/unreserved stock may be changed |
| `admin_fulfill` | `{order_id}` | Order snapshot; paid/processing only, uses actual valid reserved/replacement inventory |
| `admin_replace` | `{ticket_id}` | `{ticket,replaced:true}`; bounded warranty and replacement count, idempotent per ticket; ignores only product auto-replace switch |
| `admin_ticket` | `{ticket_id,status,reply?}` | `{ticket}`; status `open`, `in_progress`, `resolved`, `closed`, `rejected` |
| `admin_refund` | `{payment_id? ,order_id?,reason,amount_cents?,idempotency_key?}` | `{refund,payment}`; use either payment ID or order ID; orders are full refunds only |

Order shape: `id,user_id,order_number,status,total_cents,currency,payment_method,created_at,expires_at,paid_at,delivered_at,completed_at`. Order status: `pending_payment`, `paid`, `processing`, `delivered`, `completed`, `cancelled`, `refund_pending`, `refunded`.

Item shape: `id,order_id,product_id,title,quantity,unit_price_cents,delivery_method,warranty_days,auto_replace,max_replacements,replacement_count`. Purchase-time price and policy are immutable snapshots, unaffected by later product edits.

Delivery shape: `id,order_id,item_id,secret,generation,status,created_at`. Generation 0 is the original; later generations are replacements. Status: `active`, `replaced`, `refunded`. Credentials are delivered in the authenticated order page; no transactional email sender is implied. Marking a code replaced/refunded is an internal record and does **not** revoke it at a third party provider.

Messages expose `body` and `message` aliases, `is_admin`, `author_role:'admin'|'customer'`, `author_id`, `created_at`. System replies have null author ID. Ticket `replacement_applied` protects double-clicks/retries from consuming more stock.

Payment shape: `id,user_id,order_id,kind,provider,status,amount_cents,currency,idempotency_key,provider_ref,provider_session_id,checkout_url,checkout_claimed_at,last_reconciled_at,created_at,expires_at,paid_at`. Status: `pending`, `succeeded`, `expired`, `cancelled`, `refund_due`, `refund_pending`, `refunded`. A partial topup refund returns payment to `succeeded` (or `refund_due` for an uncredited late charge); full cumulative refund produces `refunded`. Derive refunded cents by summing this payment's `succeeded` refund rows.

Refund shape: `id,user_id,payment_id,order_id,amount_cents,currency,provider,status,reason,provider_ref,idempotency_key,previous_order_status,previous_payment_status,failure_reason,created_at,completed_at`. Status: `pending`, `succeeded`, `failed`. Topup refund callers should send/reuse an idempotency key and exact amount. One pending refund is allowed per payment; successful cumulative refunds cannot exceed its original amount. Wallet order refunds complete in SQL; Stripe refunds require the refund edge function/provider callback.

Ledger shape: `id,user_id,delta_cents,balance_after_cents,kind,payment_id,order_id,operation_key,description,created_at`. Kind: `topup`, `purchase`, `refund`, `refund_hold`, `refund_release`.

## Trusted service RPCs

Only `service_role` (and database owner) can execute these. Edge functions must perform provider verification and ownership/admin checks before using service capabilities.

- `commerce_claim_payment(p_payment_id uuid,p_user_id uuid) -> payment`: locks active owner and pending Stripe payment, marks claim before remote session creation. New claims need at least 31 minutes left; preserve the payment's one-hour `expires_at` for deterministic Stripe creation/idempotency.
- `commerce_settle_payment(p_payment_id uuid,p_provider_ref text,p_amount_cents bigint,p_currency text) -> {payment,duplicate?,refund_due?}`: exact amount/currency/reference verification, replay-safe ledger credit or fulfillment. Late money after cancellation/expiry/account closure is retained as `refund_due` without delivery or wallet credit.
- `commerce_expire_payment(p_payment_id uuid,p_provider_session_id text default null,p_verified_orphan boolean default false) -> {payment}`: **verify the Stripe session is expired first**. A claimed payment without a saved session can only be released with `p_verified_orphan=true`, more than ten minutes after expiry, after exhaustive provider reconciliation. Otherwise the DB rejects it. Known session IDs must match. Completed payments are never rolled back.
- `commerce_cleanup_unclaimed_payments() -> {expired}`: safely closes at most 100 expired payments with neither claim nor provider session; eligible for a scheduled service job. It never infers state for an existing/claimed Stripe session. Checkout also cleans its caller's unclaimed expired payments.
- `commerce_complete_refund(p_refund_id uuid,p_provider_ref text,p_succeeded boolean,p_failure_reason text default null) -> {refund,duplicate?}`: invoke only after retrieving Stripe's canonical refund and checking amount, currency, original payment intent and metadata. Replays are no-ops. Repeated failures cannot recredit funds. A failed→successful contradictory terminal transition raises for staff investigation rather than moving funds twice.
- `commerce_prepare_account_deletion(p_user_id uuid) -> {ready:true,already_closed?}`: after password reauthentication. Locks the account against new business; blocks wallet balance, unsettled orders, pending payments/refunds and open tickets. Clears profile/contact data, legacy order email, support free text and delivered credentials while preserving structured financial/audit records under a pseudonymous UUID. Then call auth admin deletion. Preparation is idempotent so failed auth deletion can retry.

`commerce_webhook_events(provider_event_id,event_type,processed_at)` is a provider event receipt log, with unique event ID. It complements, and does not replace, transaction-level idempotency.

## Fulfillment and operational boundaries

The stock counter is actual eligible `commerce_inventory`, not a browser/legacy count. Public available stock requires an expiry beyond the one-hour reservation window, matching checkout. Atomic selection uses row locks and `SKIP LOCKED`. Exposed, replaced and refunded credentials never return to sale. Per-user advisory transaction locks serialize checkout, money, refunds and closure. Users may hold at most three pending orders.

Delayed delivery rechecks credential expiry, quarantines expired reservations, and reserves fresh valid stock. If a full item quantity is unavailable, its credentials remain hidden and the order stays `processing` with a `delivery_pending` event. After importing stock, the administrator can fulfill it. Automatic/manual replacement requires a delivered/completed order, its original warranty window, remaining replacement allowance and sufficient valid stock for that item. Otherwise a support ticket remains for staff. Automated third party validity checks/revocation are not implemented.

Profile edits are restricted to owned `full_name`, `avatar_url`, and `phone`. Verified email follows the auth identity through an update trigger; a closed account cannot repopulate its profile.

Run the reconciliation edge function on an operational schedule and review `refund_due`, pending refunds, old processing orders and unresolved tickets. Unclaimed cleanup alone cannot resolve Stripe sessions.

Validation: `node tests/commerce-db.test.mjs` applies every project migration to PGlite and exercises PostgreSQL procedures, RLS, transaction rollback, payment/refund replay, privacy, replacement, expiry and retained-account records. PGlite has one database connection: actual multi-connection lock contention, production migration, Stripe test/live webhooks, signing keys and merchant configuration still require deployment/staging verification. No production schema or funds are changed by this test.
