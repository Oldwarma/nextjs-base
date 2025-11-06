# Admin Server Actions

所有后台管理的 Server Actions 都在这个目录中。

## 文件结构

```
app/(admin)/actions/
├── README.md             # 📖 本文档
├── dao/                  # BaseDAO 相关
│   └── base.js           # BaseDAO 核心类
├── configs/              # CRUD 配置
│   ├── user-crud.config.js
│   ├── package-crud.config.js
│   └── credit-transaction-crud.config.js
├── admin-users.js        # ✅ 用户管理（已使用 BaseDAO）
├── admin-packages.js     # ✅ 套餐管理（已使用 BaseDAO）
├── admin-credits.js      # ✅ 积分管理（已使用 BaseDAO + 自定义方法）
└── admin-usage.js        # 📊 使用统计（保持现状）
```

## 使用方式

**直接从具体文件导入**（推荐）

```javascript
import {
	getUserListAction,
	updateUserInfoAction,
	deleteUserAction,
} from '@/app/(admin)/actions/rbac/admin-users';

import {
	getAllPackagesAdminAction,
	createPackageAction,
} from '@/app/(admin)/actions/finance/admin-packages';
```

> **为什么没有 index.js？**
> 
> Next.js 15+ 的 `"use server"` 文件只能导出 async 函数，不能 re-export 其他文件的 exports。
> 因此我们直接从各自的文件导入，这样更清晰，也避免了 re-export 的限制。

---

## 文件说明

### ✅ admin-users.js - 用户管理

**状态**：已使用 BaseDAO 重构

**配置文件**：`configs/user-crud.config.js`

**Actions**：
- `getUserListAction` - 获取用户列表
- `getUserDetailAction` - 获取用户详情
- `updateUserInfoAction` - 更新用户信息
- `deleteUserAction` - 删除用户（软删除）
- `updateUserRoleAction` - 更新用户角色
- `batchUpdateUsersAction` - 批量更新用户
- `batchDeleteUsersAction` - 批量删除用户
- `getUserStatisticsAdminAction` - 获取用户统计

**特点**：
- ✅ 使用 BaseDAO，代码量减少 51%
- ✅ 统一的权限检查
- ✅ 统一的错误处理
- ✅ 支持批量操作
- ✅ 软删除支持

---

### ✅ admin-packages.js - 套餐管理

**状态**：已使用 BaseDAO

**配置文件**：`configs/package-crud.config.js`

**Actions**：
- `getAllPackagesAdminAction` - 获取所有套餐（包括未激活的）
- `getPackageDetailAction` - 获取套餐详情
- `createPackageAction` - 创建套餐
- `updatePackageAction` - 更新套餐
- `deletePackageAction` - 删除套餐
- `batchUpdatePackagesAction` - 批量更新套餐
- `batchDeletePackagesAction` - 批量删除套餐
- `getUserPackagesAdminAction` - 获取用户的套餐购买记录（自定义方法）

**特点**：
- ✅ 使用 BaseDAO，代码量减少 ~60%
- ✅ 支持批量操作
- ✅ 不使用软删除（通过 isActive 控制）
- ✅ 自动验证：price、credits、validDays 必须为非负数
- ✅ 自动排序：按 sort 字段和创建时间排序

---

### ✅ admin-credits.js - 积分管理

**状态**：已使用 BaseDAO + 自定义方法

**配置文件**：`configs/credit-transaction-crud.config.js`

**Actions**：

**查询类**（使用 BaseDAO）：
- `getCreditTransactionListAction` - 获取积分交易记录列表
- `getCreditTransactionDetailAction` - 获取单个交易记录详情
- `getUserCreditTransactionsAction` - 获取指定用户的交易记录

**操作类**（自定义方法）：
- `adminAdjustCreditsAction` - 管理员调整积分（正数=增加，负数=扣除）
- `adminAddCreditsAction` - 管理员增加积分（便捷方法）
- `adminDeductCreditsAction` - 管理员扣除积分（便捷方法）

**特点**：
- ✅ 交易记录使用 BaseDAO（只读）
- ✅ 交易记录不能直接创建、更新、删除
- ✅ 积分调整通过专门的 Action 处理
- ✅ 自动记录每次积分变动
- ✅ 支持按 type、userId 过滤查询

