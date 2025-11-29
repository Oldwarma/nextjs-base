# 字段命名规范

> **最后更新**: 2025-11-04  
> **适用范围**: 数据库、后端、前端  
> **强制执行**: v2.0.0+

---

## 📋 目录

1. [概述](#概述)
2. [核心原则](#核心原则)
3. [标准字段命名](#标准字段命名)
4. [废弃字段名](#废弃字段名)
5. [数据库命名](#数据库命名)
6. [代码命名](#代码命名)
7. [迁移指南](#迁移指南)
8. [检查清单](#检查清单)

---

## 概述

为了确保项目的一致性、可维护性和可扩展性，本文档定义了统一的字段命名规范。

### 🎯 目标

- **一致性**：数据库、后端、前端使用相同的字段名
- **可读性**：字段名清晰表达含义
- **可维护性**：降低理解和修改成本
- **可扩展性**：兼容多种数据库（MongoDB、PostgreSQL、CloudflareD1）

### 📌 适用范围

- 数据库集合（Collection）字段
- CRUD Config 配置文件
- Server Actions 参数和返回值
- 前端页面字段配置
- DAO 层方法参数

---

## 核心原则

### 1. 使用 snake_case（蛇形命名）

**推荐**：
```javascript
parent_id
sort_order
crud_category
created_at
```

**❌ 不推荐**：
```javascript
parentId       // camelCase
ParentId       // PascalCase
PARENT_ID      // SCREAMING_SNAKE_CASE
```

**例外**：
- JavaScript 代码中的变量和函数名使用 `camelCase`
- React 组件名使用 `PascalCase`
- 但数据库字段、API 参数统一使用 `snake_case`

### 2. 使用语义化名称

**推荐**：
```javascript
user_id        // 清晰表达"用户ID"
created_at     // 清晰表达"创建时间"
enable         // 清晰表达"是否启用"
```

**❌ 不推荐**：
```javascript
uid            // 缩写不清晰
ts             // 时间戳缩写
flag           // 含义模糊
```

### 3. 避免冗余前缀

**推荐**：
```javascript
// roles 表
{
  id: String,
  name: String
}
```

**❌ 不推荐**：
```javascript
// roles 表
{
  role_id: String,      // 表名已经是 roles，无需前缀
  role_name: String
}
```

**例外**：外键字段保留前缀表明来源
```javascript
// articles 表
{
  author_id: String,    // 保留前缀，表明是 users 表的 id
  category_id: String   // 保留前缀，表明是 categories 表的 id
}
```

### 4. 统一布尔值命名

**推荐**：
```javascript
enable: Boolean        // 是否启用
hidden: Boolean        // 是否隐藏
banned: Boolean        // 是否禁用
```

**❌ 不推荐**：
```javascript
enabled: Boolean       // 使用现在时，不用过去式
is_enable: Boolean     // 不需要 is_ 前缀
can_edit: Boolean      // 不需要 can_ 前缀
```

---

## 标准字段命名

### 主键和引用

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `id` | String (UUID) | 主键，所有集合统一使用 | `"a1b2c3d4-..."` |
| `_id` | ObjectId | MongoDB 自动生成，仅兼容性保留 | `ObjectId("...")` |
| `parent_id` | String (UUID) | 父级引用（树形结构） | `"parent-uuid"` |
| `user_id` | String (UUID) | 用户 ID（外键） | `"user-uuid"` |
| `author_id` | String (UUID) | 作者 ID（外键） | `"user-uuid"` |

### 基础信息

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `name` | String | 名称（通用） | `"超级管理员"` |
| `title` | String | 标题 | `"文章标题"` |
| `description` | String | 描述 | `"角色描述"` |
| `remark` | String | 备注 | `"备注信息"` |
| `url` | String | URL 地址 | `"/admin/users"` |
| `icon` | String | 图标名称 | `"UserOutlined"` |

### 状态和配置

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `enable` | Boolean | 是否启用 | `true` |
| `hidden` | Boolean | 是否隐藏 | `false` |
| `banned` | Boolean | 是否禁用 | `false` |
| `sort` | Number | 排序值（越小越靠前） | `10` |
| `status` | String | 状态 | `"active"` |
| `type` | String | 类型 | `"admin"` |

### 时间字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `created_at` | Date | 创建时间 | `new Date()` |
| `updated_at` | Date | 更新时间 | `new Date()` |
| `deleted_at` | Date | 删除时间（软删除） | `new Date()` |
| `expired_at` | Date | 过期时间 | `new Date()` |

### RBAC 特有字段

| 字段名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `role` | String | Better Auth 单一角色 | `"admin"` |
| `roles` | Array<String> | RBAC 角色 UUID 数组 | `["role-uuid-1"]` |
| `permission` | Array<String> | 权限 UUID 数组 | `["perm-uuid-1"]` |
| `menu` | Array<String> | 菜单 UUID 数组 | `["menu-uuid-1"]` |
| `actions` | Array<String> | Action 路径数组 | `["/admin/actions/*"]` |
| `crud_category` | Number | CRUD 分类（0-5） | `1` |
| `level` | Number | 权限级别（0-4） | `2` |

---

## 废弃字段名

以下字段名已废弃，不应再使用：

### ❌ 旧的主键命名

| 废弃 | 替代 | 理由 |
|------|------|------|
| `role_id` | `id` | 避免冗余前缀 |
| `permission_id` | `id` | 避免冗余前缀 |
| `menu_id` | `id` | 避免冗余前缀 |
| `user_id`（作为主键） | `id` | 统一主键名称 |
| `key` | `id` | 统一主键名称 |

### ❌ 旧的名称字段

| 废弃 | 替代 | 理由 |
|------|------|------|
| `role_name` | `name` | 避免冗余前缀 |
| `permission_name` | `name` | 避免冗余前缀 |
| `menu_name` | `name` | 避免冗余前缀 |

### ❌ 旧的引用字段

| 废弃 | 替代 | 理由 |
|------|------|------|
| `parentId` | `parent_id` | 统一为 snake_case |
| `userId` | `user_id` | 统一为 snake_case |
| `authorId` | `author_id` | 统一为 snake_case |

### ❌ 旧的排序字段

| 废弃 | 替代 | 理由 |
|------|------|------|
| `sortOrder` | `sort` | 简化命名 |
| `order` | `sort` | 语义更清晰 |

### ❌ 旧的状态字段

| 废弃 | 替代 | 理由 |
|------|------|------|
| `enabled` | `enable` | 使用现在时 |
| `is_enable` | `enable` | 移除 is_ 前缀 |
| `can_edit` | - | 权限控制不应在字段中 |

### ❌ 旧的备注字段

| 废弃 | 替代 | 理由 |
|------|------|------|
| `comment` | `remark` | 统一使用 remark |
| `note` | `remark` | 统一使用 remark |

### ❌ 旧的用户角色字段

| 废弃 | 替代 | 理由 |
|------|------|------|
| `role_ids` | `roles` | 简化命名，语义更清晰 |
| `ids` | `roles` | 含义模糊 |

### ❌ 旧的时间字段

| 废弃 | 替代 | 理由 |
|------|------|------|
| `createdAt` | `created_at` | 统一为 snake_case |
| `updatedAt` | `updated_at` | 统一为 snake_case |
| `deletedAt` | `deleted_at` | 统一为 snake_case |

---

## 数据库命名

### 集合名称（Collection Name）

**规则**：
- 使用复数形式
- 使用 snake_case
- 语义清晰

**推荐**：
```javascript
users
roles
permissions
menus
articles
credit_transactions
```

**❌ 不推荐**：
```javascript
user                    // 应该用复数
uni-id-roles           // 不要使用连字符
opendb-admin-menus     // 不要使用项目前缀
UserRoles              // 不要使用 PascalCase
```

### 索引命名

**规则**：
- 格式：`idx_{collection}_{field1}_{field2}`
- 使用 snake_case

**推荐**：
```javascript
// 单字段索引
db.users.createIndex({ "email": 1 }, { name: "idx_users_email" })

// 复合索引
db.articles.createIndex(
  { "author_id": 1, "status": 1 },
  { name: "idx_articles_author_id_status" }
)

// 唯一索引
db.roles.createIndex(
  { "name": 1 },
  { name: "idx_roles_name_unique", unique: true }
)
```

---

## 代码命名

### JavaScript/TypeScript 变量

**规则**：
- 使用 camelCase
- 语义清晰
- 避免缩写

**推荐**：
```javascript
// 变量
const userId = "user-uuid";
const createdAt = new Date();
const roleList = [];

// 函数
function getUserRoles(userId) { }
function bindUserRoles({ userId, roles }) { }

// 常量
const MAX_RETRY_COUNT = 3;
const DEFAULT_PAGE_SIZE = 20;
```

**❌ 不推荐**：
```javascript
const uid = "...";           // 缩写不清晰
const CreatedAt = new Date(); // 不要用 PascalCase
const RoleList = [];         // 不要用 PascalCase
```

### React 组件

**规则**：
- 组件名使用 PascalCase
- 文件名使用 kebab-case 或 PascalCase

**推荐**：
```javascript
// 组件定义
export default function SmartCrudPage() { }
export function UserRoleModal() { }

// 文件名
smart-crud-page.jsx
SmartCrudPage.jsx          // 也可以
```

### Server Actions

**规则**：
- Action 名称使用 camelCase + Action 后缀
- 参数使用 camelCase
- 返回值字段使用 camelCase

**推荐**：
```javascript
// Action 定义
export async function getUserRolesAction(userId) {
  return {
    success: true,
    data: roles,          // camelCase
  };
}

export async function bindUserRolesAction(userId, roles, reset) {
  // roles 参数（不是 roleIds）
}
```

### CRUD Config

**规则**：
- 配置对象的 key 使用 camelCase
- 但 `fields` 中的字段名必须与数据库一致（snake_case）

**推荐**：
```javascript
export const userCrudConfig = {
  collectionName: 'users',       // camelCase
  primaryKey: 'id',              // 数据库字段名（不变）
  
  fields: {
    creatable: [
      'name',                    // 数据库字段名（不变）
      'parent_id',               // 数据库字段名（不变）
      'sort',                    // 数据库字段名（不变）
    ],
  },
  
  query: {
    defaultSort: { name: 1 },    // camelCase + 数据库字段名
    defaultPageSize: 20,         // camelCase
    
    foreignDB: [                 // camelCase
      {
        dbName: 'roles',         // camelCase
        localKey: 'roles',       // 数据库字段名（不变）
        foreignKey: 'id',        // 数据库字段名（不变）
        as: 'roleList',          // camelCase（返回字段名）
        fieldJson: { id: 1, name: 1 }, // 数据库字段名（不变）
      },
    ],
  },
};
```

---

## 迁移指南

### 数据库迁移脚本

#### 1. roles 表迁移

```javascript
// MongoDB Shell
db.roles.updateMany(
  {},
  [
    {
      $set: {
        // 重命名字段
        id: { $ifNull: ["$id", { $toString: "$_id" }] },  // 如果没有 id，用 _id 转换
        name: "$role_name",
        remark: { $ifNull: ["$remark", "$comment"] },
        enable: { $ifNull: ["$enable", "$enabled", true] },
        sort: { $ifNull: ["$sort", "$sortOrder", 0] },
      }
    },
    {
      $unset: [
        "role_id",
        "role_name",
        "comment",
        "enabled",
        "sortOrder"
      ]
    }
  ]
);

// 为 id 字段创建唯一索引
db.roles.createIndex({ "id": 1 }, { unique: true, name: "idx_roles_id_unique" });
```

#### 2. permissions 表迁移

```javascript
db.permissions.updateMany(
  {},
  [
    {
      $set: {
        id: { $ifNull: ["$id", { $toString: "$_id" }] },
        name: "$permission_name",
        parent_id: "$parentId",
        remark: { $ifNull: ["$remark", "$comment"] },
        enable: { $ifNull: ["$enable", "$enabled", true] },
        sort: { $ifNull: ["$sort", "$sortOrder", 0] },
        crud_category: { $ifNull: ["$crud_category", "$curd_category", 0] },
      }
    },
    {
      $unset: [
        "permission_id",
        "permission_name",
        "parentId",
        "comment",
        "enabled",
        "sortOrder",
        "curd_category"
      ]
    }
  ]
);

db.permissions.createIndex({ "id": 1 }, { unique: true, name: "idx_permissions_id_unique" });
```

#### 3. menus 表迁移

```javascript
db.menus.updateMany(
  {},
  [
    {
      $set: {
        id: { $ifNull: ["$id", "$key", { $toString: "$_id" }] },
        parent_id: "$parentId",
        enable: { $ifNull: ["$enable", "$enabled", true] },
        sort: { $ifNull: ["$sort", "$sortOrder", 0] },
        remark: { $ifNull: ["$remark", "$comment"] },
      }
    },
    {
      $unset: [
        "menu_id",
        "key",
        "parentId",
        "enabled",
        "sortOrder",
        "comment"
      ]
    }
  ]
);

db.menus.createIndex({ "id": 1 }, { unique: true, name: "idx_menus_id_unique" });
```

#### 4. users 表迁移（RBAC 角色字段）

```javascript
db.users.updateMany(
  { ids: { $exists: true } },
  [
    {
      $set: {
        roles: { $ifNull: ["$roles", "$ids", "$role_ids", []] }
      }
    },
    {
      $unset: ["ids", "role_ids"]
    }
  ]
);
```

### 代码迁移清单

#### 1. CRUD Config 文件

- [ ] 修改 `primaryKey` 为 `id`
- [ ] 修改 `fields.creatable` 和 `fields.updatable` 中的字段名
- [ ] 修改 `query.defaultSort` 中的字段名
- [ ] 添加或更新 `query.foreignDB` 配置
- [ ] 修改 `validation` 规则中的字段名
- [ ] 修改 `transforms.input` 和 `transforms.output` 中的字段名

#### 2. DAO 文件

- [ ] 修改函数参数名（如 `roleIds` → `roles`）
- [ ] 修改查询条件中的字段名
- [ ] 修改更新操作中的字段名
- [ ] 修改返回数据中的字段名
- [ ] 更新注释和 JSDoc

#### 3. Server Actions 文件

- [ ] 修改函数参数名
- [ ] 修改调用 DAO 时的参数
- [ ] 修改返回数据的字段名
- [ ] 更新 JSDoc 注释

#### 4. 前端页面文件

- [ ] 修改 `fieldsConfig` 中的 `key` 值
- [ ] 修改 `render` 函数中的字段访问
- [ ] 修改 `SmartCrudPage` 的 `rowKey` 属性
- [ ] 修改连表字段的访问（如 `record.permissionList`）

---

## 检查清单

### 创建新功能时

- [ ] 使用 `id` 作为主键（UUID）
- [ ] 使用 `name` 作为名称字段
- [ ] 使用 `parent_id` 作为父级引用
- [ ] 使用 `sort` 作为排序字段
- [ ] 使用 `remark` 作为备注字段
- [ ] 使用 `enable` 作为启用状态字段
- [ ] 时间字段使用 `_at` 后缀（`created_at`, `updated_at`）
- [ ] 外键字段保留来源表前缀（`user_id`, `author_id`）

### 修改现有功能时

- [ ] 检查是否有废弃字段名
- [ ] 检查数据库字段名是否统一
- [ ] 检查 CRUD Config 是否统一
- [ ] 检查 Server Actions 参数是否统一
- [ ] 检查前端页面字段配置是否统一
- [ ] 检查连表配置是否正确
- [ ] 更新相关文档

### Code Review 时

- [ ] 新增的数据库字段遵循命名规范
- [ ] CRUD Config 的字段名与数据库一致
- [ ] Server Actions 的参数名遵循 camelCase
- [ ] 前端页面的字段访问正确
- [ ] 没有使用废弃的字段名
- [ ] 注释和文档已更新

---

## 常见错误

### ❌ 错误示例 1：使用废弃字段名

```javascript
// ❌ 错误
const role = {
  role_id: "uuid",
  role_name: "超级管理员",
  enabled: true,
  sortOrder: 10
};

// 正确
const role = {
  id: "uuid",
  name: "超级管理员",
  enable: true,
  sort: 10
};
```

### ❌ 错误示例 2：参数名不一致

```javascript
// ❌ 错误
export async function bindUserRoles({ userId, roleIds }) {
  await collection.updateOne({ id: userId }, { $set: { ids: roleIds } });
}

// 正确
export async function bindUserRoles({ userId, roles }) {
  await collection.updateOne({ id: userId }, { $set: { roles: roles } });
}
```

### ❌ 错误示例 3：连表字段访问错误

```javascript
// ❌ 错误
{
  key: 'roles',
  detail: {
    render: (value) => {
      // 直接显示 UUID 数组
      return value.join(', ');
    }
  }
}

// 正确
{
  key: 'roles',
  detail: {
    render: (value, record) => {
      // 使用连表数据显示名称
      const roles = record.roleList || value || [];
      return (
        <Space wrap>
          {roles.map(item => (
            <Tag>{item?.name || item}</Tag>
          ))}
        </Space>
      );
    }
  }
}
```

---

## 相关文档

- [RBAC 系统文档](./RBAC_SYSTEM.md)
- [BaseDAO 文档](./admin/BASE_DAO.md)
- [CRUD 开发指南](./admin/CRUD_GUIDE.md)
- [DB API 文档](./database/DB_API_GUIDE.md)

---

## 许可证

MIT License

