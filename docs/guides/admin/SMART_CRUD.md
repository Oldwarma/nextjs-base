# SmartCrudPage 指南

<div align="center">

**万能表格组件详细使用指南**

[快速开始](#-快速开始) · [fieldsConfig](#-fieldsconfig-配置) · [高级功能](#-高级功能)

</div>

---

## 🎯 概述

`SmartCrudPage` 是 NextJS Base 的核心组件，通过配置驱动实现完整的 CRUD 功能。

### 核心特点

| 特点 | 说明 |
|:---|:---|
| **配置驱动** | 一份 `fieldsConfig` 配置驱动表格、表单、搜索、详情 |
| **零样板代码** | 无需编写重复的表格列、表单字段定义 |
| **自动化** | 自动处理分页、排序、搜索、CRUD 操作 |
| **可扩展** | 支持自定义渲染、自定义操作、Hooks |

### 功能一览

- ✅ 数据列表（分页、排序、筛选）
- ✅ 高级搜索（多种搜索模式）
- ✅ 新增记录（表单自动生成）
- ✅ 编辑记录（表单自动回填）
- ✅ 删除记录（确认弹窗）
- ✅ 批量操作（批量删除、批量更新）
- ✅ 查看详情（抽屉展示）
- ✅ 树形表格（支持层级数据）
- ✅ 自定义操作按钮

---

## 🚀 快速开始

### 基础用法

```javascript
'use client'

import SmartCrudPage from '@/components/admin/smart-crud-page'
import * as actions from '@/app/(admin)/actions/xxx/crud-action.xxx'

export default function ExamplePage() {
  const fieldsConfig = [
    {
      key: 'id',
      title: 'ID',
      type: 'text',
      table: { width: 80 },
      form: { hidden: true },
    },
    {
      key: 'name',
      title: '名称',
      type: 'text',
      table: { width: 200 },
      form: { required: true },
      search: { enabled: true },
    },
    // ...更多字段
  ]

  return (
    <SmartCrudPage
      title="示例管理"
      fieldsConfig={fieldsConfig}
      actions={{
        getList: actions.getListAction,
        getDetail: actions.getDetailAction,
        create: actions.createAction,
        update: actions.updateAction,
        delete: actions.deleteAction,
      }}
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
      enableDetail={true}
    />
  )
}
```

---

## 📋 fieldsConfig 配置

### 基础结构

```javascript
{
  key: 'fieldName',      // 字段名（必填）
  title: '显示名称',      // 显示标题（必填）
  type: 'text',          // 字段类型（必填）
  options: [],           // 选项（select/tree-select 类型需要）
  table: { ... },        // 表格配置
  form: { ... },         // 表单配置
  search: { ... },       // 搜索配置
}
```

### 支持的字段类型

| 类型 | 说明 | 表格渲染 | 表单组件 |
|:---|:---|:---|:---|
| `text` | 文本 | 文本 | Input |
| `textarea` | 多行文本 | 文本（可省略） | TextArea |
| `number` | 数字 | 数字 | InputNumber |
| `select` | 下拉选择 | 标签 | Select |
| `switch` | 开关 | 开关/标签 | Switch |
| `date` | 日期 | 格式化日期 | DatePicker |
| `datetime` | 日期时间 | 格式化时间 | DateTimePicker |
| `tree-select` | 树形选择 | 文本 | TreeSelect |
| `icon` | 图标 | 图标 | IconPicker |
| `image` | 图片 | 图片预览 | ImageUpload |
| `images` | 多图 | 图片列表 | MultiImageUpload |
| `markdown` | Markdown | 预览 | MarkdownEditor |
| `json` | JSON | 格式化 | JsonEditor |

### 表格配置 (table)

```javascript
{
  key: 'name',
  title: '名称',
  type: 'text',
  table: {
    // 基础配置
    width: 200,              // 列宽
    fixed: 'left',           // 固定列 ('left' | 'right')
    hidden: false,           // 是否隐藏
    
    // 显示配置
    ellipsis: true,          // 超长省略
    copyable: true,          // 可复制
    
    // 排序
    sorter: true,            // 启用排序
    defaultSortOrder: 'desc',// 默认排序
    
    // 自定义渲染
    render: (value, record) => {
      return <span style={{ color: 'red' }}>{value}</span>
    },
    
    // 值映射（用于状态显示）
    valueEnum: {
      active: { text: '启用', status: 'Success' },
      inactive: { text: '禁用', status: 'Error' },
    },
  },
}
```

### 表单配置 (form)

```javascript
{
  key: 'name',
  title: '名称',
  type: 'text',
  form: {
    // 基础配置
    hidden: false,           // 是否隐藏
    disabled: false,         // 是否禁用
    readonly: false,         // 是否只读
    
    // 验证
    required: true,          // 是否必填
    rules: [                 // 自定义验证规则
      { max: 100, message: '最多 100 个字符' },
      { pattern: /^[a-z]+$/, message: '只能输入小写字母' },
    ],
    
    // 默认值
    defaultValue: '',
    
    // 输入提示
    placeholder: '请输入名称',
    
    // 帮助文本
    tooltip: '这是一个帮助提示',
    extra: '这是额外说明文字',
    
    // 特定类型配置
    rows: 4,                 // textarea 行数
    min: 0,                  // number 最小值
    max: 100,                // number 最大值
    step: 1,                 // number 步长
    precision: 2,            // number 精度
    
    // 布局
    colSpan: 24,             // 列宽（1-24）
  },
}
```

### 搜索配置 (search)

```javascript
{
  key: 'name',
  title: '名称',
  type: 'text',
  search: {
    enabled: true,           // 启用搜索
    mode: 'like',            // 搜索模式
    placeholder: '搜索名称', // 占位符
    defaultValue: '',        // 默认值
  },
}
```

### 搜索模式

| 模式 | 说明 | 适用场景 |
|:---|:---|:---|
| `like` | 模糊匹配 | 文本搜索 |
| `exact` | 精确匹配 | 状态、类型筛选 |
| `in` | 多选匹配 | 多选下拉 |
| `range` | 范围匹配 | 日期、数字范围 |

---

## 🎨 高级功能

### 自定义行操作

```javascript
const customRowActions = [
  {
    key: 'publish',
    label: '发布',
    icon: <SendOutlined />,
    onClick: async (record) => {
      await publishAction(record.id)
      message.success('发布成功')
    },
    // 显示条件
    showCondition: (record) => record.status === 'draft',
    // 确认弹窗
    confirm: {
      title: '确认发布？',
      content: '发布后将对外可见',
    },
  },
  {
    key: 'duplicate',
    label: '复制',
    onClick: async (record) => {
      await duplicateAction(record.id)
    },
    // 放入"更多"下拉菜单
    inMore: true,
  },
]

<SmartCrudPage
  customRowActions={customRowActions}
  // ...
/>
```

### 工具栏扩展

```javascript
const toolbarExtra = (
  <>
    <Button onClick={handleExport}>导出数据</Button>
    <Button onClick={handleImport}>导入数据</Button>
  </>
)

<SmartCrudPage
  toolbarExtra={toolbarExtra}
  // ...
/>
```

### 批量操作

```javascript
<SmartCrudPage
  enableBatchDelete={true}
  batchActions={[
    {
      key: 'enable',
      label: '批量启用',
      onClick: async (selectedRows) => {
        await batchEnableAction(selectedRows.map(r => r.id))
      },
    },
    {
      key: 'disable',
      label: '批量禁用',
      onClick: async (selectedRows) => {
        await batchDisableAction(selectedRows.map(r => r.id))
      },
    },
  ]}
  // ...
/>
```

### 树形表格

```javascript
// 数据需要有 parentId 字段
const fieldsConfig = [
  {
    key: 'name',
    title: '名称',
    type: 'text',
  },
  {
    key: 'parentId',
    title: '父级',
    type: 'tree-select',
    form: {
      // 动态加载选项
      request: async () => {
        const res = await getTreeAction()
        return res.data
      },
    },
  },
]

// SmartCrudPage 会自动检测 parentId 并渲染为树形表格
<SmartCrudPage
  fieldsConfig={fieldsConfig}
  // ...
/>
```

### 动态选项

```javascript
{
  key: 'categoryId',
  title: '分类',
  type: 'select',
  options: async () => {
    // 动态加载选项
    const res = await getCategoryListAction()
    return res.data.map(item => ({
      label: item.name,
      value: item.id,
    }))
  },
}
```

### 字段联动

```javascript
{
  key: 'type',
  title: '类型',
  type: 'select',
  options: [
    { label: '固定金额', value: 'fixed' },
    { label: '百分比', value: 'percent' },
  ],
},
{
  key: 'value',
  title: '数值',
  type: 'number',
  form: {
    // 根据 type 字段动态显示
    dependencies: ['type'],
    visible: (values) => values.type !== undefined,
    // 动态配置
    fieldProps: (values) => ({
      suffix: values.type === 'percent' ? '%' : '元',
      max: values.type === 'percent' ? 100 : undefined,
    }),
  },
}
```

---

## 📊 Props 参考

### SmartCrudPage Props

| 属性 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `title` | `string` | ✅ | 页面标题 |
| `fieldsConfig` | `FieldConfig[]` | ✅ | 字段配置数组 |
| `actions` | `Actions` | ✅ | Server Actions 对象 |
| `enableCreate` | `boolean` | | 启用创建，默认 `true` |
| `enableEdit` | `boolean` | | 启用编辑，默认 `true` |
| `enableDelete` | `boolean` | | 启用删除，默认 `true` |
| `enableDetail` | `boolean` | | 启用详情，默认 `true` |
| `enableBatchDelete` | `boolean` | | 启用批量删除 |
| `customRowActions` | `RowAction[]` | | 自定义行操作 |
| `batchActions` | `BatchAction[]` | | 批量操作 |
| `toolbarExtra` | `ReactNode` | | 工具栏扩展 |
| `tableProps` | `object` | | ProTable 额外属性 |
| `formProps` | `object` | | 表单额外属性 |

### Actions 对象

```typescript
interface Actions {
  getList: (params) => Promise<Result>
  getDetail?: (id) => Promise<Result>
  create?: (data) => Promise<Result>
  update?: (id, data) => Promise<Result>
  delete?: (id) => Promise<Result>
  batchDelete?: (ids) => Promise<Result>
}
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [fieldsConfig 详解](../../api/FIELDS_CONFIG.md) | 字段配置完整 API |
| [SmartForm 指南](./SMART_FORM.md) | 万能表单组件 |
| [Server Actions 开发](./SERVER_ACTIONS.md) | Actions 开发指南 |
| [完整示例](../../../templates/crud/EXAMPLE.md) | 从零创建 CRUD 页面 |

---

<div align="center">

[← Prisma 指南](../database/PRISMA_GUIDE.md) · [SmartForm 指南 →](./SMART_FORM.md)

</div>

