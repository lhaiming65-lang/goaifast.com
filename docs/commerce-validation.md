# 本次验证记录

- `npm run typecheck`：通过，全项目 TypeScript 检查。
- `npm run test:db`：24 项通过，隔离 PGlite 加载仓库全部迁移，执行实际 SQL、RLS、角色和事务回滚。
- `npm run test:edge`：27 项通过，覆盖支付签名、金额、重复通知、退款恢复、过期预留核对、账户删除及浏览器 RPC 包装器；所有外部 API 使用隔离 fixture。
- `npm run check:edge`：5 个新 Edge Functions 类型检查通过。
- `npm run build`：通过。
- 新交易页面、共享调用代码和新 Edge Functions 的定向 ESLint：通过。全库 `npm run lint` 仍包含旧 `any`、UI 模板接口和自动生成 MCP 文件等问题，不宣称全库 lint 清零。
- `git diff --check`：通过。
- 本地 Vite 首页返回 HTTP 200。浏览器确认未登录访问后台转登录；未部署新数据库时，购物车明确提示初始化要求，不显示假成功。

2026-09-09 云端部署验证：

- 已确认并部署至用户拥有的 `goaifast.com` 项目 `rzphsmpkdjjbptrhuxsb`。基础资料、旧订单及交易迁移在同一事务内成功执行，补齐 2 个用户资料。
- 从旧商品表导入 22 个商品。匿名 catalog RPC 返回 HTTP 200、22 个商品；可用新库存为 0，旧账号库存尚未核验和导入。
- 已部署 stripe-checkout、stripe-webhook、stripe-refund、commerce-reconcile、account-delete。无登录会话的四个用户接口返回 401；无签名 webhook 返回 400，确认服务启动和入口校验有效。
- 已设置开发环境 APP_URL 和允许来源；Stripe 私钥、Webhook 签名密钥尚未配置，商城管理员已配置。
- 云端原本没有迁移历史表，本次通过原子 SQL 安装缺失迁移；不要直接重放仓库全部迁移。安装文件摘要及部署记录保存在本地忽略目录 `.deploy-tools`。

未执行：真实商户 Stripe 测试支付、真实账户删除、带真实用户登录的全部页面验收、独立 PostgreSQL 多连接高并发压测。上述部署和入口检查不代表真实收退款已联调通过。

本地服务继续运行于 `http://127.0.0.1:8080`，改动留在工作区，未提交或推送。

后台融合：原后台框架、模块和记录已恢复，并嵌入商城交易功能。两项增量迁移已部署；数据保留、双向商品同步和浏览器验收见 [admin-integration.md](admin-integration.md)。
