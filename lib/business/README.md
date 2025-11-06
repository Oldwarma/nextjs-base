# 业务逻辑层

用户相关业务逻辑的封装，包括积分、套餐、用户资料等。

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `credits.js` | 积分管理 - 充值、扣费、交易记录、过期处理 |
| `packages.js` | 套餐管理 - 购买、激活、用量统计 |
| `user-profile.js` | 用户资料 - 个人信息、统计数据 |
| `init-user.js` | 用户初始化 - 新用户数据初始化、登录更新 |

## 🎯 使用方式

### 积分管理

```javascript
import { 
    getUserCredits, 
    addCredits, 
    deductCredits,
    getCreditTransactions,
} from '@/lib/business/credits';

// 获取用户积分
const credits = await getUserCredits(userId);

// 充值积分
await addCredits({
    userId,
    amount: 100,
    type: 'purchase',
    description: 'Purchased 100 credits',
});

// 扣除积分
const result = await deductCredits({
    userId,
    amount: 10,
    featureId: 'text-to-image',
    description: 'Generated image',
});

// 获取交易记录
const { data, total } = await getCreditTransactions({
    userId,
    pageIndex: 1,
    pageSize: 20,
});
```

### 套餐管理

```javascript
import { 
    getActivePackages, 
    purchasePackage,
    getUserCurrentPackage,
} from '@/lib/business/packages';

// 获取可用套餐
const packages = await getActivePackages();

// 购买套餐
await purchasePackage({
    userId,
    packageId,
    paymentMethod: 'stripe',
});

// 获取用户当前套餐
const currentPackage = await getUserCurrentPackage(userId);
```

### 用户资料

```javascript
import { 
    getUserProfile, 
    updateUserProfile,
    getUserStatistics,
} from '@/lib/business/user-profile';

// 获取用户资料
const profile = await getUserProfile(userId);

// 更新用户资料
await updateUserProfile(userId, {
    name: 'New Name',
    avatar: 'https://...',
});

// 获取用户统计
const stats = await getUserStatistics(userId);
// { totalImages: 100, totalCreditsUsed: 500, ... }
```

### 用户初始化

```javascript
import { initializeNewUser, updateLastLogin } from '@/lib/business/init-user';

// 初始化新用户（注册时调用）
await initializeNewUser(userId);
// 自动创建：
// - 积分记录（初始 0 积分）
// - 用户资料记录
// - 使用统计记录

// 更新登录时间
await updateLastLogin(userId);
```

## 🔑 核心特性

### 1. 积分系统

- ✅ 积分充值/扣除
- ✅ 交易记录追踪
- ✅ 过期时间管理
- ✅ 多种积分来源（购买、赠送、活动）

### 2. 套餐系统

- ✅ 套餐购买流程
- ✅ 自动激活用量
- ✅ 套餐权益管理
- ✅ 购买历史记录

### 3. 用户资料

- ✅ 基本信息管理
- ✅ 使用统计汇总
- ✅ 偏好设置

### 4. 自动初始化

- ✅ 新用户注册自动创建相关记录
- ✅ 登录时自动更新最后登录时间
- ✅ 确保数据一致性

## 📖 相关文档

- [前端权限文档](../../docs/client/PERMISSIONS.md)
- [Server Actions 文档](../../docs/client/SERVER_ACTIONS.md)

## 🔗 依赖关系

- `lib/database/db-api` - 数据库操作
- 数据表：
  - `users` - 用户基本信息
  - `user_credits` - 用户积分
  - `credit_transactions` - 积分交易记录
  - `packages` - 套餐定义
  - `user_packages` - 用户购买记录
  - `user_profiles` - 用户资料
  - `user_statistics` - 使用统计

