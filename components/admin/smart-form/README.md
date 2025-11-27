# SmartForm 万能表单组件

基于 vk-unicloud 万能表单思想，通过 JSON 配置自动生成表单。

## 📦 组件列表

| 组件 | 说明 | 使用场景 |
|------|------|---------|
| `SmartForm` | 基础表单 | 嵌入页面的表单 |
| `SmartModalForm` | 模态框表单 | 弹窗表单（最常用） |
| `SmartDrawerForm` | 抽屉表单 | 需要更大空间的表单 |

## 🚀 快速开始

### 安装导入

```jsx
import { SmartForm, SmartModalForm, SmartDrawerForm } from '@/components/admin/smart-form';
```

### 基础用法

```jsx
// 模态框表单
const [visible, setVisible] = useState(false);

<SmartModalForm
  title="Create User"
  open={visible}
  onOpenChange={setVisible}
  fieldsConfig={[
    { key: 'name', title: 'Name', type: 'text', form: { required: true } },
    { key: 'email', title: 'Email', type: 'text', form: { required: true } },
    { key: 'role', title: 'Role', type: 'select', options: [
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
    ]},
  ]}
  onFinish={async (values) => {
    const result = await createUserAction(values);
    if (result.success) {
      message.success('Created successfully');
      return true; // 返回 true 自动关闭
    }
    message.error(result.error);
    return false; // 返回 false 保持打开
  }}
/>
```

## 📝 字段配置 (fieldsConfig)

字段配置与 SmartCrudPage 完全兼容，使用相同的 `fieldsConfig` 格式。

### 基础结构

```javascript
{
  key: 'fieldName',           // ✅ 必需：字段名
  title: 'Field Title',       // ✅ 必需：显示标题
  type: 'text',               // ✅ 必需：字段类型

  // 表单配置
  form: {
    required: true,           // 是否必填
    placeholder: 'Enter...',  // 占位符
    disabled: false,          // 是否禁用
    fieldProps: {},           // Ant Design 组件原生属性
    rules: [],                // 额外验证规则
  },

  // 条件显示
  showRule: "type=='advanced'",  // 条件表达式或函数

  // 字段联动
  watch: ({ value, formData, $set }) => {
    // 监听值变化
    if (value === 'admin') {
      $set('permissions', ['all']);
    }
  },

  // 选项数据（用于 select、radio、checkbox）
  options: [
    { label: 'Option 1', value: 'value1' },
    { label: 'Option 2', value: 'value2' },
  ],
}
```

### 支持的字段类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `text` | 单行文本 | 姓名、标题 |
| `textarea` | 多行文本 | 描述、备注 |
| `number` | 数字 | 年龄、数量 |
| `money` | 金额 | 价格、费用 |
| `percentage` | 百分比 | 折扣、进度 |
| `select` | 下拉选择 | 状态、分类 |
| `radio` | 单选 | 性别、类型 |
| `checkbox` | 多选 | 权限、标签 |
| `switch` | 开关 | 启用/禁用 |
| `date` | 日期 | 生日、日期 |
| `datetime` | 日期时间 | 创建时间 |
| `time` | 时间 | 开始时间 |
| `rate` | 评分 | 星级评分 |
| `slider` | 滑块 | 范围选择 |
| `color` | 颜色 | 主题色 |
| `image` | 图片上传 | 头像、封面 |
| `file` | 文件上传 | 附件 |
| `avatar` | 头像上传 | 用户头像 |
| `markdown` | Markdown | 文章内容 |
| `json` | JSON | 配置数据 |
| `array` | 动态数组 | 标签列表 |
| `tree-select` | 树形选择 | 部门、分类 |
| `cascader` | 级联选择 | 地区 |
| `icon` | 图标选择 | 菜单图标 |
| `group` | 分组容器 | 字段分组布局 |

## 🎯 组件 API

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
| `destroyOnHidden` | boolean | true | 关闭时销毁内容 |
| `trigger` | ReactNode | - | 触发器（非受控模式） |

