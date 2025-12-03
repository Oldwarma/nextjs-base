# fieldsConfig 配置详解

<div align="center">

**SmartCrudPage 和 SmartForm 的字段配置完整 API**

</div>

---

## 🎯 概述

`fieldsConfig` 是 NextJS Base 的核心配置，一份配置驱动表格、表单、搜索、详情四个场景。

---

## 📋 基础结构

```typescript
interface FieldConfig {
  key: string           // 字段名（必填）
  title: string         // 显示标题（必填）
  type: FieldType       // 字段类型（必填）
  options?: Option[] | (() => Promise<Option[]>)  // 选项
  table?: TableConfig   // 表格配置
  form?: FormConfig     // 表单配置
  search?: SearchConfig // 搜索配置
}
```

---

## 🔤 字段类型 (type)

| 类型 | 说明 | 表格 | 表单 | 搜索 |
|:---|:---|:---:|:---:|:---:|
| `text` | 单行文本 | ✅ | Input | ✅ |
| `textarea` | 多行文本 | ✅ | TextArea | ✅ |
| `number` | 数字 | ✅ | InputNumber | ✅ |
| `select` | 下拉选择 | ✅ | Select | ✅ |
| `switch` | 开关 | ✅ | Switch | ✅ |
| `date` | 日期 | ✅ | DatePicker | ✅ |
| `datetime` | 日期时间 | ✅ | DateTimePicker | ✅ |
| `tree-select` | 树形选择 | ✅ | TreeSelect | ✅ |
| `icon` | 图标 | ✅ | IconPicker | ❌ |
| `image` | 单图 | ✅ | ImageUpload | ❌ |
| `images` | 多图 | ✅ | MultiImageUpload | ❌ |
| `markdown` | Markdown | ✅ | MarkdownEditor | ❌ |
| `json` | JSON | ✅ | JsonEditor | ❌ |

---

## 📊 表格配置 (table)

```typescript
interface TableConfig {
  // 显示控制
  width?: number              // 列宽
  fixed?: 'left' | 'right'    // 固定列
  hidden?: boolean            // 是否隐藏
  
  // 文本显示
  ellipsis?: boolean          // 超长省略
  copyable?: boolean          // 可复制
  
  // 排序
  sorter?: boolean            // 启用排序
  defaultSortOrder?: 'ascend' | 'descend'  // 默认排序
  
  // 自定义渲染
  render?: (value: any, record: any, index: number) => ReactNode
  
  // 值映射（用于状态显示）
  valueEnum?: Record<string, {
    text: string
    status?: 'Success' | 'Error' | 'Processing' | 'Warning' | 'Default'
    color?: string
  }>
}
```

### 示例

```javascript
// 基础配置
{
  key: 'name',
  title: '名称',
  type: 'text',
  table: {
    width: 200,
    ellipsis: true,
    copyable: true,
  },
}

// 固定列
{
  key: 'id',
  title: 'ID',
  type: 'text',
  table: {
    width: 80,
    fixed: 'left',
  },
}

// 排序
{
  key: 'createdAt',
  title: '创建时间',
  type: 'datetime',
  table: {
    width: 180,
    sorter: true,
    defaultSortOrder: 'descend',
  },
}

// 状态映射
{
  key: 'status',
  title: '状态',
  type: 'select',
  table: {
    width: 100,
    valueEnum: {
      active: { text: '启用', status: 'Success' },
      inactive: { text: '禁用', status: 'Error' },
      pending: { text: '待审核', status: 'Processing' },
    },
  },
}

// 自定义渲染
{
  key: 'price',
  title: '价格',
  type: 'number',
  table: {
    width: 120,
    render: (value) => `¥${value?.toFixed(2) || '0.00'}`,
  },
}

// 隐藏列
{
  key: 'remark',
  title: '备注',
  type: 'textarea',
  table: {
    hidden: true,  // 表格中不显示
  },
}
```

---

## 📝 表单配置 (form)

