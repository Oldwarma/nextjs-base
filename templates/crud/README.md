# SmartCrudPage 模板使用指南

> 基于 Permissions、Roles、Menus、Users 四个页面重构的最新模板

---

## 🎯 核心理念

### 1. 两个文件，完整功能

```
app/(admin)/
├── admin/{resource}/
│   └── page.js                    # 前端页面 + fieldsConfig
└── actions/rbac/
    └── crud-action.{resource}.js  # Server Actions + 配置
```

**不再需要**单独的 config 文件！

### 2. 配置驱动 + 类型驱动

- **配置驱动**: 一份 `fieldsConfig` 应用于 Table、Form、Search、Detail
- **类型驱动**: 通过 `type` 字段自动渲染组件（参考 vk-unicloud）

---

## 🚀 快速开始

### 步骤 1: 复制模板文件

```bash
# 1. 复制 Page 模板
cp templates/crud/page.template.js app/(admin)/admin/{resource}/page.js

# 2. 复制 Action 模板
cp templates/crud/action.template.js app/(admin)/actions/rbac/crud-action.{resource}.js
```

### 步骤 2: 批量替换变量

在你的编辑器中，批量替换以下变量：

| 变量 | 说明 | 示例 |
|------|------|------|
| `{RESOURCE_NAME}` | 资源名(小写单数) | `coupon` |
| `{RESOURCE_LABEL}` | 资源标签(首字母大写) | `Coupon` |
| `{COLLECTION_NAME}` | MongoDB 集合名(小写复数) | `coupons` |

**快捷替换命令**（macOS/Linux）：

```bash
# 在文件中替换
sed -i '' 's/{RESOURCE_NAME}/coupon/g' page.js
sed -i '' 's/{RESOURCE_LABEL}/Coupon/g' page.js
sed -i '' 's/{COLLECTION_NAME}/coupons/g' crud-action.coupon.js
```

### 步骤 3: 配置字段

在 `page.js` 中，修改 `fieldsConfig` 数组，定义你的字段。

---

## 📋 fieldsConfig 配置详解

### 基础结构

```javascript
const fieldsConfig = [
  {
    key: 'fieldName',        // 字段名（必需）
    title: 'Field Label',    // 显示标签（必需）
    type: 'text',            // 字段类型（必需）
    
    // 表格配置
    table: {
      width: 150,
      sorter: true,
      copyable: true,
    },
    
    // 表单配置
    form: {
      required: true,
      placeholder: 'Enter value',
    },
    
    // 搜索配置
    search: {
      enabled: true,
      mode: 'like',
    },
    
    // 详情配置
    detail: {
      render: (value) => value,
    },
  },
];
```

### 支持的字段类型

#### 1. 文本类型

```javascript
{ type: 'text' }       // 单行文本
{ type: 'textarea' }   // 多行文本
{ type: 'password' }   // 密码
```

#### 2. 数字类型

```javascript
{ type: 'number' }     // 数字输入
```

#### 3. 选择类型

```javascript
{
  type: 'select',
  options: [
    { label: 'Option 1', value: '1', color: 'blue' },
    { label: 'Option 2', value: '2', color: 'green' },
  ],
}

{ type: 'radio' }      // 单选
```

#### 4. 树形选择

```javascript
{
  type: 'tree-select',
  form: {
    action: getResourceTreeForSelectAction, // 动态加载树形数据
  },
}
```

#### 5. 日期类型

```javascript
{ type: 'date' }       // 日期
{ type: 'datetime' }   // 日期时间
{ type: 'dateRange' }  // 日期范围
```

#### 6. 布尔类型

```javascript
{
  type: 'switch',
  table: {
    trueText: 'Enabled',
    falseText: 'Disabled',
  },
}
```

#### 7. 数组类型

```javascript
{
  type: 'array',
  form: {
    placeholder: 'Enter item',
    addButtonText: 'Add Item',
  },
}
```

#### 8. 其他类型

```javascript
{ type: 'image' }      // 图片
{ type: 'upload' }     // 文件上传
{ type: 'json' }       // JSON 编辑器
{ type: 'markdown' }   // Markdown 编辑器
```

---

## 🎨 配置示例

### 1. 基础 CRUD 页面

```javascript
const fieldsConfig = [
  {
    key: 'name',
    title: 'Name',
    type: 'text',
    table: { width: 200, sorter: true },
    form: { required: true },
    search: { enabled: true, mode: 'like' },
  },
  {
    key: 'status',
    title: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active', color: 'green' },
      { label: 'Inactive', value: 'inactive', color: 'red' },
    ],
    table: { width: 100 },
    form: { required: true },
    search: { enabled: true, mode: 'exact' },
  },
];
```

### 2. 树形结构页面

```javascript
const fieldsConfig = [
  {
    key: 'parent_id',
    title: 'Parent',
    type: 'tree-select',
    table: false,
    form: {
      action: getResourceTreeForSelectAction,
      placeholder: 'Select parent',
    },
  },
  // ... 其他字段
];
```

### 3. 自定义渲染

```javascript
{
  key: 'avatar',
  title: 'Avatar',
  type: 'image',
  table: {
    width: 80,
    render: (url, record) => (
      <Avatar src={url} size={40}>
        {record.name?.[0]}
      </Avatar>
    ),
  },
}
```

