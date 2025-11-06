# 用户管理 DAO 架构说明

## 快速回答

**用户页面使用的是 UserDAO（自定义 DAO），没有使用 BaseDAO。**

---

## 完整调用链

```
┌─────────────────────────────────────────────────────────────┐
│                    前端页面层                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
    app/(admin)/admin/rbac/users/page.js
    (用户管理页面 - Smart CRUD 版本)
                              ↓
            导入 Server Actions:
            - getUserListAction as getList
            - updateUserInfoAction as update
            - deleteUserAction as deleteItem
            - batchUpdateUsersAction as batchUpdate
            - createUserAction
            - resetUserPasswordAction
            - bindUserRolesAction
            - getUserRolesAction
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions 层                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
    app/(admin)/actions/rbac/admin-users.js
    
    import * as userDao from '@/app/(admin)/actions/dao/user';
    
    export async function getUserListAction(params) {
        // 1. 权限检查
        const backendCheck = await checkBackendAccess();
        
        // 2. 调用 UserDAO
        const result = await userDao.getUserList({
            page,
            pageSize,
            filters,
            sort,
        });
        
        // 3. 返回结果
        return { success: true, data: result.data, total: result.total };
    }
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DAO 层 (UserDAO)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
    app/(admin)/actions/dao/user.js
    
    export async function getUserList({ page, pageSize, filters, sort }) {
        // 1. 构建查询条件
        const query = {};
        if (filters.email) {
            query.email = { $regex: filters.email, $options: 'i' };
        }
        
        // 2. 直接调用 db-api 的 selects() 函数
        const results = await selects({
            dbName: 'users',
            whereJson: query,
            pageIndex: page,
            pageSize,
            sortJson: sort,
            getCount: true,
            foreignDB: [  // ✅ 在这里配置连表
                {
                    dbName: 'roles',
                    localKey: 'roles',
                    foreignKey: 'id',
                    as: 'roleList',
                    fieldJson: { id: 1, name: 1, enable: 1 },
                },
            ],
        });
        
        // 3. 字段映射（_id → id）
        return {
            data: mapUsersFields(results.rows || []),
            total: results.total || 0,
        };
    }
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  数据库 API 层 (db-api)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
    lib/db-api.js
    
    export async function selects({ dbName, foreignDB, ... }) {
        // 使用 MongoDB Aggregation Pipeline
        // 执行连表查询
        // 返回结果
    }
```

---

## 架构设计说明

### 为什么不使用 BaseDAO？

UserDAO 是一个**自定义 DAO**，原因如下：

#### 1. **特殊的数据处理需求**

Better Auth 使用 `_id` (ObjectId) 作为主键，但对外需要暴露为字符串 `id`：

```javascript
// user.js
function mapUserFields(user) {
    return {
        ...user,
        id: user._id ? user._id.toString() : user.id,
    };
}
```

#### 2. **复杂的用户创建逻辑**

用户创建需要：
- 使用 Better Auth 的密码哈希
- 同时创建 users 记录和 account 记录
- 特殊的字段处理

```javascript
export async function createUser(userData) {
    // 1. 使用 Better Auth 哈希密码
    const { hashPassword } = await import('better-auth/crypto');
    const hashedPassword = await hashPassword(password);
    
    // 2. 创建用户
    const result = await add({ dbName: 'users', dataJson: newUser });
    
    // 3. 创建 credential account
    await add({
        dbName: 'account',
        dataJson: {
            userId: result._id,
            accountId: email.toLowerCase(),
            providerId: 'credential',
            password: hashedPassword,
        },
    });
    
    return mapUserFields(result);
}
```

#### 3. **灵活的查询配置**

可以在每个方法中自定义连表配置：

```javascript
export async function getUserList({ page, pageSize, filters, sort }) {
    // 直接配置 foreignDB
    const results = await selects({
        dbName: 'users',
        foreignDB: [ /* 自定义连表配置 */ ],
    });
}
```

### BaseDAO 的作用

BaseDAO 适用于**标准的 CRUD 场景**，例如：

- 角色管理（roles）
- 菜单管理（menus）
- 权限管理（permissions）
- 套餐管理（packages）

这些表的操作相对简单，不需要特殊处理。

---

## 文件结构对比

### UserDAO 架构（当前）

