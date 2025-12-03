# SmartForm 指南

<div align="center">

**万能表单组件详细使用指南**

[组件类型](#-组件类型) · [配置详解](#-配置详解) · [高级用法](#-高级用法)

</div>

---

## 🎯 概述

`SmartForm` 系列组件是 NextJS Base 的表单解决方案，基于 `fieldsConfig` 配置自动生成表单。

### 组件类型

| 组件 | 说明 | 使用场景 |
|:---|:---|:---|
| `SmartForm` | 基础表单 | 页面内嵌表单 |
| `SmartModalForm` | 弹窗表单 | 新增/编辑弹窗 |
| `SmartDrawerForm` | 抽屉表单 | 侧边栏表单 |

### 核心特点

- ✅ 配置驱动，自动生成表单字段
- ✅ 自动处理表单验证
- ✅ 支持多种字段类型
- ✅ 支持字段联动
- ✅ 支持异步数据加载

---

## 📦 组件类型

### SmartModalForm

最常用的表单组件，以弹窗形式展示：

```javascript
import { SmartModalForm } from '@/components/admin/smart-form'

<SmartModalForm
  title="新增用户"
  open={modalOpen}
  onOpenChange={setModalOpen}
  fieldsConfig={fieldsConfig}
  onFinish={async (values) => {
    await createUser(values)
    return true  // 返回 true 关闭弹窗
  }}
/>
```

### SmartDrawerForm

以抽屉形式展示的表单：

```javascript
import { SmartDrawerForm } from '@/components/admin/smart-form'

<SmartDrawerForm
  title="编辑用户"
  open={drawerOpen}
  onOpenChange={setDrawerOpen}
  fieldsConfig={fieldsConfig}
  initialValues={currentRecord}
  onFinish={async (values) => {
    await updateUser(values)
    return true
  }}
  width={600}
/>
```

### SmartForm

基础表单，嵌入页面中：

```javascript
import { SmartForm } from '@/components/admin/smart-form'

<SmartForm
  fieldsConfig={fieldsConfig}
  initialValues={initialData}
  onFinish={async (values) => {
    await saveData(values)
  }}
  submitter={{
    searchConfig: {
      submitText: '保存',
      resetText: '重置',
    },
  }}
/>
```

---

## 📋 配置详解

### 基础配置

```javascript
const fieldsConfig = [
  {
    key: 'name',
    title: '用户名',
    type: 'text',
    form: {
      required: true,
      placeholder: '请输入用户名',
      rules: [
        { min: 2, message: '至少 2 个字符' },
        { max: 20, message: '最多 20 个字符' },
      ],
    },
  },
]
```

### 字段类型与表单组件

#### text - 文本输入

```javascript
{
  key: 'name',
  title: '名称',
  type: 'text',
  form: {
    required: true,
    placeholder: '请输入名称',
    maxLength: 100,
    showCount: true,  // 显示字数统计
  },
}
```

#### textarea - 多行文本

```javascript
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
```

#### number - 数字输入

```javascript
{
  key: 'price',
  title: '价格',
  type: 'number',
  form: {
    min: 0,
    max: 99999,
    precision: 2,     // 小数位数
    step: 0.01,       // 步长
    prefix: '¥',      // 前缀
    suffix: '元',     // 后缀
  },
}
```

#### select - 下拉选择

```javascript
{
  key: 'status',
  title: '状态',
  type: 'select',
  options: [
    { label: '启用', value: 'active' },
    { label: '禁用', value: 'inactive' },
  ],
  form: {
    required: true,
    defaultValue: 'active',
    allowClear: true,
    showSearch: true,  // 可搜索
  },
}

// 动态选项
{
  key: 'categoryId',
  title: '分类',
  type: 'select',
  options: async () => {
    const res = await getCategoryList()
    return res.data.map(item => ({
      label: item.name,
      value: item.id,
    }))
  },
}
```

#### switch - 开关

```javascript
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
```

#### date / datetime - 日期选择

```javascript
// 日期
{
  key: 'birthday',
  title: '生日',
  type: 'date',
  form: {
    format: 'YYYY-MM-DD',
  },
}

// 日期时间
{
  key: 'publishTime',
  title: '发布时间',
  type: 'datetime',
  form: {
    format: 'YYYY-MM-DD HH:mm:ss',
    showTime: true,
  },
}
```

#### tree-select - 树形选择

```javascript
{
  key: 'parentId',
  title: '父级分类',
  type: 'tree-select',
  options: async () => {
    const res = await getCategoryTree()
    return res.data
  },
  form: {
    allowClear: true,
    showSearch: true,
    treeDefaultExpandAll: true,
    placeholder: '请选择父级分类',
  },
}
```

#### image - 图片上传

```javascript
{
  key: 'avatar',
  title: '头像',
  type: 'image',
  form: {
    maxCount: 1,
    accept: 'image/*',
    maxSize: 2,  // MB
    tip: '支持 jpg、png 格式，最大 2MB',
  },
}
```

#### images - 多图上传

```javascript
{
  key: 'gallery',
  title: '图集',
  type: 'images',
  form: {
    maxCount: 9,
    accept: 'image/*',
    maxSize: 5,
  },
}
```

#### markdown - Markdown 编辑器

```javascript
{
  key: 'content',
  title: '内容',
  type: 'markdown',
  form: {
    height: 400,
    placeholder: '请输入文章内容...',
  },
}
```

#### icon - 图标选择

```javascript
{
  key: 'icon',
  title: '图标',
  type: 'icon',
  form: {
    placeholder: '请选择图标',
  },
}
```

#### json - JSON 编辑器

```javascript
{
  key: 'config',
  title: '配置',
  type: 'json',
  form: {
    height: 200,
    defaultValue: {},
  },
}
```

---

## 🎨 高级用法

### 字段联动

```javascript
const fieldsConfig = [
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
      // 依赖字段
      dependencies: ['discountType'],
      // 动态配置
      fieldProps: (form) => {
        const type = form.getFieldValue('discountType')
        return {
          suffix: type === 'percent' ? '%' : '元',
          max: type === 'percent' ? 100 : 99999,
        }
      },
    },
  },
]
```

### 条件显示

```javascript
{
  key: 'reason',
  title: '拒绝原因',
  type: 'textarea',
  form: {
    // 只在状态为 rejected 时显示
    dependencies: ['status'],
    visible: (form) => form.getFieldValue('status') === 'rejected',
    required: (form) => form.getFieldValue('status') === 'rejected',
  },
}
```

### 自定义验证

```javascript
{
  key: 'password',
  title: '密码',
  type: 'text',
  form: {
    required: true,
    rules: [
      { min: 8, message: '密码至少 8 位' },
      {
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: '密码需包含大小写字母和数字',
      },
      {
        validator: async (_, value) => {
          if (value && value.includes(' ')) {
            throw new Error('密码不能包含空格')
          }
        },
      },
    ],
  },
}
```

### 表单布局

```javascript
<SmartModalForm
  fieldsConfig={fieldsConfig}
  // 表单布局
  layout="horizontal"
  labelCol={{ span: 6 }}
  wrapperCol={{ span: 18 }}
  // 或使用栅格布局
  grid={true}
  colProps={{ span: 12 }}  // 每个字段占一半宽度
/>

// 单独控制某个字段的宽度
{
  key: 'description',
  title: '描述',
  type: 'textarea',
  form: {
    colSpan: 24,  // 占满整行
  },
}
```

### 表单分组

```javascript
const fieldsConfig = [
  // 基础信息组
  {
    key: 'basicInfo',
    title: '基础信息',
    type: 'group',
    children: [
      { key: 'name', title: '名称', type: 'text' },
      { key: 'code', title: '编码', type: 'text' },
    ],
  },
  // 高级配置组
  {
    key: 'advancedConfig',
    title: '高级配置',
    type: 'group',
    children: [
      { key: 'enable', title: '启用', type: 'switch' },
      { key: 'remark', title: '备注', type: 'textarea' },
    ],
  },
]
```

---

## 📊 Props 参考

### 通用 Props

| 属性 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `fieldsConfig` | `FieldConfig[]` | ✅ | 字段配置数组 |
| `initialValues` | `object` | | 初始值 |
| `onFinish` | `(values) => Promise<boolean>` | ✅ | 提交回调 |
| `onValuesChange` | `(changedValues, allValues) => void` | | 值变化回调 |
| `layout` | `'horizontal' \| 'vertical' \| 'inline'` | | 布局方式 |
| `disabled` | `boolean` | | 禁用整个表单 |
| `readonly` | `boolean` | | 只读模式 |

### SmartModalForm Props

| 属性 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `title` | `string` | ✅ | 弹窗标题 |
| `open` | `boolean` | ✅ | 是否显示 |
| `onOpenChange` | `(open: boolean) => void` | ✅ | 显示状态变化 |
| `width` | `number` | | 弹窗宽度，默认 600 |
| `destroyOnClose` | `boolean` | | 关闭时销毁，默认 true |

### SmartDrawerForm Props

| 属性 | 类型 | 必填 | 说明 |
|:---|:---|:---:|:---|
| `title` | `string` | ✅ | 抽屉标题 |
| `open` | `boolean` | ✅ | 是否显示 |
| `onOpenChange` | `(open: boolean) => void` | ✅ | 显示状态变化 |
| `width` | `number` | | 抽屉宽度，默认 400 |
| `placement` | `'left' \| 'right'` | | 位置，默认 right |

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [SmartCrudPage 指南](./SMART_CRUD.md) | 万能表格组件 |
| [fieldsConfig 详解](../../api/FIELDS_CONFIG.md) | 字段配置完整 API |
| [Server Actions 开发](./SERVER_ACTIONS.md) | Actions 开发指南 |

---

<div align="center">

[← SmartCrudPage 指南](./SMART_CRUD.md) · [Server Actions 开发 →](./SERVER_ACTIONS.md)

</div>

