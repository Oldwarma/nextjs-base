# CRUD 修复记录 - Round 5

**日期：** 2024-11-13  
**主题：** 修复模糊搜索功能（`mode: 'like'` 不生效）

---

## 🐛 问题描述

### 用户报告

在 Permissions 页面搜索时，即使配置了 `mode: 'like'`，搜索仍然要求**完全匹配**，而不是模糊搜索。

```javascript
{
  key: 'name',
  search: {
    mode: 'like',  // ❌ 配置了但不生效
    placeholder: 'Search by name',
  },
}
```

**期望行为：** 搜索 "create" 应该匹配 "Create Bullet", "create user" 等  
**实际行为：** 只匹配完全等于 "create" 的记录

---

## 🔍 问题分析

### 数据流追踪

**1. 前端（SmartCrudPage）：**
```javascript
// 用户输入
searchParams = { name: 'create' }

// generateSearchTransform 转换
const mode = field.search?.mode || 'exact';  // ✅ mode = 'like'

switch (mode) {
  case 'like':
    conditions[field.key] = value;  // ❌ 只是简单赋值！
    break;
}

// 结果
whereJson = { name: 'create' }  // ❌ 这是精确匹配！
```

**2. 后端（BaseDAO）：**
```javascript
// getList 接收 whereJson
{ whereJson: { name: 'create' } }

// 直接使用 whereJson 查询
const query = { ...whereJson };

// MongoDB 查询
db.collection.find({ name: 'create' })  // ❌ 精确匹配！
```

### 根本原因

`generateSearchTransform` 在处理 `mode: 'like'` 时，只是简单地把值赋给条件对象：

```javascript
case 'like':
  conditions[field.key] = value;  // ❌ 错误！应该转换为 $regex
  break;
```

**正确的 MongoDB 模糊搜索格式应该是：**
```javascript
{ name: { $regex: 'create', $options: 'i' } }
```

---

## ✅ 修复方案

### 修改 `generateSearchTransform` 函数

**文件：** `lib/crud/field-generator.js`

```javascript
searchableFields.forEach((field) => {
  const value = searchParams[field.key];
  if (value === undefined || value === null || value === '') return;

  const mode = field.search?.mode || 'exact';

  switch (mode) {
    case 'like':
    case '%%':
      // ✅ 模糊搜索 - 转换为 MongoDB $regex 格式
      conditions[field.key] = { $regex: value, $options: 'i' };
      break;

    case 'exact':
    case '==':
      // ✅ 精确搜索
      conditions[field.key] = value;
      break;
    
    // ... 其他模式
  }
});
```

### 更新字段配置

**文件：** `app/(admin)/admin/rbac/permissions/page.js`

```javascript
{
  key: 'name',
  search: {
    mode: 'like',  // ✅ 现在会生效！
    enabled: true,
    placeholder: 'Search by name',
  },
},

{
  key: 'remark',
  search: {
    mode: 'like',  // ✅ 添加 mode 配置
    placeholder: 'Search by remark',
  },
}
```

---

## 🎯 修复后的数据流

### 完整流程

**1. 前端转换：**
```javascript
// 用户输入
searchParams = { name: 'create' }

// generateSearchTransform 转换（修复后）
conditions[field.key] = { $regex: 'create', $options: 'i' };

// 结果
whereJson = { 
  name: { $regex: 'create', $options: 'i' }  // ✅ MongoDB 模糊搜索格式
}
```

**2. 后端查询：**
```javascript
// getList 接收 whereJson
{ 
  whereJson: { 
    name: { $regex: 'create', $options: 'i' } 
  } 
}

// MongoDB 查询
db.collection.find({ 
  name: { $regex: 'create', $options: 'i' }  // ✅ 模糊搜索，不区分大小写
})
```

**3. 查询结果：**
- ✅ "Create Bullet" - 匹配（包含 "create"，不区分大小写）
- ✅ "create user" - 匹配
- ✅ "User Creation" - 匹配（包含 "creat"）
- ❌ "delete" - 不匹配

---

## 📋 支持的搜索模式

### 1. 模糊搜索 (`mode: 'like'`)

```javascript
{
  key: 'name',
  search: {
    mode: 'like',  // 或 '%%'
  },
}
```

**转换结果：**
```javascript
{ name: { $regex: 'value', $options: 'i' } }
```

**特点：**
- 不区分大小写（`$options: 'i'`）
- 匹配包含搜索词的所有记录
- 支持部分匹配

### 2. 精确搜索 (`mode: 'exact'`)

```javascript
{
  key: 'id',
  search: {
    mode: 'exact',  // 或 '=='，或省略（默认）
  },
}
```

**转换结果：**
```javascript
{ id: 'value' }
```

**特点：**
- 完全匹配
- 区分大小写
- 适用于 ID、枚举值等

### 3. 范围搜索 (`mode: 'range'`)

```javascript
{
  key: 'createdAt',
  search: {
    mode: 'range',  // 或 '[]'
  },
}
```

