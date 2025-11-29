# CRUD 修复记录 - Round 7 (2024-11-13)

## 问题描述

### 1. TreeSelect 组件警告

**现象：**
- 控制台警告 1：`Warning: TreeNode value is invalidate: undefined`
- 控制台警告 2：`Warning: key or value with TreeNode must be the same or you can remove one of them. key: root, value: null.`

**影响：**
- Menus 页面创建/更新弹窗中的 Parent Menu TreeSelect 出现警告
- 破坏用户体验，可能影响后续功能

---

### 2. Select/TreeSelect 组件缺少 Placeholder

**现象：**
- Create 时，Select/TreeSelect 显示空白，没有提示文字
- Update 时，如果字段非必填且为空，也显示空白

**影响：**
- 用户体验差，不知道该字段是做什么的
- 对于可选字段，无法区分是"未选择"还是"加载中"

---

## 根本原因

### 1. TreeSelect 警告原因

**问题代码（`crud-action.menu.js`）：**

```javascript
const formattedTree = [
  { title: '--- Root Menu ---', value: null, key: 'root' }, // ❌ 问题
  ...convertToTreeSelectFormat(result.rows || []),
];
```

**原因分析：**
1. **`value: null`** - Ant Design TreeSelect 不接受 `null` 或 `undefined` 作为有效值
2. **`key: 'root'` vs `value: null`** - TreeSelect 要求 `key` 和 `value` 必须相同

---

### 2. Placeholder 缺失原因

**问题代码（`field-types.js` - select 类型）：**

```javascript
form: (config) => {
  const props = getCommonFormProps(config);
  const options = config.options || config.data || config.form?.options || config.form?.data;
  const fieldProps = {
    showSearch: true,
    // ❌ 缺少 placeholder
    ...props.fieldProps,
  };
  
  return (
    <ProFormSelect
      {...props}  // ❌ placeholder 在顶层，Select 不使用
      options={options}
      valueEnum={config.valueEnum}
      fieldProps={fieldProps}
    />
  );
},
```

**原因分析：**
1. `getCommonFormProps` 生成的 `placeholder` 在顶层 props 中
2. 但 Ant Design Select 组件需要 `placeholder` 在 `fieldProps` 中
3. `getCommonFormProps` 生成的默认文案是 `Enter ${config.title}`，不适合 Select（应该是 `Select ${config.title}`）

---

## 解决方案

### 1. 修复 TreeSelect 警告

**修改文件：** `app/(admin)/actions/rbac/crud-action.menu.js`

**修复代码：**

```javascript
const formattedTree = [
  { title: '--- Root Menu ---', value: '', key: '' }, // 使用空字符串
  ...convertToTreeSelectFormat(result.rows || []),
];
```

**数据流说明：**

1. **UI 层：** TreeSelect 接收空字符串 `''`（避免警告）
2. **Form 层：** 用户选择 "Root Menu" 时，form 得到 `parent_id: ''`
3. **Transform 层：** `crud-action.menu.js` 的 `transforms.input` 将空字符串转换为 `null`：
   ```javascript
   if (data.parent_id === '') {
     data.parent_id = null;
   }
   ```
4. **数据库层：** 保存为 `parent_id: null`（顶级菜单）

**为什么这样做：**
- TreeSelect 兼容（空字符串是有效值）
- 数据库语义正确（`null` 表示顶级）
- `key` 和 `value` 一致（都是 `''`）
- 通过 `transforms.input` 分离 UI 层和数据层

---

### 2. 修复 Select Placeholder

**修改文件：** `lib/crud/field-types.js`

**修复代码（select 类型）：**

```javascript
form: (config) => {
  const props = getCommonFormProps(config);
  const options = config.options || config.data || config.form?.options || config.form?.data;
  const fieldProps = {
    showSearch: true,
    placeholder: config.form?.placeholder || config.placeholder || `Select ${config.title}`, // 添加到 fieldProps
    ...props.fieldProps,
  };
  
  // 移除顶层的 placeholder（Select 不需要）
  const { placeholder, ...propsWithoutPlaceholder } = props;
  
  return (
    <ProFormSelect
      {...propsWithoutPlaceholder}
      options={options}
      valueEnum={config.valueEnum}
      fieldProps={fieldProps}
    />
  );
},
```

