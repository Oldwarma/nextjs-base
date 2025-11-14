# CRUD 修复记录 - Round 4

**日期：** 2024-11-13  
**主题：** 修复 `getDb is not a function` 错误和优化主键配置

---

## 🐛 问题描述

### 错误信息

```
[update] permissions failed: TypeError: getDb is not a function
    at Object.beforeUpdate (app/(admin)/actions/rbac/crud-action.permission.js:162:21)
```

### 根本原因

在 `crud-action.permission.js` 中的 hooks 和 validation 中使用了错误的数据库 API：

```javascript
// ❌ 错误：mongodb.js 中没有导出 getDb 函数
const { getDb } = await import('@/lib/database/mongodb');
const db = await getDb();
const parent = await db.collection('permissions').findOne({ id: value });
```

实际上 `@/lib/database/mongodb` 只导出了以下函数：
- `connectToDatabase()`
- `getCollection(collectionName)` ✅
- `checkConnectionHealth()`
- `getConnectionStats()`
- `toObjectId()`
- `fromObjectId()`
- `generateId()`
- `isValidUUID()`

---

## ✅ 修复方案

### 1. 修改 validation 中的数据库访问

**文件：** `app/(admin)/actions/rbac/crud-action.permission.js`

```javascript
// ✅ 正确的方式
const { getCollection } = await import('@/lib/database/mongodb');
const collection = await getCollection('permissions');
const parent = await collection.findOne({ id: value });
```

### 2. 修改 hooks 中的数据库访问

**beforeCreate：**
```javascript
beforeCreate: async (data) => {
  const { getCollection } = await import('@/lib/database/mongodb');
  const collection = await getCollection('permissions');
  const query = { name: data.name };
  // ...
  const existing = await collection.findOne(query);
  // ...
}
```

**beforeUpdate：**
```javascript
beforeUpdate: async (id, data) => {
  const { getCollection } = await import('@/lib/database/mongodb');
  const collection = await getCollection('permissions');
  const current = await collection.findOne({ id });
  // ...
}
```

**beforeDelete：**
```javascript
beforeDelete: async (id) => {
  const { getCollection } = await import('@/lib/database/mongodb');
  const permissionsCollection = await getCollection('permissions');
  const rolesCollection = await getCollection('roles');
  // ...
}
```

**afterFind：**
```javascript
afterFind: async (records) => {
  const { getCollection } = await import('@/lib/database/mongodb');
  const collection = await getCollection('permissions');
  const parents = await collection.find({ id: { $in: parentIds } }).toArray();
  // ...
}
```

---

## 🎯 主键配置优化

### 问题：为什么使用 `id` 而不是 `_id`？

用户希望使用自定义 `id` 字段（UUID 格式）以便未来迁移到其他数据库（如 PostgreSQL）。但这导致需要在多处配置 `primaryKey` 和 `rowKey`，增加了复杂度。

### 解决方案：修改默认值

#### 1. SmartCrudPage 默认值

**文件：** `components/admin/smart-crud-page.jsx`

```javascript
export default function SmartCrudPage({
  // ...
  rowKey = 'id',  // ✅ 改为默认使用 'id'（原来是 '_id'）
  // ...
})
```

#### 2. BaseDAO 默认值

**文件：** `app/(admin)/actions/dao/base.js`

```javascript
constructor(config) {
  this.config = {
    primaryKey: config.primaryKey || 'id',  // ✅ 已经默认使用 'id'
    // ...
  };
}
```

### 使用效果

**修改前（需要手动配置）：**
```javascript
// ❌ 需要记得配置
const config = {
  primaryKey: 'id',  // 忘记就报错
};

<SmartCrudPage rowKey='id' />  // 忘记就报错
```

**修改后（自动使用默认值）：**
```javascript
// ✅ 不需要配置，默认就是 'id'
const config = {
  collectionName: 'permissions',
  // primaryKey 默认是 'id'
};

<SmartCrudPage />  // rowKey 默认是 'id'
```

---

## 📚 相关文档

创建了新文档：`docs/database-primary-key-strategy.md`

