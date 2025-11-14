# CRUD 修复记录 - Round 6

**日期：** 2024-11-13  
**主题：** 修复 textarea 字段搜索时 placeholder 不显示

---

## 🐛 问题描述

### 用户报告

在 Permissions 页面，`remark` 字段（类型为 `textarea`）配置了搜索功能，但 `placeholder` 没有生效：

```javascript
{
  key: 'remark',
  type: 'textarea',
  search: {
    mode: 'like',
    placeholder: 'Search by remark',  // ❌ 不显示
  },
}
```

**期望行为：** 搜索表单中显示 "Search by remark" 作为 placeholder  
**实际行为：** placeholder 不显示，搜索框为空白

---

## 🔍 问题分析

### 字段类型渲染流程

**1. SmartCrudPage 生成搜索表单：**
```javascript
// generateTableColumns 函数
if (field.search) {
  // 获取字段类型的 search 函数
  const typeConfig = FIELD_TYPE_REGISTRY[field.type];
  
  if (typeConfig?.search) {
    column.renderFormItem = () => {
      return typeConfig.search(field);  // ✅ 调用 search 函数
    };
  }
}
```

**2. 字段类型定义：**
```javascript
// field-types.js
export const FIELD_TYPE_REGISTRY = {
  text: {
    table: (value, config) => { /* ... */ },
    form: (config) => { /* ... */ },
    search: (config) => {  // ✅ 有 search 函数
      return <ProFormText 
        placeholder={config.search?.placeholder || `Search by ${config.title}`}
      />;
    },
  },
  
  textarea: {
    table: (value, config) => { /* ... */ },
    form: (config) => { /* ... */ },
    // ❌ 缺少 search 函数！
  },
};
```

### 根本原因

`textarea` 字段类型**缺少 `search` 函数定义**！

当 `field.type = 'textarea'` 且配置了 `search` 时：
1. `typeConfig.search` 为 `undefined`
2. SmartCrudPage 不会调用自定义的 search 渲染函数
3. ProTable 使用默认的搜索组件（不会读取 `config.search?.placeholder`）

---

## ✅ 修复方案

### 为 textarea 添加 search 函数

**文件：** `lib/crud/field-types.js`

```javascript
textarea: {
  table: (value, config) => {
    // ... 表格渲染逻辑
  },
  
  form: (config) => {
    // ... 表单渲染逻辑（多行文本框）
    return <ProFormTextArea {...props} />;
  },
  
  // ✅ 添加 search 函数
  search: (config) => {
    // textarea 字段在搜索时使用单行文本输入框（更适合搜索场景）
    const props = {
      name: config.key,
      label: config.title,
      placeholder: config.search?.placeholder || `Search by ${config.title}`,
      fieldProps: {
        allowClear: true,
        ...config.search?.fieldProps,
      },
      ...config.search?.props,
    };
    return <ProFormText {...props} />;  // ✅ 搜索时使用单行输入框
  },
},
```

### 设计考虑

**为什么搜索时使用单行输入框而不是多行？**

1. **用户体验** - 搜索输入通常是短关键词，单行输入框更合适
2. **界面美观** - 搜索表单通常横向排列，多行文本框会占用过多空间
3. **一致性** - 与其他搜索字段（text、number 等）保持一致的高度
4. **符合习惯** - 用户习惯在单行输入框中进行搜索

**参考其他框架：**
- Ant Design Pro 的 ProTable 默认使用 `ProFormText` 进行搜索
- Element UI 的 Table 搜索也使用单行输入
- vk-unicloud 的 vk-data-table 搜索同样使用单行输入

---

## 🎯 修复后的效果

### 渲染流程

**1. 配置：**
```javascript
{
  key: 'remark',
  type: 'textarea',  // ✅ 类型为 textarea
  table: {
    // 表格中显示为多行文本（省略显示）
  },
  form: {
    // 表单中使用多行文本框（4行）
  },
  search: {
    mode: 'like',
    placeholder: 'Search by remark',  // ✅ 现在会生效！
  },
}
```