```
app/(admin)/
├── actions/
│   ├── dao/
│   │   ├── base.js                    # BaseDAO 基类（未使用）
│   │   └── user.js                    # ✅ UserDAO（自定义，实际使用）
│   │       ├── createUser()
│   │       ├── updateUser()
│   │       ├── deleteUser()
│   │       ├── getUserList()           # ⭐ 在这里配置 foreignDB
│   │       ├── getUserById()
│   │       ├── resetUserPassword()
│   │       ├── bindUserRoles()
│   │       └── getUserStats()
│   │
│   └── rbac/
│       ├── configs/
│       │   └── user-crud.config.js    # Config 文件（未使用，仅作文档）
│       │       └── query.foreignDB    # 这里的 foreignDB 配置未被使用
│       │
│       └── admin-users.js             # Server Actions
│           ├── import * as userDao    # ✅ 导入 UserDAO
│           ├── getUserListAction()    # 调用 userDao.getUserList()
│           ├── createUserAction()     # 调用 userDao.createUser()
│           └── ...                    # 其他 Actions
│
└── admin/
    └── rbac/
        └── users/
            └── page.js                # ✅ 前端页面
                └── import { getUserListAction } from admin-users.js
```

### 如果使用 BaseDAO（对比）

```
app/(admin)/
├── actions/
│   ├── dao/
│   │   ├── base.js                    # BaseDAO 基类
│   │   └── user.js                    # UserDAO 继承 BaseDAO
│   │       class UserDAO extends BaseDAO {
│   │           constructor() {
│   │               super(userCrudConfig);  # ⭐ 使用 config
│   │           }
│   │           
│   │           // 只保留特殊方法
│   │           createUser() { /* Better Auth 特殊逻辑 */ }
│   │           resetUserPassword() { /* ... */ }
│   │           
│   │           // 标准方法使用 BaseDAO 的实现
│   │           // getList(), update(), delete() 等
│   │       }
│   │
│   └── rbac/
│       ├── configs/
│       │   └── user-crud.config.js    # ⭐ Config 会被使用
│       │       └── query.foreignDB    # BaseDAO.getList() 会读取这里
│       │
│       └── admin-users.js             # Server Actions
│           ├── const userDao = new UserDAO();
│           ├── getUserListAction()    # 调用 userDao.getList() (BaseDAO 的方法)
│           └── ...
```

---

## 配置重复问题

### 当前状态

1. **`user.js` 的 `getUserList()` 方法** - ✅ 实际使用
   ```javascript
   foreignDB: [
       {
           dbName: 'roles',
           localKey: 'roles',
           foreignKey: 'id',
           as: 'roleList',
       },
   ]
   ```

2. **`user-crud.config.js` 的 `query.foreignDB`** - ❌ 未使用
   ```javascript
   query: {
       foreignDB: [
           {
               dbName: 'roles',
               localKey: 'roles',
               foreignKey: 'id',
               as: 'roleList',
           },
       ],
   }
   ```

### 为什么重复？

**因为没有经过 BaseDAO**，所以 config 中的 foreignDB 不会被读取。

调用链是：
```
page.js → admin-users.js → user.js (getUserList) → selects()
                                        ↑
                              没有经过 BaseDAO
```

如果使用 BaseDAO，调用链会是：
```
page.js → admin-users.js → userDao.getList() (BaseDAO 的方法)
                                        ↓
                              BaseDAO.getList() 读取 config.query.foreignDB
                                        ↓
                                    selects()
```

---

## 三种架构方案对比

### 方案 1: 当前方案 - 纯自定义 UserDAO（已采用）

**优点：**
- ✅ 完全自定义，灵活性最高
- ✅ 不依赖 BaseDAO，代码更简单
- ✅ 适合复杂业务逻辑

**缺点：**
- ❌ 配置分散，每个方法单独配置
- ❌ Config 文件未被使用，可能造成混淆
- ❌ 代码重复度较高

**适用场景：**
- 用户管理（Better Auth 集成）
- 订单管理（复杂业务）
- 支付管理（特殊处理）

---

### 方案 2: 混合方案 - UserDAO 继承 BaseDAO

**实现示例：**

```javascript
// app/(admin)/actions/dao/user.js
import { BaseDAO } from './base';
import { userCrudConfig } from '../rbac/configs/user-crud.config';

class UserDAO extends BaseDAO {
    constructor() {
        super(userCrudConfig);  // ⭐ 使用 config
    }
    
    // 覆盖特殊方法
    async createUser(userData) {
        // Better Auth 特殊逻辑
        const { hashPassword } = await import('better-auth/crypto');
        // ...
    }
    
    async resetUserPassword(userId, newPassword) {
        // 密码重置特殊逻辑
        // ...
    }
    
    // 覆盖字段映射
    mapFields(user) {
        return {
            ...user,
            id: user._id ? user._id.toString() : user.id,
        };
    }
    
    // 标准方法直接使用 BaseDAO 的实现：
    // - getList() → 会自动读取 config.query.foreignDB ⭐
    // - update()
    // - delete()
    // - getDetail()
}

export const userDao = new UserDAO();

// 导出方法
export const createUser = userDao.createUser.bind(userDao);
export const getUserList = userDao.getList.bind(userDao);  // ⭐ 使用 BaseDAO 的方法
export const updateUser = userDao.update.bind(userDao);
// ...
```

