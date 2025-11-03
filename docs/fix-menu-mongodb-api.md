# 修复菜单管理 MongoDB API 问题

## 🐛 问题描述

### 问题 1: `.sort()` 不是函数

```
TypeError: menusCollection.find(...).sort is not a function
```

### 问题 2: `checkAdmin()` 返回格式错误

```javascript
// checkAdmin() 实际返回
{
  session: { ... },
  user: { ... }
}

// 但代码期望
{
  success: true,
  ...
}
```

## 🔍 问题原因

### 原因 1: MongoDB Collection 包装器

`lib/mongodb.js` 中的 `getCollection()` 返回的不是原生 MongoDB collection，而是一个包装对象：

```javascript
export async function getCollection(collectionName) {
  const db = await connectToDatabase();
  const collection = db.collection(collectionName);

  return {
    find: async (query = {}, options = {}) => {
      query = processObjectIds(query);
      return collection.find(query, options).toArray(); // ❌ 直接返回数组
    },
    // ...
  };
}
```

**问题**: `find()` 直接返回 `toArray()` 的结果（数组），而不是 MongoDB Cursor，所以无法链式调用 `.sort()`。

### 原因 2: checkAdmin 函数设计

`lib/admin-auth.js` 中的 `checkAdmin()` 函数：

```javascript
export async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect('/en/login?error=unauthorized');
  }
  
  if (session.user.role !== 'admin') {
    redirect('/en?error=forbidden');
  }
  
  // ... 更新 lastLoginAt
  
  return { session, user: session.user }; // ❌ 没有 success 字段
}
```

**问题**: 返回格式与其他 Server Actions 不一致。

## ✅ 解决方案

### 解决方案 1: 使用 Options 传递 Sort

**错误的写法**（原生 MongoDB 风格）:
```javascript
const menus = await menusCollection
  .find(query)
  .sort({ sortOrder: -1, createdAt: 1 })
  .toArray();
```

**正确的写法**（适配包装器）:
```javascript
const menus = await menusCollection.find(query, {
  sort: { sortOrder: -1, createdAt: 1 }
});
```

### 解决方案 2: 修改权限检查逻辑

**错误的判断**:
```javascript
const admin = await checkAdmin();
if (!admin.success) {
  return { success: false, error: admin.error };
}
```

**正确的判断**:
```javascript
const admin = await checkAdmin();
// checkAdmin() 返回 { session, user }
// 如果执行到这里说明权限验证通过（否则会 redirect）
if (!admin?.user) {
  return { success: false, error: 'Unauthorized' };
}
```

## 📝 修改的文件

### `app/(admin)/actions/admin-menus.js`

**1. 修复 getMenuListAction**:
```diff
- const menus = await menusCollection
-   .find(query)
-   .sort({ sortOrder: -1, createdAt: 1 })
-   .toArray();
+ const menus = await menusCollection.find(query, {
+   sort: { sortOrder: -1, createdAt: 1 }
+ });
```

**2. 修复 getMenuTreeAction**:
```diff
- const menus = await menusCollection
-   .find({ deletedAt: { $exists: false }, enabled: true })
-   .sort({ sortOrder: -1, createdAt: 1 })
-   .toArray();
+ const menus = await menusCollection.find(
+   { deletedAt: { $exists: false }, enabled: true },
+   { sort: { sortOrder: -1, createdAt: 1 } }
+ );
```

**3. 修复所有 checkAdmin 调用**（5 处）:
```diff
  const admin = await checkAdmin();
- if (!admin.success) {
-   return { success: false, error: admin.error };
+ if (!admin?.user) {
+   return { success: false, error: 'Unauthorized' };
  }
```

## 🎯 为什么 getList 返回树形结构？

### ProTable 的树形表格支持

ProTable 支持两种数据格式：

**1. 扁平数据 + 分页** ✅ 适合大量数据
```javascript
{
  data: [
    { id: 1, name: 'Item 1', parentId: null },
    { id: 2, name: 'Item 2', parentId: 1 },
    { id: 3, name: 'Item 3', parentId: 1 },
  ],
  total: 100,
  success: true
}
```

**2. 树形数据 + 无分页** ✅ 适合菜单、分类等
```javascript
{
  data: [
    { 
      id: 1, 
      name: 'Item 1', 
      children: [
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]
    },
  ],
  total: 3,
  success: true
}
```

### 菜单管理的选择

**为什么选择树形数据？**

1. ✅ **数据量小**: 菜单通常不会超过 100 条
2. ✅ **层级关系重要**: 需要直观展示父子关系
3. ✅ **用户体验好**: 
   - 默认展开所有层级
   - 可以拖拽调整顺序（未来功能）
   - 直观的缩进显示
4. ✅ **无需分页**: 一次性加载全部数据

**配置**:
```javascript
tableProps={{
  expandable: {
    defaultExpandAllRows: true,  // 默认展开所有行
    indentSize: 24,              // 缩进大小
  },
  pagination: false,             // 禁用分页
}}
```

## 🔧 MongoDB 包装器说明

### 当前 API

`lib/mongodb.js` 提供的包装器 API：

```javascript
const collection = await getCollection('collectionName');

// ✅ 支持的操作
await collection.find(query, options);
await collection.findOne(query);
await collection.insertOne(data);
await collection.insertMany(data);
await collection.updateOne(filter, update);
await collection.updateMany(filter, update);
await collection.deleteOne(filter);
await collection.deleteMany(filter);
await collection.countDocuments(query);

// ❌ 不支持链式调用
// await collection.find(query).sort().limit().toArray();
```

### 使用 Options 参数

所有查询操作都应该通过 `options` 参数传递额外配置：

```javascript
// 排序
await collection.find(query, { sort: { field: 1 } });

// 分页
await collection.find(query, { 
  sort: { createdAt: -1 },
  skip: (page - 1) * pageSize,
  limit: pageSize 
});

// 投影（只返回部分字段）
await collection.find(query, { 
  projection: { name: 1, email: 1 } 
});
```

## 📚 相关文档

- [ProTable 树形表格](https://procomponents.ant.design/components/table#树形表格)
- [MongoDB Node.js Driver - Find Options](https://mongodb.github.io/node-mongodb-native/6.3/interfaces/FindOptions.html)

## 🎉 修复结果

- ✅ `.sort()` 错误已修复
- ✅ `checkAdmin()` 判断已修复
- ✅ 创建菜单功能正常
- ✅ 列表显示树形结构
- ✅ 父级菜单选择正常

---

**修复日期**: 2025-11-03  
**影响范围**: 菜单管理模块  
**状态**: ✅ 已完全修复

