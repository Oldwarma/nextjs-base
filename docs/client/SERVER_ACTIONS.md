# Server Actions 使用文档

## 概述

本项目使用 Next.js 15 的 Server Actions 替代传统的 API 路由，提供更好的性能和开发体验。Server Actions 直接在服务器端执行，无需额外的 API 端点。

## 优势

**更简单** - 无需创建 API 路由，直接调用函数  
**更快速** - 减少网络往返，提升性能  
**类型安全** - 完整的 TypeScript 支持  
**自动序列化** - 自动处理数据序列化  
**内置验证** - 统一的 Session 验证  

## 目录结构

```
app/
├── (client)/actions/      # 客户端 Actions
│   ├── index.js          # 统一导出
│   ├── user.js           # 用户相关
│   ├── credits.js        # 积分相关
│   ├── packages.js       # 套餐相关
│   ├── usage.js          # 使用记录
│   └── generate.js       # 图片生成
└── (admin)/actions/       # 管理员 Actions
    ├── index.js          # 统一导出
    ├── admin-users.js    # 用户管理
    ├── admin-credits.js  # 积分管理
    ├── admin-packages.js # 套餐管理
    └── admin-usage.js    # 使用记录管理
```

## 客户端 Actions

### 1. 用户相关 (`user.js`)

#### 获取用户资料
```javascript
import { getUserProfileAction } from '@/app/(client)/actions';

const result = await getUserProfileAction();
if (result.success) {
  console.log(result.data); // 用户资料
}
```

#### 更新用户资料
```javascript
import { updateUserProfileAction } from '@/app/(client)/actions';

const result = await updateUserProfileAction({
  name: 'New Name',
  image: 'https://example.com/avatar.jpg',
  username: 'newusername'
});
```

#### 获取用户统计信息
```javascript
import { getUserStatisticsAction } from '@/app/(client)/actions';

const result = await getUserStatisticsAction();
if (result.success) {
  console.log(result.data.credits);  // 积分统计
  console.log(result.data.usage);    // 使用统计
  console.log(result.data.packages); // 套餐统计
}
```

### 2. 积分相关 (`credits.js`)

#### 获取当前积分
```javascript
import { getUserCreditsAction } from '@/app/(client)/actions';

const result = await getUserCreditsAction();
console.log(result.data.credits); // 当前积分
```

#### 获取积分详细信息
```javascript
import { getUserCreditsInfoAction } from '@/app/(client)/actions';

const result = await getUserCreditsInfoAction();
console.log(result.data);
// {
//   credits: 100,
//   totalCreditsEarned: 500,
//   totalCreditsUsed: 400
// }
```

#### 获取积分交易记录
```javascript
import { getCreditTransactionsAction } from '@/app/(client)/actions';

const result = await getCreditTransactionsAction({
  pageIndex: 1,
  pageSize: 20,
  type: 'spend' // 可选：'earn', 'spend', 'expire', 'refund'
});
```

#### 获取积分信息和交易记录（组合）
```javascript
import { getUserCreditsWithTransactionsAction } from '@/app/(client)/actions';

const result = await getUserCreditsWithTransactionsAction({
  pageIndex: 1,
  pageSize: 10
});
// 包含积分信息和交易记录
```

### 3. 套餐相关 (`packages.js`)

#### 获取可用套餐
```javascript
import { getActivePackagesAction } from '@/app/(client)/actions';

const result = await getActivePackagesAction();
console.log(result.data); // 套餐列表
```

#### 购买套餐
```javascript
import { purchasePackageAction } from '@/app/(client)/actions';

const result = await purchasePackageAction(packageId, {
  paymentMethod: 'stripe',
  transactionId: 'txn_xxx'
});

if (result.success) {
  console.log(`Order ID: ${result.data.orderId}`);
  console.log(`Credits granted: ${result.data.creditsGranted}`);
}
```

#### 获取购买记录
```javascript
import { getUserPackagesAction } from '@/app/(client)/actions';

const result = await getUserPackagesAction({
  pageIndex: 1,
  pageSize: 10,
  status: 'active' // 可选：'active', 'expired', 'cancelled'
});
```

#### 获取当前有效套餐
```javascript
import { getUserCurrentPackageAction } from '@/app/(client)/actions';

const result = await getUserCurrentPackageAction();
if (result.success && result.data) {
  console.log(`Current package: ${result.data.name}`);
  console.log(`Expires at: ${result.data.expireAt}`);
}
```

### 4. 使用记录 (`usage.js`)

#### 获取使用记录
```javascript
import { getUserUsageLogsAction } from '@/app/(client)/actions';

const result = await getUserUsageLogsAction({
  pageIndex: 1,
  pageSize: 20,
  action: 'text_to_image', // 可选
  status: 'success',        // 可选
  startDate: '2024-01-01',  // 可选
  endDate: '2024-12-31'     // 可选
});
```

