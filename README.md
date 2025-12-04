# NextJS Base - Full-Stack Admin Platform

A full-stack SaaS platform with user authentication, RBAC permission system, and admin management.

## Version

v0.1.0 — first open-source release with a simple landing page + admin demo and built-in sample roles/users for quick exploration. Version is tracked in `package.json` and mirrored in `VERSION.md`.

## Features

### Core Functionality
- 👤 **Multi-Auth Support**: Email/Password, Google OAuth, GitHub OAuth (Better Auth)
- 🔐 **RBAC System**: Role-based access control with permissions and menus
- 👨‍💼 **Admin Dashboard**: User management, role configuration, menu management
- 📊 **Action Logging**: Detailed logs for all admin operations
- 📁 **Asset Management**: File upload and management system

### Technical Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Better Auth with Prisma Adapter
- **UI**: Ant Design + ProComponents
- **Language**: JavaScript (ES6+)
- **i18n**: next-intl (English, Chinese, Japanese)

## Project Structure

```
nextjs-base/
├── app/                    # Next.js App Router
│   ├── (client)/          # Frontend (multi-language support)
│   │   ├── [locale]/      # Dynamic language routes (en, zh, ja)
│   │   └── actions/       # Client-side Server Actions
│   └── (admin)/           # Admin panel (English only)
│       ├── admin/         # Admin pages
│       └── actions/       # Admin Server Actions
├── lib/                    # Core libraries
│   ├── auth/              # Authentication
│   ├── database/          # Database (Prisma)
│   ├── core/              # Core utilities
│   └── logging/           # Action logging
├── prisma/                # Prisma schema and migrations
│   └── schema.prisma      # Database schema
├── components/            # React components
├── docs/                  # Documentation
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL 14+
- (Optional) Google/GitHub OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nextjs-base
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# PostgreSQL Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/nextjs_base?schema=public"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-at-least-32-characters"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

4. Initialize the database:
```bash
# Generate Prisma Client (需要先配置 DATABASE_URL)
npx prisma generate

# Push schema to database
npx prisma db push
```

> **注意**: Prisma 7 需要在 `.env` 文件中配置 `DATABASE_URL`（不是 `.env.local`）。

5. Run the development server:
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `user` | User accounts (Better Auth) |
| `account` | OAuth accounts |
| `session` | User sessions |
| `role` | RBAC roles |
| `permission` | RBAC permissions |
| `menu` | Admin menu items |
| `action_log` | Admin action logs |
| `asset` | Uploaded files |

See [prisma/schema.prisma](./prisma/schema.prisma) for detailed schema.

## Core Modules

### 1. Authentication (`lib/auth/auth.js`)
- Better Auth with Prisma Adapter
- Multi-provider authentication (Email, Google, GitHub)
- Session management with custom fields
- Admin plugin for user management

### 2. RBAC System
- **Roles**: Define user roles with permissions and menus
- **Permissions**: Granular permission control
- **Menus**: Dynamic admin menu based on user roles

### 3. Admin Dashboard
- **SmartCrudPage**: Generic CRUD page component
- **BaseDAO**: Data access object with hooks and validation
- **Action Logger**: Automatic logging of admin operations

## Development

### Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (dev)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name <name>

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Code Style
- Use ES6+ features
- Follow functional programming principles
- Add JSDoc comments for functions
- Use camelCase for JavaScript, snake_case for database columns

### Database Operations
- Use Prisma Client directly
- Handle pagination with `skip` and `take`
- Use transactions for complex operations

## Deployment

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
```

### Database
```bash
# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## Documentation

- [PostgreSQL + Prisma 配置指南](./docs/database/POSTGRESQL_SETUP.md)
- [RBAC 系统文档](./docs/rbac/README.md)
- [Smart CRUD 开发指南](./docs/admin/SMART_CRUD_GUIDE.md)

## License

MIT License

---

Built with ❤️ using Next.js, PostgreSQL, and Prisma