**关键改动：**
1. 在 `fieldProps` 中添加 `placeholder`
2. 从顶层 props 中移除 `placeholder`
3. 使用更合适的默认文案 `Select ${config.title}`

---

### 3. 修复 TreeSelect Placeholder

**修改文件：** `lib/crud/field-types.js`

**修复代码（tree-select 类型）：**

```javascript
// 构建新的 fieldProps，确保移除废弃属性
const fieldProps = {
  treeData,
  multiple,
  treeCheckable,
  showSearch,
  treeDefaultExpandAll: true,
  placeholder: config.form?.placeholder || config.placeholder || `Select ${config.title}`, // 添加 placeholder
  ...rawFieldProps,
};
```

**关键改动：**
1. 在 `fieldProps` 中添加 `placeholder`
2. 默认文案：`Select ${config.title}`

---

## 技术细节

### 1. TreeSelect 的 Value 要求

**Ant Design TreeSelect 文档：**
- `value` 可以是：`string | number | string[] | number[]`
- ❌ `value` 不能是：`null | undefined`
- `key` 和 `value` 必须相同（单选时）

**我们的选择：**
- 使用 **空字符串 `''`** 而不是 `null`
- 在 `transforms.input` 中转换为 `null`

---

### 2. Ant Design Select/TreeSelect 的 Placeholder 位置

**正确的 Placeholder 配置：**

```javascript
// ❌ 错误：在顶层
<Select placeholder="Please select" />

// 正确：在 ProForm 中通过 fieldProps
<ProFormSelect
  fieldProps={{
    placeholder: "Please select"
  }}
/>
```

**为什么：**
- ProForm 组件是对 Ant Design 组件的封装
- `fieldProps` 中的属性会直接传递给底层的 Ant Design 组件
- 顶层的 `placeholder` 是 ProForm 的属性，不会传递给 Select

---

### 3. 为什么用空字符串而不是特殊值？

**其他方案对比：**

| 方案 | 优点 | 缺点 |
|------|------|------|
| `value: null` | 语义清晰 | ❌ TreeSelect 不支持 |
| `value: 'root'` | TreeSelect 支持 | ❌ 需要在多处特殊处理 "root" |
| `value: 0` | TreeSelect 支持 | ❌ 与真实 ID 冲突 |
| `value: ''` (空字符串) | TreeSelect 支持<br>转换简单<br>语义合理 | 需要 transform |

**最终选择：** 空字符串 + Transform

---

## 影响范围

### 修改的文件

1. **`app/(admin)/actions/rbac/crud-action.menu.js`**
   - 修复 `getMenuTreeForSelectAction` 的 Root 节点定义

2. **`lib/crud/field-types.js`**
   - 修复 `select` 类型的 `form` 函数（添加 placeholder）
   - 修复 `tree-select` 类型的 `form` 函数（添加 placeholder）

### 影响的功能

**Menus 页面**
- Create Modal 的 Parent Menu 字段
- Update Modal 的 Parent Menu 字段

**Permissions 页面**
- Create Modal 的 Parent Permission 字段
- Update Modal 的 Parent Permission 字段

**所有使用 Select/TreeSelect 的页面**
- 现在都会正确显示 placeholder

---

## 测试验证

### 1. TreeSelect 警告验证

**测试步骤：**
1. 打开 Menus 页面
2. 点击 "Create" 按钮
3. 查看浏览器控制台

**预期结果：**
- 没有 TreeSelect 警告
- Parent Menu 字段显示 "Select Parent Menu" placeholder
- 下拉菜单中有 "--- Root Menu ---" 选项

---

### 2. Placeholder 显示验证

**测试步骤：**
1. 打开 Menus 页面
2. 点击 "Create" 按钮
3. 观察所有 Select/TreeSelect 字段

**预期结果：**
- Parent Menu 显示 "Select Parent Menu"
- 所有 Select 字段都有合适的 placeholder

---

### 3. Root Menu 选择验证

