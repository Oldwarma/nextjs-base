# Smart CRUD - 示例页面使用指南

> 📍 位置: `app/(admin)/admin/example/page.js`

## 🎯 页面概述

示例页面是一个**完整的演示页面**，展示了 Smart CRUD 系统支持的所有 **26 种字段类型**。

这个页面可以帮助你：
- ✅ 快速了解所有字段类型的实际效果
- ✅ 查看每种类型在表格、表单、搜索中的表现
- ✅ 作为开发新页面的参考模板
- ✅ 测试新功能和新组件

---

## 🚀 如何访问

1. 启动开发服务器：
```bash
npm run dev
```

2. 访问示例页面：
```
http://localhost:3000/admin/example
```

---

## 📋 展示的 26 种字段类型

### 基础输入（6 个）

| 字段 | 类型 | 说明 |
|------|------|------|
| Title | `text` | 文本输入，支持搜索 |
| Description | `textarea` | 多行文本 |
| Rich Content | `richtext` | 富文本编辑器 |
| Quantity | `number` | 数字输入，支持范围搜索 |
| Price | `money` | 金额输入，支持范围搜索 |
| Discount | `percent` | 百分比输入 |

### 选择类（6 个）

| 字段 | 类型 | 说明 |
|------|------|------|
| Category | `select` | 单选下拉，支持搜索 |
| Priority | `radio` | 单选按钮组，支持搜索 |
| Features | `checkbox` | 多选框组 |
| Active | `switch` | 开关，支持搜索 |
| Location | `cascader` | 级联选择（国家>州>城市）|
| Department | `tree-select` | 树形选择（部门结构）|

### 日期时间（4 个）

| 字段 | 类型 | 说明 |
|------|------|------|
| Launch Date | `date` | 日期选择，支持范围搜索 |
| Published At | `datetime` | 日期时间，支持范围搜索 |
| Campaign Period | `daterange` | 日期范围 |
| Delivery Time | `time` | 时间选择 |

### 上传类（3 个）

| 字段 | 类型 | 说明 |
|------|------|------|
| Cover Image | `image` | 图片上传，表格显示缩略图 |
| Author Avatar | `avatar` | 头像上传，圆形显示 |
| Attachment | `file` | 文件上传 |

### 高级类（7 个）

| 字段 | 类型 | 说明 |
|------|------|------|
| Tags | `tag` | 标签选择，彩色显示 |
| API Key | `password` | 密码输入，隐藏显示 |
| Rating | `rate` | 评分，支持半星 |
| Satisfaction | `slider` | 滑块（0-100%）|
| Brand Color | `color` | 颜色选择器 |
| Icon | `icon` | 图标选择器 |
| Metadata | `json` | JSON 编辑器，支持验证 |
| Keywords | `array` | 数组输入（每行一个）|

---

## 🎨 页面特性

### 1. 完整的 CRUD 功能

```javascript
// 启用所有功能
enableCreate={true}    // ✅ 创建
enableEdit={true}      // ✅ 编辑
enableDelete={true}    // ✅ 删除
enableDetail={true}    // ✅ 详情
```

### 2. 智能搜索

支持 7 个字段的搜索：
- Title（模糊搜索）
- Quantity（范围搜索）
- Price（范围搜索）
- Category（精确搜索）
- Priority（精确搜索）
- Active（布尔搜索）
- Department（树形搜索）
- Launch Date（日期范围搜索）
- Published At（日期时间范围搜索）

### 3. 表格优化

- 固定列（Title 固定在左侧）
- 横向滚动（支持超宽表格）
- 列宽自定义
- 文本省略

### 4. 表单增强

- 必填项验证
- 数值范围限制
- 提示信息（tips）
- 占位符（placeholder）

---

## 💡 代码结构

### 1. 树形数据定义

```javascript
const departmentTree = [
  {
    value: 'engineering',
    title: 'Engineering',
    children: [
      { value: 'frontend', title: 'Frontend Team' },
      { value: 'backend', title: 'Backend Team' },
    ],
  },
  // ...
];
```

### 2. 级联数据定义

```javascript
const locationData = [
  {
    value: 'us',
    label: 'United States',
    children: [
      {
        value: 'ca',
        label: 'California',
        children: [
          { value: 'sf', label: 'San Francisco' },
        ],
      },
    ],
  },
  // ...
];
```

### 3. 字段配置