---

## 🔧 高级配置

### 1. 动态选项加载

```javascript
const [options, setOptions] = useState([]);

useEffect(() => {
  loadOptions();
}, []);

const fieldsConfig = useMemo(() => [
  {
    key: 'category',
    type: 'select',
    options: options, // 动态选项
  },
], [options]);
```

### 2. 条件显示字段

```javascript
{
  key: 'customField',
  title: 'Custom Field',
  type: 'text',
  form: {
    showRule: (formData) => formData.type === 'custom',
  },
}
```

### 3. 自定义操作

```javascript
const customRowActions = [
  {
    key: 'activate',
    text: 'Activate',
    onClick: async (record) => {
      await activateAction(record.id);
    },
  },
];

<SmartCrudPage
  customRowActions={customRowActions}
  // ...
/>
```

### 4. 树形表格

```javascript
<SmartCrudPage
  expandable={{
    defaultExpandAllRows: true,
    childrenColumnName: 'children',
  }}
  // ...
/>
```

---

## 📚 完整示例

### 示例 1: Permissions 页面

参考：`app/(admin)/admin/rbac/permissions/page.js`

**特点**：
- 树形结构
- 父级选择
- 动作数组字段

### 示例 2: Roles 页面

参考：`app/(admin)/admin/rbac/roles/page.js`

**特点**：
- 自定义操作（分配权限/菜单）
- 树形模态框
- 多选数据

### 示例 3: Menus 页面

参考：`app/(admin)/admin/rbac/menus/page.js`

**特点**：
- 树形表格
- 图标选择
- URL 配置

### 示例 4: Users 页面

参考：`app/(admin)/admin/rbac/users/page.js`

**特点**：
- Better Auth 集成
- 自定义创建模态框
- 角色绑定
- 密码重置
- 用户封禁

---

## 🎯 最佳实践

### 1. 文件命名

```
✅ 推荐
page.js
crud-action.permission.js
crud-action.role.js

❌ 不推荐
permissions-page.js
admin-permissions.js
permission-crud.config.js (不需要单独的 config)
```

### 2. 字段顺序

```javascript
const fieldsConfig = [
  // 1. 隐藏字段（ID）
  { key: 'id', table: false, form: false },
  
  // 2. 主要字段（名称、编码）
  { key: 'name' },
  { key: 'code' },
  
  // 3. 状态字段
  { key: 'enable' },
  { key: 'status' },
  
  // 4. 描述字段
  { key: 'description' },
  { key: 'remark' },
  
  // 5. 时间字段
  { key: 'createdAt' },
  { key: 'updatedAt' },
];
```

### 3. rowKey 配置

```javascript
// ✅ 正确：使用字符串
<SmartCrudPage rowKey='id' />

// ❌ 错误：不要使用函数
<SmartCrudPage rowKey={(record) => record.id} />
```

### 4. Actions 命名

```javascript
// ✅ 统一命名规范
export const getResourceListAction = ...;
export const getResourceDetailAction = ...;
export const createResourceAction = ...;
export const updateResourceAction = ...;
export const deleteResourceAction = ...;
```

### 5. 搜索模式

```javascript
search: {
  mode: 'like',   // 模糊搜索（文本）
  mode: 'exact',  // 精确搜索（状态、布尔值）
  mode: 'in',     // 数组包含（多选）
}
```

---

## 🐛 常见问题

### 1. 删除时提示 "ID is required"

**原因**: `rowKey` 配置错误

```javascript
// ❌ 错误
rowKey={(record) => record.id}

// ✅ 正确
rowKey='id'
```

### 2. 搜索时报错 "$regex has to be a string"

**原因**: DAO 层重复包装 `$regex`

**解决**: 在 DAO 中检查是否已经是对象：

```javascript
if (filters.name) {
  query.name = typeof filters.name === 'object' 
    ? filters.name 
    : { $regex: filters.name, $options: 'i' };
}
```

### 3. TreeSelect 警告 "value is invalidate: undefined"

**原因**: Root 节点的 `value` 是 `null` 或 `undefined`

**解决**: 使用空字符串：

```javascript
const treeData = [
  { title: '--- Root ---', value: '', key: '' }, // ✅ 使用空字符串
  ...otherNodes,
];
```

### 4. Select 没有 placeholder

**原因**: `placeholder` 放在了顶层 props

**解决**: 放在 `fieldProps` 中：

```javascript
form: {
  placeholder: 'Select option', // ❌ 无效
  fieldProps: {
    placeholder: 'Select option', // ✅ 有效
  },
}
```

---

## 📖 相关文档

- [SmartCrudPage 完整指南](../../docs/SMART_CRUD_COMPLETE_GUIDE.md)
- [字段类型参考](../../lib/crud/field-types.js)
- [CRUD Helper 文档](../../lib/crud/crud-helper.js)

---

## ✨ 总结

使用 SmartCrudPage 模板的优势：

- 🚀 **快速开发** - 2 个文件，10 分钟完成
- 📦 **代码复用** - 减少 50-60% 代码量
- 🎯 **统一规范** - 所有页面结构一致
- 🔧 **易于维护** - 配置集中，修改方便
- ⚡ **类型驱动** - 自动渲染，开箱即用

**开始使用模板，提升 10 倍开发效率！** 🎉