**测试步骤：**
1. 打开 Menus 页面
2. 点击 "Create" 按钮
3. Parent Menu 选择 "--- Root Menu ---"
4. 填写其他必填字段，保存

**预期结果：**
- 创建成功
- 数据库中 `parent_id` 为 `null`
- 列表中显示为顶级菜单

---

### 4. 非必填字段为空验证

**测试步骤：**
1. 打开 Menus 页面
2. 点击某条记录的 "Edit" 按钮
3. 观察 `remark` 字段（非必填，可能为空）

**预期结果：**
- 如果 `remark` 为空，显示 placeholder "Enter Remark"
- 不会显示空白
- 用户体验良好

---

## 最佳实践总结

### 1. TreeSelect Root 节点配置

**推荐模式：**

```javascript
// 1. Action 中返回 UI 兼容的格式
export const getTreeForSelectAction = async () => {
  // ...
  return {
    success: true,
    data: [
      { title: '--- Root ---', value: '', key: '' }, // 空字符串
      ...actualTreeData,
    ],
  };
};

// 2. Config 中通过 transform 转换
export const config = {
  transforms: {
    input: (data) => {
      if (data.parent_id === '') {
        data.parent_id = null; // 转为 null
      }
      return data;
    },
  },
};
```

---

### 2. Select/TreeSelect Placeholder 配置

**推荐配置：**

```javascript
{
  key: 'parent_id',
  title: 'Parent Menu',
  type: 'tree-select',
  form: {
    placeholder: 'Select Parent Menu', // 显式配置
    action: getMenuTreeForSelectAction,
  },
}
```

**自动生成的默认值：**
- Select/TreeSelect: `Select ${config.title}`
- Input: `Enter ${config.title}`
- Textarea: `Enter ${config.title}`

---

### 3. ProForm 组件属性传递规则

**记住：**
- `fieldProps` 中的属性 → 传递给底层 Ant Design 组件
- 顶层属性 → ProForm 自己使用，不传递

**示例：**

```javascript
<ProFormSelect
  name="field"
  label="Label"              // ProForm 属性
  rules={[...]}              // ProForm 属性
  fieldProps={{
    placeholder: "Select",   // 传递给 Select
    showSearch: true,        // 传递给 Select
    allowClear: true,        // 传递给 Select
  }}
/>
```

---

## 后续优化建议

### 1. 统一 Placeholder 生成逻辑

**建议：**
- 在 `getCommonFormProps` 中根据 `type` 生成不同的默认 placeholder
- Select/TreeSelect: `Select ${title}`
- Input/Textarea: `Enter ${title}`
- DatePicker: `Select ${title}`

---

### 2. 封装 Root 节点注入逻辑

**建议：**
- 在 `DynamicFormFields` 中自动为 TreeSelect 添加 Root 节点
- 通过配置控制是否显示 Root 节点

**示例配置：**

```javascript
{
  key: 'parent_id',
  type: 'tree-select',
  form: {
    showRootOption: true,           // 是否显示 Root 选项
    rootOptionLabel: '--- Root ---', // Root 选项文案
  },
}
```

---

### 3. 增强 Transform 文档

**建议：**
- 在文档中明确说明 `transforms.input` 和 `transforms.output` 的使用场景
- 提供更多 UI 层和数据层分离的示例

---

## 相关文档

- [Ant Design TreeSelect](https://ant.design/components/tree-select-cn)
- [Ant Design Select](https://ant.design/components/select-cn)
- [ProComponents ProFormSelect](https://procomponents.ant.design/components/form#proformselect)

---

## 提交信息建议

```
fix: 修复 TreeSelect 警告和 Select Placeholder 缺失问题

1. 修复 TreeSelect Root 节点警告
   - 使用空字符串代替 null 作为 value
   - 确保 key 和 value 一致

2. 修复 Select/TreeSelect 缺少 Placeholder
   - 在 fieldProps 中添加 placeholder
   - 使用更合适的默认文案 "Select ${title}"

3. 优化用户体验
   - Create 时显示明确的提示文字
   - Update 时对空值字段也显示 placeholder

影响范围：Menus、Permissions 等所有使用 TreeSelect 的页面
```