```javascript
const fieldsConfig = [
  {
    key: 'title',
    title: 'Title',
    type: 'text',
    table: {
      width: 200,
      fixed: 'left',
    },
    form: {
      required: true,
    },
    search: {
      enabled: true,
      mode: 'like',
    },
    tips: 'Enter a descriptive title',
  },
  // ... 更多字段
];
```

### 4. 模拟 Actions

```javascript
const actions = {
  list: async (params) => {
    // 返回模拟数据
    return {
      success: true,
      data: mockData,
      total: 100,
    };
  },
  create: async (data) => { /* ... */ },
  update: async (id, data) => { /* ... */ },
  delete: async (id) => { /* ... */ },
};
```

---

## 🎯 使用场景

### 1. 学习参考

当你需要使用某种字段类型时：
1. 打开示例页面
2. 查看该类型的配置
3. 复制到你的项目中

### 2. 测试新功能

当你添加新特性时：
1. 在示例页面中测试
2. 确保所有类型正常工作
3. 验证兼容性

### 3. 演示系统

向团队成员展示 Smart CRUD 的能力：
1. 打开示例页面
2. 演示各种字段类型
3. 展示搜索、排序、分页等功能

---

## 🔧 自定义示例页面

### 1. 添加新字段类型

```javascript
fieldsConfig.push({
  key: 'newField',
  title: 'New Field',
  type: 'your-new-type',
  // ... 配置
});
```

### 2. 修改模拟数据

```javascript
const mockData = Array.from({ length: 10 }, (_, i) => ({
  _id: `example-${i + 1}`,
  title: `Custom Title ${i + 1}`,
  // ... 更多字段
}));
```

### 3. 连接真实后端

```javascript
const actions = {
  list: async (params) => {
    const response = await fetch('/api/examples', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.json();
  },
  // ... 其他 actions
};
```

---

## 📊 性能优化

### 1. 表格滚动

```javascript
// 设置横向滚动
scroll={{ x: 2500 }}
```

### 2. 列宽控制

```javascript
{
  key: 'title',
  table: {
    width: 200,  // 固定宽度
    ellipsis: true,  // 超出省略
  },
}
```

### 3. 隐藏不常用列

```javascript
{
  key: 'description',
  hideInTable: true,  // 表格中不显示
}
```

---

## 🎨 最佳实践

### 1. 字段分组

按类型分组字段，便于维护：

```javascript
// ============================================
// 基础输入（6 个）
// ============================================

// ============================================
// 选择类（6 个）
// ============================================

// 等...
```

### 2. 注释说明

为每个字段添加注释：

```javascript
{
  key: 'rating',
  title: 'Rating',
  type: 'rate',
  // 支持半星，最多 5 星
  form: {
    count: 5,
    allowHalf: true,
  },
}
```

### 3. 提示信息

为复杂字段添加 tips：

```javascript
{
  key: 'metadata',
  type: 'json',
  tips: 'Enter metadata in JSON format',
}
```

---

## 🚨 常见问题

### 1. 页面加载缓慢

**原因**: 字段太多，表格渲染慢

**解决**:
```javascript
// 隐藏部分字段
hideInTable: true
```

### 2. 表格宽度溢出

**原因**: 列太多

**解决**:
```javascript
// 启用横向滚动
scroll={{ x: 2500 }}
```

### 3. 搜索不生效

**原因**: 未启用搜索或模式错误

**解决**:
```javascript
search: {
  enabled: true,
  mode: 'like',  // 确保模式正确
}
```

---

## 📝 相关文档

- [Smart CRUD 完整指南](./SMART_CRUD.md)
- [所有字段类型](./SMART_CRUD_QUICKSTART.md)
- [VK 特性](./SMART_CRUD_VK_FEATURES.md)
- [新增组件 (v1.2.0)](./SMART_CRUD_NEW_COMPONENTS.md)
- [高级组件 (v1.3.0)](./SMART_CRUD_ADVANCED_COMPONENTS.md)

---

## 🎊 总结

示例页面是：
- ✅ 最全面的字段类型展示
- ✅ 最佳的学习参考资料
- ✅ 最好的功能测试平台
- ✅ 最直观的系统演示工具

**推荐**: 开发新功能前，先在示例页面中测试！

---

**页面地址**: `/admin/example`  
**字段数量**: 30 个字段  
**字段类型**: 26 种  
**功能**: 完整的 CRUD + 搜索 + 排序 + 分页