**优点：**
- ✅ 配置统一，只需在 config 中配置一次
- ✅ 减少代码重复
- ✅ 保留特殊方法的灵活性
- ✅ 便于维护

**缺点：**
- ❌ 需要重构现有代码
- ❌ 增加一定复杂度
- ❌ 需要理解继承机制

**适用场景：**
- 系统稳定后的优化
- 需要统一配置管理
- 多个类似实体的管理

---

### 方案 3: 完全使用 BaseDAO

**实现示例：**

```javascript
// app/(admin)/actions/rbac/admin-users.js
import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { userCrudConfig } from './configs/user-crud.config';

const userDao = new BaseDAO(userCrudConfig);

export async function getUserListAction(params) {
    const backendCheck = await checkBackendAccess();
    return await userDao.getList(params);  // ⭐ 直接使用 BaseDAO
}

export async function updateUserAction(userId, updateData) {
    const backendCheck = await checkBackendAccess();
    return await userDao.update(userId, updateData);
}

// 特殊方法需要单独实现
export async function createUserAction(userData) {
    // Better Auth 特殊逻辑
    // ...
}
```

**优点：**
- ✅ 最简单，无需自定义 DAO
- ✅ 配置统一管理
- ✅ 代码量最少

**缺点：**
- ❌ 灵活性最低
- ❌ 特殊方法需要单独处理
- ❌ 字段映射困难（_id → id）

**适用场景：**
- 简单的 CRUD 表
- 角色、菜单、权限等标准实体

---

## 推荐方案

### 短期（当前）：方案 1 - 纯自定义 UserDAO

**原因：**
- 已经实现并稳定运行
- 不需要重构
- 满足当前需求

**改进建议：**
- ✅ 在 config 文件中添加注释说明其用途
- ✅ 保持两处配置一致（便于理解）
- ✅ 创建架构文档（本文档）

### 长期（可选）：方案 2 - 混合方案

**时机：**
- 系统稳定后
- 需要统一配置管理时
- 代码重复度过高时

**迁移步骤：**
1. 让 UserDAO 继承 BaseDAO
2. 保留特殊方法（createUser, resetUserPassword）
3. 删除标准 CRUD 方法（使用 BaseDAO 的实现）
4. 更新 admin-users.js 的调用方式
5. 测试所有功能

---

## 其他模块的对比

### 使用 BaseDAO 的模块

```javascript
// app/(admin)/actions/rbac/admin-roles.js
import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { roleCrudConfig } from './configs/role-crud.config';

const roleDao = new BaseDAO(roleCrudConfig);

export async function getRoleListAction(params) {
    return await roleDao.getList(params);  // ⭐ 直接使用 BaseDAO
}
```

**适用实体：**
- ✅ 角色（roles）
- ✅ 菜单（menus）
- ✅ 权限（permissions）
- ✅ 套餐（packages）

### 使用自定义 DAO 的模块

```javascript
// app/(admin)/actions/dao/user.js
export async function createUser(userData) {
    // 特殊逻辑
}

export async function getUserList({ page, pageSize, filters, sort }) {
    // 自定义查询
}
```

**适用实体：**
- ✅ 用户（users）- Better Auth 集成
- ✅ 订单（orders）- 复杂业务
- ✅ 支付（payments）- 特殊处理

---

## 总结

### 当前架构

```
用户页面 (page.js)
    ↓
Server Actions (admin-users.js)
    ↓ import * as userDao
UserDAO (user.js) ← ⭐ 自定义 DAO，不使用 BaseDAO
    ↓ 直接配置 foreignDB
db-api (selects)
    ↓
MongoDB
```

### 配置说明

- **`user.js` 中的 foreignDB** → ✅ 实际使用
- **`user-crud.config.js` 中的 foreignDB** → ❌ 未使用（仅作文档）

### 为什么这样设计

1. **灵活性** - 用户管理需要 Better Auth 集成，逻辑复杂
2. **特殊处理** - _id ↔ id 转换、密码哈希、多表操作
3. **性能优化** - 可以在每个方法中自定义连表配置

### 未来优化方向

- 考虑使用方案 2（混合方案）统一配置管理
- 提取公共逻辑到 BaseDAO
- 减少代码重复

---

## 相关文档

- [ForeignDB 连表查询指南](../database/FOREIGNDB_JOIN_GUIDE.md)
- [ForeignDB 修复总结](../database/FOREIGNDB_FIX_SUMMARY.md)
- [BaseDAO 文档](../admin/BASE_DAO.md)
- [Smart CRUD 使用指南](../admin/SMART_CRUD_GUIDE.md)