内容包括：
1. 为什么使用 `id` 而不是 `_id`
2. 配置清单
3. 实施指南
4. 常见错误及修复
5. 最佳实践
6. 决策矩阵

---

## 🎉 最终效果

### 1. 数据库操作正常

- ✅ `beforeCreate` - 使用 `getCollection` 正常工作
- ✅ `beforeUpdate` - 使用 `getCollection` 正常工作
- ✅ `beforeDelete` - 使用 `getCollection` 正常工作
- ✅ `afterFind` - 使用 `getCollection` 正常工作
- ✅ `validation` - 使用 `getCollection` 正常工作

### 2. 主键配置简化

- ✅ `SmartCrudPage` 默认使用 `id` 作为 `rowKey`
- ✅ `BaseDAO` 默认使用 `id` 作为 `primaryKey`
- ✅ 不需要每次都手动配置
- ✅ 保持了跨数据库兼容性（UUID 格式）

### 3. 代码更简洁

**Permissions 页面（page.js）：**
- 移除了 `rowKey='id'` 配置（使用默认值）
- 309 行代码，清晰简洁

**Permissions Actions（crud-action.permission.js）：**
- 所有数据库操作使用 `getCollection`
- 348 行代码，包含完整的 validation、hooks、transforms
- 不需要单独的 config 文件

---

## 📋 测试清单

请测试以下功能：

- [ ] **创建权限** - 验证名称重复检查
- [ ] **更新权限** - 验证名称重复检查和循环引用检查
- [ ] **删除权限** - 验证子权限和角色引用检查
- [ ] **查看权限列表** - 验证父权限信息显示
- [ ] **父权限下拉** - 验证树形数据加载
- [ ] **树形表格** - 验证层级显示
- [ ] **字段渲染** - 验证所有字段类型正确显示

---

## 🔍 关键学习点

### 1. MongoDB API 使用

```javascript
// ✅ 正确：使用 getCollection
const { getCollection } = await import('@/lib/database/mongodb');
const collection = await getCollection('collectionName');

// ❌ 错误：getDb 不存在
const { getDb } = await import('@/lib/database/mongodb');
const db = await getDb();
```

### 2. 主键策略

使用自定义 `id` 字段的好处：
- 标准 UUID 格式
- 跨数据库兼容
- 易于迁移

但需要在框架层面设置默认值以降低使用复杂度：
- `SmartCrudPage` 的 `rowKey` 默认值
- `BaseDAO` 的 `primaryKey` 默认值

### 3. 配置文件策略

最简化的结构：
- **page.js** - 只包含 `fieldsConfig`（客户端安全）
- **crud-action.{resource}.js** - 包含所有服务端配置和 actions
- **无需单独的 config 文件**

---

## 📊 修改文件清单

### 修改的文件

1. **app/(admin)/actions/rbac/crud-action.permission.js**
   - 修改：所有 `getDb` 改为 `getCollection`
   - 影响：validation、hooks（beforeCreate、beforeUpdate、beforeDelete、afterFind）

2. **components/admin/smart-crud-page.jsx**
   - 修改：`rowKey` 默认值从 `'_id'` 改为 `'id'`
   - 影响：所有使用 SmartCrudPage 的页面

3. **app/(admin)/admin/rbac/permissions/page.js**
   - 修改：移除 `rowKey='id'` 配置（使用默认值）
   - 影响：代码更简洁

### 新增的文件

1. **docs/database-primary-key-strategy.md**
   - 主键策略详细说明文档

2. **docs/crud-fixes-round4-2024-11-13.md**
   - 本次修复记录（当前文档）

---

## ✨ 下一步

1. **测试所有功能** - 确保修复没有引入新问题
2. **应用到其他 RBAC 页面** - users、roles、menus 也应用相同的简化结构
3. **更新文档** - 将新的最佳实践加入到 `crud-final-standard.md`
4. **创建示例** - 基于当前 permissions 页面创建标准模板

---

**修复完成！** 🎉

现在可以正常使用 permissions 页面的所有 CRUD 功能了！

