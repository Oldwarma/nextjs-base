# SmartForm 万能表单使用指南

基于 vk-unicloud 万能表单思想，通过 JSON 配置自动生成表单的组件集合。

## 📦 组件概览

| 组件 | 说明 | 使用场景 |
|------|------|---------|
| `SmartForm` | 基础表单 | 嵌入页面的独立表单 |
| `SmartModalForm` | 模态框表单 | 弹窗表单（最常用） |
| `SmartDrawerForm` | 抽屉表单 | 需要更大空间的表单 |

## 🚀 快速开始

### 导入组件

```jsx
import { SmartForm, SmartModalForm, SmartDrawerForm } from '@/components/admin/smart-form';
```

### 基础示例

```jsx
'use client';

import { useState } from 'react';
import { SmartModalForm } from '@/components/admin/smart-form';
import { App } from 'antd';

export default function MyPage() {
  const { message } = App.useApp();
  const [visible, setVisible] = useState(false);

  const fieldsConfig = [
    { 
      key: 'name', 
      title: 'Name', 
      type: 'text', 
      form: { required: true, placeholder: 'Enter name' } 
    },
    { 
      key: 'email', 
      title: 'Email', 
      type: 'text', 
      form: { 
        required: true, 
        rules: [{ type: 'email', message: 'Invalid email' }] 
      } 
    },
    { 
      key: 'role', 
      title: 'Role', 
      type: 'select', 
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      form: { required: true }
    },
  ];

  const handleSubmit = async (values) => {
    console.log('Form values:', values);
    
    // 调用 Server Action
    const result = await createUserAction(values);
    
    if (result.success) {
      message.success('Created successfully');
      return true; // 返回 true 自动关闭表单
    }
    
    message.error(result.error);
    return false; // 返回 false 保持表单打开
  };

  return (
    <>
      <Button onClick={() => setVisible(true)}>Create User</Button>
      
      <SmartModalForm
        title="Create User"
        open={visible}
        onOpenChange={setVisible}
        fieldsConfig={fieldsConfig}
        onFinish={handleSubmit}
        width={600}
      />
    </>
  );
}
```

## 📝 字段配置 (fieldsConfig)

字段配置与 SmartCrudPage 完全兼容，使用相同的格式。

### 基础结构

```javascript
{
  key: 'fieldName',           // ✅ 必需：字段名（对应表单字段名）
  title: 'Field Title',       // ✅ 必需：显示标题
  type: 'text',               // ✅ 必需：字段类型

  // 表单配置
  form: {
    required: true,           // 是否必填
    placeholder: 'Enter...',  // 占位符
    disabled: false,          // 是否禁用
    tips: 'Some tips',        // 提示信息（tooltip）
    fieldProps: {},           // Ant Design 组件原生属性
    rules: [],                // 额外验证规则
  },

  // 选项数据（用于 select、radio、checkbox）
  options: [
    { label: 'Option 1', value: 'value1' },
    { label: 'Option 2', value: 'value2' },
  ],

  // 条件显示
  showRule: "type=='advanced'",

  // 字段联动
  watch: ({ value, formData, $set }) => {
    if (value === 'admin') {
      $set('permissions', ['all']);
    }
  },
}
```

### 支持的字段类型

#### 基础类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `text` | 单行文本 | Input |
| `textarea` | 多行文本 | TextArea |
| `number` | 数字 | InputNumber |
| `money` | 金额 | InputNumber (带前缀) |
| `percentage` | 百分比 | InputNumber (带后缀) |
| `password` | 密码 | Input.Password |

#### 选择类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `select` | 下拉选择 | Select |
| `radio` | 单选 | Radio.Group |
| `checkbox` | 多选 | Checkbox.Group |
| `switch` | 开关 | Switch |
| `tree-select` | 树形选择 | TreeSelect |
| `cascader` | 级联选择 | Cascader |

#### 日期时间

| 类型 | 说明 | 组件 |
|------|------|------|
| `date` | 日期 | DatePicker |
| `datetime` | 日期时间 | DatePicker (showTime) |
| `time` | 时间 | TimePicker |
| `daterange` | 日期范围 | RangePicker |

#### 其他类型

| 类型 | 说明 | 组件 |
|------|------|------|
| `rate` | 评分 | Rate |
| `slider` | 滑块 | Slider |
| `color` | 颜色 | ColorPicker |
| `image` | 图片上传 | Upload |
| `file` | 文件上传 | Upload |
| `avatar` | 头像上传 | Upload |
| `markdown` | Markdown | MarkdownEditor |
| `json` | JSON | TextArea |
| `array` | 动态数组 | Form.List |
| `icon` | 图标选择 | IconPicker |

