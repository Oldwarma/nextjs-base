# 核心库 (Core Library)

模板化快速开发架构的核心组件，提供统一的权限验证、日志记录和 CRUD 操作封装。

## 📁 文件列表

| 文件 | 说明 | 行数 |
|------|------|------|
| `action-wrapper.js` | Action 包装器 - 统一权限+日志+错误处理 | 269 行 |
| `crud-helper.js` | CRUD 辅助类 - 一行代码创建完整 CRUD | 261 行 |

---

## 🎯 核心理念

### 1. 自动化一切重复工作
- 权限验证自动完成
- 日志记录自动完成
- 错误处理自动完成
- 返回格式自动统一

### 2. 拿来即用
- 复制模板 → 修改配置 → 立即可用
- 无需手动添加权限检查
- 无需手动记录日志
- 无需处理错误边界

### 3. 高度可扩展
- 支持自定义 Actions
- 支持钩子函数（before/after）
- 支持不同级别的包装器

---

## 📖 action-wrapper.js

统一的 Action 包装器，自动处理权限、日志、错误。

### 核心方法

#### 1. wrapAdminAction

管理员 Action 包装器，自动验证管理员权限并记录日志。

```javascript
import { wrapAdminAction } from '@/lib/core/action-wrapper';

export const createCoupon = wrapAdminAction(
    'create',              // action 类型
    'coupon',              // 资源类型
    async (params, context) => {
        // 业务逻辑
        const { userId } = context; // 自动提供
        const { code, discount } = params;
        
        // 创建优惠券
        return { success: true, data: { id: '123', code } };
    }
);
```

**自动功能：**
- 验证管理员权限
- 记录操作日志（成功/失败）
- 统一错误处理
- 提供 `userId` 上下文

**支持的 action 类型：**
- `create` - 创建
- `update` - 更新
- `delete` - 删除
- `read` - 读取
- `batch_update` - 批量更新
- `batch_delete` - 批量删除

#### 2. wrapBatchAction

批量操作专用包装器。

```javascript
import { wrapBatchAction } from '@/lib/core/action-wrapper';

export const batchDeleteCoupons = wrapBatchAction(
    'batch_delete',
    'coupon',
    async (params, context) => {
        const { ids } = params;
        // 批量删除逻辑
        return { success: true, deletedCount: ids.length };
    }
);
```

#### 3. wrapQueryAction

查询操作包装器，默认跳过日志记录（优化性能）。

```javascript
import { wrapQueryAction } from '@/lib/core/action-wrapper';

export const getCouponList = wrapQueryAction(
    'coupon',
    async (params, context) => {
        const { pageIndex, pageSize } = params;
        // 查询逻辑
        return { success: true, data: [], total: 0 };
    }
);
```

#### 4. wrapClientAction

客户端 Action 包装器（不验证管理员，但需登录）。

```javascript
import { wrapClientAction } from '@/lib/core/action-wrapper';

export const getUserCoupons = wrapClientAction(
    'read',
    'coupon',
    async (params, context) => {
        const { userId, user } = context; // 自动提供
        // 查询用户的优惠券
        return { success: true, data: [] };
    }
);
```

#### 5. wrapPublicAction

公开 API 包装器（无需登录）。

```javascript
import { wrapPublicAction } from '@/lib/core/action-wrapper';

export const getPublicCoupons = wrapPublicAction(
    'read',
    'coupon',
    async (params) => {
        // 查询公开优惠券
        return { success: true, data: [] };
    }
);
```

### 高级选项

```javascript
wrapAdminAction('create', 'coupon', handler, {
    skipLog: false,         // 跳过日志记录
    skipAuth: false,        // 跳过权限验证（慎用！）
    beforeExecute: async (params, context) => {
        // 执行前钩子
        console.log('Before create:', params);
    },
    afterExecute: async (result, context) => {
        // 执行后钩子
        console.log('After create:', result);
    },
});
```

---