---

### 📊 admin-usage.js - 使用统计

**状态**：使用统一的 `checkAdminAction`，保持现状

**Actions**：
- `getAdminUsageLogsAction` - 获取用户使用日志
- `getSystemStatisticsAction` - 获取系统统计

**说明**：
- 这些是统计查询，不是标准 CRUD
- 不适合使用 BaseDAO
- 保持现状即可

---

## 迁移到 BaseDAO 的步骤

### 1. 创建 CRUD 配置

```javascript
// configs/package-crud.config.js
export const packageCrudConfig = {
	collectionName: 'packages',
	primaryKey: '_id',
	fields: {
		creatable: ['name', 'price', 'credits'],
		updatable: ['name', 'price', 'credits', 'status'],
		searchable: ['name'],
	},
	validation: {
		name: { required: true },
		price: { required: true },
		credits: { required: true },
	},
	softDelete: true,
};
```

### 2. 重写 Server Actions

```javascript
// app/(admin)/actions/admin-packages.js
'use server';

import { createCrudActions } from '@/(admin)/actions/dao/base';
import { packageCrudConfig } from '@/configs/package-crud.config';

const packageCrud = createCrudActions(packageCrudConfig);

export const getPackageListAction = packageCrud.getList;
export const createPackageAction = packageCrud.create;
export const updatePackageAction = packageCrud.update;
export const deletePackageAction = packageCrud.delete;

// 自定义方法
export async function getUserPackagesAction(userId) {
	// 自定义实现
}
```

### 3. 创建 CRUD 页面

复制 `app/(admin)/admin/_template/page.js` 到 `app/(admin)/admin/packages/page.js`，配置 columns 和 formFields。

---

## 权限检查

所有 Actions 都使用统一的 `checkAdminAction`：

```javascript
import { checkAdminAction } from '@/lib/admin/admin-auth';

export async function someAction() {
	const adminCheck = await checkAdminAction();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}
	
	// 业务逻辑
}
```

**优势**：
- ✅ 统一的权限检查逻辑
- ✅ 自动更新 `lastLoginAt`
- ✅ 返回标准化的错误格式

---

## 错误处理

所有 Actions 返回统一的格式：

```javascript
// 成功
{ success: true, data: {...} }
{ success: true, message: 'Operation completed' }

// 失败
{ success: false, error: 'Error message' }
```

---

## 最佳实践

### 1. 从具体文件导入

```javascript
// ✅ 推荐：清晰明确
import {
	getUserListAction,
	updateUserInfoAction,
} from '@/app/(admin)/actions/rbac/admin-users';

// ✅ 可选：使用别名简化
import {
	getUserListAction as getList,
	updateUserInfoAction as update,
} from '@/app/(admin)/actions/rbac/admin-users';
```

### 2. Actions 命名规范

```javascript
// 格式：动词 + 实体 + Action
getUserListAction
createPackageAction
updateUserInfoAction
deletePackageAction
batchUpdateUsersAction

// 管理员专用加 Admin 后缀
getAllPackagesAdminAction
getAdminUsageLogsAction
```

### 3. 参数顺序

```javascript
// 单个操作：ID 在前，数据在后
updateUserAction(userId, data)
deleteUserAction(userId)

// 批量操作：IDs 数组在前，数据在后
batchUpdateUsersAction(userIds, updates)
batchDeleteUsersAction(userIds)
```

---

## 迁移进度

- [x] admin-users.js - 已使用 BaseDAO ✅
- [x] 统一 checkAdminAction ✅
- [x] 移除 index.js（Next.js 15+ 限制）✅
- [x] admin-packages.js - 已迁移到 BaseDAO ✅
- [x] admin-credits.js - 已迁移到 BaseDAO（混合模式）✅
- [ ] 创建 packages 管理页面
- [ ] 创建 credits 管理页面

---

## 相关文档

- [BaseDAO 文档](../../../docs/ADMIN_BASE_DAO.md)
- [CRUD 模板指南](../../../docs/ADMIN_CRUD_TEMPLATE_GUIDE.md)
- [系统总览](../../../docs/ADMIN_SYSTEM_README.md)

