# BaseDAO 设计深度讨论

## 问题核心

**用户的担忧：** BaseDAO 是基础，UserDAO/SysDAO 是衍生需求，BaseDAO 是否可以承担这个工作？

参考：[VK Framework DAO 文档](https://vkdoc.fsq.pub/client/uniCloud/db/dao.html)

---

## VK Framework 的 DAO 架构分析

### VK 的三层架构

根据 VK Framework 文档，它的设计哲学是：

```
┌─────────────────────────────────────────────────┐
│           Service 层（业务逻辑层）                │
│   "利用积木搭建你想要的乐园"                      │
└─────────────────────────────────────────────────┘
                      ↑
                      │ 调用
                      ↓
┌─────────────────────────────────────────────────┐
│              DAO 层（数据访问层）                 │
│   "利用零件组装不同形状和规则的积木"               │
│   - xxxDao.findById()                           │
│   - xxxDao.listByWhereJson()                    │
│   - xxxDao.updateById()                         │
│   - 提供数据库原子性操作                          │
│   - 可以脱离业务开发                             │
└─────────────────────────────────────────────────┘
                      ↑
                      │ 使用
                      ↓
┌─────────────────────────────────────────────────┐
│            BaseDAO（万能DAO - 基础零件）          │
│   - 最基础的数据库操作                            │
│   - 通用的增删改查                               │
│   - 不含业务逻辑                                 │
└─────────────────────────────────────────────────┘
```

### VK 的关键设计原则

1. **BaseDAO = 最基础的零件**
   - 提供原子性的数据库操作
   - 不含任何业务逻辑
   - 通用、可复用

2. **DAO 层 = 组装后的积木**
   - 使用 BaseDAO 的零件
   - 组合成特定形状的积木
   - 仍然是数据操作，但更具体

3. **Service 层 = 业务乐园**
   - 使用 DAO 层的积木
   - 实现具体业务逻辑

### VK 的命名规范

```javascript
// DAO 层方法命名
findById()              // 根据 ID 查单条
findByMobile()          // 根据手机号查单条
findByWhereJson()       // 根据条件查单条
listByStatus()          // 根据状态查多条
listByWhereJson()       // 根据条件查多条
add()                   // 新增
updateById()            // 根据 ID 更新
deleteById()            // 根据 ID 删除
updateByWhereJson()     // 批量更新
deleteByWhereJson()     // 批量删除
```

---

## 我们当前的 BaseDAO 设计分析

### 我们的架构

```
┌─────────────────────────────────────────────────┐
│         Server Actions 层（类似 Service 层）      │
│   - admin-users.js                              │
│   - 权限检查 + 调用 DAO                          │
└─────────────────────────────────────────────────┘
                      ↑
                      │ 调用
                      ↓
┌─────────────────────────────────────────────────┐
│              DAO 层（UserDAO/SysDAO）            │
│   - UserDAO (完全自定义)                         │
│     - createUser()                              │
│     - getUserList()                             │
│     - updateUser()                              │
│   - SysDAO (完全自定义)                          │
│     - findRoleById()                            │
│     - findRoleByIdWithNames()                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            BaseDAO（我们的设计）                  │
│   ⚠️ 问题：不是"纯粹的零件"                       │
│   - getList()         ← 包含权限检查 ❌           │
│   - create()          ← 包含验证逻辑 ❌           │
│   - update()          ← 包含字段过滤 ❌           │
│   - delete()          ← 包含软删除 ❌            │
│   + 配置系统（validation, hooks, transforms）    │
│   + 权限检查（checkPermission）                  │
│   + 日志记录（通过 createAction）                │
└─────────────────────────────────────────────────┘
```

### 我们的 BaseDAO 的问题

#### ❌ 问题 1: BaseDAO 不够"基础"

**VK 的 BaseDAO：**
```javascript
// 纯粹的数据库操作，不含任何业务逻辑
baseDao.add({ dbName: 'users', dataJson: { ... } });
baseDao.update({ dbName: 'users', whereJson: { ... }, dataJson: { ... } });
baseDao.selects({ dbName: 'users', whereJson: { ... } });
```

**我们的 BaseDAO：**
```javascript
class BaseDAO {
    async getList(params) {
        await this.checkPermission();  // ❌ 业务逻辑：权限检查
        
        // ❌ 业务逻辑：字段验证
        const query = this.buildSearchQuery(search);
        
        // ❌ 业务逻辑：软删除过滤
        if (this.config.softDelete) {
            query.$or = [{ deletedAt: { $exists: false } }];
        }
        
        // 数据库操作
        const result = await selects({ ... });
        
        // ❌ 业务逻辑：数据转换
        const transform = this.config.transforms?.output;
        const data = transform ? result.rows.map(transform) : result.rows;
        
        return { success: true, data, total };
    }
}
```

**结论：** 我们的 BaseDAO **太重了**，包含了太多业务逻辑。

---

#### ❌ 问题 2: 职责不清晰

**VK 的职责划分：**
```
BaseDAO:  纯数据库操作
   ↓
DAO层:   数据操作 + 简单组合
   ↓
Service: 业务逻辑 + 权限检查 + 验证
```

**我们的职责划分：**
```
BaseDAO:  数据库操作 + 权限 + 验证 + 转换  ← ❌ 职责过重
   ↓
DAO层:   几乎什么都没做（或者完全不用 BaseDAO）
   ↓
Actions: 只做权限检查，然后调用 DAO
```

---

#### ❌ 问题 3: UserDAO 和 SysDAO 没有使用 BaseDAO

**当前状态：**
- UserDAO：完全自定义，**不使用** BaseDAO
- SysDAO：完全自定义，**不使用** BaseDAO
- 其他 DAO（RoleDAO, MenuDAO）：直接 `new BaseDAO(config)`

**为什么？**
因为 BaseDAO 太重，包含了太多特定逻辑：
- UserDAO 需要 Better Auth 集成，BaseDAO 无法支持
- SysDAO 需要复杂的连表查询，BaseDAO 的 getList 太固定

---

## 理想的设计应该是什么样？

参考 VK Framework，我们应该有：

### 方案 A：纯粹的 BaseDAO（VK 风格）

```javascript
// ===== db-api.js =====
// 这就是我们的 BaseDAO（最基础的零件）
export async function add({ dbName, dataJson }) { ... }
export async function selects({ dbName, whereJson, foreignDB }) { ... }
export async function updateOne({ dbName, whereJson, dataJson }) { ... }
export async function remove({ dbName, whereJson }) { ... }

// ===== dao/userDao.js =====
// UserDAO：使用基础零件组装积木
import { add, selects, updateOne, remove } from '@/lib/db-api';

export async function findUserById(userId) {
    // 只做数据操作，不含业务逻辑
    return await selects({
        dbName: 'users',
        whereJson: { _id: ObjectId(userId) },
        getOne: true,
    });
}

export async function listUsersByFilters({ page, pageSize, filters }) {
    // 只做数据操作，不含业务逻辑
    const query = {};
    if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
    }
    
    return await selects({
        dbName: 'users',
        whereJson: query,
        pageIndex: page,
        pageSize,
        getCount: true,
        foreignDB: [
            {
                dbName: 'roles',
                localKey: 'roles',
                foreignKey: 'id',
                as: 'roleList',
            },
        ],
    });
}

export async function createUser(userData) {
    // Better Auth 特殊逻辑（但仍然是数据操作）
    const { hashPassword } = await import('better-auth/crypto');
    const hashedPassword = await hashPassword(userData.password);
    
    // 插入用户
    const result = await add({
        dbName: 'users',
        dataJson: { ...userData, password: undefined },
    });
    
    // 插入账户
    await add({
        dbName: 'account',
        dataJson: {
            userId: result._id,
            password: hashedPassword,
            providerId: 'credential',
        },
    });
    
    return result;
}

export async function updateUserById(userId, updateData) {
    return await updateOne({
        dbName: 'users',
        whereJson: { _id: ObjectId(userId) },
        dataJson: updateData,
    });
}

// ===== actions/admin-users.js =====
// Actions 层：业务逻辑 + 权限检查 + 验证 + 日志
import * as userDao from '@/dao/userDao';
import { logAction } from '@/lib/action-logger';

export async function getUserListAction(params) {
    const startTime = Date.now();
    
    // 1️⃣ 权限检查（业务逻辑）
    const adminCheck = await checkAdminAction();
    if (!adminCheck.isAdmin) {
        return { success: false, error: 'Unauthorized' };
    }
    
    try {
        // 2️⃣ 参数验证（业务逻辑）
        if (params.pageSize > 100) {
            return { success: false, error: 'Page size too large' };
        }
        
        // 3️⃣ 调用 DAO（数据操作）
        const result = await userDao.listUsersByFilters({
            page: params.pageIndex,
            pageSize: params.pageSize,
            filters: params.filters,
        });
        
        // 4️⃣ 数据转换（业务逻辑）
        const data = result.rows.map(user => ({
            ...user,
            id: user._id.toString(),
        }));
        
        const response = {
            success: true,
            data,
            total: result.total,
        };
        
        // 5️⃣ 日志记录（业务逻辑）
        await logAction('getList', 'admin/users', startTime, new Date(), params, response, false);
        
        return response;
        
    } catch (error) {
        console.error('getUserListAction error:', error);
        const errorResult = { success: false, error: error.message };
        await logAction('getList', 'admin/users', startTime, new Date(), params, errorResult, true);
        return errorResult;
    }
}
```

**优点：**
- ✅ 职责清晰：数据 vs 业务完全分离
- ✅ BaseDAO（db-api）非常纯粹
- ✅ DAO 层可以脱离业务开发
- ✅ 灵活性最高

**缺点：**
- ❌ Actions 层代码量大（每个方法都要写权限、验证、日志）
- ❌ 代码重复度高
- ❌ 需要大量重构

---

### 方案 B：保留当前的 BaseDAO，但改名为 SmartDAO

```javascript
// ===== dao/base.js =====
// 改名为 SmartDAO（智能 DAO，包含业务逻辑）
export class SmartDAO {
    // 包含权限检查、验证、转换、日志等
    async getList(params) { ... }
    async create(data) { ... }
    async update(id, data) { ... }
}

// ===== dao/userDao.js =====
// UserDAO：继承 SmartDAO，只覆盖特殊方法
class UserDAO extends SmartDAO {
    async create(userData) {
        // Better Auth 特殊逻辑
    }
}

// ===== actions/admin-users.js =====
// Actions 层变得很简单
export async function getUserListAction(params) {
    return await userDao.getList(params);
}
```

**优点：**
- ✅ Actions 层代码简洁
- ✅ 减少代码重复
- ✅ 与当前设计接近，重构工作量小

**缺点：**
- ❌ 不符合 VK 的设计哲学
- ❌ DAO 层包含业务逻辑，职责不清
- ❌ 不够灵活（特殊需求难以实现）

---

### 方案 C：混合方案（推荐）

```javascript
// ===== lib/db-api.js =====
// 保持纯粹的数据库 API（这是真正的 BaseDAO）
export async function add({ dbName, dataJson }) { ... }
export async function selects({ dbName, whereJson, foreignDB }) { ... }
// ...

// ===== dao/base.js =====
// 改名为 CrudHelper（CRUD 辅助类）
// 提供可选的业务逻辑功能
export class CrudHelper {
    constructor(config) {
        this.config = config;
    }
    
    // 提供辅助方法，但不强制使用
    buildSearchQuery(search) { ... }
    buildFiltersQuery(filters) { ... }
    async validate(data, action) { ... }
    
    // 提供可选的标准 CRUD（内部使用 db-api）
    async getList(params) {
        // 可以调用，也可以不调用
        const query = this.buildSearchQuery(params.search);
        return await selects({
            dbName: this.config.collectionName,
            whereJson: query,
            // ...
        });
    }
}

// ===== dao/userDao.js =====
// UserDAO：使用 CrudHelper（可选）
import { CrudHelper } from './base';
import { add, selects } from '@/lib/db-api';

class UserDAO extends CrudHelper {
    // 可以使用父类的辅助方法
    async getUserList(params) {
        const query = this.buildSearchQuery(params.search);  // ← 使用辅助方法
        
        // 但直接调用 db-api
        return await selects({
            dbName: 'users',
            whereJson: query,
            foreignDB: this.config.query.foreignDB,
        });
    }
    
    // 或者完全自定义
    async createUser(userData) {
        // 完全自由，不使用父类方法
        const { hashPassword } = await import('better-auth/crypto');
        // ...
    }
}

// ===== lib/action-wrapper.js =====
// 提供统一的 Action 包装器（处理权限、日志）
export function wrapAction(actionFn, options = {}) {
    return async function(...args) {
        const startTime = Date.now();
        const category = options.category || 'unknown';
        
        try {
            // 权限检查
            if (options.requireAdmin) {
                const adminCheck = await checkAdminAction();
                if (!adminCheck.isAdmin) {
                    return { success: false, error: 'Unauthorized' };
                }
            }
            
            // 调用实际方法
            const result = await actionFn.apply(this, args);
            
            // 日志记录
            await logAction(options.action, category, startTime, new Date(), args[0], result, !result.success);
            
            return result;
            
        } catch (error) {
            console.error(`${options.action} error:`, error);
            const errorResult = { success: false, error: error.message };
            await logAction(options.action, category, startTime, new Date(), args[0], errorResult, true);
            return errorResult;
        }
    };
}

// ===== actions/admin-users.js =====
// Actions 层：使用包装器
import * as userDao from '@/dao/userDao';
import { wrapAction } from '@/lib/action-wrapper';

export const getUserListAction = wrapAction(
    async function(params) {
        // 业务验证
        if (params.pageSize > 100) {
            return { success: false, error: 'Page size too large' };
        }
        
        // 调用 DAO
        const result = await userDao.getUserList(params);
        
        // 数据转换
        return {
            success: true,
            data: result.rows.map(u => ({ ...u, id: u._id.toString() })),
            total: result.total,
        };
    },
    {
        action: 'getList',
        category: 'admin/users',
        requireAdmin: true,
    }
);
```

**优点：**
- ✅ 职责清晰：db-api（纯数据）、CrudHelper（辅助）、DAO（数据组合）、Actions（业务）
- ✅ 灵活性高：可以用辅助方法，也可以完全自定义
- ✅ 减少重复：wrapAction 统一处理权限和日志
- ✅ 符合 VK 的设计哲学

**缺点：**
- ❌ 需要重构（工作量中等）
- ❌ 概念较多，需要理解

---

## 对比总结

| 方案 | BaseDAO 纯度 | 代码重复 | 灵活性 | 重构工作量 | 推荐指数 |
|------|-------------|----------|--------|-----------|---------|
| **方案 A（VK 纯粹风格）** | ⭐⭐⭐⭐⭐ | ❌ 高 | ⭐⭐⭐⭐⭐ | ❌ 大 | ⭐⭐⭐ |
| **方案 B（改名 SmartDAO）** | ⭐ | ✅ 低 | ⭐⭐ | ✅ 小 | ⭐⭐ |
| **方案 C（混合方案）** | ⭐⭐⭐⭐ | ✅ 低 | ⭐⭐⭐⭐ | ⭐⭐⭐ 中 | ⭐⭐⭐⭐⭐ |

---

## 我的建议

### 短期（立即实施）

**使用方案 B：改名 + 微调**

1. 将 `BaseDAO` 改名为 `CrudDAO`（表示这是包含业务逻辑的 CRUD 辅助类）
2. 在文档中明确说明：这不是纯粹的 BaseDAO，而是智能 CRUD 辅助类
3. UserDAO 继承 CrudDAO，但可以完全覆盖方法

**理由：**
- ✅ 工作量小（1-2 天）
- ✅ 风险低
- ✅ 立即解决日志问题
- ✅ 为将来重构铺路

### 长期（2-3 个月后）

**使用方案 C：混合方案**

在系统稳定后，逐步重构：
1. 保持 `db-api.js` 作为纯粹的 BaseDAO
2. 创建 `CrudHelper` 提供可选的辅助功能
3. 创建 `actionWrapper` 统一处理权限和日志
4. 逐步迁移各个 DAO

**理由：**
- ✅ 符合 VK 设计哲学
- ✅ 职责清晰
- ✅ 灵活性高
- ✅ 可维护性强

---

## 回答你的核心问题

### Q: BaseDAO 是否可以承担"基础零件"的工作？

**A: 当前的 BaseDAO 不能，因为它太重了。**

**根据 VK 的定义：**
- BaseDAO = 纯粹的数据库操作（零件）
- DAO 层 = 数据操作的组合（积木）
- Service 层 = 业务逻辑（乐园）

**我们的 BaseDAO：**
- ❌ 包含权限检查（业务逻辑）
- ❌ 包含数据验证（业务逻辑）
- ❌ 包含数据转换（业务逻辑）
- ✅ 包含数据库操作（零件）

**结论：** 我们的 BaseDAO 应该改名为 `CrudDAO` 或 `SmartDAO`，它不是纯粹的"基础零件"，而是"预组装的积木"。

---

## 下一步行动

你想选择哪个方案？

1. **方案 A**：完全重构，符合 VK 风格（工作量大，2-3 周）
2. **方案 B**：改名 + 微调（工作量小，1-2 天）
3. **方案 C**：混合方案（工作量中等，1-2 周）

我个人推荐：
- 短期用**方案 B**（快速解决当前问题）
- 长期用**方案 C**（逐步优化架构）

你的想法呢？ 🤔