### SmartDrawerForm

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | string | 'Form' | 抽屉标题 |
| `open` | boolean | - | 是否打开（受控） |
| `onOpenChange` | (visible: boolean) => void | - | 打开状态变化回调 |
| `fieldsConfig` | array | [] | 字段配置数组 |
| `initialValues` | object | {} | 表单初始值 |
| `onFinish` | (values) => Promise<boolean> | - | 提交回调，返回 true 关闭 |
| `beforeSubmit` | (values) => values \| false | - | 提交前数据转换 |
| `actions` | object | {} | Server Actions |
| `isCreate` | boolean | true | 是否是创建表单 |
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
| `beforeSubmit` | (values) => values \| false | - | 提交前数据转换 |
| `actions` | object | {} | Server Actions |
| `isCreate` | boolean | true | 是否是创建表单 |
| `labelWidth` | string | 'auto' | 标签宽度 |
| `layout` | 'horizontal' \| 'vertical' \| 'inline' | 'horizontal' | 布局方式 |
| `column` | number | 1 | 列数（多列布局） |
| `loading` | boolean | false | 加载状态 |
| `disabled` | boolean | false | 禁用整个表单 |
| `submitter` | boolean \| object | true | 提交按钮配置 |

## 📚 高级用法

### 分组布局 (group)

```javascript
{
  key: 'basic-group',
  title: '📋 Basic Information',
  type: 'group',
  tips: 'Fill in the basic information',
  columns: [
    { key: 'title', title: 'Title', type: 'text', col: { span: 16 } },
    { key: 'status', title: 'Status', type: 'select', col: { span: 8 } },
  ],
}
```

**栅格宽度：** `col.span` 支持 1-24，默认 12（50%）

### 条件显示 (showRule)

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

支持的操作符：`= == === != !== > >= < <= in && ||`

### 字段联动 (watch)

```javascript
{
  key: 'category',
  title: 'Category',
  type: 'select',
  data: categoryOptions,
  watch: {
    handler: (value, { setFieldValue }) => {
      // 主分类变化时，清空子分类
      setFieldValue('subCategory', undefined);
    },
  },
}
```

### 动态选项 (data 函数)

```javascript
{
  key: 'subCategory',
  title: 'Sub Category',
  type: 'select',
  // data 可以是函数，根据其他字段值动态返回选项
  data: (formData) => {
    return subCategoryMap[formData?.category] || [];
  },
}
```

### 条件禁用 (disabled 函数)

```javascript
{
  key: 'subCategory',
  title: 'Sub Category',
  type: 'select',
  // 当没有选择主分类时禁用
  disabled: (formData) => !formData?.category,
}
```

### 数据转换 (beforeSubmit)

```jsx
<SmartModalForm
  fieldsConfig={[...]}
  beforeSubmit={(values) => {
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
  fieldsConfig={[...]}
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

```jsx
<SmartModalForm
  title="Create User"
  trigger={<Button type="primary">Create</Button>}
  fieldsConfig={[...]}
  onFinish={handleCreate}
/>
```

### 自定义提交按钮

```jsx
<SmartModalForm
  fieldsConfig={[...]}
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

SmartForm 系列组件与 SmartCrudPage 共享相同的 `fieldsConfig` 配置格式，可以无缝复用配置：

```jsx
// 定义一次配置
const userFieldsConfig = [
  { key: 'name', title: 'Name', type: 'text', form: { required: true } },
  { key: 'email', title: 'Email', type: 'text', form: { required: true } },
  // ...
];

// 在 SmartCrudPage 中使用
<SmartCrudPage
  fieldsConfig={userFieldsConfig}
  actions={crudActions}
/>

// 在独立表单中复用
<SmartModalForm
  title="Quick Create"
  fieldsConfig={userFieldsConfig}
  onFinish={handleCreate}
/>
```

## 📖 参考文档

- [vk-unicloud 万能表单](https://vkdoc.fsq.pub/admin/3/form.html)
- [Ant Design ProComponents ModalForm](https://procomponents.ant.design/components/modal-form)
- [Ant Design ProComponents DrawerForm](https://procomponents.ant.design/components/drawer-form)
- [SmartCrudPage 完整指南](../../../docs/SMART_CRUD_COMPLETE_GUIDE.md)

