# Smart CRUD - Markdown 编辑器使用指南

> 📦 基于 `@uiw/react-md-editor` 实现

## 🎯 特性

- **实时预览** - 支持分屏预览、纯编辑、纯预览三种模式
- **工具栏** - 内置丰富的 Markdown 工具栏（标题、粗体、斜体、链接、图片等）
- **语法高亮** - 代码块自动语法高亮
- **快捷键** - 支持 Markdown 标准快捷键
- **全屏编辑** - 支持全屏模式
- **暗色模式** - 可切换明暗主题
- **响应式** - 自适应不同屏幕尺寸

---

## 📦 安装

已安装：`@uiw/react-md-editor`

---

## 🚀 使用方式

### 1. 基础用法

在 `fieldsConfig` 中使用 `markdown` 或 `richtext` 类型：

```javascript
{
  key: 'content',
  title: 'Content',
  type: 'markdown',  // 或 'richtext'
  hideInTable: true,
  form: {
    required: true,
  },
}
```

### 2. 自定义高度

```javascript
{
  key: 'content',
  title: 'Content',
  type: 'markdown',
  form: {
    height: 500,  // 默认 400px
  },
}
```

### 3. 自定义预览模式

```javascript
{
  key: 'content',
  title: 'Content',
  type: 'markdown',
  form: {
    preview: 'live',  // 'live' | 'edit' | 'preview'
  },
}
```

**预览模式说明**:
- `live` - 分屏模式（默认）：左侧编辑，右侧预览
- `edit` - 纯编辑模式：只显示编辑器
- `preview` - 纯预览模式：只显示预览

### 4. 完整示例

```javascript
{
  key: 'articleContent',
  title: 'Article Content',
  type: 'markdown',
  hideInTable: true,  // 表格中不显示
  form: {
    required: true,
    height: 600,
    preview: 'live',
    placeholder: 'Write your article in Markdown...',
  },
  tips: 'Supports full Markdown syntax including code blocks, tables, and images',
}
```

---

## 🎨 Markdown 语法支持

### 标题

```markdown
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

### 强调

```markdown
**粗体** or __粗体__
*斜体* or _斜体_
~~删除线~~
```

### 列表

```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```

### 链接和图片

```markdown
[链接文本](https://example.com)
![图片描述](https://example.com/image.jpg)
```

### 代码

行内代码：\`code\`

代码块：
\`\`\`javascript
function hello() {
  console.log('Hello World');
}
\`\`\`

### 引用

```markdown
> 这是一段引用文本
```

### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
```

### 分隔线

```markdown
---
```

---

## 🎯 实际应用场景

### 1. 博客文章编辑

```javascript
const fieldsConfig = [
  {
    key: 'title',
    title: 'Title',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'summary',
    title: 'Summary',
    type: 'textarea',
    form: { required: true },
  },
  {
    key: 'content',
    title: 'Content',
    type: 'markdown',
    hideInTable: true,
    form: {
      required: true,
      height: 600,
      placeholder: 'Write your blog post in Markdown...',
    },
    tips: 'Use Markdown syntax for formatting',
  },
];
```

### 2. 产品文档编辑

```javascript
const fieldsConfig = [
  {
    key: 'productName',
    title: 'Product Name',
    type: 'text',
  },
  {
    key: 'description',
    title: 'Description',
    type: 'markdown',
    hideInTable: true,
    form: {
      height: 400,
      preview: 'live',
    },
  },
  {
    key: 'technicalSpecs',
    title: 'Technical Specifications',
    type: 'markdown',
    hideInTable: true,
    form: {
      height: 500,
    },
  },
];
```

### 3. FAQ 编辑

```javascript
const fieldsConfig = [
  {
    key: 'question',
    title: 'Question',
    type: 'text',
    form: { required: true },
  },
  {
    key: 'answer',
    title: 'Answer',
    type: 'markdown',
    hideInTable: true,
    form: {
      required: true,
      height: 300,
      placeholder: 'Provide a detailed answer...',
    },
  },
];
```

---

## ⚙️ 高级配置

### 1. 自定义工具栏

如果需要更高级的自定义，可以直接使用 `MarkdownEditor` 组件：

```javascript
import MarkdownEditor from '@/components/admin/markdown-editor';

<MarkdownEditor
  value={value}
  onChange={setValue}
  height={500}
  preview="live"
  placeholder="Enter markdown..."
/>
```

### 2. 工具栏按钮

默认工具栏包括：
- 标题（H1-H6）
- 粗体、斜体、删除线
- 引用
- 代码、代码块
- 链接、图片
- 列表（有序、无序）
- 分隔线
- 撤销、重做
- 全屏

---

## 🎨 样式自定义

### 主题切换

编辑器默认使用浅色主题，可以在 `markdown-editor.jsx` 中修改：

```javascript
<div data-color-mode="light">  // 或 "dark"
  <MDEditor ... />
</div>
```

### 自定义样式

可以覆盖默认样式：

```css
/* global.css */
.w-md-editor {
  border-radius: 8px;
}

.w-md-editor-toolbar {
  background: #f5f5f5;
}
```

---

## 📊 表格和详情显示

### 表格显示

Markdown 内容在表格中会显示为纯文本预览（移除 Markdown 标记）：

```javascript
{
  key: 'content',
  type: 'markdown',
  table: {
    width: 300,
    ellipsis: true,  // 超出省略
  },
}
```

### 详情显示

在详情页会渲染完整的 Markdown 内容（需要配合 Markdown 渲染库）。

---

## 🔧 与其他字段类型的对比

| 类型 | 适用场景 | 特性 |
|------|---------|------|
| `text` | 短文本 | 单行输入 |
| `textarea` | 普通多行文本 | 多行输入，无格式 |
| `markdown` | 需要格式的文档 | Markdown 语法，实时预览 |
| `richtext` | 同 markdown | markdown 的别名 |

---

## 💡 最佳实践

### 1. 合理设置高度

- 短内容（备注、简介）：300-400px
- 中等内容（FAQ、说明）：400-500px
- 长内容（文章、文档）：600px+

### 2. 隐藏表格显示

Markdown 内容通常较长，建议在表格中隐藏：

```javascript
hideInTable: true,
```

### 3. 添加提示信息

为用户提供使用提示：

```javascript
tips: 'Supports Markdown syntax. Use # for headers, ** for bold, * for italic',
```

### 4. 必填验证

重要内容添加必填验证：

```javascript
form: {
  required: true,
}
```

---

## 🚨 常见问题

### 1. 编辑器不显示

**原因**: SSR 问题

**解决**: 已使用 `dynamic import` 禁用 SSR
```javascript
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
```

### 2. 样式冲突

**原因**: CSS 未正确导入

**解决**: 确保导入了样式文件
```javascript
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
```

### 3. 图片上传

**注意**: 默认不支持图片上传，需要自己实现

**方案**: 
1. 使用图片 URL
2. 集成图片上传功能
3. 使用第三方图床

---

## 📚 相关资源

- [react-md-editor 文档](https://uiwjs.github.io/react-md-editor/)
- [Markdown 语法](https://www.markdownguide.org/basic-syntax/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

---

## 🎊 总结

Markdown 编辑器特点：
- 功能强大，支持完整 Markdown 语法
- 用户体验好，实时预览
- 集成简单，开箱即用
- 轻量级，性能优秀

**推荐场景**:
- 博客文章
- 产品文档
- 技术文档
- FAQ
- 帮助中心

---

**组件位置**: `components/admin/markdown-editor.jsx`  
**字段类型**: `markdown` 或 `richtext`  
**依赖**: `@uiw/react-md-editor`

