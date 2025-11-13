# CRUD 配置说明文档

**版本：** 1.0  
**日期：** 2024-11-13

---

## 📋 配置项说明

### 1. page.js 中的 `search` 配置 vs crud-action.js 中的 `query` 配置

这两个配置**不冲突**，它们的职责完全不同：

| 配置项 | 位置 | 职责 | 示例 |
|-------|------|------|------|
| **`search`** | `page.js` 的 `fieldsConfig` 中 | **UI层面**：定义搜索表单的字段、占位符、组件类型等 | `search: { placeholder: 'Search by name' }` |
| **`query`** | `crud-action.js` 的配置中 | **数据层面**：定义数据库查询的默认参数（排序、分页大小、连表等） | `query: { defaultSort: { sort: 1 }, defaultPageSize: 20 }` |

#### 详细说明

**`search` 配置（UI层）**

位置：`page.js` 中的 `fieldsConfig` 数组中

```javascript
// page.js
const fieldsConfig = [
  {
    key: 'name',
    title: 'Name',
    type: 'text',
    search: {
      // ✅ UI配置：搜索框的占位符
      placeholder: 'Search by name',
      // ✅ UI配置：字段属性
      fieldProps: {
        allowClear: true,
      },
      // ✅ UI配置：是否延迟加载（仅展开时显示）
      lazyLoad: true,
    },
  },
  {
    key: 'enable',
    title: 'Enable',
    type: 'switch',
    search: {
      // ✅ UI配置：搜索时使用下拉选择而不是开关
      type: 'select',
      options: [
        { label: 'Enabled', value: true },
        { label: 'Disabled', value: false },
      ],
    },
  },
];
```

**作用：**
- 控制搜索表单的**显示和交互**
- 定义哪些字段可以搜索
- 定义搜索组件的类型和属性
- 定义搜索框的占位符、提示等UI文本

**`query` 配置（数据层）**

位置：`crud-action.js` 的配置对象中

```javascript
// crud-action.{resource}.js
const {resource}Config = {
  collectionName: '{resource}',
  primaryKey: '_id',
  
  query: {
    // ✅ 数据配置：默认排序规则
    defaultSort: { sort: 1, name: 1 },
    
    // ✅ 数据配置：默认每页显示数量
    defaultPageSize: 20,
    
    // ✅ 数据配置：需要连表查询的字段
    populateFields: ['parent_id', 'role_id'],
    
    // ✅ 数据配置：默认筛选条件（强制应用）
    defaultFilters: { enable: true },
  },
};
```

**作用：**
- 控制数据库查询的**默认行为**
- 定义数据的默认排序方式
- 定义分页的默认大小
- 定义需要自动关联查询的字段
- 定义全局的筛选条件

---

### 2. 工作流程示例

**用户操作：在搜索框输入 "admin" 并点击搜索**

1. **UI层（`search` 配置）**
   - 根据 `fieldsConfig` 中的 `search` 配置，渲染搜索表单
   - 用户在 "Name" 字段的搜索框中输入 "admin"
   - 点击搜索按钮

2. **数据传递**
   - UI 将搜索条件传递给 Server Action：`{ name: 'admin' }`

3. **数据层（`query` 配置）**
   - Server Action 接收搜索条件
   - 结合 `query` 配置构建完整的查询：
     ```javascript
     {
       filters: { name: 'admin' },          // 来自用户输入
       sort: { sort: 1, name: 1 },         // 来自 query.defaultSort
       pageIndex: 1,
       pageSize: 20,                        // 来自 query.defaultPageSize
       populateFields: ['parent_id'],       // 来自 query.populateFields
     }
     ```

4. **数据库查询**
   - BaseDAO 执行查询
   - 自动关联 `parent_id` 字段（因为在 `populateFields` 中）
   - 按 `sort: 1, name: 1` 排序
   - 每页返回 20 条数据

---

### 3. 配置对比表

| 特性 | `search`（UI层） | `query`（数据层） |
|------|-----------------|-----------------|
| **定义位置** | `page.js` | `crud-action.js` |
| **作用范围** | 前端UI | 后端数据库 |
| **配置内容** | 搜索框占位符、组件类型、字段属性 | 默认排序、分页大小、连表字段 |
| **修改影响** | 只影响搜索表单的显示 | 影响所有数据查询的默认行为 |
| **用户可见** | 是（直接看到UI变化） | 否（只影响数据结果） |
| **示例** | `placeholder: 'Search...'` | `defaultSort: { createdAt: -1 }` |

