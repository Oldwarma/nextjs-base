# Server Actions 开发指南

<div align="center">

**后台 Server Actions 开发最佳实践**

[快速开始](#-快速开始) · [配置详解](#-配置详解) · [高级用法](#-高级用法)

</div>

---

## 🎯 概述

NextJS Base 使用 **Server Actions** 处理后台业务逻辑，通过 `createCrudActions` 快速创建标准 CRUD 操作。

### 核心特点

| 特点 | 说明 |
|:---|:---|
| **自动权限** | 通过命名约定自动处理权限检查 |
| **自动日志** | 自动记录所有操作日志 |
| **统一验证** | 配置化的数据验证 |
| **Hooks 支持** | 支持 before/after 钩子 |

---

## 🚀 快速开始

### 使用模板创建

```bash
# 创建 Action 文件
cp templates/crud/action.template.js app/(admin)/actions/your-module/crud-action.your-resource.js

# 替换变量
sed -i '' 's/{RESOURCE_NAME}/yourResource/g' crud-action.your-resource.js
sed -i '' 's/{RESOURCE_LABEL}/YourResource/g' crud-action.your-resource.js
sed -i '' 's/{MODEL_NAME}/yourResource/g' crud-action.your-resource.js
```

### 基础示例

```javascript
'use server'

import { createCrudActions } from '@/lib/core/crud-helper'

// 资源配置
const postConfig = {
  modelName: 'post',
  primaryKey: 'id',
  softDelete: true,
  
  fields: {
    creatable: ['title', 'content', 'status'],
    updatable: ['title', 'content', 'status'],
    searchable: ['title', 'content'],
  },
  
  query: {
    defaultSort: { createdAt: 'desc' },
    defaultPageSize: 20,
  },
  
  validation: {
    title: { required: true, maxLength: 200 },
    content: { required: true },
    status: { enum: ['draft', 'published'] },
  },
}

// 导出 CRUD Actions
export const {
  getList: getPostListAction,
  getDetail: getPostDetailAction,
  create: createPostAction,
  update: updatePostAction,
  delete: deletePostAction,
} = createCrudActions(postConfig)
```

---

## 📋 配置详解

### 基础配置

```javascript
const resourceConfig = {
  // 模型名称（对应 Prisma 模型）
  modelName: 'post',
  
  // 主键字段
  primaryKey: 'id',
  
  // 是否启用软删除
  softDelete: true,
  
  // 是否需要管理员权限（默认 false，使用 RBAC 权限）
  requireAdmin: false,
}
```

### 字段配置 (fields)

```javascript
fields: {
  // 创建时允许的字段
  creatable: ['title', 'content', 'categoryId', 'tags', 'status'],
  
  // 更新时允许的字段
  updatable: ['title', 'content', 'categoryId', 'tags', 'status'],
  
  // 可搜索的字段
  searchable: ['title', 'content'],
}
```

### 查询配置 (query)

```javascript
query: {
  // 默认排序
  defaultSort: { createdAt: 'desc' },
  
  // 默认分页大小
  defaultPageSize: 20,
  
  // 默认过滤条件
  defaultFilter: { enable: true },
  
  // 关联查询（Prisma include）
  include: {
    author: true,
    category: true,
  },
}
```

### 验证配置 (validation)

```javascript
validation: {
  // 必填 + 长度限制
  title: {
    required: true,
    minLength: 2,
    maxLength: 200,
    message: '标题必填，2-200 个字符',
  },
  
  // 枚举验证
  status: {
    enum: ['draft', 'published', 'archived'],
    message: '状态值无效',
  },
  
  // 正则验证
  slug: {
    pattern: /^[a-z0-9-]+$/,
    message: 'URL 别名只能包含小写字母、数字和连字符',
  },
  
  // 数字范围
  sort: {
    min: 0,
    max: 9999,
    message: '排序值必须在 0-9999 之间',
  },
  
  // 唯一性验证
  email: {
    required: true,
    unique: true,
    message: '邮箱已存在',
  },
  
  // 自定义验证器
  password: {
    required: true,
    validator: async (value, data, recordId) => {
      if (value.length < 8) {
        throw new Error('密码至少 8 位')
      }
      if (!/[A-Z]/.test(value)) {
        throw new Error('密码需包含大写字母')
      }
    },
  },
}
```

### Hooks 配置

```javascript
hooks: {
  // 创建前
  beforeCreate: async (data, ctx) => {
    // 可以修改数据
    data.authorId = ctx.userId
    data.slug = generateSlug(data.title)
    return data
  },
  
  // 创建后
  afterCreate: async (record, ctx) => {
    // 发送通知、清除缓存等
    await sendNotification('新文章发布', record.title)
  },
  
  // 更新前
  beforeUpdate: async (id, data, ctx) => {
    // 检查权限
    const post = await getPost(id)
    if (post.authorId !== ctx.userId && !ctx.isAdmin) {
      throw new Error('无权修改他人文章')
    }
    return data
  },
  
  // 更新后
  afterUpdate: async (record, ctx) => {
    await clearCache(`post:${record.id}`)
  },
  
  // 删除前
  beforeDelete: async (id, ctx) => {
    const post = await getPost(id)
    if (post.status === 'published') {
      throw new Error('已发布的文章不能删除')
    }
    return true  // 返回 false 阻止删除
  },
  
  // 删除后
  afterDelete: async (id, ctx) => {
    await clearCache(`post:${id}`)
  },
  
  // 批量删除前
  beforeBatchDelete: async (ids, ctx) => {
    // 检查是否有已发布的文章
    const posts = await getPosts(ids)
    const published = posts.filter(p => p.status === 'published')
    if (published.length > 0) {
      throw new Error(`有 ${published.length} 篇已发布文章不能删除`)
    }
    return true
  },
}
```

### 数据转换 (transforms)

```javascript
transforms: {
  // 写入前转换
  input: (data) => {
    // 处理输入数据
    if (data.code) {
      data.code = data.code.toUpperCase().trim()
    }
    return data
  },
  
  // 读取后转换
  output: (record) => {
    // 处理输出数据
    if (record.price) {
      record.priceDisplay = `¥${record.price.toFixed(2)}`
    }
    return record
  },
}
```

---

## 🎨 高级用法

### 自定义 Action

```javascript
import { wrapAction } from '@/lib/core/action-wrapper'
import { prisma } from '@/lib/database/prisma'

// 导出标准 CRUD
export const { getList, create, update, delete: del } = createCrudActions(config)

// 自定义 Action - 发布文章
export const publishPostAction = wrapAction(
  'sysPublishPost',  // sys 前缀需要后台权限
  async (params, ctx) => {
    const { id } = params
    
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) {
      throw new Error('文章不存在')
    }
    
    if (post.status === 'published') {
      throw new Error('文章已发布')
    }
    
    const updated = await prisma.post.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    })
    
    return { success: true, data: updated }
  }
)

// 公开 Action - 获取已发布文章
export const getPublishedPostsAction = wrapAction(
  'pubGetPublishedPosts',  // pub 前缀无需登录
  async (params) => {
    const posts = await prisma.post.findMany({
      where: { status: 'published', enable: true },
      orderBy: { publishedAt: 'desc' },
      take: params.limit || 10,
    })
    
    return { success: true, data: posts }
  }
)

// 需要登录的 Action
export const likePostAction = wrapAction(
  'authLikePost',  // auth 前缀需要登录
  async (params, ctx) => {
    const { postId } = params
    
    await prisma.postLike.create({
      data: {
        postId,
        userId: ctx.userId,
      },
    })
    
    return { success: true }
  }
)
```

### 扩展 CRUD Actions

```javascript
import { createCrudActions, extendCrudActions } from '@/lib/core/crud-helper'

const baseActions = createCrudActions(config)

// 扩展额外的 Actions
export const actions = extendCrudActions(baseActions, {
  // 切换状态
  toggleStatus: wrapAction('sysTogglePostStatus', async ({ id }) => {
    const post = await prisma.post.findUnique({ where: { id } })
    return await prisma.post.update({
      where: { id },
      data: { enable: !post.enable },
    })
  }),
  
  // 批量发布
  batchPublish: wrapAction('sysBatchPublishPost', async ({ ids }) => {
    return await prisma.post.updateMany({
      where: { id: { in: ids } },
      data: { status: 'published', publishedAt: new Date() },
    })
  }),
})
```

### 复杂查询

```javascript
// 使用 selects 进行连表查询
const config = {
  modelName: 'post',
  
  query: {
    // 使用 selects 连表查询（支持数组字段关联）
    selects: {
      author: {
        localKey: 'authorId',
        foreignKey: 'id',
        foreignDB: 'user',
        type: 'object',  // 单条关联
        fields: ['id', 'name', 'avatar'],
      },
      category: {
        localKey: 'categoryId',
        foreignKey: 'id',
        foreignDB: 'category',
        type: 'object',
        fields: ['id', 'name'],
      },
    },
  },
}
```

### 只读 Actions

```javascript
import { createReadOnlyActions } from '@/lib/core/crud-helper'

// 只创建读取相关的 Actions
export const {
  getList: getLogListAction,
  getDetail: getLogDetailAction,
} = createReadOnlyActions({
  modelName: 'actionLog',
  query: {
    defaultSort: { createdAt: 'desc' },
    defaultPageSize: 50,
  },
})
```

---

## 📐 命名规范

### Action 命名

| 前缀 | 级别 | 说明 | 示例 |
|:---|:---|:---|:---|
| `pub` | PUBLIC | 公开访问 | `pubGetConfig` |
| `auth` | AUTH | 需要登录 | `authGetUserInfo` |
| `sys` | SYSTEM | 需要后台权限 | `sysGetPostList` |

### 完整命名格式

```
{prefix}{Action}{Resource}Action

示例：
- sysGetPostListAction       // 获取文章列表
- sysGetPostDetailAction     // 获取文章详情
- sysCreatePostAction        // 创建文章
- sysUpdatePostAction        // 更新文章
- sysDeletePostAction        // 删除文章
- sysBatchDeletePostAction   // 批量删除文章
- sysPublishPostAction       // 发布文章（自定义）
```

### 文件命名

```
app/(admin)/actions/
├── rbac/
│   ├── crud-action.role.js
│   ├── crud-action.permission.js
│   └── crud-action.menu.js
├── content/
│   ├── crud-action.post.js
│   └── crud-action.category.js
└── system/
    ├── crud-action.asset.js
    └── crud-action.action-log.js
```

---

## 📊 返回格式

### 成功响应

```javascript
{
  success: true,
  data: {
    // 单条数据
    id: 'xxx',
    name: '测试',
    // ...
  }
}

// 或列表数据
{
  success: true,
  data: {
    list: [...],
    total: 100,
    page: 1,
    pageSize: 20,
  }
}
```

### 错误响应

```javascript
{
  success: false,
  error: '错误信息',
  code: 'ERROR_CODE',  // 可选
}
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [wrapAction API](../../api/WRAP_ACTION.md) | Action 包装器 API |
| [createCrudActions API](../../api/CRUD_HELPER.md) | CRUD 工厂函数 API |
| [BaseDAO API](../../api/BASE_DAO.md) | 数据访问对象 API |
| [Action 模板](../../../templates/crud/action.template.js) | 模板文件 |

---

<div align="center">

[← SmartForm 指南](./SMART_FORM.md) · [RBAC 配置指南 →](../rbac/CONFIGURATION.md)

</div>