#### 布局类型

| 类型 | 说明 | 用途 |
|------|------|------|
| `group` | 分组容器 | 将字段分组显示，支持栅格布局 |

## 🎯 API 参考

### SmartModalForm

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | string | 'Form' | 模态框标题 |
| `open` | boolean | - | 是否打开（受控） |
| `onOpenChange` | (visible: boolean) => void | - | 打开状态变化回调 |
| `fieldsConfig` | array | [] | 字段配置数组 |
| `initialValues` | object | {} | 表单初始值 |
| `onFinish` | (values) => Promise<boolean> | - | 提交回调，返回 true 关闭 |
| `beforeSubmit` | (values) => values \| false | - | 提交前数据转换 |
| `actions` | object | {} | Server Actions（用于 action 加载数据） |
| `isCreate` | boolean | true | 是否是创建表单 |
| `width` | number \| string | 600 | 模态框宽度 |
| `enableFullscreen` | boolean | true | 是否启用全屏按钮 |
| `destroyOnClose` | boolean | true | 关闭时销毁内容 |
| `trigger` | ReactNode | - | 触发器（非受控模式） |

### SmartDrawerForm

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | string | 'Form' | 抽屉标题 |
| `open` | boolean | - | 是否打开 |
| `onOpenChange` | (visible: boolean) => void | - | 打开状态变化回调 |
| `fieldsConfig` | array | [] | 字段配置数组 |
| `initialValues` | object | {} | 表单初始值 |
| `onFinish` | (values) => Promise<boolean> | - | 提交回调 |
| `beforeSubmit` | (values) => values \| false | - | 提交前数据转换 |
| `width` | number \| string | 600 | 抽屉宽度 |
| `placement` | 'left' \| 'right' | 'right' | 抽屉位置 |
| `submitter` | boolean \| object | true | 提交按钮配置 |
| `extra` | ReactNode | - | 标题栏右侧内容 |

### SmartForm

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `fieldsConfig` | array | [] | 字段配置数组 |
| `initialValues` | object | {} | 表单初始值 |
| `onFinish` | (values) => Promise<boolean> | - | 提交回调 |
| `onFinishFailed` | (errorInfo) => void | - | 验证失败回调 |
| `onValuesChange` | (changedValues, allValues) => void | - | 值变化回调 |
| `labelWidth` | string | 'auto' | 标签宽度 |
| `layout` | 'horizontal' \| 'vertical' \| 'inline' | 'horizontal' | 布局方式 |
| `column` | number | 1 | 列数（多列布局） |
| `loading` | boolean | false | 加载状态 |
| `disabled` | boolean | false | 禁用整个表单 |
| `submitter` | boolean \| object | true | 提交按钮配置 |

## 📚 高级用法

### 分组布局 (group)

使用 `group` 类型可以将表单字段分组显示，支持栅格布局：

```javascript
const fieldsConfig = [
  // 分组 1: 基础信息
  {
    key: 'basic-group',
    title: '📋 Basic Information',
    type: 'group',
    tips: 'Fill in the basic information',  // 可选：提示文字
    columns: [
      { 
        key: 'title', 
        title: 'Title', 
        type: 'text', 
        form: { required: true },
        col: { span: 16 },  // 占 16/24 = 66.7% 宽度
      },
      { 
        key: 'status', 
        title: 'Status', 
        type: 'select',
        data: statusOptions,
        col: { span: 8 },   // 占 8/24 = 33.3% 宽度
      },
    ],
  },
  
  // 分组 2: 价格信息
  {
    key: 'price-group',
    title: '💰 Price Information',
    type: 'group',
    columns: [
      { key: 'price', title: 'Price', type: 'money', col: { span: 8 } },
      { key: 'discount', title: 'Discount', type: 'percent', col: { span: 8 } },
      { key: 'quantity', title: 'Quantity', type: 'number', col: { span: 8 } },
    ],
  },
];
```

**分组配置说明：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `key` | string | 分组唯一标识 |
| `title` | string | 分组标题 |
| `type` | `'group'` | 固定值 |
| `tips` | string | 分组提示文字（可选） |
| `columns` | array | 分组内的字段配置 |

**字段栅格配置：**

每个字段可以通过 `col.span` 设置宽度（1-24），默认为 12（50%）：

```javascript
{ key: 'field1', col: { span: 24 } }  // 100% 宽度（整行）
{ key: 'field2', col: { span: 12 } }  // 50% 宽度（半行）
{ key: 'field3', col: { span: 8 } }   // 33.3% 宽度（三分之一）
{ key: 'field4', col: { span: 6 } }   // 25% 宽度（四分之一）
```

