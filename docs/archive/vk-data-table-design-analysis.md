# vk-data-table 设计分析与借鉴

**日期：** 2024-11-13  
**目标：** 分析 vk-data-table 的设计理念，改进我们的 SmartCrudPage

---

## 🎯 vk-data-table 核心设计理念

### 1. 类型驱动渲染（Type-Driven Rendering）

**原则：** `type` 字段决定组件的渲染方式

```javascript
// Switch 类型自动渲染为开关
{
  key: "enable",
  title: "是否启用",
  type: "switch",              // ✅ type 决定渲染
  activeValue: true,
  inactiveValue: false,
  width: 80,
}

// Tree-Select 类型自动渲染为树形选择器
{
  key: "parent_id",
  title: "父级菜单",
  type: "tree-select",         // ✅ type 决定渲染
  action: "admin/system/menu/sys/getAll",
  props: { 
    list: "rows",
    value: "menu_id",
    label: "label",
    children: "children"
  },
}
```

**优势：**
- 无需编写 JSX
- 配置即可实现复杂 UI
- 易于理解和维护

---

### 2. Action 字符串自动触发请求

**原则：** `action` 字段自动触发数据请求

```javascript
// 表格数据请求
table1: {
  action: "admin/system/menu/sys/getAll",  // ✅ 字符串 URL
  columns: [/* ... */],
}

// Tree-Select 数据请求
{
  key: "parent_id",
  type: "tree-select",
  action: "admin/system/menu/sys/getAll",  // ✅ 自动请求
  props: { 
    list: "rows",           // 指定数据路径
    value: "menu_id",
    label: "label",
    children: "children"
  },
}
```

**优势：**
- 自动处理请求和状态管理
- 无需手动 `useEffect` 或 `useState`
- 配置即用

---

### 3. Formatter 函数（非 JSX）

**原则：** 使用纯 JavaScript 函数返回 HTML 字符串

```javascript
{
  key: "name",
  title: "菜单名称",
  type: "html",
  formatter: function(val, row, column, index) {
    // ✅ 纯 JS 函数，返回 HTML 字符串
    let icon = row.icon || "el-icon-tickets";
    return `<i class="${icon}" style="margin-right: 10px;"></i><text>${row.name}</text>`;
  }
}
```

**对比 React 的 JSX render：**
```javascript
// React 方式（需要导入组件）
render: (value, record) => (
  <div>
    <Icon type={record.icon} />
    <span>{record.name}</span>
  </div>
)
```

**优势：**
- 不需要导入 React 组件
- 可以在纯 JS 配置文件中定义
- 更轻量

**劣势：**
- 安全性（需要注意 XSS）
- 无法使用 React 组件的高级特性

---

### 4. Props 配置数据映射

**原则：** 使用 `props` 配置指定数据结构映射

```javascript
{
  key: "parent_id",
  type: "tree-select",
  action: "admin/system/menu/sys/getAll",
  props: { 
    list: "rows",           // 数据在 result.rows
    value: "menu_id",       // 使用 menu_id 作为 value
    label: "label",         // 使用 label 作为显示文本
    children: "children"    // children 字段名
  },
}
```

**优势：**
- 适配不同的 API 返回格式
- 无需手动转换数据
- 声明式配置

---

### 5. Watch 回调实时更新

**原则：** Switch 类型支持 `watch` 回调实时更新

```javascript
{
  key: "enable",
  type: "switch",
  watch: (res) => {
    let { value, row, change } = res;
    vk.callFunction({
      url: "admin/system/menu/sys/updateBase",
      data: {
        _id: row._id,
        enable: value
      },
      success: data => {
        change(value); // 更新表格显示
      }
    });
  }
}
```

**优势：**
- 支持行内编辑
- 实时保存数据
- 无需刷新整个表格

---

## 📊 与 SmartCrudPage 的对比

| 特性 | vk-data-table | SmartCrudPage（当前） | 改进方向 |
|------|---------------|----------------------|----------|
| **类型渲染** | `type` 自动识别 | 部分支持 | ✅ 增强 type 自动渲染 |
| **Action 请求** | 字符串 URL | 函数引用 | ⚠️ 架构不同，需适配 |
| **Render 函数** | `formatter` (HTML) | JSX render | ⚠️ 保持 JSX，但支持 formatter |
| **Tree-Select 数据** | `action` + `props` | 手动加载 | ✅ 自动加载 |
| **Switch 渲染** | `type: "switch"` | 手动 render | ✅ 自动渲染 |
| **实时更新** | `watch` 回调 | 不支持 | 🔄 未来考虑 |
| **配置位置** | 全在 columns | 分散 | ✅ 统一到 fieldsConfig |

---

## ✅ 改进建议

### 1. 增强 type 自动渲染

**目标：** `type` 字段自动决定渲染方式

**实现：**
```javascript
// Config 中
{
  key: 'enable',
  type: 'switch',              // ✅ SmartCrudPage 自动渲染为 Switch
  activeText: 'Enabled',
  inactiveText: 'Disabled',
}

{
  key: 'crud_category',
  type: 'select',
  valueEnum: {                // ✅ SmartCrudPage 自动渲染为 Tag
    0: { text: 'Unclassified', status: 'Default' },
    1: { text: 'Create', status: 'Success' },
  },
}
```