## 📖 crud-helper.js

CRUD 操作辅助类，一行代码创建完整的 CRUD Actions。

### 核心方法

#### 1. createCrudActions

创建完整的 CRUD Actions（6 个方法）。

```javascript
import { createCrudActions } from '@/lib/core/crud-helper';
import { couponCrudConfig } from './configs/coupon-crud.config';

// 一行代码创建所有 CRUD Actions
const crudActions = createCrudActions(couponCrudConfig);

// 导出
export const getCouponListAction = crudActions.getList;
export const getCouponDetailAction = crudActions.getDetail;
export const createCouponAction = crudActions.create;
export const updateCouponAction = crudActions.update;
export const deleteCouponAction = crudActions.delete;
export const batchUpdateCouponsAction = crudActions.batchUpdate;
export const batchDeleteCouponsAction = crudActions.batchDelete;
```

**自动生成的方法：**
1. `getList(params)` - 获取列表（分页、搜索、排序）
2. `getDetail(params)` - 获取详情
3. `create(params)` - 创建
4. `update(params)` - 更新
5. `delete(params)` - 删除
6. `batchUpdate(params)` - 批量更新
7. `batchDelete(params)` - 批量删除

**自动功能：**
- 权限验证
- 日志记录
- 字段验证
- 字段过滤
- 搜索条件构建
- 软删除支持
- 错误处理

#### 2. createSimpleCrudActions

创建简化版 CRUD Actions（仅基础 4 个操作）。

```javascript
import { createSimpleCrudActions } from '@/lib/core/crud-helper';

const crudActions = createSimpleCrudActions(config);
// 只包含: getList, getDetail, create, update, delete
```

#### 3. createReadOnlyActions

创建只读 Actions（仅 getList 和 getDetail）。

```javascript
import { createReadOnlyActions } from '@/lib/core/crud-helper';

const readOnlyActions = createReadOnlyActions(config);
// 只包含: getList, getDetail
```

**适用场景：**
- 日志查看页面
- 统计报表页面
- 审计记录页面

#### 4. extendCrudActions

扩展 CRUD Actions，添加自定义方法。

```javascript
import { createCrudActions, extendCrudActions } from '@/lib/core/crud-helper';
import { wrapAdminAction } from '@/lib/core/action-wrapper';

const baseCrudActions = createCrudActions(config);

export default extendCrudActions(baseCrudActions, {
    // 添加自定义 Action
    async activate(params) {
        return wrapAdminAction('activate', 'coupon', async ({ id }, context) => {
            // 激活优惠券逻辑
            return { success: true, message: 'Coupon activated' };
        })(params);
    },
    
    async deactivate(params) {
        return wrapAdminAction('deactivate', 'coupon', async ({ id }, context) => {
            // 停用优惠券逻辑
            return { success: true, message: 'Coupon deactivated' };
        })(params);
    },
});
```

#### 5. createCrudActionsWithHooks

创建带钩子的 CRUD Actions。

```javascript
import { createCrudActionsWithHooks } from '@/lib/core/crud-helper';

const crudActions = createCrudActionsWithHooks(config, {
    // 创建前钩子
    beforeCreate: async (params, context) => {
        console.log('Before create:', params);
        // 数据预处理、验证
    },
    
    // 创建后钩子
    afterCreate: async (result, context) => {
        console.log('After create:', result);
        // 发送通知、同步数据
    },
    
    // 更新前钩子
    beforeUpdate: async (params, context) => {
        console.log('Before update:', params);
    },
    
    // 更新后钩子
    afterUpdate: async (result, context) => {
        console.log('After update:', result);
    },
    
    // 删除前钩子
    beforeDelete: async (params, context) => {
        console.log('Before delete:', params);
    },
    
    // 删除后钩子
    afterDelete: async (result, context) => {
        console.log('After delete:', result);
    },
});
```

---

## 🚀 快速开始

### 步骤 1：创建 CRUD 配置

