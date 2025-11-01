# Smart CRUD - VK 特性实现

> **参考**: [vk-unicloud 公共属性文档](https://vkdoc.fsq.pub/admin/components/0%E3%80%81public.html)

## 🎉 新增功能

借鉴 vk-unicloud 的设计，我们在 Smart CRUD 中实现了以下高频公共属性：

### ✅ 已实现的功能

1. **showRule** - 条件显示（支持表达式和函数）
2. **disabled** - 条件禁用（支持表达式和函数）
3. **watch** - 字段值变化监听
4. **tips** - 字段下方固定提示
5. **clearable** - 是否允许清空

---

## 📖 使用指南

### 1. showRule - 条件显示

根据表单数据动态显示/隐藏字段。

#### 表达式形式

支持的操作符：`= == > >= < <= != in && ||`

```javascript
const fieldsConfig = [
  {
    key: 'login_appid_type',
    title: 'Login Permission',
    type: 'radio',
    form: {
      props: {
        options: [
          { label: 'Some Apps', value: 1 },
          { label: 'All Apps', value: 0 },
        ],
      },
    },
  },
  {
    key: 'mode',
    title: 'Mode',
    type: 'radio',
    form: {
      props: {
        options: [
          { label: 'Override', value: 1 },
          { label: 'Add', value: 2 },
          { label: 'Remove', value: 3 },
        ],
      },
    },
    // 当 login_appid_type == 1 时才显示此字段
    showRule: 'login_appid_type==1',
  },
];
```

#### 函数形式

```javascript
{
  key: 'mode',
  title: 'Mode',
  type: 'select',
  showRule: (formData) => {
    return formData.login_appid_type === 1;
  },
}
```

#### 复杂条件

```javascript
{
  key: 'advanced_options',
  title: 'Advanced Options',
  type: 'textarea',
  // 多个条件组合
  showRule: 'age>=18 && status=="active"',
}

{
  key: 'warning',
  title: 'Warning',
  type: 'text',
  // in 操作符
  showRule: "status in ['pending','review']",
}
```

---

### 2. disabled - 条件禁用

根据表单数据动态禁用字段。

#### 表达式形式

```javascript
{
  key: 'mode',
  title: 'Mode',
  type: 'select',
  // 当 login_appid_type == 0 时禁用此字段
  disabled: 'login_appid_type==0',
}
```

#### 函数形式

```javascript
{
  key: 'edit_field',
  title: 'Edit Field',
  type: 'text',
  disabled: (formData) => {
    // 只有管理员可以编辑
    return formData.role !== 'admin';
  },
}
```

---

### 3. watch - 字段监听

监听字段值的变化，并执行回调函数。

```javascript
{
  key: 'province',
  title: 'Province',
  type: 'select',
  form: {
    props: {
      options: [
        { label: 'Beijing', value: 'beijing' },
        { label: 'Shanghai', value: 'shanghai' },
      ],
    },
  },
  watch: ({ value, formData, column, index, option, $set }) => {
    // 当省份改变时，自动清空城市
    $set('city', undefined);
    
    // 可以根据省份加载城市列表
    console.log('Province changed to:', value);
    console.log('Selected option:', option);
  },
}
```

#### watch 回调参数

| 参数 | 说明 | 类型 |
|------|------|------|
| value | 当前字段的值 | any |
| formData | 整个表单的数据 | Object |
| column | 当前字段的配置 | Object |
| index | 字段在配置数组中的索引 | Number |
| option | 当前选中的选项数据（如果有） | Object |
| $set | 设置其他字段的值 | Function |

#### 实用示例

```javascript
// 示例 1: 联动选择
{
  key: 'country',
  title: 'Country',
  type: 'select',
  watch: ({ value, $set }) => {
    // 切换国家时清空省份和城市
    $set('province', undefined);
    $set('city', undefined);
  },
}

// 示例 2: 自动计算
{
  key: 'price',
  title: 'Price',
  type: 'money',
  watch: ({ value, formData, $set }) => {
    // 自动计算总价
    const quantity = formData.quantity || 1;
    $set('total', value * quantity);
  },
}

// 示例 3: 动态提示
{
  key: 'email',
  title: 'Email',
  type: 'text',
  watch: ({ value, $set }) => {
    // 根据邮箱自动填充用户名
    if (value && value.includes('@')) {
      const username = value.split('@')[0];
      $set('username', username);
    }
  },
}
```

---

### 4. tips - 固定提示

字段下方的固定提示信息（区别于 placeholder）。

```javascript
{
  key: 'password',
  title: 'Password',
  type: 'password',
  tips: 'Password must be at least 8 characters and include numbers and letters',
}

// 或者
{
  key: 'email',
  title: 'Email',
  type: 'text',
  form: {
    tips: 'We will send a verification email to this address',
  },
}
```

**与 placeholder 的区别**：
- `placeholder`: 输入框内的提示，用户输入后消失
- `tips`: 输入框下方的提示，始终显示

---

### 5. clearable - 可清空

控制输入框/选择框是否显示清空按钮。

```javascript
// 全局配置
{
  key: 'name',
  title: 'Name',
  type: 'text',
  clearable: false,  // 不允许清空
}

// 表单级别配置
{
  key: 'email',
  title: 'Email',
  type: 'text',
  form: {
    clearable: true,  // 允许清空（默认）
  },
}
```

**默认值**: `true` (允许清空)

**适用组件**:
- text
- textarea
- select
- number
- money
- date
- datetime
- 等所有输入/选择类组件

---

## 🎯 完整示例

```javascript
const fieldsConfig = [
  // 用户类型选择
  {
    key: 'userType',
    title: 'User Type',
    type: 'radio',
    form: {
      props: {
        options: [
          { label: 'Individual', value: 'individual' },
          { label: 'Company', value: 'company' },
        ],
      },
    },
    tips: 'Select your account type',
  },
  
  // 个人姓名（仅个人用户显示）
  {
    key: 'name',
    title: 'Name',
    type: 'text',
    showRule: 'userType=="individual"',
    form: {
      required: true,
      placeholder: 'Enter your full name',
    },
    clearable: true,
  },
  
  // 公司名称（仅企业用户显示）
  {
    key: 'companyName',
    title: 'Company Name',
    type: 'text',
    showRule: 'userType=="company"',
    form: {
      required: true,
    },
  },
  
  // 年龄（个人用户必填，企业用户禁用）
  {
    key: 'age',
    title: 'Age',
    type: 'number',
    showRule: 'userType=="individual"',
    disabled: 'userType=="company"',
    form: {
      min: 18,
      max: 100,
    },
    tips: 'You must be at least 18 years old',
  },
  
  // 邮箱（带监听）
  {
    key: 'email',
    title: 'Email',
    type: 'text',
    form: {
      required: true,
    },
    watch: ({ value, $set }) => {
      // 自动生成用户名
      if (value && value.includes('@')) {
        const username = value.split('@')[0];
        $set('username', username);
      }
    },
    tips: 'We will send a verification email',
  },
  
  // 用户名（由邮箱自动填充）
  {
    key: 'username',
    title: 'Username',
    type: 'text',
    disabled: (formData) => Boolean(formData.email),
    tips: 'Auto-generated from email',
  },
];
```

---

## 📊 支持的操作符

### showRule 和 disabled 表达式

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `=` 或 `==` | 等于 | `age==18` |
| `!=` | 不等于 | `status!="inactive"` |
| `>` | 大于 | `age>18` |
| `>=` | 大于等于 | `age>=18` |
| `<` | 小于 | `price<100` |
| `<=` | 小于等于 | `price<=100` |
| `in` | 包含于 | `status in ['active','pending']` |
| `&&` | 且 | `age>=18 && status=="active"` |
| `\|\|` | 或 | `status=="active" \|\| status=="pending"` |

---

## 🔍 实现细节

### 文件结构

```
lib/admin/crud/
├── field-types.js          # 字段类型定义（已更新）
├── field-generator.js      # 字段生成器
├── rule-evaluator.js       # 规则评估器（新增）⭐
└── search-transformer.js   # 搜索转换器

components/admin/
├── smart-crud-page.jsx     # Smart CRUD 组件（已更新）
└── dynamic-form-fields.jsx # 动态表单字段（新增）⭐
```

### 核心组件

#### 1. rule-evaluator.js
负责评估 `showRule` 和 `disabled` 表达式。

```javascript
import { evaluateRule } from '@/lib/admin/crud/rule-evaluator';

// 评估表达式
const result = evaluateRule('age>=18', { age: 20 });  // true

// 评估函数
const result = evaluateRule((data) => data.age >= 18, { age: 20 });  // true
```

#### 2. dynamic-form-fields.jsx
负责动态渲染表单字段，支持条件显示、禁用和监听。

```javascript
import DynamicFormFields from '@/components/admin/dynamic-form-fields';

<DynamicFormFields 
  fieldsConfig={fieldsConfig} 
  formInstance={form}
  isCreate={false}
/>
```

---

## 🎨 最佳实践

### 1. 优先使用表达式
对于简单条件，使用表达式比函数更简洁：

```javascript
// ✅ 好
showRule: 'age>=18'

// ❌ 不推荐（过于复杂）
showRule: (formData) => formData.age >= 18
```

### 2. 复杂逻辑使用函数
对于复杂条件，使用函数更清晰：

```javascript
// ✅ 好
showRule: (formData) => {
  const isAdult = formData.age >= 18;
  const isVerified = formData.emailVerified === true;
  return isAdult && isVerified;
}

// ❌ 不推荐（难以阅读）
showRule: 'age>=18 && emailVerified==true'
```

### 3. watch 用于联动
使用 `watch` 实现字段联动：

```javascript
{
  key: 'country',
  watch: ({ value, $set }) => {
    // 清空依赖字段
    $set('province', undefined);
    $set('city', undefined);
  },
}
```

### 4. tips 用于说明
使用 `tips` 提供清晰的说明：

```javascript
{
  key: 'apiKey',
  type: 'password',
  tips: 'Your API key is confidential. Never share it with anyone.',
}
```

---

## 🔄 迁移指南

### 从传统表单迁移

**之前**:
```javascript
<ProFormText
  name="name"
  label="Name"
  placeholder="Enter name"
  rules={[{ required: true }]}
/>
```

**之后**:
```javascript
{
  key: 'name',
  title: 'Name',
  type: 'text',
  form: {
    required: true,
    placeholder: 'Enter name',
  },
}
```

### 添加条件显示

只需添加 `showRule`:

```javascript
{
  key: 'name',
  title: 'Name',
  type: 'text',
  showRule: 'userType=="individual"',  // 新增
  form: {
    required: true,
  },
}
```

---

## 📚 相关文档

- [Smart CRUD 使用指南](./SMART_CRUD.md)
- [Smart CRUD 快速参考](./SMART_CRUD_QUICKSTART.md)
- [vk-unicloud 公共属性](https://vkdoc.fsq.pub/admin/components/0%E3%80%81public.html)

---

**更新日期**: 2025-11-01  
**版本**: v1.1.0