```typescript
interface FormConfig {
  // 显示控制
  hidden?: boolean            // 是否隐藏
  disabled?: boolean          // 是否禁用
  readonly?: boolean          // 是否只读
  
  // 验证
  required?: boolean          // 是否必填
  rules?: Rule[]              // 验证规则
  
  // 默认值
  defaultValue?: any
  
  // 输入提示
  placeholder?: string
  tooltip?: string            // 帮助图标提示
  extra?: string              // 额外说明文字
  
  // 布局
  colSpan?: number            // 列宽 (1-24)
  
  // 字段联动
  dependencies?: string[]     // 依赖字段
  visible?: (form: FormInstance) => boolean  // 动态显示
  fieldProps?: (form: FormInstance) => object  // 动态属性
  
  // 特定类型配置
  rows?: number               // textarea 行数
  min?: number                // number 最小值
  max?: number                // number 最大值
  step?: number               // number 步长
  precision?: number          // number 精度
  prefix?: string             // 前缀
  suffix?: string             // 后缀
  maxCount?: number           // 图片最大数量
  accept?: string             // 文件类型
  maxSize?: number            // 文件大小限制 (MB)
}
```

### 示例

```javascript
// 必填文本
{
  key: 'name',
  title: '名称',
  type: 'text',
  form: {
    required: true,
    placeholder: '请输入名称',
    rules: [
      { min: 2, message: '至少 2 个字符' },
      { max: 50, message: '最多 50 个字符' },
    ],
  },
}

// 数字输入
{
  key: 'price',
  title: '价格',
  type: 'number',
  form: {
    required: true,
    min: 0,
    max: 99999,
    precision: 2,
    prefix: '¥',
    placeholder: '请输入价格',
  },
}

// 多行文本
{
  key: 'description',
  title: '描述',
  type: 'textarea',
  form: {
    rows: 4,
    maxLength: 500,
    showCount: true,
    placeholder: '请输入描述信息',
  },
}

// 开关
{
  key: 'enable',
  title: '是否启用',
  type: 'switch',
  form: {
    defaultValue: true,
    checkedChildren: '开',
    unCheckedChildren: '关',
  },
}

// 图片上传
{
  key: 'avatar',
  title: '头像',
  type: 'image',
  form: {
    maxCount: 1,
    accept: 'image/*',
    maxSize: 2,
    tip: '支持 jpg、png 格式，最大 2MB',
  },
}

// 字段联动
{
  key: 'discountType',
  title: '优惠类型',
  type: 'select',
  options: [
    { label: '固定金额', value: 'fixed' },
    { label: '百分比', value: 'percent' },
  ],
},
{
  key: 'discountValue',
  title: '优惠值',
  type: 'number',
  form: {
    dependencies: ['discountType'],
    fieldProps: (form) => ({
      suffix: form.getFieldValue('discountType') === 'percent' ? '%' : '元',
      max: form.getFieldValue('discountType') === 'percent' ? 100 : undefined,
    }),
  },
}

// 条件显示
{
  key: 'reason',
  title: '拒绝原因',
  type: 'textarea',
  form: {
    dependencies: ['status'],
    visible: (form) => form.getFieldValue('status') === 'rejected',
    required: (form) => form.getFieldValue('status') === 'rejected',
  },
}

// 隐藏字段
{
  key: 'id',
  title: 'ID',
  type: 'text',
  form: {
    hidden: true,
  },
}
```

---

## 🔍 搜索配置 (search)

```typescript
interface SearchConfig {
  enabled?: boolean           // 是否启用搜索
  mode?: 'like' | 'exact' | 'in' | 'range'  // 搜索模式
  placeholder?: string        // 占位符
  defaultValue?: any          // 默认值
}
```

### 搜索模式详解

