# Better Auth UUID 主键配置

## 问题描述

Better Auth 默认使用 MongoDB 的 `_id`（ObjectId）作为主键，但我们的 RBAC 系统需要使用 UUID 字符串作为 `id` 主键。

## ❌ 之前尝试的错误方案

1. **使用 `generateId` 参数** - 无效
2. **使用 `mapKeysTransformInput/Output`** - 不适用
3. **使用 `databaseHooks.before`** - 钩子未触发

## ✅ 正确的解决方案

### 核心思路

**告诉 Better Auth 不要使用 `_id`，而是使用我们自定义的 `id` 字段作为主键。**

### 实现步骤

#### 1. 配置用户表字段

```javascript
user: {
    modelName: 'users',
    fields: {
        id: 'id', // 关键：告诉 Better Auth 使用 id 作为主键
    },
    additionalFields: {
        // ... 其他字段
    },
}
```

#### 2. 配置账户表字段

```javascript
account: {
    modelName: 'account',
    fields: {
        id: 'id', // 关键：告诉 Better Auth 使用 id 作为主键
    },
    accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github'],
    },
}
```

#### 3. 使用 databaseHooks 自动生成 UUID

```javascript
databaseHooks: {
    user: {
        create: {
            before: async (user) => {
                // 自动生成 UUID 作为主键
                if (!user.id) {
                    user.id = uuidv4();
                }
                return { data: user };
            },
        },
    },
    account: {
        create: {
            before: async (account) => {
                // 为 account 也生成 UUID id
                if (!account.id) {
                    account.id = uuidv4();
                }
                return { data: account };
            },
        },
    },
}
```

## 最终效果

### 数据库结构

#### users 集合

```json
{
  "_id": ObjectId("..."),  // MongoDB 自己仍会存，但 Better Auth 不使用它
  "id": "c3f9ba2d-1b7a-4c5e-9f8d-7e6f5a4b3c2d",  // UUID 主键
  "email": "test@example.com",
  "name": "Test User",
  "role": "user",
  "roles": [],
  "isBackendAllowed": false,
  "credits": 0,
  ...
}
```

#### account 集合

```json
{
  "_id": ObjectId("..."),
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // UUID 主键
  "userId": "c3f9ba2d-1b7a-4c5e-9f8d-7e6f5a4b3c2d",  // 关联到 users.id（UUID）
  "accountId": "test@example.com",
  "providerId": "credential",
  "password": "...",
  ...
}
```

## 关键点总结

1. **`fields.id: 'id'`** - 告诉 Better Auth 主键字段名是 `id`
2. **`databaseHooks.create.before`** - 在创建记录前自动生成 UUID
3. **不需要修改索引** - Better Auth 会自动在 `id` 字段上建立唯一索引
4. **`_id` 仍然存在** - MongoDB 会自动创建，但 Better Auth 不使用它

## 验证方法

### 1. 注册新用户

```bash
POST /api/auth/sign-up/email
{
  "email": "test@example.com",
  "password": "12345678",
  "name": "Test"
}
```

### 2. 检查数据库

```javascript
// 应该能看到 id 字段（UUID）
db.users.findOne({ email: "test@example.com" })

// account.userId 应该是 UUID 字符串（不是 ObjectId）
db.account.findOne({ accountId: "test@example.com" })
```

### 3. 重置密码测试

```javascript
// 在后台用户管理中重置密码
// 应该可以成功创建或更新 credential 账户
```

## 参考来源

这个方案来自社区实践，核心理念是：**只要不让 Better Auth 管理 `_id`，就可以把主键换成任意字段。**

## 文件修改清单

- ✅ `lib/auth.js` - 添加 `fields.id` 和 `databaseHooks`
- ✅ `app/(admin)/actions/dao/user.js` - `getUserById` 兼容双主键（向后兼容）
- ✅ `app/(admin)/actions/dao/user.js` - `resetUserPassword` 使用 `user.id` 优先

## 注意事项

1. **旧用户数据**：如果已有用户只有 `_id` 没有 `id`，需要运行迁移脚本
2. **索引问题**：Better Auth 会自动管理 `id` 字段的唯一索引
3. **向后兼容**：DAO 层保留了对 `_id` 的查询支持，确保旧数据仍可访问

