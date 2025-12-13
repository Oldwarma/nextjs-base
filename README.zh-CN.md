# NextJS Base

<div align="center">

**基于 Next.js 的生产级全栈后台管理平台**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-20.9+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)

[English](README.md) · [中文](README.zh-CN.md) · [文档](https://nextjsbase.com/zh/docs)· [官网](https://nextjsbase.com)
 · [演示](https://admin-demo.nextjsbase.com)

</div>

---

## ✨ 特性

- 🔐 **身份认证** - 邮箱密码 + OAuth（Google、GitHub），基于 Better Auth
- 👥 **RBAC 权限系统** - 角色、权限、菜单的完整权限控制
- 📊 **后台管理面板** - 配置驱动的 CRUD，SmartCrudPage 开箱即用
- 📝 **操作日志** - 全面的审计追踪
- 📁 **资源管理** - 支持 Cloudflare R2 的文件上传和管理
- 🌐 **国际化** - 基于 next-intl 的多语言支持
- 🎨 **现代化 UI** - Ant Design + ProComponents

## 🛠️ 技术栈

| 类别 | 技术 |
|:---|:---|
| 框架 | Next.js 16 (App Router) |
| 数据库 | PostgreSQL + Prisma |
| 认证 | Better Auth |
| UI 组件 | Ant Design、ProComponents |
| 样式 | Tailwind CSS |
| 语言 | JavaScript (ES6+) |

## 🚀 快速开始

### 环境要求

- Node.js 20.9+
- PostgreSQL 16+
- bun（推荐）/ pnpm / npm / yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/huglemon/nextjs-base.git
cd nextjs-base

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env.local

# 初始化数据库并创建管理员
bun run init

# 启动开发服务器
bun run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 环境变量

```env
# 数据库（必填）
DATABASE_URL="postgresql://user:password@localhost:5432/nextjs_base"

# Better Auth（必填）
BETTER_AUTH_SECRET="至少32位的密钥字符串"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth（可选）
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Cloudflare R2（可选 - 用于文件上传）
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
```

## 📁 项目结构

```
nextjs-base/
├── app/
│   ├── (admin)/           # 后台管理
│   │   ├── admin/         # 后台页面
│   │   └── actions/       # Server Actions
│   ├── (client)/          # 前台（支持国际化）
│   │   └── [locale]/      # 语言路由
│   └── api/               # API 路由
├── components/
│   ├── admin/             # 后台组件（SmartCrudPage、SmartForm）
│   └── ui/                # 基础 UI 组件
├── lib/
│   ├── auth/              # 认证
│   ├── core/              # 核心工具（wrapAction、createCrudActions）
│   └── database/          # Prisma 客户端
├── prisma/
│   └── schema.prisma      # 数据库模型
└── docs/                  # 文档
```

## 📖 文档

- [快速入门](https://nextjsbase.com/zh/docs/getting-started)
- [架构概述](https://nextjsbase.com/zh/docs/architecture/OVERVIEW)
- [SmartCrudPage 指南](https://nextjsbase.com/zh/docs/admin/guides/SMART_CRUD)
- [RBAC 配置](https://nextjsbase.com/zh/docs/admin/rbac/CONFIGURATION)
- [API 参考](https://nextjsbase.com/zh/docs/api)

## 🤝 参与贡献

欢迎贡献代码！请查看我们的[贡献指南](https://nextjsbase.com/zh/docs/contributing)了解详情。

### 快速链接

- [如何提交 PR](https://nextjsbase.com/zh/docs/contributing/PULL_REQUEST)
- [如何提交 Issue](https://nextjsbase.com/zh/docs/contributing/ISSUE)

### 开发流程

1. Fork 本仓库
2. 从 `develop` 分支创建新分支：`git checkout -b feature/your-feature`
3. 进行修改
4. 向 `develop` 分支提交 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 💬 加入社区

欢迎加入我们的社区，交流问题、分享经验、获取最新动态！

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-加入服务器-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/channels/1449297468654227583/)

**[加入 Discord 服务器](https://discord.com/channels/1449297468654227583/)**

</div>

<div align="center">
<img src="https://nextjsbase.com/images/wx_qrcode.png" alt="微信二维码" width="200" />

*扫码添加我的微信，我会拉你进群*
</div>

## 🙏 致谢

- [Next.js](https://nextjs.org) - React 框架
- [Prisma](https://prisma.io) - 新一代 ORM
- [Better Auth](https://better-auth.com) - 认证库
- [Ant Design](https://ant.design) - UI 组件库

---

<div align="center">

**[⬆ 返回顶部](#nextjs-base)**

用 ❤️ 构建 by [huglemon](https://github.com/huglemon)

</div>