> **设计说明**：我们使用自定义分组实现（Divider + Row/Col）而不是 ProFormGroup，
> 因为 ProFormGroup 内部使用 Space 布局，无法支持精确的栅格宽度控制。

### 条件显示 (showRule)

根据其他字段的值决定是否显示当前字段：

```javascript
{
  key: 'advancedOptions',
  title: 'Advanced Options',
  type: 'text',
  // 字符串表达式
  showRule: "type === 'advanced'",
  // 或使用函数
  showRule: (formData) => formData.type === 'advanced',
}
```

**支持的操作符：**

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `=` `==` | 等于（宽松） | `status == 'active'` |
| `===` | 严格等于 | `status === 'active'` |
| `!=` | 不等于（宽松） | `status != 'draft'` |
| `!==` | 严格不等于 | `status !== 'draft'` |
| `>` `>=` `<` `<=` | 比较 | `age >= 18` |
| `in` | 包含 | `status in ['active','pending']` |
| `&&` | 逻辑与 | `age >= 18 && status === 'active'` |
| `\|\|` | 逻辑或 | `role === 'admin' \|\| role === 'super'` |

**在分组中使用 showRule：**

```javascript
{
  type: 'group',
  title: 'Contact Information',
  columns: [
    { key: 'contactType', title: 'Contact Type', type: 'radio', data: contactTypes },
    { 
      key: 'email', 
      title: 'Email', 
      type: 'text',
      showRule: "contactType === 'email'",  // 只有选择 email 时显示
    },
    { 
      key: 'phone', 
      title: 'Phone', 
      type: 'text',
      showRule: "contactType === 'phone'",  // 只有选择 phone 时显示
    },
  ],
}

### 字段联动 (watch)

监听字段值变化并执行操作：

```javascript
{
  key: 'province',
  title: 'Province',
  type: 'select',
  options: provinceOptions,
  // 方式 1：函数形式
  watch: ({ value, formData, $set, setFieldValue }) => {
    // 当省份变化时，清空城市
    $set('city', undefined);  // $set 和 setFieldValue 等价
  },
  
  // 方式 2：对象形式（vk-unicloud 风格）
  watch: {
    handler: (value, { formData, $set }) => {
      $set('city', undefined);
    },
  },
}
```

**watch 回调参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `value` | any | 当前字段的新值 |
| `formData` | object | 所有表单字段的值 |
| `column` | object | 当前字段配置 |
| `option` | object | 当前选中的选项（如果有） |
| `$set` | function | 设置其他字段值的函数 |
| `setFieldValue` | function | 同 `$set` |

**实际案例：级联选择**

```javascript
{
  type: 'group',
  title: 'Category',
  columns: [
    {
      key: 'category',
      title: 'Main Category',
      type: 'select',
      data: categoryOptions,
      watch: {
        handler: (value, { setFieldValue }) => {
          // 主分类变化时，清空子分类
          setFieldValue('subCategory', undefined);
        },
      },
    },
    {
      key: 'subCategory',
      title: 'Sub Category',
      type: 'select',
      // 动态获取子分类选项
      data: (formData) => {
        const category = formData?.category;
        return subCategoryMap[category] || [];
      },
      // 当没有选择主分类时禁用
      disabled: (formData) => !formData?.category,
    },
  ],
}
```

**实际案例：开关联动**

```javascript
{
  type: 'group',
  title: 'Settings',
  columns: [
    {
      key: 'isActive',
      title: 'Active',
      type: 'switch',
      watch: {
        handler: (value, { setFieldValue }) => {
          // 关闭 Active 时，同时关闭依赖项
          if (!value) {
            setFieldValue('isVip', false);
            setFieldValue('enableNotification', false);
          }
        },
      },
    },
    {
      key: 'isVip',
      title: 'VIP Only',
      type: 'switch',
      disabled: (formData) => !formData?.isActive,
    },
    {
      key: 'enableNotification',
      title: 'Notification',
      type: 'switch',
      disabled: (formData) => !formData?.isActive,
    },
  ],
}
```

### 数据转换 (beforeSubmit)

在提交前转换数据：

```jsx
<SmartModalForm
  fieldsConfig={fieldsConfig}
  beforeSubmit={(values) => {
    // 返回 false 取消提交
    if (!values.agree) {
      message.error('Please agree to terms');
      return false;
    }
    
    // 转换数据格式
    return {
      ...values,
      createdAt: new Date(),
      tags: values.tags?.join(','),
    };
  }}
  onFinish={handleSubmit}
/>
```

### 使用 ref 控制表单

```jsx
const formRef = useRef();

<SmartModalForm
  ref={formRef}
  fieldsConfig={fieldsConfig}
  onFinish={handleSubmit}
