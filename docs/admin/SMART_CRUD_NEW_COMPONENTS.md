# Smart CRUD - 新增组件 (v1.2.0)

> **参考**: [vk-unicloud 内置组件](https://vkdoc.fsq.pub/admin/)

## 🎉 新增 6 个高优先级组件

我们在 v1.2.0 中新增了 6 个常用组件，使字段类型总数达到 **22 个**！

---

## 📊 组件列表

### 1. rate - 评分组件 ⭐

用于评分、评级等场景。

#### 基础用法

```javascript
{
  key: 'rating',
  title: 'Rating',
  type: 'rate',
  form: {
    count: 5,        // 总星数，默认 5
    allowHalf: true, // 是否允许半星，默认 true
  },
}
```

#### 表格显示

```javascript
{
  key: 'rating',
  title: 'Rating',
  type: 'rate',
  table: {
    width: 120,
    count: 5,  // 显示的星数
  },
}
```

#### 完整示例

```javascript
{
  key: 'productRating',
  title: 'Product Rating',
  type: 'rate',
  table: {
    width: 150,
    count: 5,
  },
  form: {
    count: 5,
    allowHalf: true,
    required: true,
  },
  tips: 'Rate this product from 1 to 5 stars',
}
```

---

### 2. slider - 滑块组件 🎚️

用于选择数值范围。

#### 基础用法

```javascript
{
  key: 'volume',
  title: 'Volume',
  type: 'slider',
  form: {
    min: 0,
    max: 100,
    step: 1,
  },
}
```

#### 带刻度

```javascript
{
  key: 'temperature',
  title: 'Temperature',
  type: 'slider',
  form: {
    min: 0,
    max: 100,
    step: 10,
    marks: {
      0: '0°C',
      25: '25°C',
      50: '50°C',
      75: '75°C',
      100: '100°C',
    },
  },
}
```

#### 表格显示

在表格中显示为进度条 + 数值：

```javascript
{
  key: 'progress',
  title: 'Progress',
  type: 'slider',
  table: {
    width: 180,
    min: 0,
    max: 100,
  },
}
```

---

### 3. color - 颜色选择器 🎨

用于选择颜色。

#### 基础用法

```javascript
{
  key: 'themeColor',
  title: 'Theme Color',
  type: 'color',
  form: {
    required: true,
  },
}
```

#### 表格显示

在表格中显示颜色块 + 色值：

```javascript
{
  key: 'brandColor',
  title: 'Brand Color',
  type: 'color',
  table: {
    width: 150,
  },
}
```

#### 完整示例

```javascript
{
  key: 'primaryColor',
  title: 'Primary Color',
  type: 'color',
  table: {
    width: 150,
  },
  form: {
    required: true,
    placeholder: 'Select primary color',
  },
  tips: 'Choose the primary color for your theme',
}
```

---

### 4. file - 文件上传 📎

用于上传文件（非图片）。

#### 基础用法

```javascript
{
  key: 'attachment',
  title: 'Attachment',
  type: 'file',
  form: {
    max: 5,                    // 最多上传 5 个文件
    accept: '.pdf,.doc,.docx', // 接受的文件类型
    action: '/api/upload',     // 上传地址
  },
}
```

#### 表格显示

在表格中显示文件名标签：

```javascript
{
  key: 'documents',
  title: 'Documents',
  type: 'file',
  table: {
    width: 200,
  },
}
```

#### 完整示例

```javascript
{
  key: 'resume',
  title: 'Resume',
  type: 'file',
  table: {
    width: 200,
  },
  form: {
    max: 1,
    accept: '.pdf,.doc,.docx',
    action: '/api/upload/resume',
    required: true,
  },
  tips: 'Upload your resume (PDF or Word format, max 10MB)',
}
```

---

### 5. time - 时间选择器 ⏰

用于选择时间（不含日期）。

#### 基础用法

```javascript
{
  key: 'startTime',
  title: 'Start Time',
  type: 'time',
  form: {
    format: 'HH:mm:ss', // 时间格式，默认 HH:mm:ss
  },
}
```

#### 只选择小时和分钟

```javascript
{
  key: 'alarmTime',
  title: 'Alarm Time',
  type: 'time',
  form: {
    format: 'HH:mm',
  },
}
```

#### 表格显示

```javascript
{
  key: 'openTime',
  title: 'Open Time',
  type: 'time',
  table: {
    width: 120,
    format: 'HH:mm',
  },
}
```

#### 完整示例

```javascript
{
  key: 'deliveryTime',
  title: 'Delivery Time',
  type: 'time',
  table: {
    width: 120,
    format: 'HH:mm',
  },
  form: {
    format: 'HH:mm',
    required: true,
  },
  search: {
    enabled: true,
    format: 'HH:mm',
  },
  tips: 'Select delivery time',
}
```

---

### 6. cascader - 级联选择 🏗️

用于多级分类选择（如省市区）。

#### 基础用法

```javascript
{
  key: 'location',
  title: 'Location',
  type: 'cascader',
  form: {
    options: [
      {
        value: 'beijing',
        label: 'Beijing',
        children: [
          { value: 'haidian', label: 'Haidian' },
          { value: 'chaoyang', label: 'Chaoyang' },
        ],
      },
      {
        value: 'shanghai',
        label: 'Shanghai',
        children: [
          { value: 'pudong', label: 'Pudong' },
          { value: 'huangpu', label: 'Huangpu' },
        ],
      },
    ],
    changeOnSelect: true, // 允许选择任意级别
    showSearch: true,     // 显示搜索框
  },
}
```

#### 表格显示

在表格中显示为 "省 / 市 / 区" 格式：

```javascript
{
  key: 'address',
  title: 'Address',
  type: 'cascader',
  table: {
    width: 200,
  },
}
```

#### 使用 data 属性

```javascript
{
  key: 'category',
  title: 'Category',
  type: 'cascader',
  data: [
    {
      value: 'electronics',
      label: 'Electronics',
      children: [
        { value: 'phone', label: 'Phone' },
        { value: 'laptop', label: 'Laptop' },
      ],
    },
    {
      value: 'clothing',
      label: 'Clothing',
      children: [
        { value: 'mens', label: "Men's" },
        { value: 'womens', label: "Women's" },
      ],
    },
  ],
}
```

#### 完整示例

```javascript
{
  key: 'region',
  title: 'Region',
  type: 'cascader',
  table: {
    width: 220,
  },
  form: {
    options: provinceOptions,
    changeOnSelect: false,
    showSearch: true,
    required: true,
    placeholder: 'Select province / city / district',
  },
  search: {
    enabled: true,
    options: provinceOptions,
  },
  tips: 'Select your region (province / city / district)',
}
```

---

## 🎯 实际应用示例

### 示例 1：产品评价表单

```javascript
const fieldsConfig = [
  {
    key: 'productName',
    title: 'Product Name',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'rating',
    title: 'Rating',
    type: 'rate',
    form: {
      count: 5,
      allowHalf: true,
      required: true,
    },
    tips: 'How would you rate this product?',
  },
  {
    key: 'satisfaction',
    title: 'Satisfaction',
    type: 'slider',
    form: {
      min: 0,
      max: 100,
      marks: {
        0: '😞',
        50: '😐',
        100: '😊',
      },
    },
  },
  {
    key: 'review',
    title: 'Review',
    type: 'textarea',
  },
];
```

### 示例 2：主题设置表单

```javascript
const fieldsConfig = [
  {
    key: 'primaryColor',
    title: 'Primary Color',
    type: 'color',
    form: { required: true },
  },
  {
    key: 'secondaryColor',
    title: 'Secondary Color',
    type: 'color',
  },
  {
    key: 'fontSize',
    title: 'Font Size',
    type: 'slider',
    form: {
      min: 12,
      max: 24,
      step: 1,
      marks: {
        12: '12px',
        16: '16px',
        20: '20px',
        24: '24px',
      },
    },
  },
];
```

### 示例 3：店铺设置表单

```javascript
const fieldsConfig = [
  {
    key: 'shopName',
    title: 'Shop Name',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'location',
    title: 'Location',
    type: 'cascader',
    form: {
      options: provinceOptions,
      required: true,
    },
  },
  {
    key: 'openTime',
    title: 'Open Time',
    type: 'time',
    form: {
      format: 'HH:mm',
      required: true,
    },
  },
  {
    key: 'closeTime',
    title: 'Close Time',
    type: 'time',
    form: {
      format: 'HH:mm',
      required: true,
    },
  },
  {
    key: 'logo',
    title: 'Logo',
    type: 'image',
  },
  {
    key: 'license',
    title: 'Business License',
    type: 'file',
    form: {
      max: 1,
      accept: '.pdf,.jpg,.png',
    },
  },
];
```

---

## 📊 字段类型总览

### 现在支持的 22 种类型

#### 基础输入（6 个）
1. ✅ text - 单行文本
2. ✅ textarea - 多行文本
3. ✅ richtext - 富文本
4. ✅ number - 数字
5. ✅ money - 金额
6. ✅ percent - 百分比

#### 选择类（4 个）
7. ✅ select - 下拉选择
8. ✅ radio - 单选
9. ✅ checkbox - 多选
10. ✅ switch - 开关

#### 日期时间（4 个）
11. ✅ date - 日期选择
12. ✅ datetime - 日期时间选择
13. ✅ daterange - 日期范围选择
14. ✅ **time** - 时间选择 🆕

#### 上传类（3 个）
15. ✅ image - 图片上传
16. ✅ avatar - 头像上传
17. ✅ **file** - 文件上传 🆕

#### 高级类（5 个）
18. ✅ tag - 标签
19. ✅ password - 密码
20. ✅ **rate** - 评分 🆕
21. ✅ **slider** - 滑块 🆕
22. ✅ **color** - 颜色选择 🆕
23. ✅ **cascader** - 级联选择 🆕

---

## 🔄 与 vk-unicloud 对比

| 类别 | vk (29) | 我们 (22) | 完成度 |
|------|---------|----------|--------|
| 基础输入 | 6 | 6 | ✅ 100% |
| 选择类 | 7 | 5 | 🟡 71% |
| 日期时间 | 2 | 4 | ✅ 200% |
| 上传类 | 3 | 3 | ✅ 100% |
| 高级类 | 11 | 4 | 🟡 36% |
| **总计** | **29** | **22** | **76%** |

### 还缺少的组件（7 个）

#### 选择类（2 个）
- ❌ remote-select - 远程搜索下拉
- ❌ table-select - 表格选择

#### 高级类（5 个）
- ❌ json - JSON 编辑器
- ❌ array - 动态数组
- ❌ tree-select - 树形选择
- ❌ icon - 图标选择器
- ❌ map - 地图选址

---

## 🎨 UI 展示

### rate - 评分
- **表格**: ⭐⭐⭐⭐⭐
- **表单**: 可交互的星星选择
- **详情**: ⭐⭐⭐⭐⭐ 4 / 5

### slider - 滑块
- **表格**: ████░░░░░░ 40
- **表单**: 可拖动的滑块
- **支持**: 刻度标记

### color - 颜色
- **表格**: 🟦 #1890ff
- **表单**: 颜色选择面板
- **显示**: 色块 + 色值

### file - 文件
- **表格**: 📎 document.pdf
- **表单**: 上传按钮 + 文件列表
- **支持**: 多文件上传

### time - 时间
- **表格**: 09:30
- **表单**: 时间选择面板
- **格式**: HH:mm 或 HH:mm:ss

### cascader - 级联
- **表格**: Beijing / Haidian / Zhongguancun
- **表单**: 级联下拉选择
- **支持**: 搜索功能

---

## 🚀 快速开始

### 1. 直接使用

新的组件已经自动注册，直接在 `fieldsConfig` 中使用即可：

```javascript
const fieldsConfig = [
  { key: 'rating', title: 'Rating', type: 'rate' },
  { key: 'volume', title: 'Volume', type: 'slider' },
  { key: 'color', title: 'Color', type: 'color' },
  { key: 'file', title: 'File', type: 'file' },
  { key: 'time', title: 'Time', type: 'time' },
  { key: 'location', title: 'Location', type: 'cascader' },
];
```

### 2. 配置选项

每个组件都支持 `table`, `form`, `search`, `detail` 四个配置维度：

```javascript
{
  key: 'rating',
  type: 'rate',
  table: { /* 表格配置 */ },
  form: { /* 表单配置 */ },
  search: { /* 搜索配置 */ },
  detail: { /* 详情配置 */ },
}
```

### 3. 查看完整文档

- [Smart CRUD 使用指南](./SMART_CRUD.md)
- [字段类型参考](./SMART_CRUD.md#字段类型)
- [VK 特性](./SMART_CRUD_VK_FEATURES.md)

---

## 📝 更新日志

**版本**: v1.2.0  
**日期**: 2025-11-01  
**新增**: 6 个高优先级组件  
**总计**: 22 种字段类型

---

**下一步**: 继续实现剩余 7 个组件，目标 100% 覆盖 vk-unicloud！🎯

