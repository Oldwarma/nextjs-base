# Better Auth UUID 集成完整指南

## 🎯 问题背景

Better Auth 的 MongoDB Adapter **保留了 `id` 字段作为特殊字段**，会自动用 MongoDB 的 `_id`（ObjectId）覆盖任何我们自定义的 `id` 值。因此，我们无法直接使用 `id` 字段存储 UUID。

经过多次尝试，最终采用了 **DAO 层字段映射** 方案来解决这个问题。

## ✅ 最终解决方案

### 方案架构

```
┌─────────────────┐
│  应用层/RBAC   │  使用 user.id (看起来是 UUID)
└────────┬────────┘
         │
    DAO 层映射
         │
┌────────┴────────┐
│    数据库层     │  实际存储 user.uuid (UUID)
│                 │  Better Auth 使用 user.id (ObjectId)
└─────────────────┘
```

### 数据结构

#### users 表

```json
{
  "_id": ObjectId("690b31057cd975fcf89d9ba1"),  // MongoDB 主键
  "uuid": "ea4e1c93-44e7-49d2-ae9e-d31ad60260ff", // 业务主键（我们的）
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "roles": ["role-uuid-1"], // RBAC 角色使用 uuid
  ...
}
```

#### account 表

```json
{
  "_id": ObjectId("690b31057cd975fcf89d9ba2"),    // MongoDB 主键
  "uuid": "d3bb408a-bfc8-45bf-9032-84c194adf1e9",  // account 的业务主键
  "userId": ObjectId("690b31057cd975fcf89d9ba1"), // Better Auth 的关联
  "userUuid": "ea4e1c93-44e7-49d2-ae9e-d31ad60260ff", // 业务层关联
  "providerId": "credential",
  ...
}
```

## 🔧 实现细节

### 1. Better Auth 配置 (`lib/auth.js`)

#### 1.1 定义 uuid 字段

```javascript
user: {
    additionalFields: {
        // 不能用 id，Better Auth 会覆盖它
        uuid: {
            type: 'string',
            required: false,
            input: false,
            output: true,
        },
    },
}

account: {
    additionalFields: {
        uuid: {
            type: 'string',
            required: false,
            input: false,
            output: true,
        },
        userUuid: {  // 关联到 users.uuid
            type: 'string',
            required: false,
            input: false,
            output: true,
        },
    },
}
```

#### 1.2 Database Hooks 自动生成 UUID

```javascript
databaseHooks: {
    user: {
        create: {
            before: async (user) => {
                return {
                    data: {
                        ...user,
                        uuid: uuidv4(), // 生成 UUID
                    },
                };
            },
        },
    },
    account: {
        create: {
            before: async (account) => {
                return {
                    data: {
                        ...account,
                        uuid: uuidv4(),
                    },
                };
            },
            // 关键：在 account 创建后关联 userUuid
            after: async (account) => {
                const db = await getDatabase();
                const { ObjectId } = await import('mongodb');
                
                // 查询 user 的 uuid
                const userId = ObjectId.isValid(account.userId) 
                    ? new ObjectId(account.userId) 
                    : account.userId;
                const user = await db.collection('users').findOne({ _id: userId });
                
                if (user && user.uuid) {
                    // 更新 account 的 userUuid
                    const accountId = ObjectId.isValid(account.id) 
                        ? new ObjectId(account.id) 
                        : account.id;
                    await db.collection('account').updateOne(
                        { _id: accountId },
                        { $set: { userUuid: user.uuid } }
                    );
                }
            },
        },
    },
}
```

**⚠️ 重要时序说明：**

- `user.create.after` 触发时，`account` **还未创建**
- 必须在 `account.create.after` 中关联 `userUuid`
- 此时 `user` 和 `account` 都已完全保存

### 2. DAO 层字段映射 (`app/(admin)/actions/dao/user.js`)

#### 2.1 映射函数

```javascript
/**
 * 字段映射：将数据库的 uuid 映射为对外的 id
 */
function mapUserFields(user) {
    if (!user) return null;
    
    return {
        ...user,
        id: user.uuid || user.id, // uuid -> id 映射
    };
}

/**
 * 批量映射
 */
function mapUsersFields(users) {
    if (!Array.isArray(users)) return [];
    return users.map(mapUserFields);
}

/**
 * 反向映射：id -> uuid 查询条件
 */
function mapIdToUuid(id) {
    const { ObjectId } = require('mongodb');
    if (ObjectId.isValid(id) && id.length === 24) {
        // 兼容旧数据：同时查询 uuid 和 _id
        return {
            $or: [
                { uuid: id },
                { _id: new ObjectId(id) }
            ]
        };
    }
    // 新数据：直接用 uuid
    return { uuid: id };
}
```

#### 2.2 应用映射