/>

// 获取表单值
const values = formRef.current?.getFieldsValue();

// 设置表单值
formRef.current?.setFieldsValue({ name: 'New Name' });

// 重置表单
formRef.current?.resetFields();

// 验证表单
formRef.current?.validateFields();

// 提交表单
formRef.current?.submit();
```

### 非受控模式（使用 trigger）

不需要管理 open 状态：

```jsx
<SmartModalForm
  title="Create User"
  trigger={<Button type="primary">Create</Button>}
  fieldsConfig={fieldsConfig}
  onFinish={handleCreate}
/>
```

### 自定义提交按钮

```jsx
<SmartModalForm
  fieldsConfig={fieldsConfig}
  formProps={{
    submitter: {
      searchConfig: {
        submitText: 'Save',
        resetText: 'Reset',
      },
      render: (props, doms) => {
        return [
          ...doms,
          <Button key="custom" onClick={handleCustomAction}>
            Custom Action
          </Button>,
        ];
      },
    },
  }}
/>
```

## 🔄 与 SmartCrudPage 的关系

SmartForm 系列组件与 SmartCrudPage 共享相同的 `fieldsConfig` 配置格式：

```jsx
// 定义一次配置
const userFieldsConfig = [
  { key: 'name', title: 'Name', type: 'text', form: { required: true } },
  { key: 'email', title: 'Email', type: 'text', form: { required: true } },
  // 表格相关配置
  { key: 'createdAt', title: 'Created', type: 'datetime', form: false },
];

// 在 SmartCrudPage 中使用（包含表格+表单）
<SmartCrudPage
  fieldsConfig={userFieldsConfig}
  actions={crudActions}
/>

// 在独立表单中复用（只使用表单配置）
<SmartModalForm
  title="Quick Create"
  fieldsConfig={userFieldsConfig}
  onFinish={handleCreate}
/>
```

## 📖 实际案例

### 替换手写 Modal + Form

**之前（手写）：**

```jsx
<Modal
  title="Create User"
  open={visible}
  onOk={() => form.submit()}
  onCancel={() => setVisible(false)}
>
  <Form form={form} onFinish={handleCreate}>
    <Form.Item name="email" label="Email" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item name="password" label="Password" rules={[{ required: true }]}>
      <Input.Password />
    </Form.Item>
    <Form.Item name="role" label="Role">
      <Select options={roleOptions} />
    </Form.Item>
  </Form>
</Modal>
```

**之后（配置化）：**

```jsx
<SmartModalForm
  title="Create User"
  open={visible}
  onOpenChange={setVisible}
  fieldsConfig={[
    { key: 'email', title: 'Email', type: 'text', form: { required: true } },
    { key: 'password', title: 'Password', type: 'password', form: { required: true } },
    { key: 'role', title: 'Role', type: 'select', options: roleOptions },
  ]}
  onFinish={handleCreate}
/>
```

### 复杂表单示例

```jsx
const productFieldsConfig = [
  // 基础信息
  { key: 'name', title: 'Product Name', type: 'text', form: { required: true } },
  { key: 'description', title: 'Description', type: 'textarea' },
  { key: 'price', title: 'Price', type: 'money', form: { required: true } },
  
  // 分类
  { 
    key: 'category', 
    title: 'Category', 
    type: 'cascader',
    form: {
      options: categoryTree,
      required: true,
    }
  },
  
  // 状态
  { 
    key: 'status', 
    title: 'Status', 
    type: 'select',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' },
    ],
    form: { required: true }
  },
  
  // 高级选项（条件显示）
  { 
    key: 'publishAt', 
    title: 'Publish Time', 
    type: 'datetime',
    showRule: "status=='published'",
    form: { required: true }
  },
  
  // 标签（动态数组）
  { 
    key: 'tags', 
    title: 'Tags', 
    type: 'array',
    form: {
      addButtonText: 'Add Tag',
      max: 10,
    }
  },
  
  // 封面图
  { key: 'cover', title: 'Cover Image', type: 'image' },
];

<SmartModalForm
  title="Create Product"
  open={visible}
  onOpenChange={setVisible}
  fieldsConfig={productFieldsConfig}
  onFinish={handleCreateProduct}
  width={800}
/>
```

## 📖 参考文档

- [vk-unicloud 万能表单](https://vkdoc.fsq.pub/admin/3/form.html)
- [Ant Design ProComponents ModalForm](https://procomponents.ant.design/components/modal-form)
- [SmartCrudPage 完整指南](./SMART_CRUD_COMPLETE_GUIDE.md)
- [字段类型详解](../lib/crud/README.md)

