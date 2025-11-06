# UUID 与 ID 字段映射方案

## 🔍 问题背景

Better Auth 的 MongoDB Adapter **保留了 `id` 字段作为特殊字段**，会自动用 `_id`（ObjectId）的值覆盖任何我们设置的 `id` 值。因此，我们无法直接使用 `id` 字段存储 UUID。

## 🎯 解决方案

采用 **DAO 层字段映射** 的方式：
- **数据库层**：使用 `uuid` 字段存储业务主键（UUID v4）
- **应用层**：通过 DAO 映射为 `id` 字段，保持 RBAC 系统的 API 一致性

## 📊 数据结构

### users 表

```json
{
  "_id": ObjectId("..."),          // MongoDB 主键（Better Auth 使用）
  "uuid": "550e8400-e29b-41d4-...", // 业务主键（我们的系统使用）
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "roles": ["role-uuid-1", "role-uuid-2"], // RBAC 角色（使用 uuid）
  ...
}
```

### account 表

```json
{
  "_id": ObjectId("..."),           // MongoDB 主键
  "uuid": "7c9e6679-7425-40de-...",  // account 的业务主键
  "userId": ObjectId("..."),        // Better Auth 的关联（指向 users._id）
  "userUuid": "550e8400-e29b-...",  // 业务层关联（指向 users.uuid）
  "providerId": "credential",
  ...
}
```

## 🔧 实现细节

### 1. Better Auth 配置 (`lib/auth.js`)

```javascript
user: {
    additionalFields: {
        // 使用 uuid 字段，避免与 Better Auth 的 id 冲突
        uuid: {
            type: 'string',
            required: false,
            input: false,
            output: true,
        },
    },
}

databaseHooks: {
    user: {
        create: {
            before: async (user) => {
                return {
                    data: {
                        ...user,
                        uuid: uuidv4(), // 自动生成 UUID
                    },
                };
            },
        },
    },
}
```

### 2. DAO 层字段映射 (`app/(admin)/actions/dao/user.js`)

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
 * 获取用户（示例）
 */
export async function getUserById(userId) {
    // 查询时使用 uuid 字段
    const user = await selects({
        dbName: 'users',
        whereJson: { uuid: userId }, // 注意：这里用 uuid
        getOne: true,
    });
    
    // 返回时映射为 id
    return mapUserFields(user);
}
```

### 3. RBAC 系统使用

对于 RBAC 系统的其他部分，**完全不需要改动**：

```javascript
// 绑定角色：使用 user.id（实际是 uuid）
await bindUserRoles(user.id, ['role-uuid-1', 'role-uuid-2']);

// 获取用户权限：使用 user.id
const permissions = await getUserPermissions(user.id);

// 检查权限：使用 user.id
const hasAccess = await checkUserPermission(user.id, 'menu:view');
```

## 📝 关键点总结

### ✅ 优点

1. **改动最小**：只需要在 DAO 层添加映射函数
2. **向后兼容**：现有 RBAC 代码无需修改
3. **语义清晰**：对外 API 仍然使用 `id`，符合直觉
4. **易于理解**：映射逻辑集中在 DAO 层

### ⚠️ 注意事项

1. **查询条件**：DAO 层查询时使用 `uuid` 字段
   ```javascript
   // ❌ 错误
   whereJson: { id: userId }
   
   // ✅ 正确
   whereJson: { uuid: userId }
   ```

2. **返回数据**：所有返回用户数据的函数都要使用 `mapUserFields`
   ```javascript
   return mapUserFields(user);      // 单个用户
   return mapUsersFields(users);    // 用户列表
   ```

3. **Better Auth 操作**：直接涉及 Better Auth 的操作（如登录、注册）使用其原生 `id`（ObjectId）

4. **旧数据兼容**：映射函数中使用了 fallback：`user.uuid || user.id`，兼容旧数据

## 🔄 数据迁移

对于现有数据，需要运行迁移脚本：

```javascript
// 为所有现有用户添加 uuid 字段
db.users.find({ uuid: { $exists: false } }).forEach(user => {
    db.users.updateOne(
        { _id: user._id },
        { $set: { uuid: uuidv4() } }
    );
});

// 为所有 account 添加 userUuid 关联
db.account.find({ userUuid: { $exists: false } }).forEach(account => {
    const user = db.users.findOne({ _id: account.userId });
    if (user && user.uuid) {
        db.account.updateOne(
            { _id: account._id },
            { $set: { userUuid: user.uuid } }
        );
    }
});
```

## 🚀 未来优化

可以考虑在以下场景优化：

1. **全局搜索替换**：如果团队决定统一使用 `uuid`，可以进行全局重命名
2. **TypeScript 类型**：定义明确的类型，确保 `id` 和 `uuid` 的使用场景
3. **文档生成**：自动生成 API 文档，说明字段映射关系

## 📚 相关文档

- [Better Auth Database Configuration](https://www.better-auth.com/docs/concepts/database)
- [RBAC System README](./README.md)
- [Database Hooks](https://www.better-auth.com/docs/concepts/database#database-hooks)

