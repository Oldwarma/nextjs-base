# 修复 account 表缺失的 userId 字段

## 问题

Better Auth 报错 `Invalid id value`，因为 `account` 表中缺少 `userId` 字段。

## 原因

Google OAuth 登录时创建的 `account` 记录没有 `userId` 字段，导致 Better Auth 无法关联到 `users` 表。

## 解决方案

### 方法 1：在 MongoDB Compass 中执行（推荐）

1. 打开 MongoDB Compass
2. 连接到数据库
3. 选择 `account` 集合
4. 点击 "Aggregations" 或 "Documents" 标签
5. 点击 "Filter" 输入框，执行以下命令：

```javascript
// 更新你的 Google account，添加 userId
db.account.updateOne(
  { _id: ObjectId("69030d2a9ff630ade7f92b34") },
  { $set: { userId: ObjectId("69030d2a9ff630ade7f92b33") } }
)
```

### 方法 2：使用 MongoDB Shell

```bash
# 连接到 MongoDB
mongosh

# 切换到数据库
use jimeng

# 更新 account
db.account.updateOne(
  { _id: ObjectId("69030d2a9ff630ade7f92b34") },
  { $set: { userId: ObjectId("69030d2a9ff630ade7f92b33") } }
)
```

### 方法 3：批量修复所有缺失 userId 的 account

如果有多个 account 缺失 userId，可以执行：

```javascript
// 查找所有缺失 userId 的 account
db.account.find({ userId: { $exists: false } })

// 对于每个 account，根据 email 或 accountId 手动关联：
// 1. Google/GitHub OAuth: 根据 email 查找 users
db.users.findOne({ email: "karma.zhao@gmail.com" })
// 复制返回的 _id

// 2. 更新 account
db.account.updateOne(
  { _id: ObjectId("69030d2a9ff630ade7f92b34") },
  { $set: { userId: ObjectId("复制的用户_id") } }
)
```

## 验证

更新后，你的 `account` 记录应该包含 `userId` 字段：

```json
{
  "_id": ObjectId("69030d2a9ff630ade7f92b34"),
  "accountId": "107231209920205563982",
  "providerId": "google",
  "userId": ObjectId("69030d2a9ff630ade7f92b33"),  // ← 新增字段
  "accessToken": "...",
  "idToken": "...",
  ...
}
```

## 重新测试

1. 重启开发服务器
2. 尝试 Google 登录
3. 应该可以成功登录！