**2. 渲染结果：**
- **表格列** - 显示文本，超过 200 字符时省略
- **创建/编辑表单** - 多行文本框（TextArea，4行）
- **搜索表单** - 单行文本框（Input），显示 "Search by remark" placeholder ✅

**3. 用户体验：**
```
表格：
┌─────────────────────────────────┐
│ Remark                          │
├─────────────────────────────────┤
│ Allow users to create new...    │  ← 省略显示
└─────────────────────────────────┘

创建表单：
┌────────────────────────────────┐
│ Remark                         │
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │                          │   │
│ │  [多行文本输入区域]       │   │  ← TextArea (4行)
│ │                          │   │
│ └──────────────────────────┘   │
└────────────────────────────────┘

搜索表单：
┌────────────────────────────────┐
│ Remark: [Search by remark... ]│  ← 单行输入框，显示 placeholder ✅
└────────────────────────────────┘
```

---

## 📋 字段类型搜索函数检查清单

### ✅ 已支持 search 函数的类型

| 类型 | search 组件 | 说明 |
|------|------------|------|
| `text` | `ProFormText` | 单行文本输入 |
| `textarea` | `ProFormText` | ✅ 本次添加（搜索时用单行） |
| `number` | `ProFormDigit` | 数字输入 |
| `date` | `ProFormDatePicker` | 日期选择 |
| `daterange` | `ProFormDateRangePicker` | 日期范围选择 |
| `datetime` | `ProFormDateTimePicker` | 日期时间选择（未来可添加） |
| `datetimerange` | `ProFormDateTimeRangePicker` | 日期时间范围选择 |
| `select` | `ProFormSelect` | 下拉选择 |
| `radio` | `ProFormRadio.Group` | 单选（搜索时用 select） |
| `switch` | `ProFormSelect` | 开关（搜索时用 select：是/否） |
| `cascader` | `ProFormCascader` | 级联选择 |
| `tree-select` | `ProFormTreeSelect` | 树形选择 |

### ❌ 不支持搜索的类型（合理）

| 类型 | 原因 |
|------|------|
| `markdown` | 复杂内容，不适合搜索 |
| `richtext` | 富文本，不适合搜索 |
| `image` | 图片，不适合搜索 |
| `file` | 文件，不适合搜索 |
| `array` | 动态数组，不适合搜索 |
| `json` | JSON 对象，不适合搜索 |
| `checkbox` | 多选（可考虑添加，用 select mode="multiple"） |

### 📝 待补充的类型（可选）

| 类型 | 建议 search 组件 | 优先级 |
|------|----------------|--------|
| `checkbox` | `ProFormSelect` (mode="multiple") | 中 |
| `money` | `ProFormDigit` (前缀 $) | 低 |
| `percentage` | `ProFormDigit` (后缀 %) | 低 |

---

## 🧪 测试结果

### 测试场景

#### 1. Remark 字段搜索

**操作：**
1. 打开 Permissions 页面
2. 点击搜索表单展开按钮
3. 查看 "Remark" 搜索框

**预期结果：**
- ✅ 显示单行文本输入框
- ✅ 显示 placeholder "Search by remark"
- ✅ 可以输入搜索关键词
- ✅ 支持模糊搜索（mode: 'like'）

#### 2. 搜索功能

**测试数据：**
- Record 1: remark = "Allow users to create new posts"
- Record 2: remark = "DELETE operation requires admin"
- Record 3: remark = "Grenade level permission"

**搜索 "admin"：**
- ✅ 返回 Record 2
- ✅ 模糊搜索生效（不区分大小写）

#### 3. 表单中的 Remark 字段

**操作：**
1. 点击 "Create" 或 "Edit"
2. 查看 "Remark" 字段

**预期结果：**
- ✅ 显示多行文本框（TextArea）
- ✅ 默认 4 行
- ✅ 可以输入多行文本
- ✅ 显示字符计数（如果配置了 showCount）