```javascript
// app/(admin)/actions/coupons/configs/coupon-crud.config.js
export const couponCrudConfig = {
    modelName: 'coupons',
    fieldsConfig: {
        code: {
            type: 'text',
            label: 'Coupon Code',
            required: true,
            rules: [
                { required: true, message: 'Code is required' },
                { min: 4, max: 20, message: 'Code length: 4-20' },
            ],
        },
        discount: {
            type: 'number',
            label: 'Discount (%)',
            required: true,
            rules: [
                { required: true, message: 'Discount is required' },
                { min: 1, max: 100, message: 'Discount: 1-100%' },
            ],
        },
        expiresAt: {
            type: 'date',
            label: 'Expires At',
            required: true,
        },
    },
};
```

### 步骤 2：创建 Actions 文件

```javascript
// app/(admin)/actions/coupons/admin-coupons.js
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { couponCrudConfig } from './configs/coupon-crud.config';

// 一行代码创建所有 CRUD Actions
const crudActions = createCrudActions(couponCrudConfig);

// 导出
export const getCouponListAction = crudActions.getList;
export const getCouponDetailAction = crudActions.getDetail;
export const createCouponAction = crudActions.create;
export const updateCouponAction = crudActions.update;
export const deleteCouponAction = crudActions.delete;
export const batchUpdateCouponsAction = crudActions.batchUpdate;
export const batchDeleteCouponsAction = crudActions.batchDelete;
```

### 步骤 3：创建前端页面

```jsx
// app/(admin)/admin/coupons/page.js
import { SmartCrudPage } from '@/components/admin/smart-crud-page';
import { couponCrudConfig } from '@/app/(admin)/actions/coupons/configs/coupon-crud.config';
import * as actions from '@/app/(admin)/actions/coupons/admin-coupons';

export default function CouponsPage() {
    return (
        <SmartCrudPage
            title="Coupon Management"
            fieldsConfig={couponCrudConfig.fieldsConfig}
            actions={actions}
        />
    );
}
```

### 完成！

3 个文件，不到 50 行代码，完整的 CRUD 功能：
- 权限验证
- 日志记录
- 表格、表单、搜索
- 分页、排序、筛选
- 批量操作
- 软删除

---

## 🔗 依赖关系

```
crud-helper.js
    ├── action-wrapper.js
    │   ├── lib/auth/auth
    │   ├── lib/auth/admin-auth
    │   └── lib/logging/action-logger
    │
    └── app/(admin)/actions/dao/base.js (BaseDAO)
        ├── lib/database/prisma
        └── lib/logging/action-logger
```

---

## 📚 相关文档

- [BaseDAO 文档](https://nextjsbase.com/zh/docs/api/BASE_DAO)
- [Server Actions & 日志](https://nextjsbase.com/zh/docs/admin/guides/SERVER_ACTIONS)
- [Smart CRUD 指南](https://nextjsbase.com/zh/docs/admin/guides/SMART_CRUD)
- [通用工具函数 nb.pubfn](../function/README.md)

---

## 🎯 设计原则

1. **Convention over Configuration** - 约定优于配置
2. **Don't Repeat Yourself (DRY)** - 不要重复自己
3. **Single Responsibility** - 单一职责
4. **Separation of Concerns** - 关注点分离
5. **Open/Closed Principle** - 开闭原则（对扩展开放，对修改封闭）

---

## ✨ 总结

**核心库提供的价值：**

- 🚀 **10 倍开发效率** - 3 个文件完成完整 CRUD
- 🔐 **100% 权限覆盖** - 自动验证，无遗漏
- 📝 **100% 日志覆盖** - 自动记录，可审计
- ⚡ **0 重复代码** - 统一封装，拿来即用
- 🎯 **统一规范** - 代码风格一致，易维护

**适用场景：**

- 后台管理系统
- 数据管理页面
- 审计日志系统
- 报表查询系统
- 任何需要 CRUD 的业务模块