---

### 2. Tree-Select 自动加载

**目标：** 通过 `action` 字段名自动调用对应的 Server Action

**实现：**
```javascript
// Config 中
{
  key: 'parent_id',
  type: 'tree-select',
  form: {
    action: 'getPermissionTreeForSelectAction',  // ✅ action 名称
    props: {
      list: 'data',
      value: 'value',
      label: 'title',
      children: 'children',
    },
  },
}

// Page 中
<SmartCrudPage
  actions={{
    getList: actions.getPermissionTreeAction,
    create: actions.createPermissionAction,
    // ✅ SmartCrudPage 自动查找并调用
    getPermissionTreeForSelectAction: actions.getPermissionTreeForSelectAction,
  }}
/>
```

---

### 3. 支持 formatter 函数

**目标：** 支持纯 JS 函数返回字符串或对象

**实现：**
```javascript
// Config 中
{
  key: 'actions',
  type: 'array',
  table: {
    formatter: (value) => {
      // ✅ 返回字符串或对象，SmartCrudPage 自动处理
      if (!value || value.length === 0) return '-';
      return value.slice(0, 2).join(', ') + (value.length > 2 ? ' ...' : '');
    },
  },
}
```

---

### 4. ValueEnum 自动渲染 Tag

**目标：** 使用 `valueEnum` 配置自动渲染 Tag（参考 Ant Design Pro）

**实现：**
```javascript
// Config 中
{
  key: 'level',
  type: 'select',
  table: {
    valueEnum: {
      0: { text: 'Other', status: 'Default' },
      1: { text: 'Bullet', status: 'Success' },
      2: { text: 'Bomb', status: 'Warning' },
      3: { text: 'Grenade', status: 'Error' },
      4: { text: 'Nuclear', status: 'Error' },
    },
  },
}

// SmartCrudPage 自动渲染为：
<Tag color={getStatusColor(status)}>{text}</Tag>
```

**状态映射：**
```javascript
const statusColorMap = {
  Default: 'default',
  Success: 'success',
  Error: 'error',
  Warning: 'warning',
  Processing: 'processing',
};
```

---

## 🎯 核心改进点总结

### 必须实现（高优先级）

1. ✅ **Type-Driven Rendering**
   - `type: "switch"` → 自动渲染 Switch 样式
   - `type: "select"` + `valueEnum` → 自动渲染 Tag

2. ✅ **Tree-Select 自动加载**
   - `action` 字段名 → 自动从 `actions` prop 中查找并调用
   - `props` 配置 → 自动映射数据结构

3. ✅ **Formatter 支持**
   - 支持 `formatter` 函数返回字符串
   - 与 `render` 共存，优先级：`render` > `formatter`

### 应该实现（中优先级）

4. ✅ **ValueEnum 配置**
   - 简化 Tag 渲染配置
   - 统一状态映射

5. ✅ **自动识别树形数据**
   - 检测 `children` 字段自动启用树形表格

### 可以考虑（低优先级）

6. 🔄 **Watch 回调**
   - 支持行内编辑
   - 实时更新数据

7. 🔄 **HTML 渲染**
   - 支持 `type: "html"`
   - 安全处理 HTML 字符串

---

## 📝 配置文件对比

### vk-data-table 风格

```javascript
// ✅ 简洁、声明式
columns: [
  {
    key: "parent_id",
    title: "父级菜单",
    type: "tree-select",
    action: "admin/system/menu/sys/getAll",
    props: { list: "rows", value: "menu_id", label: "label", children: "children" },
  },
  {
    key: "enable",
    title: "是否启用",
    type: "switch",
    activeValue: true,
    inactiveValue: false,
  },
]
```

### 改进后的 SmartCrudPage 风格

```javascript
// ✅ 同样简洁、类型安全
fieldsConfig: [
  {
    key: 'parent_id',
    title: 'Parent Permission',
    type: 'tree-select',
    form: {
      action: 'getPermissionTreeForSelectAction',
      props: { list: 'data', value: 'value', label: 'title', children: 'children' },
    },
  },
  {
    key: 'enable',
    title: 'Status',
    type: 'switch',
    table: {
      activeText: 'Enabled',
      inactiveText: 'Disabled',
    },
  },
]
```

---

## 🚀 实施计划

### Phase 1：核心功能（本周）
1. ✅ Tree-Select 自动加载
2. ✅ Switch 自动渲染
3. ✅ ValueEnum 支持

### Phase 2：增强功能（下周）
4. ✅ Formatter 函数支持
5. ✅ 自动识别树形数据
6. ✅ Array 自动渲染

### Phase 3：高级功能（按需）
7. 🔄 Watch 回调
8. 🔄 行内编辑
9. 🔄 HTML 渲染

---

**文档版本：** 1.0  
**作者：** AI Assistant  
**最后更新：** 2024-11-13

