# Permissions 配置文件拆分重构文档

**日期：** 2024-11-13  
**问题：** Module not found: Can't resolve 'child_process'  
**解决方案：** 将混合配置拆分为客户端和服务端两个独立文件

---

## 🔴 问题描述

### 原始错误
```
Module not found: Can't resolve 'child_process'

Import trace:
  ./lib/database/mongodb.js [Client Component Browser]
  ./app/(admin)/actions/rbac/configs/permission-crud-unified.config.js [Client Component Browser]
  ./app/(admin)/admin/rbac/permissions/page.js [Client Component Browser]
```

### 根本原因
1. **混合配置文件被客户端导入**
   - `permission-crud-unified.config.js` 包含客户端（fieldsConfig）和服务端（validation/hooks）配置
   - Page.js（客户端组件）导入此文件获取 `fieldsConfig`
   - 配置中的 hooks 使用了 MongoDB 模块

2. **Next.js 静态分析限制**
   - 即使使用动态 `import()`，Webpack/Turbopack 仍会在静态分析阶段尝试解析模块
   - MongoDB 依赖 Node.js 原生模块（如 `child_process`）
   - 客户端代码无法访问这些模块

3. **'use client' 指令无效**
   - 添加 `'use client'` 不能阻止 import 语句的静态分析
   - 只影响代码的运行环境，不影响构建时的模块解析

---

## 解决方案

### 策略：配置文件拆分

将混合配置拆分为两个独立文件：

1. **客户端配置**：`permission-fields.config.jsx`
   - 只包含 `fieldsConfig`（字段配置）
   - 用于前端组件渲染（SmartCrudPage）
   - 不包含任何 MongoDB 或 Node.js 模块引用
   - 可安全在客户端使用

2. **服务端配置**：`permission-crud.config.js`
   - 只包含 BaseDAO 配置
   - 包含 validation、hooks、transforms
   - 只在 Server Actions 中使用
   - 可以安全使用 MongoDB 模块

---

## 📁 文件结构

### 重构前
```
app/(admin)/actions/rbac/configs/
└── permission-crud-unified.config.js  (混合配置，628行)
    ├── fieldsConfig (客户端)
    ├── validation (服务端)
    ├── hooks (服务端 - 使用 MongoDB)
    └── transforms (服务端)
```

### 重构后
```
app/(admin)/actions/rbac/configs/
├── permission-fields.config.jsx  (客户端配置，314行)
│   └── getPermissionFieldsConfig()  → 返回 fieldsConfig
│
└── permission-crud.config.js  (服务端配置，391行)
    ├── fields (可创建/可更新/可搜索字段)
    ├── validation (验证规则 + MongoDB 逻辑)
    ├── hooks (生命周期钩子 + MongoDB 操作)
    └── transforms (数据转换)
```

---

## 🔧 代码变更

### 1. 客户端配置文件

**文件：** `app/(admin)/actions/rbac/configs/permission-fields.config.jsx`

```jsx
'use client';

import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

/**
 * 字段配置 - 用于自动生成表格、表单、搜索、详情
 * @param {Array} permissionTree - 权限树数据（用于父级权限选择）
 * @returns {Array} fieldsConfig
 */
export const getPermissionFieldsConfig = (permissionTree = []) => [
  {
    key: 'name',
    title: 'Name',
    type: 'text',
    table: { width: 200, ellipsis: true },
    form: { required: true, placeholder: 'Enter name' },
    search: { placeholder: 'Search by name' },
  },
  // ... 其他字段配置
];
```

**特点：**
- 使用 `'use client'` 指令
- 只导入 Ant Design 组件（客户端安全）
- 不包含任何 MongoDB 或 Node.js 模块
- 导出纯函数 `getPermissionFieldsConfig()`

---

### 2. 服务端配置文件

**文件：** `app/(admin)/actions/rbac/configs/permission-crud.config.js`

```javascript
// 无 'use client' 指令 - 默认为服务端模块

export const permissionCrudConfig = {
  collectionName: 'permissions',
  primaryKey: 'id',
  
  fields: {
    creatable: ['name', 'parent_id', 'remark', /* ... */],
    updatable: ['name', 'parent_id', 'remark', /* ... */],
    searchable: ['name', 'remark'],
  },

  validation: {
    parent_id: {
      custom: async (value, context) => {
        // 可以安全使用动态 import
        const { getDb } = await import('@/lib/database/mongodb');
        const db = await getDb();
        // ... 验证逻辑
      },
    },
  },

  hooks: {
    beforeCreate: async (data, context) => {
      // 可以安全使用动态 import
      const { getDb } = await import('@/lib/database/mongodb');
      // ... hook 逻辑
    },
  },

  transforms: { /* ... */ },
};
```

**特点：**
- 默认服务端模块（无 'use client'）
- 可以使用动态 `import()` 加载 MongoDB
- 只在 Server Actions 中使用
- 包含完整的后端逻辑

---

### 3. Page 组件更新

**文件：** `app/(admin)/admin/rbac/permissions/page.js`

**修改前：**
```javascript
import { permissionCrudConfig } from '@/app/(admin)/actions/rbac/configs/permission-crud-unified.config';

const fieldsConfig = useMemo(() => {
  return permissionCrudConfig.getFieldsConfig(permissionTree);
}, [permissionTree]);
```

**修改后：**
```javascript
// 只导入客户端配置
import { getPermissionFieldsConfig } from '@/app/(admin)/actions/rbac/configs/permission-fields.config';

const fieldsConfig = useMemo(() => {
  return getPermissionFieldsConfig(permissionTree);
}, [permissionTree]);
```

