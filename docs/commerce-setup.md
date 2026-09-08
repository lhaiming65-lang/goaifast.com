# 数字商城部署与验收

当前云端安装状态（2026-09-09）：已核实并初始化 `rzphsmpkdjjbptrhuxsb`，部署五个交易服务，导入 22 个旧商品资料。Stripe 密钥和有效库存仍需配置，商城管理员已设置。原运营后台与交易功能已融合，见 `admin-integration.md`。云端原先缺少迁移历史，本次以原子 SQL 安装缺失迁移；再次部署前先核对实际结构，不要直接重放全部迁移。详见 `commerce-validation.md`。

## 1. 核对目标环境

原仓库前端默认连接 `rzphsmpkdjjbptrhuxsb.supabase.co`，旧 Supabase 配置和 MCP 曾指向 `aknsgkavrvgxihnufyqg`。本地 `project_id` 现在只使用名称 `goaifast`，它不代表已绑定任何云项目。请明确使用自己的项目，不要根据旧字符串直接部署。

复制 `.env.example` 为 `.env.local`，填写同一项目的 URL、公开 publishable/anon key 和 project ID。公开密钥不提供管理员权限；Stripe 私钥和 Supabase service-role key 只能放在服务端 Secrets。

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

前端默认地址 `http://127.0.0.1:8080`。缺少新数据库服务时，页面会提示尚未初始化，不会模拟充值到账或生成卡密。

## 2. 应用数据库迁移

用 Supabase CLI 登录并绑定已核实的项目，先备份，再检查 migration history。新库按顺序应用仓库全部迁移。已有库先确认原有迁移已应用，不要重复运行早期的 CREATE TABLE 文件。新增文件：`supabase/migrations/20260909000000_commerce.sql`。

```sh
npx supabase login
npx supabase link --project-ref YOUR_VERIFIED_PROJECT_REF
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

新表使用 `commerce_` 前缀，商品来源是 `store_products`。旧 `orders`、`go_admin_orders` 和旧账号池没有被导入为已验证的新交易；需要另外核对历史真实订单后迁移。旧订单修改/删除和运营表宽松权限会被收紧，旧后台部分依赖这些权限的操作会改变行为。

在 Supabase Auth 创建管理员账号后，由数据库所有者分配角色（将 UUID 替换为实际用户 ID）：

```sql
insert into public.user_roles(user_id, role)
values ('YOUR_ADMIN_USER_UUID', 'admin')
on conflict (user_id, role) do nothing;
```

不要使用前端或 user_metadata 中的 admin 字段授予管理员角色。

## 3. 部署服务端与配置 Stripe

在 Supabase Secrets 中设置 `STRIPE_SECRET_KEY`（先用测试模式）、`STRIPE_WEBHOOK_SECRET`、`APP_URL` 和 `ALLOWED_ORIGINS`。APP_URL 是商城回跳地址，生产环境必须 HTTPS；ALLOWED_ORIGINS 为逗号分隔的允许来源。Supabase 自动提供 `SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`，自托管时须自行设置。

```sh
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-refund
npx supabase functions deploy commerce-reconcile
npx supabase functions deploy account-delete
```

这些函数在代码中通过 `auth.getUser()` 验证会话和数据库角色；webhook 仅信任 Stripe 签名。`verify_jwt=false` 不能替代代码中的身份验证，不应删除验证逻辑。

Stripe Webhook URL 为：`https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`。订阅：

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `refund.created`
- `refund.updated`
- `refund.failed`

使用该端点对应的签名密钥；Stripe CLI 本地转发密钥与 Dashboard 端点密钥不同。仅 URL 带 `payment=returned` 不会把订单改为已支付。

## 4. Auth 配置

启用邮箱验证，配置可发送邮件的 SMTP。设置 Site URL 和 redirect URLs：开发环境的 `/`、`/auth`、`/profile`、`/reset-password`，以及正式域名对应路径。启用 Secure email change / Secure password change，并设置最低密码长度、注册与登录限流。验证邮件重发和 OAuth 能否使用取决于这些服务配置。

注销流程要求当前密码再次验证；第三方登录用户先通过邮件设置密码。交易事务会先关闭账户，清理个人信息，保留匿名账本，再删除 Auth 身份。若存储桶文件归属于用户造成 Auth 删除失败，需要管理员处理文件归属后重试，不要删除资金记录来绕过检查。

## 5. 商家初始化与操作

1. 登录 `/admin`，创建 SKU 并设置美元单价、自动/人工交付、售后期限和自动换货上限。
2. “卡密库存”选择 SKU，每行导入一份完整交付内容，可设置有效期。库存数从可用货物计算；手工填写商品展示库存不会创造可交付货物。
3. 自动交付会在收款后分配库存。人工交付仍需先导入货物，再在订单页点击“分配库存并发货”。故障换货以订单项为单位。
4. “售后与投诉”查看消息、回复、手工换货和审核全额订单退款。“支付与退款”查看未完成退款并重试相同退款。
5. “核对支付 / 释放过期预留”核实真实 Stripe 状态后更新本地记录。没有 provider session ID 的中断请求会在过期后等待 10 分钟再检查 Stripe；不能证实不存在支付时继续保留预留。不要手工把状态改成 paid 或直接增加余额。
6. 定期执行支付核对。当前提供管理员主动核对，没有自动替你配置线上 cron。网络不确定的退款保留待处理，恢复渠道配置后重试相同记录，不能新建另一笔来绕过原记录。

## 6. 自动测试和上线验收

```sh
npm run typecheck
npm test
npm run build
```

数据库测试在隔离的 PGlite PostgreSQL 引擎里应用全部迁移，使用匿名、普通用户和 service_role 验证账本、价格校验、重复操作、库存不足、权限、换货、退款和账户结清。Edge 测试拦截所有外部网络，用 Stripe SDK 验签及模拟 API 测试响应，不会实际收款或删除云用户。

这些测试不等同于真实 Stripe 和 Supabase 联调，也不替代独立 PostgreSQL 多连接并发测试。启用真实收款前至少走完：邮箱注册验证 → 导入测试库存 → 多商品购物车 → Stripe 测试付款 → 唯一交付 → 确认收货 → 故障换货 → 全额订单退款；充值 → 部分消费 → 剩余余额部分退款；库存不足、关闭支付页、过期、重复 webhook、退款失败、越权访问及结清后的账户删除。

## 7. 部署前端

现有 GitHub Pages 工作流只发布前端，不发布 Supabase 迁移或 Edge Functions。`VITE_SUPABASE_*` 必须在构建阶段指向同一个已部署项目；SPA 深链接需要 fallback。生产切换前分别核对 Stripe live key、live webhook secret、正式 APP_URL、SMTP、管理员角色和可交付库存。