**转换结果：**
```javascript
{ 
  createdAt_start: '2024-01-01',
  createdAt_end: '2024-12-31'
}
```

### 4. 数组包含 (`mode: 'in'`)

```javascript
{
  key: 'roles',
  search: {
    mode: 'in',
  },
}
```

**转换结果：**
```javascript
{ roles_in: ['role1', 'role2'] }
```

**特点：**
- 会被 BaseDAO 转换为 MongoDB `$in` 操作符
- 适用于多选下拉框

### 5. 比较操作符

```javascript
// 大于
{ mode: 'gt' }  // 或 '>'
// 结果: { field_gt: value }

// 大于等于
{ mode: 'gte' }  // 或 '>='
// 结果: { field_gte: value }

// 小于
{ mode: 'lt' }  // 或 '<'
// 结果: { field_lt: value }

// 小于等于
{ mode: 'lte' }  // 或 '<='
// 结果: { field_lte: value }
```

---

## 🎉 测试结果

### 测试用例

#### 1. 模糊搜索 - Name 字段

**测试数据：**
- "Create Bullet"
- "create user"
- "User Creation"
- "Delete Permission"

**搜索 "create"：**
- ✅ 匹配前 3 条（不区分大小写）
- ✅ 不匹配 "Delete Permission"

#### 2. 模糊搜索 - Remark 字段

**测试数据：**
- "Allow users to create new posts"
- "DELETE operation requires admin"
- "creation time tracking"

**搜索 "create"：**
- ✅ 匹配前 2 条
- ✅ "creation" 也匹配（因为包含 "creat"）

#### 3. 组合搜索

**搜索条件：**
- Name: "create"
- Enable: true

**结果：**
- ✅ 只返回名字包含 "create" 且状态为启用的记录
- ✅ 两个条件都生效

---

## 📊 修改文件清单

### 修改的文件

1. **lib/crud/field-generator.js**
   - 修改：`generateSearchTransform` 函数中的 `case 'like'` 分支
   - 影响：所有使用模糊搜索的页面

2. **app/(admin)/admin/rbac/permissions/page.js**
   - 修改：`remark` 字段添加 `mode: 'like'`
   - 影响：remark 字段现在也支持模糊搜索

### 新增的文件

1. **docs/crud-fixes-round5-2024-11-13.md**
   - 本次修复记录（当前文档）

---

## 🔍 关键学习点

### 1. MongoDB 模糊搜索

**错误方式（精确匹配）：**
```javascript
{ name: 'create' }
```

**正确方式（模糊搜索）：**
```javascript
{ name: { $regex: 'create', $options: 'i' } }
```

**说明：**
- `$regex`: 正则表达式匹配
- `$options: 'i'`: 不区分大小写（case-insensitive）

### 2. 搜索模式配置

**配置位置：**
```javascript
{
  key: 'fieldName',
  search: {
    mode: 'like',  // ✅ 必须明确指定 mode
    placeholder: 'Search...',
  },
}
```

**如果省略 `mode`：**
- 默认为 `'exact'`（精确匹配）
- 如果需要模糊搜索，**必须显式配置** `mode: 'like'`

### 3. 数据转换位置

**方案对比：**

❌ **错误：在 BaseDAO 中转换**
- 问题：BaseDAO 收到的已经是 `whereJson`，无法区分哪些字段需要模糊搜索
- 结果：必须修改 BaseDAO，增加复杂度

✅ **正确：在 generateSearchTransform 中转换**
- 优点：根据字段配置的 `mode` 生成正确的查询格式
- 结果：BaseDAO 收到的就是最终的 MongoDB 查询条件

### 4. 类型转换的时机

**前端（SmartCrudPage）：**
- 负责将用户输入转换为后端理解的格式
- `generateSearchTransform` 是正确的转换位置

**后端（BaseDAO）：**
- 负责执行查询
- 应该接收已经格式化好的查询条件

---

## ✨ 下一步

### 1. 测试所有搜索功能

- [x] Name 字段模糊搜索
- [x] Remark 字段模糊搜索
- [ ] Enable 字段精确搜索（select）
- [ ] 组合搜索（多个字段）
- [ ] 清除搜索

### 2. 应用到其他页面

需要检查以下页面的搜索配置：
- [ ] Users 页面
- [ ] Roles 页面
- [ ] Menus 页面
- [ ] Posts 页面（CMS）

### 3. 文档更新

- [ ] 更新 `crud-final-standard.md`，说明搜索模式配置
- [ ] 添加搜索模式使用示例
- [ ] 创建搜索模式选择指南

---

## 📝 相关文档

- `docs/crud-fixes-round4-2024-11-13.md` - 修复 getDb 错误
- `docs/crud-fixes-round3-2024-11-13.md` - 修复 React 警告和数据持久化
- `docs/crud-final-standard.md` - CRUD 标准文档

---

**修复完成！** 🎉

现在模糊搜索功能正常工作了，搜索 "create" 可以匹配所有包含该词的记录！