---

### 4. Server Actions 更新

**文件：** `app/(admin)/actions/rbac/admin-permissions.js`

**修改前：**
```javascript
import { permissionCrudConfig } from '@/app/(admin)/actions/rbac/configs/permission-crud-unified.config';
```

**修改后：**
```javascript
// 只导入服务端配置
import { permissionCrudConfig } from '@/app/(admin)/actions/rbac/configs/permission-crud.config';
```

---

## 📊 拆分前后对比

| 指标 | 拆分前 | 拆分后 |
|------|--------|--------|
| **配置文件** | 1 个混合文件 (628行) | 2 个独立文件 (314+391行) |
| **客户端引用** | ❌ 导入混合配置（含 MongoDB） | 只导入纯客户端配置 |
| **服务端引用** | 可使用完整配置 | 可使用完整配置 |
| **构建错误** | ❌ Module not found | 正常构建 |
| **维护性** | ⚠️ 职责混合 | 职责分离 |

---

## 🎯 核心原则

### Next.js 客户端/服务端代码分离规则

1. **客户端代码（'use client'）**
   - 可以导入：React、Ant Design、纯 JS 库
   - ❌ 不能导入：MongoDB、fs、path、child_process 等 Node.js 模块
   - ❌ 不能导入：任何间接依赖 Node.js 模块的文件

2. **服务端代码（默认）**
   - 可以导入：任何 Node.js 模块
   - 可以使用动态 `import()` 延迟加载
   - ⚠️ 如果被客户端代码导入，会导致构建错误

3. **混合使用策略**
   - **拆分配置**：客户端配置 + 服务端配置
   - **拆分组件**：纯 UI 组件（客户端） + 数据获取（服务端）
   - **Server Actions**：将所有后端逻辑封装在 Server Actions 中
   - ❌ **避免混合**：不要在同一文件中混合客户端和服务端代码

---

## 🚀 应用到其他页面

### Roles 页面重构计划

**当前文件结构：**
```
app/(admin)/actions/rbac/configs/
└── role-crud.config.js  (服务端配置)

app/(admin)/admin/rbac/roles/
└── page.js  (手动构建 fieldsConfig)
```

**重构目标：**
```
app/(admin)/actions/rbac/configs/
├── role-fields.config.jsx  (新增：客户端配置)
└── role-crud.config.js  (保持：服务端配置)

app/(admin)/admin/rbac/roles/
└── page.js  (使用 SmartCrudPage + getRoleFieldsConfig)
```

### Users 页面重构计划

**同理：**
```
app/(admin)/actions/rbac/configs/
├── user-fields.config.jsx  (新增)
└── user-crud.config.js  (更新)
```

### Menus 页面重构计划

**同理：**
```
app/(admin)/actions/rbac/configs/
├── menu-fields.config.jsx  (新增)
└── menu-crud.config.js  (更新)
```

---

## 验证清单

- [x] 客户端配置文件创建完成
- [x] 服务端配置文件创建完成
- [x] Page.js 导入路径更新
- [x] admin-permissions.js 导入路径更新
- [x] 旧的混合配置文件已删除
- [x] 无 Lint 错误
- [ ] **应用正常启动**
- [ ] **Permissions 页面所有功能测试**

---

## 📝 后续任务

1. **测试 Permissions 页面**（当前）
   - 页面加载
   - 树形表格显示
   - CRUD 操作
   - 字段验证
   - 父级选择

2. **重构 Roles 页面**
   - 创建 `role-fields.config.jsx`
   - 更新 `role-crud.config.js`
   - 精简 `roles/page.js`

3. **重构 Users 页面**
   - 创建 `user-fields.config.jsx`
   - 更新 `user-crud.config.js`
   - 精简 `users/page.js`

4. **重构 Menus 页面**
   - 创建 `menu-fields.config.jsx`
   - 更新 `menu-crud.config.js`
   - 精简 `menus/page.js`

---

## 💡 经验总结

### 问题根源
- Next.js 的模块解析是静态的，动态 import 只能延迟执行，不能避免静态分析
- 客户端代码会触发完整的依赖链解析
- MongoDB 等 Node.js 库不能在客户端代码中使用

### 最佳实践
1. **严格分离客户端和服务端代码**
2. **配置文件按职责拆分**
3. **使用 Server Actions 封装所有后端逻辑**
4. **客户端只关注 UI 和交互逻辑**

### 架构原则
```
┌─────────────────────────────────────────┐
│          Client Component               │
│  ┌─────────────────────────────────┐   │
│  │  page.js                         │   │
│  │  - 只导入 fields config          │   │
│  │  - 调用 Server Actions           │   │
│  │  - UI 渲染和交互                 │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│     Import (client-safe)                │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  permission-fields.config.jsx   │   │
│  │  - 纯 UI 配置                    │   │
│  │  - 无后端依赖                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Server Actions                 │
│  ┌─────────────────────────────────┐   │
│  │  admin-permissions.js           │   │
│  │  - 导入 crud config              │   │
│  │  - 使用 createCrudActions        │   │
│  └─────────────────────────────────┘   │
│              ↓                          │
│     Import (server-only)                │
│              ↓                          │
│  ┌─────────────────────────────────┐   │
│  │  permission-crud.config.js      │   │
│  │  - BaseDAO 配置                  │   │
│  │  - Validation, Hooks, Transforms │   │
│  │  - 可使用 MongoDB                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

**文档版本：** 1.0  
**作者：** AI Assistant  
**最后更新：** 2024-11-13