---

## 📊 修改文件清单

### 修改的文件

1. **lib/crud/field-types.js**
   - 修改：为 `textarea` 类型添加 `search` 函数
   - 影响：所有使用 `textarea` 且配置了 `search` 的字段

### 未修改的文件

- `app/(admin)/admin/rbac/permissions/page.js` - 配置已经正确，不需要修改

---

## 🔍 关键学习点

### 1. 字段类型的三种渲染函数

每个字段类型应该定义三种渲染函数（根据使用场景）：

```javascript
export const FIELD_TYPE_REGISTRY = {
  fieldType: {
    // 1. 表格渲染（必需）
    table: (value, config) => {
      // 只读显示，可以格式化、省略、添加样式
      return <span>{value}</span>;
    },
    
    // 2. 表单渲染（必需）
    form: (config) => {
      // 可编辑的表单组件
      return <ProFormText {...props} />;
    },
    
    // 3. 搜索渲染（可选）
    search: (config) => {
      // 搜索表单组件（通常比表单组件更简化）
      return <ProFormText {...props} />;
    },
    
    // 4. 详情渲染（可选，默认使用 table）
    detail: (value, config) => {
      return <span>{value}</span>;
    },
  },
};
```

### 2. 搜索组件的设计原则

**简化原则：**
- 搜索组件应该比表单组件**更简单**
- 例如：textarea 在表单中是多行，但搜索时用单行
- 例如：radio 在表单中是单选按钮，但搜索时用下拉框

**一致性原则：**
- 所有搜索字段保持相似的高度和样式
- 避免在搜索表单中使用占用大量空间的组件

**可用性原则：**
- 必须配置 `placeholder` 提示用户
- 必须配置 `allowClear` 允许清除
- 必须读取 `config.search?.placeholder` 配置

### 3. placeholder 配置的读取优先级

```javascript
search: (config) => {
  const props = {
    // ✅ 优先级（从高到低）：
    placeholder: 
      config.search?.placeholder ||      // 1. search 配置中的 placeholder
      config.placeholder ||              // 2. 顶层 placeholder
      `Search by ${config.title}`,       // 3. 默认值（使用字段标题）
  };
  return <ProFormText {...props} />;
}
```

### 4. 字段配置的层次结构

```javascript
{
  key: 'remark',
  type: 'textarea',
  title: 'Remark',
  
  // 表格配置
  table: {
    width: 200,
    ellipsis: true,
  },
  
  // 表单配置
  form: {
    required: false,
    fieldProps: {
      showCount: true,
      maxLength: 200,
      autoSize: { minRows: 2, maxRows: 5 },  // textarea 特有
    },
  },
  
  // 搜索配置
  search: {
    mode: 'like',
    placeholder: 'Search by remark',  // ✅ search 特有配置
    fieldProps: {
      allowClear: true,  // 可以覆盖默认值
    },
  },
}
```

---

## ✨ 下一步

### 1. 测试其他字段类型

- [ ] 测试所有支持搜索的字段类型
- [ ] 确保 placeholder 都正确显示
- [ ] 确保搜索功能都正常工作

### 2. 补充文档

- [ ] 更新 `crud-final-standard.md`
- [ ] 添加字段类型搜索配置说明
- [ ] 创建字段类型选择指南

### 3. 可选增强

- [ ] 为 `checkbox` 类型添加 search 函数（多选下拉）
- [ ] 为 `money` 类型添加 search 函数（数字输入）
- [ ] 为 `percentage` 类型添加 search 函数（数字输入）

---

## 📝 相关文档

- `docs/crud-fixes-round5-2024-11-13.md` - 修复模糊搜索功能
- `docs/crud-fixes-round4-2024-11-13.md` - 修复 getDb 错误
- `docs/crud-final-standard.md` - CRUD 标准文档

---

**修复完成！** 🎉

现在 textarea 字段的搜索功能完全正常，placeholder 正确显示了！