#### 获取使用统计
```javascript
import { getUserUsageStatisticsAction } from '@/app/(client)/actions';

const result = await getUserUsageStatisticsAction({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

console.log(result.data);
// {
//   total: 100,
//   successful: 95,
//   failed: 5,
//   totalCreditsUsed: 1000,
//   byAction: { text_to_image: {...}, ... }
// }
```

#### 检查是否有足够积分
```javascript
import { checkUserCanUseFeatureAction } from '@/app/(client)/actions';

const result = await checkUserCanUseFeatureAction('text_to_image', {
  size: '1024x1024',
  model: 'hd'
});

if (result.data.canUse) {
  console.log(`可以使用，需要 ${result.data.creditsNeeded} 积分`);
} else {
  console.log(`积分不足，还需要 ${result.data.shortage} 积分`);
}
```

#### 获取功能价格配置
```javascript
import { getFeaturePricesAction } from '@/app/(client)/actions';

// 获取所有价格
const allPrices = await getFeaturePricesAction();

// 获取特定功能价格
const textToImagePrice = await getFeaturePricesAction('text_to_image');
```

### 5. 图片生成 (`generate.js`)

#### 文生图
```javascript
import { textToImageAction } from '@/app/(client)/actions';

const result = await textToImageAction({
  prompt: 'A beautiful sunset over the ocean',
  size: '1024x1024',
  model: 'hd'
});

if (result.success) {
  console.log(`Image URL: ${result.data.imageUrl}`);
  console.log(`Credits used: ${result.data.creditsUsed}`);
  console.log(`Remaining credits: ${result.data.remainingCredits}`);
} else if (result.error === 'Insufficient credits') {
  console.log(`需要 ${result.details.required} 积分`);
  console.log(`当前只有 ${result.details.current} 积分`);
  console.log(`还差 ${result.details.shortage} 积分`);
}
```

#### 图生图
```javascript
import { imageToImageAction } from '@/app/(client)/actions';

const result = await imageToImageAction({
  imageUrl: 'https://example.com/image.jpg',
  prompt: 'Make it more colorful',
  size: '1024x1024',
  model: 'standard'
});
```

#### 图片放大
```javascript
import { upscaleImageAction } from '@/app/(client)/actions';

const result = await upscaleImageAction({
  imageUrl: 'https://example.com/image.jpg',
  scale: '4x' // '2x' or '4x'
});
```

#### 移除背景
```javascript
import { removeBackgroundAction } from '@/app/(client)/actions';

const result = await removeBackgroundAction({
  imageUrl: 'https://example.com/image.jpg'
});
```

## 管理员 Actions

所有管理员 Actions 都会自动检查用户权限。

### 1. 用户管理 (`admin-users.js`)

#### 获取用户列表
```javascript
import { getUserListAction } from '@/app/(admin)/actions';

const result = await getUserListAction({
  pageIndex: 1,
  pageSize: 20,
  role: 'user',      // 可选：筛选角色
  search: 'john'     // 可选：搜索关键词
});
```

#### 更新用户角色
```javascript
import { updateUserRoleAction } from '@/app/(admin)/actions';

const result = await updateUserRoleAction(userId, 'admin');
```

#### 获取用户统计（管理员视角）
```javascript
import { getUserStatisticsAdminAction } from '@/app/(admin)/actions';

const result = await getUserStatisticsAdminAction(userId);
```

### 2. 积分管理 (`admin-credits.js`)

#### 调整用户积分
```javascript
import { adminAdjustCreditsAction } from '@/app/(admin)/actions';

// 增加积分
await adminAdjustCreditsAction(userId, 100, 'Promotion reward');

// 扣除积分
await adminAdjustCreditsAction(userId, -50, 'Penalty');
```

#### 批量赠送积分
```javascript
import { batchGrantCreditsAction } from '@/app/(admin)/actions';

const result = await batchGrantCreditsAction(
  ['userId1', 'userId2', 'userId3'],
  50,
  {
    reason: 'New Year promotion',
    expireAt: new Date('2024-12-31')
  }
);

console.log(`成功赠送 ${result.data.successCount} 个用户`);
```

#### 查看用户积分详情
```javascript
import { getUserCreditsInfoAdminAction } from '@/app/(admin)/actions';

const result = await getUserCreditsInfoAdminAction(userId);
```

### 3. 套餐管理 (`admin-packages.js`)

#### 获取所有套餐（包括不活跃的）
```javascript
import { getAllPackagesAdminAction } from '@/app/(admin)/actions';

const result = await getAllPackagesAdminAction(true);
```

