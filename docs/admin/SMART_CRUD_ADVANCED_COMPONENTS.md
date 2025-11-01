# Smart CRUD - 高级组件 (v1.3.0)

> **参考**: [vk-unicloud 内置组件](https://vkdoc.fsq.pub/admin/)

## 🎉 新增 4 个中优先级组件

在 v1.3.0 中，我们新增了 4 个高级组件，使字段类型总数达到 **26 个**，覆盖率达到 **90%**！

---

## 📋 组件列表

### 1. json - JSON 编辑器 📝

用于编辑 JSON 格式数据，支持验证。

#### 基础用法

```javascript
{
  key: 'config',
  title: 'Configuration',
  type: 'json',
  form: {
    required: true,
  },
}
```

#### 表格显示

在表格中显示为代码片段（截断）：

```javascript
{
  key: 'metadata',
  title: 'Metadata',
  type: 'json',
  table: {
    width: 200,
  },
}
```

#### 详情显示

在详情中格式化显示：

```javascript
// 自动格式化为带缩进的 JSON
{
  "name": "Product",
  "price": 99.99,
  "tags": ["new", "hot"]
}
```

#### 完整示例

```javascript
{
  key: 'apiResponse',
  title: 'API Response',
  type: 'json',
  table: {
    width: 250,
  },
  form: {
    required: true,
    placeholder: 'Enter JSON data',
  },
  tips: 'Enter valid JSON format',
}
```

---

### 2. array - 动态数组 📋

用于输入数组数据（简化版：每行一个值）。

#### 基础用法

```javascript
{
  key: 'tags',
  title: 'Tags',
  type: 'array',
  form: {
    placeholder: 'Enter one tag per line',
  },
}
```

#### 表格显示

在表格中显示为标签列表：

```javascript
{
  key: 'categories',
  title: 'Categories',
  type: 'array',
  table: {
    width: 200,
  },
}
```

#### 数据转换

```javascript
// 输入（字符串）:
frontend
backend
mobile

// 保存（数组）:
['frontend', 'backend', 'mobile']

// 表格显示:
[frontend] [backend] [mobile]
```

#### 完整示例

```javascript
{
  key: 'skills',
  title: 'Skills',
  type: 'array',
  table: {
    width: 250,
  },
  form: {
    placeholder: 'Enter one skill per line',
    required: true,
  },
  tips: 'Enter skills, one per line',
}
```

---

### 3. tree-select - 树形选择 🌳

用于多级树形结构选择（如部门、分类等）。

#### 基础用法

```javascript
{
  key: 'department',
  title: 'Department',
  type: 'tree-select',
  data: [
    {
      value: 'engineering',
      title: 'Engineering',
      children: [
        { value: 'frontend', title: 'Frontend' },
        { value: 'backend', title: 'Backend' },
      ],
    },
    {
      value: 'marketing',
      title: 'Marketing',
      children: [
        { value: 'seo', title: 'SEO' },
        { value: 'content', title: 'Content' },
      ],
    },
  ],
}
```

#### 多选模式

```javascript
{
  key: 'permissions',
  title: 'Permissions',
  type: 'tree-select',
  form: {
    multiple: true,
    treeCheckable: true,
    treeData: permissionTree,
  },
}
```

#### 表格显示

在表格中显示选中的值：

```javascript
// 单选: "Frontend"
// 多选: "Frontend, Backend, SEO"
```

#### 完整示例

```javascript
{
  key: 'organizationUnit',
  title: 'Organization Unit',
  type: 'tree-select',
  table: {
    width: 200,
  },
  form: {
    treeData: orgTree,
    multiple: false,
    showSearch: true,
    required: true,
  },
  search: {
    enabled: true,
    treeData: orgTree,
  },
  tips: 'Select your organization unit',
}
```

---

### 4. icon - 图标选择器 ✨

用于选择图标（预定义 25 个常用 Ant Design 图标）。

#### 基础用法

```javascript
{
  key: 'menuIcon',
  title: 'Menu Icon',
  type: 'icon',
}
```

#### 预定义图标列表

- HomeOutlined
- UserOutlined
- SettingOutlined
- SearchOutlined
- PlusOutlined
- EditOutlined
- DeleteOutlined
- CheckOutlined
- CloseOutlined
- HeartOutlined
- StarOutlined
- LikeOutlined
- MessageOutlined
- NotificationOutlined
- BellOutlined
- ShoppingCartOutlined
- FileOutlined
- FolderOutlined
- MailOutlined
- PhoneOutlined
- PictureOutlined
- CameraOutlined
- CloudOutlined
- DownloadOutlined
- UploadOutlined

#### 自定义图标列表

```javascript
{
  key: 'icon',
  title: 'Icon',
  type: 'icon',
  form: {
    icons: [
      'DashboardOutlined',
      'TeamOutlined',
      'ProjectOutlined',
      'BarChartOutlined',
    ],
  },
}
```

#### 或使用 data 属性

```javascript
{
  key: 'icon',
  title: 'Icon',
  type: 'icon',
  data: ['HomeOutlined', 'UserOutlined', 'SettingOutlined'],
}
```

#### 表格显示

在表格中显示图标+名称：

```javascript
// 🏠 HomeOutlined
```

#### 完整示例

```javascript
{
  key: 'moduleIcon',
  title: 'Module Icon',
  type: 'icon',
  table: {
    width: 150,
  },
  form: {
    required: true,
  },
  tips: 'Select an icon for this module',
}
```

---

## 🎯 实际应用示例

### 示例 1：API 配置表单

```javascript
const fieldsConfig = [
  {
    key: 'name',
    title: 'API Name',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'endpoint',
    title: 'Endpoint',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'headers',
    title: 'Headers',
    type: 'json',
    form: {
      placeholder: '{"Content-Type": "application/json"}',
    },
    tips: 'Enter HTTP headers in JSON format',
  },
  {
    key: 'allowedMethods',
    title: 'Allowed Methods',
    type: 'array',
    form: {
      placeholder: 'GET\nPOST\nPUT\nDELETE',
    },
  },
];
```

### 示例 2：组织架构表单

```javascript
const fieldsConfig = [
  {
    key: 'name',
    title: 'Employee Name',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'department',
    title: 'Department',
    type: 'tree-select',
    form: {
      treeData: [
        {
          value: 'engineering',
          title: 'Engineering',
          children: [
            { value: 'frontend', title: 'Frontend Team' },
            { value: 'backend', title: 'Backend Team' },
            { value: 'mobile', title: 'Mobile Team' },
          ],
        },
        {
          value: 'product',
          title: 'Product',
          children: [
            { value: 'design', title: 'Design Team' },
            { value: 'pm', title: 'Product Management' },
          ],
        },
      ],
      required: true,
    },
  },
  {
    key: 'skills',
    title: 'Skills',
    type: 'array',
    form: {
      placeholder: 'Enter skills, one per line',
    },
  },
];
```

### 示例 3：菜单配置表单

```javascript
const fieldsConfig = [
  {
    key: 'name',
    title: 'Menu Name',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'icon',
    title: 'Icon',
    type: 'icon',
    form: { required: true },
  },
  {
    key: 'route',
    title: 'Route',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'parent',
    title: 'Parent Menu',
    type: 'tree-select',
    form: {
      treeData: existingMenus,
    },
  },
  {
    key: 'permissions',
    title: 'Permissions',
    type: 'tree-select',
    form: {
      multiple: true,
      treeCheckable: true,
      treeData: permissionTree,
    },
  },
];
```

---

## 📊 完整字段类型总览

### 现在支持的 26 种类型

#### 基础输入（6 个）
1. ✅ text
2. ✅ textarea
3. ✅ richtext
4. ✅ number
5. ✅ money
6. ✅ percent

#### 选择类（4 个）
7. ✅ select
8. ✅ radio
9. ✅ checkbox
10. ✅ switch

#### 日期时间（4 个）
11. ✅ date
12. ✅ datetime
13. ✅ daterange
14. ✅ time

#### 上传类（3 个）
15. ✅ image
16. ✅ avatar
17. ✅ file

#### 高级类（9 个）
18. ✅ tag
19. ✅ password
20. ✅ rate
21. ✅ slider
22. ✅ color
23. ✅ cascader
24. ✅ **json** 🆕
25. ✅ **array** 🆕
26. ✅ **tree-select** 🆕
27. ✅ **icon** 🆕

---

## 🔄 与 vk-unicloud 最终对比

| 类别 | vk (29) | 我们 (26) | 完成度 |
|------|---------|----------|--------|
| 基础输入 | 6 | 6 | ✅ 100% |
| 选择类 | 7 | 6 | 🟢 86% |
| 日期时间 | 2 | 4 | ✅ 200% |
| 上传类 | 3 | 3 | ✅ 100% |
| 高级类 | 11 | 7 | 🟢 64% |
| **总计** | **29** | **26** | **🎉 90%** |

### 还未实现的组件（3 个）

#### 选择类（1 个）
- ❌ remote-select - 远程搜索下拉（需要异步数据源）

#### 高级类（2 个）
- ❌ map - 地图选址（需要地图 SDK）
- ❌ address - 地址选择（与 cascader 类似）

**注**: 这 3 个组件因为需要额外的依赖或与现有组件重复，暂不实现。

---

## 💡 使用技巧

### 1. JSON 编辑器

**推荐场景**:
- API 配置
- 元数据编辑
- 动态配置

**注意事项**:
- 会自动验证 JSON 格式
- 详情页自动格式化显示
- 支持嵌套对象和数组

### 2. 动态数组

**推荐场景**:
- 标签列表
- 技能列表
- 关键词列表

**注意事项**:
- 简化版：每行一个值
- 自动过滤空行
- 转换为数组存储

### 3. 树形选择

**推荐场景**:
- 部门选择
- 分类选择
- 权限选择

**注意事项**:
- 支持单选和多选
- 支持可勾选模式
- 自动展开所有节点

### 4. 图标选择器

**推荐场景**:
- 菜单图标
- 模块图标
- 功能图标

**注意事项**:
- 简化版：预定义图标列表
- 可自定义图标列表
- 表格自动渲染图标

---

## 🚀 快速开始

### 1. 直接使用

```javascript
const fieldsConfig = [
  { key: 'config', type: 'json' },
  { key: 'tags', type: 'array' },
  { key: 'department', type: 'tree-select', data: treeData },
  { key: 'icon', type: 'icon' },
];
```

### 2. 查看完整文档

- [Smart CRUD 使用指南](./SMART_CRUD.md)
- [新增组件 (v1.2.0)](./SMART_CRUD_NEW_COMPONENTS.md)
- [VK 特性](./SMART_CRUD_VK_FEATURES.md)

---

## 📝 更新日志

**版本**: v1.3.0  
**日期**: 2025-11-01  
**新增**: 4 个中优先级组件  
**总计**: 26 种字段类型  
**覆盖率**: 90% (vs vk-unicloud)

---

## 🎊 里程碑

- ✅ v1.0.0 - 基础 CRUD 系统（16 种类型）
- ✅ v1.1.0 - VK 特性支持（showRule, disabled, watch, tips, clearable）
- ✅ v1.2.0 - 6 个高优先级组件（rate, slider, color, file, time, cascader）
- ✅ v1.3.0 - 4 个中优先级组件（json, array, tree-select, icon）
- 🎉 **覆盖率达到 90%！**

---

**状态**: ✅ 生产就绪  
**推荐**: 可以应用于实际项目 🚀

