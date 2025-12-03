# Lib 库目录结构

项目核心库文件，按功能分类组织。

## 📁 目录结构

```
lib/
├── auth/                # 🔐 认证与权限
│   ├── auth.js          # Better Auth 核心配置
│   ├── auth-client.js   # 客户端认证 API
│   ├── admin-auth.js    # 管理员权限验证
│   ├── page-auth.js     # RBAC 页面访问控制
│   ├── permission-auth.js # RBAC 操作权限检查
│   └── README.md
│
├── database/            # 🗄️ 数据库访问
│   ├── prisma.js        # Prisma Client 单例
│   ├── selects.js       # 万能连表查询工具
│   └── README.md
│
├── function/            # 🛠️ 通用工具函数（nb.pubfn）
│   ├── index.js         # 工具函数入口（类型判断、数组、字符串、时间等）
│   ├── treeUtil.js      # 树形结构工具
│   └── README.md
│
├── logging/             # 📝 日志系统
│   ├── action-logger.js # 管理员操作日志
│   ├── usage-logs.js    # 用户使用记录
│   └── README.md
│
├── business/            # 💼 业务逻辑
│   ├── credits.js       # 积分管理
│   ├── packages.js      # 套餐管理
│   ├── user-profile.js  # 用户资料
│   ├── init-user.js     # 用户初始化
│   └── README.md
│
├── crud/                # 🎨 CRUD 工具
│   ├── field-generator.js     # 字段生成器
│   ├── field-types.js         # 字段类型注册表
│   ├── rule-evaluator.js      # 规则评估器
│   ├── search-transformer.js  # 搜索转换器
│   └── README.md
│
├── core/                # 🎯 核心库
│   ├── action-wrapper.js # Action 包装器
│   ├── crud-helper.js    # CRUD 辅助类
│   └── README.md
│
├── validation/          # 数据验证
│   ├── auto-schema.js   # 自动 Schema 转换（validation → Zod）
│   ├── index.js         # 导出入口
│   └── README.md
│
└── utils.js             # 🔧 通用工具函数（旧，建议使用 function/）
```

## 🎯 快速导航

### 认证相关

```javascript
// 服务端认证
import { auth } from '@/lib/auth/auth';
import { checkAdmin, checkAdminAction } from '@/lib/auth/admin-auth';
import { checkPageAccess } from '@/lib/auth/page-auth';
import { checkPermission } from '@/lib/auth/permission-auth';

// 客户端认证
import { authClient } from '@/lib/auth/auth-client';
```

### 数据库操作

```javascript
// Prisma Client（推荐）
import { prisma } from '@/lib/database/prisma';

// 万能连表查询
import { selects, selectOne } from '@/lib/database/selects';
```

### 通用工具函数

```javascript
// 推荐：使用 nb.pubfn 工具集
import nb from '@/lib/function';

// 类型判断
nb.pubfn.isArray(value);
nb.pubfn.isFunction(callback);
nb.pubfn.isNull(data);

// UUID 生成
const id = nb.pubfn.uuid();

// 时间格式化
nb.pubfn.timeFormat(date, 'yyyy-MM-dd');

// 树形结构
nb.pubfn.tree.arrayToTree(list);
nb.pubfn.tree.findInTree(tree, predicate);
```

### 日志记录

```javascript
// 管理员操作日志
import { logAction } from '@/lib/logging/action-logger';

// 用户使用记录
import { createUsageLog, updateUsageLog } from '@/lib/logging/usage-logs';
```

### 业务逻辑

```javascript
// 积分管理
import { getUserCredits, addCredits, deductCredits } from '@/lib/business/credits';

// 套餐管理
import { getActivePackages, purchasePackage } from '@/lib/business/packages';

// 用户资料
import { getUserProfile, updateUserProfile } from '@/lib/business/user-profile';

// 用户初始化
import { initializeNewUser, updateLastLogin } from '@/lib/business/init-user';
```

### CRUD 工具

```javascript
// SmartCrudPage 组件使用
import {
    generateTableColumns,
    generateSearchConfig,
    validateFieldsConfig,
} from '@/lib/crud/field-generator';

import { buildSortCondition } from '@/lib/crud/search-transformer';
import { evaluateRule } from '@/lib/crud/rule-evaluator';
import { FIELD_TYPE_REGISTRY } from '@/lib/crud/field-types';
```

### 数据验证

```javascript
// 验证配置自动转换为 Zod Schema
import { validateWithConfig, runCustomValidators } from '@/lib/validation';

// 高级用法：直接使用 Zod
import { z } from '@/lib/validation';
```

## 📖 详细文档

每个子目录都有详细的 README.md 文档：

- [🔐 认证与权限 (auth/)](./auth/README.md)
- [🗄️ 数据库访问 (database/)](./database/README.md)
- [🛠️ 通用工具函数 (function/)](./function/README.md)
- [📝 日志系统 (logging/)](./logging/README.md)
- [💼 业务逻辑 (business/)](./business/README.md)
- [🎨 CRUD 工具 (crud/)](./crud/README.md)
- [🎯 核心库 (core/)](./core/README.md)
- [数据验证 (validation/)](./validation/README.md)

## 🔗 依赖关系图

```
┌─────────────────────────────────────────────────┐
│                  App Layer                       │
│  (Server Actions / Pages / Components)          │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
┌────────▼────────┐  ┌───────▼────────┐
│   business/     │  │     crud/      │
│  (业务逻辑)       │  │  (CRUD 工具)   │
└────────┬────────┘  └───────┬────────┘
         │                   │
    ┌────▼───────┬───────────┘
    │            │
┌───▼────┐  ┌───▼────┐
│ auth/  │  │logging/│
│(认证)   │  │(日志)   │
└───┬────┘  └───┬────┘
    │           │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ database/ │
    │ (数据库)   │
    └───────────┘
```

## 📝 命名规范

### 导入路径规范

- 使用绝对路径：`@/lib/auth/auth`
- 明确子目录：`@/lib/database/prisma`

### 文件命名规范

- 使用 kebab-case：`action-logger.js`
- 功能清晰描述：`user-profile.js`
- 避免缩写：`permission-auth.js` 而不是 `perm-auth.js`

## 🚀 开发指南

### 添加新的业务模块

1. 在对应目录创建新文件
2. 使用 `@/lib/database/db-api` 进行数据库操作
3. 在目录的 README.md 中更新文档
4. 添加使用示例

### 修改现有模块

1. 检查依赖关系，确保不破坏现有功能
2. 运行 linter 检查导入路径
3. 更新相关文档

## 🔧 维护记录

- **2024-11-06**: 完成 lib 目录重构
  - 创建 5 个功能分类目录
  - 迁移所有文件到新目录结构
  - 更新所有导入路径（40+ 文件）
  - 创建各目录 README 文档

