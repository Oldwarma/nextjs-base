# 权限系统数据库迁移指南

> **最后更新**: 2024-11-14  
> **版本**: v1.0

本文档说明如何为现有的权限系统添加 `apis` 字段支持。

---

## 📊 迁移概述

### 变更内容

为 `permissions` 表添加新字段 `apis`，用于支持 API 路由权限控制。

### 迁移影响

- **向后兼容**：现有权限配置继续工作
- **无需停机**：可以在线上环境直接执行
- **零风险**：只添加字段，不修改现有数据

---

## 🔧 迁移步骤

### Step 1: 备份数据库（可选但推荐）

```bash
# MongoDB 导出 permissions 集合
mongodump --db=your_database --collection=permissions --out=/backup/path

# 或使用 MongoDB Compass 导出
```

### Step 2: 运行迁移脚本

创建迁移脚本 `scripts/migrate-add-apis-field.js`：

```javascript
/**
 * 权限系统迁移脚本
 * 为所有现有权限添加 apis 字段
 * 
 * 运行方式：
 * node scripts/migrate-add-apis-field.js
 */

import { getCollection } from '@/lib/database/mongodb';

async function migratePermissions() {
  console.log('🚀 开始迁移权限系统...\n');
  
  try {
    const collection = await getCollection('permissions');
    
    // 1. 统计需要迁移的文档
    const totalCount = await collection.countDocuments();
    const needMigrationCount = await collection.countDocuments({
      apis: { $exists: false }
    });
    
    console.log(`📊 统计信息:`);
    console.log(`   总权限数: ${totalCount}`);
    console.log(`   需要迁移: ${needMigrationCount}`);
    console.log(`   已有 apis 字段: ${totalCount - needMigrationCount}\n`);
    
    if (needMigrationCount === 0) {
      console.log('所有权限已经包含 apis 字段，无需迁移');
      return;
    }
    
    // 2. 执行迁移
    console.log('🔄 正在添加 apis 字段...');
    const result = await collection.updateMany(
      { apis: { $exists: false } },
      { $set: { apis: [] } }
    );
    
    console.log(`\n迁移完成!`);
    console.log(`   更新文档数: ${result.modifiedCount}`);
    console.log(`   匹配文档数: ${result.matchedCount}\n`);
    
    // 3. 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const afterMigrationCount = await collection.countDocuments({
      apis: { $exists: true }
    });
    
    console.log(`   现在所有权限都有 apis 字段: ${afterMigrationCount}/${totalCount}`);
    
    if (afterMigrationCount === totalCount) {
      console.log('\n🎉 迁移验证成功！');
    } else {
      console.log('\n⚠️ 警告：部分文档可能未迁移成功，请检查');
    }
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    throw error;
  }
}

// 执行迁移
migratePermissions()
  .then(() => {
    console.log('\n✨ 迁移脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 迁移脚本执行失败:', error);
    process.exit(1);
  });
```

### Step 3: 执行迁移

```bash
# 在项目根目录执行
node scripts/migrate-add-apis-field.js
```

**预期输出**：

```
🚀 开始迁移权限系统...

📊 统计信息:
   总权限数: 15
   需要迁移: 15
   已有 apis 字段: 0

🔄 正在添加 apis 字段...

迁移完成!
   更新文档数: 15
   匹配文档数: 15

🔍 验证迁移结果...
   现在所有权限都有 apis 字段: 15/15

🎉 迁移验证成功！

✨ 迁移脚本执行完毕
```

### Step 4: 验证迁移结果

在 MongoDB 中查询验证：

```javascript
// MongoDB Shell 或 Compass
db.permissions.find({}, { name: 1, actions: 1, apis: 1 }).pretty()
```

**预期结果**：

```javascript
{
  "_id": ObjectId("..."),
  "id": "crud-read-all",
  "name": "CRUD - Read (All)",
  "actions": [
    "**/get*Action",
    "**/find*Action",
    "**/query*Action"
  ],
  "apis": []  // 新添加的字段
}
```

---

## 🎨 迁移后配置示例

### 为现有权限添加 API 权限

迁移完成后，可以在权限管理页面为现有权限添加 `apis` 配置：

#### 示例 1: 用户读取权限

**迁移前**：

```json
{
  "id": "crud-user-read",
  "name": "User - Read",
  "actions": [
    "**/getUser*Action",
    "**/listUser*Action"
  ]
}
```

**迁移后（可选添加）**：

```json
{
  "id": "crud-user-read",
  "name": "User - Read",
  "actions": [
    "**/getUser*Action",
    "**/listUser*Action"
  ],
  "apis": [
    "/api/v1/users",
    "/api/v1/users/*"
  ]
}
```

#### 示例 2: 订单管理权限

**迁移前**：

```json
{
  "id": "order-management",
  "name": "Order Management",
  "actions": [
    "**/*Order*Action"
  ]
}
```

**迁移后（可选添加）**：

```json
{
  "id": "order-management",
  "name": "Order Management",
  "actions": [
    "**/*Order*Action"
  ],
  "apis": [
    "/api/v1/orders/*",
    "/api/v1/orders/*/refund"
  ]
}
```

---

## 🔄 回滚方案

如果需要回滚迁移：

### 方案 1: 从备份恢复

```bash
# 从备份恢复
mongorestore --db=your_database --collection=permissions /backup/path/your_database/permissions.bson
```

### 方案 2: 删除 apis 字段

创建回滚脚本 `scripts/rollback-remove-apis-field.js`：

