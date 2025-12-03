# 创建第一个页面

<div align="center">

**15 分钟学会使用 SmartCrudPage 创建管理页面**

[准备工作](#-准备工作) · [创建步骤](#-创建步骤) · [验证测试](#-验证测试)

</div>

---

## 📋 概述

本教程将指导你使用 **SmartCrudPage** 模板创建一个完整的 CRUD 管理页面。

### 你将学到

- ✅ 如何设计 Prisma 数据模型
- ✅ 如何创建 Server Actions
- ✅ 如何配置 SmartCrudPage
- ✅ 如何添加后台菜单

### 最终效果

创建一个「公告管理」页面，包含：
- 📋 数据列表（分页、排序、搜索）
- ➕ 新增公告
- ✏️ 编辑公告
- 🗑️ 删除公告
- 👁️ 查看详情

---

## 🔧 准备工作

### 1. 设计数据模型

在 `prisma/schema.prisma` 中添加公告模型：

```prisma
model Announcement {
  id        String    @id @default(cuid())
  title     String                        // 公告标题
  content   String    @db.Text            // 公告内容
  type      String    @default("info")    // 类型：info/warning/success
  enable    Boolean   @default(true)      // 是否启用
  sort      Int       @default(0)         // 排序
  remark    String?                       // 备注
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?                     // 软删除
}
```

### 2. 执行数据库迁移

```bash
npx prisma migrate dev --name add_announcement
```

---

## 📝 创建步骤

### Step 1: 创建 Server Actions

创建文件 `app/(admin)/actions/content/crud-action.announcement.js`：

```javascript
'use server'

import { createCrudActions } from '@/lib/core/crud-helper'

/**
 * 公告管理 - Server Actions
 * 
 * 命名规范：
 * - sys 前缀：需要后台权限
 * - auth 前缀：需要登录
 * - pub 前缀：公开访问
 */

// 资源配置
const announcementConfig = {
  // 基础配置
  modelName: 'announcement',
  primaryKey: 'id',
  softDelete: true,
  
  // 字段配置
  fields: {
    creatable: ['title', 'content', 'type', 'enable', 'sort', 'remark'],
    updatable: ['title', 'content', 'type', 'enable', 'sort', 'remark'],
    searchable: ['title', 'content', 'type'],
  },
  
  // 查询配置
  query: {
    defaultSort: { sort: 'asc', createdAt: 'desc' },
    defaultPageSize: 20,
  },
  
  // 验证规则
  validation: {
    title: {
      required: true,
      maxLength: 100,
      message: '标题必填，最多 100 个字符'
    },
    content: {
      required: true,
      message: '内容必填'
    },
    type: {
      enum: ['info', 'warning', 'success'],
      message: '类型必须是 info/warning/success'
    }
  }
}

// 导出 CRUD Actions
export const {
  getList: getAnnouncementListAction,
  getDetail: getAnnouncementDetailAction,
  create: createAnnouncementAction,
  update: updateAnnouncementAction,
  delete: deleteAnnouncementAction,
} = createCrudActions(announcementConfig)
```

### Step 2: 创建前端页面

创建文件 `app/(admin)/admin/content/announcements/page.js`：

```javascript
'use client'

import SmartCrudPage from '@/components/admin/smart-crud-page'
import * as announcementActions from '@/app/(admin)/actions/content/crud-action.announcement'

/**
 * 公告管理页面
 */
export default function AnnouncementsPage() {
  // 字段配置 - 核心配置，驱动整个页面
  const fieldsConfig = [
    {
      key: 'id',
      title: 'ID',
      type: 'text',
      table: { width: 80, copyable: true },
      form: { hidden: true },
    },
    {
      key: 'title',
      title: '公告标题',
      type: 'text',
      table: { width: 200, ellipsis: true },
      form: { required: true, placeholder: '请输入公告标题' },
      search: { enabled: true, mode: 'like' },
    },
    {
      key: 'content',
      title: '公告内容',
      type: 'textarea',
      table: { width: 300, ellipsis: true },
      form: { required: true, rows: 4 },
    },
    {
      key: 'type',
      title: '类型',
      type: 'select',
      options: [
        { label: '📢 通知', value: 'info' },
        { label: '⚠️ 警告', value: 'warning' },
        { label: '✅ 成功', value: 'success' },
      ],
      table: { width: 100 },
      form: { required: true },
      search: { enabled: true, mode: 'exact' },
    },
    {
      key: 'enable',
      title: '状态',
      type: 'switch',
      table: {
        width: 80,
        render: (value) => value ? '✅ 启用' : '❌ 禁用'
      },
      form: { defaultValue: true },
      search: { enabled: true, mode: 'exact' },
    },
    {
      key: 'sort',
      title: '排序',
      type: 'number',
      table: { width: 80, sorter: true },
      form: { defaultValue: 0, min: 0 },
    },
    {
      key: 'remark',
      title: '备注',
      type: 'textarea',
      table: { hidden: true },
      form: { rows: 2 },
    },
    {
      key: 'createdAt',
      title: '创建时间',
      type: 'datetime',
      table: { width: 180, sorter: true },
      form: { hidden: true },
      search: { enabled: true, mode: 'range' },
    },
  ]

  // Actions 配置
  const actions = {
    getList: announcementActions.getAnnouncementListAction,
    getDetail: announcementActions.getAnnouncementDetailAction,
    create: announcementActions.createAnnouncementAction,
    update: announcementActions.updateAnnouncementAction,
    delete: announcementActions.deleteAnnouncementAction,
  }

  return (
    <SmartCrudPage
      title="公告管理"
      fieldsConfig={fieldsConfig}
      actions={actions}
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
      enableDetail={true}
    />
  )
}
```

### Step 3: 添加菜单（可选）

在后台管理的「菜单管理」页面添加新菜单：

| 字段 | 值 |
|:---|:---|
| 名称 | 公告管理 |
| URL | /admin/content/announcements |
| 图标 | BellOutlined |
| 父级菜单 | 内容管理（如果有） |
| 排序 | 10 |

---

## ✅ 验证测试

### 1. 启动开发服务器

```bash
npm run dev
```

### 2. 访问页面

打开浏览器访问：[http://localhost:3000/admin/content/announcements](http://localhost:3000/admin/content/announcements)

### 3. 功能测试

- [ ] 列表正常显示
- [ ] 点击「新建」可以打开表单
- [ ] 填写表单后可以保存
- [ ] 点击「编辑」可以修改数据
- [ ] 点击「删除」可以删除数据
- [ ] 搜索功能正常工作
- [ ] 分页功能正常工作

---

## 🎨 进阶配置

### 添加自定义操作按钮

```javascript
const customRowActions = [
  {
    key: 'publish',
    label: '发布',
    onClick: async (record) => {
      // 自定义操作逻辑
      console.log('发布公告:', record.id)
    },
    showCondition: (record) => !record.enable,
  },
]

<SmartCrudPage
  // ...其他配置
  customRowActions={customRowActions}
/>
```

### 添加工具栏按钮

```javascript
const toolbarExtra = (
  <Button onClick={() => console.log('导出')}>
    导出数据
  </Button>
)

<SmartCrudPage
  // ...其他配置
  toolbarExtra={toolbarExtra}
/>
```

### 使用 Hooks 处理业务逻辑

在 `crud-action.announcement.js` 中添加：

```javascript
const announcementConfig = {
  // ...其他配置
  
  hooks: {
    beforeCreate: async (data) => {
      // 创建前的处理
      console.log('即将创建公告:', data.title)
      return data
    },
    afterCreate: async (record) => {
      // 创建后的处理
      console.log('公告创建成功:', record.id)
    },
    beforeUpdate: async (id, data) => {
      // 更新前的处理
      return data
    },
    beforeDelete: async (id) => {
      // 删除前的检查
      // 如果返回 false 或抛出错误，将阻止删除
      return true
    },
  }
}
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [SmartCrudPage 完整指南](../guides/admin/SMART_CRUD.md) | 详细的组件配置说明 |
| [fieldsConfig 配置详解](../api/FIELDS_CONFIG.md) | 字段配置的所有选项 |
| [Server Actions 开发](../guides/admin/SERVER_ACTIONS.md) | Actions 开发最佳实践 |
| [完整示例：优惠券管理](../../templates/crud/EXAMPLE.md) | 更复杂的功能示例 |

---

<div align="center">

[← 快速入门](./README.md) · [项目结构说明 →](./PROJECT_STRUCTURE.md)

</div>