#### 创建套餐
```javascript
import { createPackageAction } from '@/app/(admin)/actions';

const result = await createPackageAction({
  name: 'Pro Plan',
  description: 'For professional users',
  price: 29.99,
  credits: 500,
  validDays: 30,
  features: ['500 credits', 'HD quality', 'Priority support'],
  isActive: true,
  sort: 2
});
```

#### 更新套餐
```javascript
import { updatePackageAction } from '@/app/(admin)/actions';

const result = await updatePackageAction(packageId, {
  price: 24.99,
  credits: 600
});
```

#### 删除套餐（软删除）
```javascript
import { deletePackageAction } from '@/app/(admin)/actions';

const result = await deletePackageAction(packageId);
```

#### 获取套餐统计
```javascript
import { getPackageStatisticsAction } from '@/app/(admin)/actions';

const result = await getPackageStatisticsAction();
console.log(result.data);
// {
//   packages: [
//     { packageId, packageName, totalPurchases, activePurchases, revenue }
//   ],
//   totalRevenue: 10000
// }
```

### 4. 使用记录管理 (`admin-usage.js`)

#### 获取所有使用记录
```javascript
import { getAllUsageLogsAction } from '@/app/(admin)/actions';

const result = await getAllUsageLogsAction({
  pageIndex: 1,
  pageSize: 50,
  action: 'text_to_image',
  status: 'success',
  userId: 'specific-user-id',  // 可选
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

#### 获取全局统计
```javascript
import { getGlobalUsageStatisticsAction } from '@/app/(admin)/actions';

const result = await getGlobalUsageStatisticsAction({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

console.log(result.data);
// {
//   total, successful, failed, totalCreditsUsed, uniqueUsers,
//   byAction: {...},
//   byDate: {...}
// }
```

#### 获取/更新功能价格
```javascript
import { 
  getFeaturePricesAdminAction, 
  updateFeaturePriceAction 
} from '@/app/(admin)/actions';

// 获取价格
const prices = await getFeaturePricesAdminAction('text_to_image');

// 更新价格
const result = await updateFeaturePriceAction('text_to_image', {
  base: 12,
  multipliers: {
    '1024x1024': 2.5,
    'hd': 1.8
  }
});
```

## 在 React 组件中使用

### 客户端组件示例

```javascript
'use client';

import { useState } from 'react';
import { textToImageAction } from '@/app/(client)/actions';

export default function GenerateImageForm() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await textToImageAction({
      prompt,
      size: '1024x1024',
      model: 'hd'
    });

    setLoading(false);
    
    if (result.success) {
      setResult(result.data);
    } else {
      alert(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      
      {result && (
        <div>
          <img src={result.imageUrl} alt="Generated" />
          <p>Credits used: {result.creditsUsed}</p>
          <p>Remaining: {result.remainingCredits}</p>
        </div>
      )}
    </form>
  );
}
```

### 服务端组件示例

```javascript
import { getUserProfileAction } from '@/app/(client)/actions';

export default async function ProfilePage() {
  const result = await getUserProfileAction();

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  const profile = result.data;

  return (
    <div>
      <h1>{profile.name}</h1>
      <p>Email: {profile.email}</p>
      <p>Credits: {profile.credits}</p>
    </div>
  );
}
```

## 错误处理

所有 Actions 返回统一的响应格式：

```javascript
// 成功
{
  success: true,
  data: { ... },
  message: 'Optional success message'
}

// 失败
{
  success: false,
  error: 'Error message',
  details: { ... } // 可选的错误详情
}
```

## 注意事项

1. **Session 验证**: 所有 Actions 都会自动验证用户 Session
2. **权限检查**: 管理员 Actions 会额外检查用户角色
3. **错误处理**: 始终检查 `result.success` 来判断操作是否成功
4. **积分扣除**: 图片生成 Actions 会自动扣除积分
5. **类型安全**: 建议使用 TypeScript 以获得更好的类型提示

## 迁移指南

### 从 API 路由迁移到 Server Actions

**之前（API 路由）:**
```javascript
const response = await fetch('/api/user/profile');
const data = await response.json();
```

**现在（Server Actions）:**
```javascript
import { getUserProfileAction } from '@/app/(client)/actions';

const result = await getUserProfileAction();
```

优势：
- 无需处理 HTTP 响应
- 无需手动序列化/反序列化
- 更好的类型安全
- 更快的执行速度

## 总结

Server Actions 提供了一种更现代、更高效的方式来处理服务器端逻辑。相比传统的 API 路由：

代码更简洁  
性能更好  
开发体验更佳  
类型安全更强  

推荐在新项目中优先使用 Server Actions！