```javascript
/**
 * 获取用户（示例）
 */
export async function getUserById(userId) {
    // 查询时：id -> uuid
    const whereJson = mapIdToUuid(userId);
    
    const results = await selects({
        dbName: 'users',
        whereJson: whereJson,
        getOne: true,
    });
    
    // 返回时：uuid -> id
    return mapUserFields(results);
}

/**
 * 获取用户列表（示例）
 */
export async function getUserList({ page, pageSize, filters, sort }) {
    const results = await selects({
        dbName: 'users',
        whereJson: filters,
        pageIndex: page,
        pageSize,
        sortJson: sort,
    });
    
    return {
        data: mapUsersFields(results.rows), // 批量映射
        total: results.total,
        page,
        pageSize,
    };
}
```

### 3. RBAC 系统使用

对于 RBAC 系统和其他业务逻辑，**完全不需要改动**：

```javascript
// ✅ 正常使用，DAO 层自动处理映射
const user = await getUserById(userId);
console.log(user.id); // 实际是 uuid，但对外仍然叫 id

// ✅ 绑定角色
await bindUserRoles(user.id, ['role-uuid-1', 'role-uuid-2']);

// ✅ 检查权限
const hasAccess = await checkUserPermission(user.id, 'menu:view');
```

## 📝 关键要点总结

### ✅ 成功要素

1. **不使用 `id` 字段名** - Better Auth 会覆盖它
2. **使用 `uuid` 字段** - 作为普通的 additionalField
3. **在 `account.create.after` 中关联** - 不是 `user.create.after`
4. **DAO 层映射** - 对外 API 保持 `id`，内部使用 `uuid`
5. **兼容旧数据** - 同时支持 `uuid` 和 `_id` 查询

### ⚠️ 常见陷阱

1. **❌ 在 `user.create.after` 中更新 account**
   - Account 此时还未创建！
   
2. **❌ 使用 `fields.id: 'id'` 配置**
   - Better Auth 会认为这是主键字段
   
3. **❌ 忘记 ObjectId 类型转换**
   - `account.userId` 是 ObjectId，需要转换才能查询
   
4. **❌ 不映射返回值**
   - 必须在返回前调用 `mapUserFields`

## 🔄 数据迁移

### 为现有用户添加 uuid

```javascript
// scripts/migrate-add-uuid.js
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const client = await MongoClient.connect(process.env.MONGODB_URI);
const db = client.db(process.env.MONGODB_DB_NAME);

// 1. 为所有 users 添加 uuid
const users = await db.collection('users').find({ uuid: { $exists: false } }).toArray();
for (const user of users) {
    await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { uuid: uuidv4() } }
    );
}

// 2. 为所有 account 添加 uuid 和 userUuid
const accounts = await db.collection('account').find({ uuid: { $exists: false } }).toArray();
for (const account of accounts) {
    const user = await db.collection('users').findOne({ _id: account.userId });
    await db.collection('account').updateOne(
        { _id: account._id },
        { 
            $set: { 
                uuid: uuidv4(),
                userUuid: user?.uuid || null
            } 
        }
    );
}

console.log('✅ 迁移完成！');
```

## 📊 实际效果验证

### 注册新用户

```bash
POST /api/auth/sign-up/email
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

### 查看日志

```
🔥 [user.create.before] 触发
✅ 生成 user.uuid: ea4e1c93-44e7-49d2-ae9e-d31ad60260ff
🎉 [user.create.after] 用户已创建
   - user.uuid (业务主键): ea4e1c93-44e7-49d2-ae9e-d31ad60260ff
   - user.id (Better Auth): 690b31057cd975fcf89d9ba1
🔥 [account.create.before] 触发
✅ 生成 account.uuid: d3bb408a-bfc8-45bf-9032-84c194adf1e9
🎉 [account.create.after] account 已创建
   - account.uuid: d3bb408a-bfc8-45bf-9032-84c194adf1e9
   - account.userId: 690b31057cd975fcf89d9ba1
✅ 找到 user.uuid: ea4e1c93-44e7-49d2-ae9e-d31ad60260ff
✅ 已为 account 添加 userUuid: ea4e1c93-44e7-49d2-ae9e-d31ad60260ff
```

### 数据库验证

```javascript
// users 表有 uuid ✅
db.users.findOne({ email: "test@example.com" })
// { _id: ObjectId(...), uuid: "ea4e1c93-...", ... }

// account 表有 uuid 和 userUuid ✅
db.account.findOne({ accountId: "690b31057cd975fcf89d9ba1" })
// { _id: ObjectId(...), uuid: "d3bb408a-...", userUuid: "ea4e1c93-...", ... }
```

## 🚀 后续优化建议

1. **TypeScript 类型定义**
   - 明确 `id` 和 `uuid` 的使用场景
   
2. **统一查询封装**
   - 创建通用的查询工具函数
   
3. **性能优化**
   - 为 `uuid` 字段添加索引
   - 考虑缓存常用查询

4. **监控和日志**
   - 监控映射失败的情况
   - 记录旧数据访问

## 📚 相关文档

- [UUID 与 ID 字段映射方案](./UUID_ID_MAPPING.md)
- [Better Auth Database Configuration](https://www.better-auth.com/docs/concepts/database)
- [RBAC System README](./README.md)

---

**最后更新**: 2025-11-05  
**作者**: AI Assistant & HugLemon  
**状态**: ✅ 已验证可用