```javascript
/**
 * 回滚脚本：删除 apis 字段
 */

import { getCollection } from '@/lib/database/mongodb';

async function rollbackPermissions() {
  console.log('🔙 开始回滚权限系统...\n');
  
  try {
    const collection = await getCollection('permissions');
    
    const result = await collection.updateMany(
      { apis: { $exists: true } },
      { $unset: { apis: "" } }
    );
    
    console.log(`回滚完成!`);
    console.log(`   删除 apis 字段的文档数: ${result.modifiedCount}\n`);
    
  } catch (error) {
    console.error('\n❌ 回滚失败:', error);
    throw error;
  }
}

rollbackPermissions()
  .then(() => {
    console.log('\n✨ 回滚脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 回滚脚本执行失败:', error);
    process.exit(1);
  });
```

---

## 📝 注意事项

### 1. 字段默认值

- 新添加的 `apis` 字段默认为空数组 `[]`
- 空数组不会影响权限检查逻辑
- 只有配置了值的 `apis` 才会生效

### 2. 权限检查逻辑

迁移后，权限检查逻辑：

```javascript
// checkUserHasApiPermission 只在有配置时才检查
export async function checkUserHasApiPermission(userId, apiPath) {
  const userPermissionIds = await getUserPermissionIds(userId);
  const apis = await getApisByPermissionIds(userPermissionIds);
  
  // 如果所有权限的 apis 都是空数组，这里返回 []
  if (apis.length === 0) {
    return false;  // 没有配置 API 权限，拒绝访问
  }
  
  return matchActionPath(apiPath, apis);
}
```

### 3. 性能影响

- 添加字段不会影响现有查询性能
- 空数组不会增加存储负担
- 索引无需重建（如果有的话）

### 4. 渐进式配置

迁移完成后，可以渐进式地为权限添加 `apis` 配置：

1. **第一步**：只迁移字段，不配置值
2. **第二步**：为需要 API 权限的模块配置 `apis`
3. **第三步**：在 API Routes 中使用 `withApiPermission`
4. **第四步**：测试验证

---

## 🧪 测试验证

### 测试用例 1: 验证迁移后现有功能不受影响

```javascript
// 测试现有的 Server Actions 权限
import { checkUserHasActionPermission } from '@/app/(admin)/actions/dao/sys';

async function testExistingPermissions() {
  // 假设用户有 "crud-user-read" 权限
  const hasPermission = await checkUserHasActionPermission('user-id', 'getUserAction');
  
  console.assert(hasPermission === true, '现有权限应该继续工作');
  console.log('现有权限测试通过');
}
```

### 测试用例 2: 验证新的 API 权限

```javascript
// 测试新的 API 权限检查
import { checkUserHasApiPermission } from '@/app/(admin)/actions/dao/sys';

async function testApiPermissions() {
  // 1. 测试空 apis 数组（应该拒绝访问）
  const hasPermission1 = await checkUserHasApiPermission('user-id', '/api/v1/users');
  console.assert(hasPermission1 === false, '空 apis 应该拒绝访问');
  
  // 2. 配置 apis 后再测试
  // 假设权限已配置 "apis": ["/api/v1/users/*"]
  const hasPermission2 = await checkUserHasApiPermission('user-id', '/api/v1/users/123');
  console.assert(hasPermission2 === true, '配置的 apis 应该允许访问');
  
  console.log('API 权限测试通过');
}
```

### 测试用例 3: 验证 admin 角色自动通过

```javascript
// 测试 admin 角色
async function testAdminRole() {
  // admin 应该自动通过所有检查
  const hasPermission = await checkUserHasApiPermission('admin-user-id', '/api/v1/users');
  console.assert(hasPermission === true, 'admin 应该自动通过');
  
  console.log('Admin 角色测试通过');
}
```

---

## 📊 FAQ

### Q1: 迁移会影响线上服务吗？

**A**: 不会。迁移只是添加新字段（空数组），不会影响现有功能。可以在线上环境直接执行。

### Q2: 如果迁移中断怎么办？

**A**: 迁移脚本使用 `updateMany`，MongoDB 会保证操作的原子性。如果中断，部分文档可能已更新，重新运行脚本即可（脚本会跳过已有 `apis` 字段的文档）。

### Q3: 需要更新应用代码吗？

**A**: 不需要。添加字段后，现有代码继续工作。只有在需要使用 API 权限时，才需要：
1. 配置权限的 `apis` 字段
2. 在 API Routes 中使用 `withApiPermission`

### Q4: 可以只为部分权限添加 apis 吗？

**A**: 可以。迁移脚本为所有权限添加空数组，你可以只为需要的权限配置具体的 API 路径。

### Q5: apis 字段支持哪些格式？

**A**: 
- 精确路径：`/api/v1/users`
- 单层通配：`/api/v1/users/*` (匹配 `/api/v1/users/123`)
- 多层通配：`/api/v1/users/**` (匹配 `/api/v1/users/123/profile`)

---

## 🎓 总结

### 迁移清单

- [x] 备份数据库（可选但推荐）
- [x] 运行迁移脚本
- [x] 验证迁移结果
- [ ] 为需要的权限配置 `apis` 值（可选，渐进式）
- [ ] 在 API Routes 中使用 `withApiPermission`（可选，渐进式）
- [ ] 测试验证

### 关键要点

1. **零风险迁移** - 只添加字段，不修改现有数据
2. **向后兼容** - 现有功能不受影响
3. **渐进式配置** - 可以逐步为权限添加 API 权限配置
4. **易于回滚** - 需要时可以轻松删除 apis 字段

---

## 📚 相关文档

- [权限系统扩展方案](./PERMISSION_SYSTEM_EXTENSION.md)
- [Actions 路径配置指南](./ACTIONS_PATH_GUIDE.md)
- [RBAC 系统总览](./RBAC_SYSTEM.md)

---

**Version History**:
- `v1.0` (2024-11-14): 初始版本，说明 apis 字段迁移步骤