| 模式 | 说明 | 适用类型 | Prisma 转换 |
|:---|:---|:---|:---|
| `like` | 模糊匹配 | text, textarea | `{ contains: value }` |
| `exact` | 精确匹配 | select, switch, number | `value` |
| `in` | 多选匹配 | select (多选) | `{ in: values }` |
| `range` | 范围匹配 | date, datetime, number | `{ gte: start, lte: end }` |

### 示例

```javascript
// 模糊搜索
{
  key: 'title',
  title: '标题',
  type: 'text',
  search: {
    enabled: true,
    mode: 'like',
    placeholder: '搜索标题',
  },
}

// 精确匹配
{
  key: 'status',
  title: '状态',
  type: 'select',
  options: [
    { label: '启用', value: 'active' },
    { label: '禁用', value: 'inactive' },
  ],
  search: {
    enabled: true,
    mode: 'exact',
  },
}

// 多选匹配
{
  key: 'tags',
  title: '标签',
  type: 'select',
  options: [...],
  search: {
    enabled: true,
    mode: 'in',
  },
}

// 日期范围
{
  key: 'createdAt',
  title: '创建时间',
  type: 'datetime',
  search: {
    enabled: true,
    mode: 'range',
  },
}

// 数字范围
{
  key: 'price',
  title: '价格',
  type: 'number',
  search: {
    enabled: true,
    mode: 'range',
  },
}
```

---

## 🎨 选项配置 (options)

### 静态选项

```javascript
{
  key: 'status',
  title: '状态',
  type: 'select',
  options: [
    { label: '启用', value: 'active' },
    { label: '禁用', value: 'inactive' },
  ],
}
```

### 动态选项

```javascript
{
  key: 'categoryId',
  title: '分类',
  type: 'select',
  options: async () => {
    const res = await getCategoryListAction()
    return res.data.map(item => ({
      label: item.name,
      value: item.id,
    }))
  },
}
```

### 树形选项

```javascript
{
  key: 'parentId',
  title: '父级',
  type: 'tree-select',
  options: async () => {
    const res = await getCategoryTreeAction()
    return res.data  // 需要是树形结构
  },
}
```

---

## 📚 完整示例

```javascript
const fieldsConfig = [
  // ID
  {
    key: 'id',
    title: 'ID',
    type: 'text',
    table: { width: 80, fixed: 'left', copyable: true },
    form: { hidden: true },
  },
  
  // 名称
  {
    key: 'name',
    title: '名称',
    type: 'text',
    table: { width: 200, ellipsis: true },
    form: { required: true, placeholder: '请输入名称' },
    search: { enabled: true, mode: 'like' },
  },
  
  // 分类
  {
    key: 'categoryId',
    title: '分类',
    type: 'select',
    options: async () => {
      const res = await getCategoryListAction()
      return res.data.map(item => ({ label: item.name, value: item.id }))
    },
    table: { width: 120 },
    form: { required: true },
    search: { enabled: true, mode: 'exact' },
  },
  
  // 价格
  {
    key: 'price',
    title: '价格',
    type: 'number',
    table: {
      width: 100,
      sorter: true,
      render: (value) => `¥${value?.toFixed(2)}`,
    },
    form: { required: true, min: 0, precision: 2, prefix: '¥' },
    search: { enabled: true, mode: 'range' },
  },
  
  // 状态
  {
    key: 'enable',
    title: '状态',
    type: 'switch',
    table: {
      width: 80,
      render: (value) => value ? '✅ 启用' : '❌ 禁用',
    },
    form: { defaultValue: true },
    search: { enabled: true, mode: 'exact' },
  },
  
  // 备注
  {
    key: 'remark',
    title: '备注',
    type: 'textarea',
    table: { hidden: true },
    form: { rows: 3 },
  },
  
  // 创建时间
  {
    key: 'createdAt',
    title: '创建时间',
    type: 'datetime',
    table: { width: 180, sorter: true },
    form: { hidden: true },
    search: { enabled: true, mode: 'range' },
  },
]
```

---

<div align="center">

[← 返回 API 参考](./README.md)

</div>

