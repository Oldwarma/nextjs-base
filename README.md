# Jimeng SaaS - AI Image Generation Platform

A full-stack SaaS platform for AI image generation with user authentication, credit system, package management, and usage tracking.

## Features

### Core Functionality
- 🎨 **AI Image Generation**: Text-to-image, image-to-image, upscaling, and more
- 👤 **Multi-Auth Support**: Email/Password, Google OAuth, GitHub OAuth
- 💳 **Credit System**: Flexible credit-based payment system with expiration
- 📦 **Package Management**: Multiple subscription tiers with different features
- 📊 **Usage Tracking**: Detailed logs and statistics for all operations
- 👨‍💼 **Admin Dashboard**: User management, package configuration, statistics

### Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: MongoDB with optimized connection pooling
- **Authentication**: Better Auth with multiple providers
- **UI**: Modern, responsive design with shadcn/ui
- **Language**: JavaScript (ES6+)
- **i18n**: next-intl with support for English, Chinese, and Japanese

## Project Structure

```
jimeng-saas/
├── app/                    # Next.js App Router
│   ├── (client)/          # Frontend (multi-language support)
│   │   ├── [locale]/      # Dynamic language routes (en, zh, ja)
│   │   └── actions/       # Client-side Server Actions
│   └── (admin)/           # Admin panel (English only)
│       └── actions/       # Admin Server Actions
├── lib/                    # Core business logic
│   ├── auth.js            # Authentication configuration
│   ├── mongodb.js         # MongoDB connection and utilities
│   ├── credits.js         # Credit management
│   ├── packages.js        # Package management
│   ├── user-profile.js    # User profile management
│   └── usage-logs.js      # Usage tracking and logging
├── i18n/                  # Internationalization config
│   ├── config.js          # Language settings
│   └── request.js         # next-intl configuration
├── messages/              # Translation files
│   ├── en.json           # English
│   ├── zh.json           # Chinese
│   └── ja.json           # Japanese
├── components/            # React components
├── scripts/               # Utility scripts
│   └── init-db.js        # Database initialization
├── docs/                  # Documentation
└── README.md             # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- MongoDB 4.4+
- (Optional) Google/GitHub OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd jimeng-saas
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

Edit `.env` and configure:
- MongoDB connection (`MONGODB_URI`, `MONGODB_DB_NAME`)
- Auth secrets (`BETTER_AUTH_SECRET`)
- OAuth credentials (optional)

4. Initialize the database:
```bash
node scripts/init-db.js
```

This will:
- Create necessary indexes
- Insert default packages
- Set up collections

5. Run the development server:
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

### Collections

- **users**: User accounts with auth info, credits, and package data
- **packages**: Subscription package configurations
- **user_packages**: User purchase records
- **credit_transactions**: Credit transaction history
- **usage_logs**: Feature usage records

See [API_USAGE.md](./docs/API_USAGE.md) for detailed schema definitions.

## Core Modules

### 1. Authentication (`lib/auth.js`)
- Multi-provider authentication (Email, Google, GitHub)
- Session management with custom fields
- Role-based access control
- Automatic user initialization

### 2. Credit System (`lib/credits.js`)
- Add/deduct/refund credits
- Transaction history
- Expiration handling
- Batch operations

### 3. Package Management (`lib/packages.js`)
- Create/update packages
- Purchase processing
- Expiration tracking
- Revenue statistics

### 4. User Profiles (`lib/user-profile.js`)
- Update profile (name, avatar, email)
- Username management
- User statistics
- Admin user management

### 5. Usage Tracking (`lib/usage-logs.js`)
- Feature usage logging
- Automatic credit deduction
- Usage statistics
- Pricing configuration

## Server Actions (推荐使用)

本项目使用 Next.js 15 的 Server Actions，无需创建 API 路由即可调用服务器端功能。

### 客户端使用示例

#### 获取用户资料
```javascript
import { getUserProfileAction } from '@/app/(client)/actions';

const result = await getUserProfileAction();
if (result.success) {
  console.log(result.data); // 用户资料
}
```

#### 购买套餐
```javascript
import { purchasePackageAction } from '@/app/(client)/actions';

const result = await purchasePackageAction(packageId, paymentInfo);
```

#### 生成图片（自动扣除积分）
```javascript
import { textToImageAction } from '@/app/(client)/actions';

const result = await textToImageAction({
  prompt: 'A beautiful sunset',
  size: '1024x1024',
  model: 'hd'
});

if (result.success) {
  console.log(`Image: ${result.data.imageUrl}`);
  console.log(`Remaining credits: ${result.data.remainingCredits}`);
}
```

### 管理员使用示例

```javascript
import { 
  getUserListAction, 
  adminAdjustCreditsAction 
} from '@/app/(admin)/actions';

// 获取用户列表
const users = await getUserListAction({ pageIndex: 1, pageSize: 20 });

// 调整用户积分
await adminAdjustCreditsAction(userId, 100, 'Promotion reward');
```

查看完整文档：
- [Server Actions 使用指南](./docs/SERVER_ACTIONS.md) - 推荐优先阅读
- [API 路由文档](./docs/API_USAGE.md) - 传统 API 路由（保留兼容）

## Scheduled Tasks

Set up cron jobs for:

1. **Expired Credits**: Run `processExpiredCredits()` daily
2. **Expired Packages**: Run `processExpiredPackages()` hourly

Example with node-cron:
```javascript
import cron from 'node-cron';
import { processExpiredCredits } from '@/lib/credits';
import { processExpiredPackages } from '@/lib/packages';

// Every day at 00:00
cron.schedule('0 0 * * *', async () => {
  await processExpiredCredits();
});

// Every hour
cron.schedule('0 * * * *', async () => {
  await processExpiredPackages();
});
```

## Development

### Code Style
- Use ES6+ features
- Follow functional programming principles
- Add JSDoc comments for functions
- Keep functions focused and small

### Database Operations
- Always use the provided utilities in `lib/mongodb.js`
- Handle ObjectId conversions automatically
- Use pagination for large datasets
- Add proper indexes for queries

### Error Handling
- Throw descriptive errors
- Use try-catch in API routes
- Return consistent error formats
- Log errors appropriately

## Deployment

### Environment Variables
Ensure all production environment variables are set:
- `NODE_ENV=production`
- `BETTER_AUTH_SECRET` (generate a strong secret)
- `MONGODB_URI` (production MongoDB URL)
- OAuth credentials (if using social login)

### Database
- Run `init-db.js` on production database
- Set up proper indexes
- Configure backup strategy
- Monitor connection pool

### Monitoring
- Set up error tracking (e.g., Sentry)
- Monitor MongoDB performance
- Track API response times
- Set up alerts for critical failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check [API_USAGE.md](./docs/API_USAGE.md)
- Open an issue on GitHub
- Contact support team

---

Built with ❤️ using Next.js and MongoDB
