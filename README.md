# NextJS Base

<div align="center">

**A production-ready full-stack admin platform built with Next.js**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-20.9+-green.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)

[English](README.md) · [中文](README.zh-CN.md) · [Documentation](https://nextjsbase.com/docs)· [Website](https://nextjsbase.com)
 · [Demo](https://admin-demo.nextjsbase.com)

</div>

---

## ✨ Features

- 🔐 **Authentication** - Email/password + OAuth (Google, GitHub) via Better Auth
- 👥 **RBAC System** - Role-based access control with permissions and menus
- 📊 **Admin Dashboard** - Configuration-driven CRUD with SmartCrudPage
- 📝 **Action Logging** - Comprehensive audit trail for all operations
- 📁 **Asset Management** - File upload and manage with Cloudflare R2 support
- 🌐 **i18n Ready** - Multi-language support via next-intl
- 🎨 **Modern UI** - Ant Design + ProComponents

## 🛠️ Tech Stack

| Category | Technology |
|:---|:---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma |
| Authentication | Better Auth |
| UI Components | Ant Design, ProComponents |
| Styling | Tailwind CSS |
| Language | JavaScript (ES6+) |

## 🚀 Quick Start

### Prerequisites

- Node.js 20.9+
- PostgreSQL 16+
- bun (recommended) / pnpm / npm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/huglemon/nextjs-base.git
cd nextjs-base

# Install dependencies
bun install

# Configure environment
cp .env.example .env.local

# Initialize database and create admin
bun run init

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/nextjs_base"

# Better Auth (Required)
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Cloudflare R2 (Optional - for file uploads)
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME=""
R2_PUBLIC_URL=""
```

## 📁 Project Structure

```
nextjs-base/
├── app/
│   ├── (admin)/           # Admin panel
│   │   ├── admin/         # Admin pages
│   │   └── actions/       # Server Actions
│   ├── (client)/          # Frontend with i18n
│   │   └── [locale]/      # Language routes
│   └── api/               # API routes
├── components/
│   ├── admin/             # Admin components (SmartCrudPage, SmartForm)
│   └── ui/                # Base UI components
├── lib/
│   ├── auth/              # Authentication
│   ├── core/              # Core utilities (wrapAction, createCrudActions)
│   └── database/          # Prisma client
├── prisma/
│   └── schema.prisma      # Database schema
└── docs/                  # Documentation
```

## 📖 Documentation

- [Getting Started](https://nextjsbase.com/en/docs/getting-started)
- [Architecture Overview](https://nextjsbase.com/en/docs/architecture/OVERVIEW)
- [SmartCrudPage Guide](https://nextjsbase.com/en/docs/admin/guides/SMART_CRUD)
- [RBAC Configuration](https://nextjsbase.com/en/docs/admin/rbac/CONFIGURATION)
- [API Reference](https://nextjsbase.com/en/docs/api)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://nextjsbase.com/en/docs/contributing) for details.

### Quick Links

- [How to Submit a PR](https://nextjsbase.com/en/docs/contributing/PULL_REQUEST)
- [How to Report an Issue](https://nextjsbase.com/en/docs/contributing/ISSUE)

### Development Workflow

1. Fork the repository
2. Create a branch from `develop`: `git checkout -b feature/your-feature`
3. Make your changes
4. Submit a Pull Request to `develop`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Community

Join our community for discussions, questions, and updates!

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/channels/1449297468654227583/)

**[Join our Discord Server](https://discord.com/channels/1449297468654227583/)**

</div>

<div align="center">
<img src="https://nextjsbase.com/images/wx_qrcode.png" alt="WeChat QR Code" width="200" />

*Scan to add me on WeChat, then I'll invite you to the group*
</div>

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React Framework
- [Prisma](https://prisma.io) - Next-generation ORM
- [Better Auth](https://better-auth.com) - Authentication library
- [Ant Design](https://ant.design) - UI component library

---

<div align="center">

**[⬆ Back to Top](#nextjs-base)**

Built with ❤️ by [huglemon](https://github.com/huglemon)

</div>