---

### 4. 常见场景

#### 场景 1：添加新的搜索字段

**需求：** 允许用户按 "状态" 搜索

**修改：** 只需修改 `page.js`

```javascript
// page.js
{
  key: 'status',
  title: 'Status',
  type: 'select',
  search: {
    placeholder: 'Select status',
    options: [
      { label: 'Active', value: 1 },
      { label: 'Inactive', value: 0 },
    ],
  },
}
```

**不需要修改 `crud-action.js`**，因为只是UI层的改动。

#### 场景 2：修改默认排序方式

**需求：** 默认按创建时间倒序排序（最新的在前）

**修改：** 只需修改 `crud-action.js`

```javascript
// crud-action.{resource}.js
const {resource}Config = {
  query: {
    defaultSort: { createdAt: -1 },  // ✅ 修改这里
    defaultPageSize: 20,
  },
};
```

**不需要修改 `page.js`**，因为只是数据层的改动。

#### 场景 3：添加自动关联查询

**需求：** 在查询权限时，自动关联父权限的信息

**修改：** 只需修改 `crud-action.js`

```javascript
// crud-action.permission.js
const permissionConfig = {
  query: {
    populateFields: ['parent_id'],  // ✅ 添加这里
  },
  
  hooks: {
    afterFind: async (records) => {
      // ✅ 在这里实现关联查询逻辑
      const parentIds = [...new Set(records.map(r => r.parent_id).filter(Boolean))];
      const parents = await db.collection('permissions').find({ id: { $in: parentIds } }).toArray();
      const parentMap = new Map(parents.map(p => [p.id, p]));
      
      return records.map(record => ({
        ...record,
        parentInfo: parentMap.get(record.parent_id),
      }));
    },
  },
};
```

---

### 5. 最佳实践

#### ✅ 正确的分工

```javascript
// page.js - 只管UI
const fieldsConfig = [
  {
    key: 'name',
    search: {
      placeholder: 'Search by name',  // ✅ UI文本
      fieldProps: {
        allowClear: true,              // ✅ UI行为
      },
    },
  },
];

// crud-action.{resource}.js - 只管数据
const config = {
  query: {
    defaultSort: { name: 1 },          // ✅ 数据排序
    defaultPageSize: 20,                // ✅ 数据分页
    populateFields: ['parent_id'],      // ✅ 数据关联
  },
};
```

#### ❌ 错误的做法

```javascript
// ❌ 不要在 page.js 中定义数据库查询逻辑
const fieldsConfig = [
  {
    key: 'name',
    search: {
      defaultSort: { name: 1 },  // ❌ 这应该在 crud-action.js 中
    },
  },
];

// ❌ 不要在 crud-action.js 中定义UI文本
const config = {
  query: {
    searchPlaceholder: 'Search...',  // ❌ 这应该在 page.js 中
  },
};
```

---

### 6. 总结

| 问题 | 答案 |
|------|------|
| **search 和 query 会冲突吗？** | 不会，它们职责不同 |
| **修改搜索框占位符改哪里？** | 修改 `page.js` 中的 `search.placeholder` |
| **修改默认排序改哪里？** | 修改 `crud-action.js` 中的 `query.defaultSort` |
| **修改每页显示数量改哪里？** | 修改 `crud-action.js` 中的 `query.defaultPageSize` |
| **添加搜索字段改哪里？** | 修改 `page.js` 中的 `fieldsConfig`，添加 `search` 配置 |
| **添加自动关联查询改哪里？** | 修改 `crud-action.js` 中的 `query.populateFields` 和 `hooks.afterFind` |

---

## 🎯 记忆口诀

- **page.js = UI** - 用户看到什么、怎么交互
- **crud-action.js = 数据** - 数据库怎么查、怎么排序

**一句话总结：**

> `search` 控制**搜索表单的样子**，`query` 控制**数据查询的默认行为**，两者互不干扰！

---

**文档版本：** 1.0  
**最后更新：** 2024-11-13

