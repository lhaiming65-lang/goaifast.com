# Welcome to your Lovable project

## 数字商城业务流程

已增加购物车、服务端订单、Stripe 支付、钱包及退款、库存发货、售后和账户删除。

- [业务审计、已实现范围和待补功能](docs/commerce-audit.md)
- [数据库 / Stripe / Auth 配置与上线验收](docs/commerce-setup.md)
- [服务端 API 合约](docs/commerce-contract.md)

本地验证：`npm run typecheck`、`npm test`、`npm run check:edge`、`npm run build`。
新增后端需要应用迁移并部署 Edge Functions；启动 Vite 不会自动完成云端部署。

## Project info

**URL**: https://lovable.dev/projects/d5c1268b-6a64-4b51-ad18-e089279a77d5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d5c1268b-6a64-4b51-ad18-e089279a77d5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d5c1268b-6a64-4b51-ad18-e089279a77d5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
