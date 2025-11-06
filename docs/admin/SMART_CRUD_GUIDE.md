# Smart CRUD 完整开发指南

> **最后更新**: 2025-11-04  
> **版本**: v2.0.0  
> **目标读者**: AI Assistant、开发者  
> **用途**: 创建新的管理页面时的完整参考

---

## 📋 目录

1. [快速开始](#快速开始)
2. [三步创建新页面](#三步创建新页面)
3. [CRUD Config 配置详解](#crud-config-配置详解)
4. [Server Actions 编写规范](#server-actions-编写规范)
5. [Page 页面开发规范](#page-页面开发规范)
6. [字段类型完整参考](#字段类型完整参考)
7. [连表查询配置](#连表查询配置)
8. [完整示例](#完整示例)
9. [常见场景](#常见场景)
10. [检查清单](#检查清单)

---

## 快速开始

### 什么是 Smart CRUD？

Smart CRUD 是一个统一的 CRUD 开发框架，通过**声明式配置**自动生成：
- ✅ 列表页表格
- ✅ 创建/编辑表单
- ✅ 搜索筛选器
- ✅ 批量操作
- ✅ 导出功能

### 核心优势

| 传统方式 | Smart CRUD |
|---------|-----------|
| 手写 500+ 行代码 | 配置 100 行 |
| 重复定义字段 | 定义一次，到处使用 |
| 手动处理增删改查 | 自动生成 |
| 手动拼接查询条件 | 自动生成 MongoDB 查询 |
| 手动处理表单验证 | 声明式验证规则 |

---

## 三步创建新页面

假设要创建一个「文章管理」页面，完整步骤如下：

### 📁 文件结构

```
app/(admin)/
├── actions/
│   ├── configs/
│   │   └── article-crud.config.js    ← Step 1: CRUD 配置
│   └── admin-articles.js              ← Step 2: Server Actions
└── admin/
    └── articles/
        └── page.js                    ← Step 3: 页面组件
```

---

## CRUD Config 配置详解

### 文件位置

`app/(admin)/actions/configs/article-crud.config.js`

### 完整模板

```javascript
/**
 * Article CRUD Configuration
 * 
 * 此配置文件定义了文章管理的所有 CRUD 规则
 */

export const articleCrudConfig = {
  // ============================================
  // 1. 基础配置
  // ============================================
  
  /** 集合名称（MongoDB Collection） */
  collectionName: 'articles',
  
  /** 日志分类（用于日志记录） */
  logCategory: 'admin/articles',
  
  /** 主键字段（必须是 UUID） */
  primaryKey: 'id',
  
  // ============================================
  // 2. 字段权限配置
  // ============================================
  
  fields: {
    /** 可创建的字段（Create 时允许提交的字段） */
    creatable: [
      'title',
      'content',
      'author_id',
      'category_id',
      'status',
      'tags',
      'cover_image',
      'enable',
      'sort',
      'remark',
    ],
    
    /** 可更新的字段（Update 时允许修改的字段） */
    updatable: [
      'title',
      'content',
      'category_id',
      'status',
      'tags',
      'cover_image',
      'enable',
      'sort',
      'remark',
    ],
    
    /** 可搜索的字段（用于文本搜索） */
    searchable: ['title', 'content', 'tags'],
  },
  
  // ============================================
  // 3. 查询配置
  // ============================================
  
  query: {
    /** 默认排序 */
    defaultSort: { created_at: -1, sort: 1 },
    
    /** 默认分页大小 */
    defaultPageSize: 20,
    
    /** 基础过滤条件（始终应用） */
    baseFilter: {},
    
    /** 连表查询配置（自动关联其他表） */
    foreignDB: [
      {
        dbName: 'users',              // 目标表名
        localKey: 'author_id',        // 本地字段（外键）
        foreignKey: 'id',             // 目标表主键
        as: 'authorInfo',             // 结果字段名
        limit: 1,                     // 一对一关系
        fieldJson: {                  // 只返回需要的字段
          id: 1,
          name: 1,
          email: 1,
          image: 1,
        },
      },
      {
        dbName: 'categories',
        localKey: 'category_id',
        foreignKey: 'id',
        as: 'categoryInfo',
        limit: 1,
        fieldJson: { id: 1, name: 1 },
      },
    ],
  },
  
  // ============================================
  // 4. 数据验证规则
  // ============================================
  
  validation: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200,
      message: 'Title must be between 5 and 200 characters',
    },
    content: {
      required: true,
      minLength: 10,
      message: 'Content must be at least 10 characters',
    },
    author_id: {
      required: true,
      validator: async (value) => {
        // 自定义验证：检查作者是否存在
        const { getCollection } = await import('@/lib/mongodb');
        const users = await getCollection('users');
        const user = await users.findOne({ id: value });
        return !!user;
      },
      message: 'Invalid author',
    },
  },
  
  // ============================================
  // 5. 生命周期钩子
  // ============================================
  
  hooks: {
    /**
     * 创建前钩子
     * @param {Object} data - 待创建的数据
     * @returns {Object} 处理后的数据
     */
    beforeCreate: async (data) => {
      // 自动设置作者为当前用户
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      data.author_id = session.user.id;
      
      // 自动生成 slug
      data.slug = data.title.toLowerCase().replace(/\s+/g, '-');
      
      return data;
    },
    
    /**
     * 更新前钩子
     * @param {String} id - 记录 ID
     * @param {Object} data - 待更新的数据
     * @param {Object} existing - 现有数据
     * @returns {Object} 处理后的数据
     */
    beforeUpdate: async (id, data, existing) => {
      // 更新 slug
      if (data.title && data.title !== existing.title) {
        data.slug = data.title.toLowerCase().replace(/\s+/g, '-');
      }
      
      // 权限检查：只能编辑自己的文章
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      if (existing.author_id !== session.user.id && session.user.role !== 'admin') {
        throw new Error('You can only edit your own articles');
      }
      
      return data;
    },
    
    /**
     * 删除前钩子
     * @param {String} id - 记录 ID
     * @param {Object} existing - 现有数据
     * @returns {Boolean} true=允许删除，false=阻止删除
     */
    beforeDelete: async (id, existing) => {
      // 权限检查
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      if (existing.author_id !== session.user.id && session.user.role !== 'admin') {
        throw new Error('You can only delete your own articles');
      }
      
      return true;
    },
    
    /**
     * 删除后钩子
     * @param {String} id - 已删除的记录 ID
     * @param {Object} deleted - 已删除的数据
     */
    afterDelete: async (id, deleted) => {
      // 清理关联数据（如评论）
      const { getCollection } = await import('@/lib/mongodb');
      const comments = await getCollection('comments');
      await comments.deleteMany({ article_id: id });
      
      console.log(`Article ${id} and its comments deleted`);
    },
    
    /**
     * 批量更新前钩子
     * @param {Array<String>} ids - 记录 ID 数组
     * @param {Object} data - 待更新的数据
     * @returns {Object} 处理后的数据
     */
    beforeBatchUpdate: async (ids, data) => {
      // 批量操作时的数据处理
      return data;
    },
    
    /**
     * 批量删除前钩子
     * @param {Array<String>} ids - 记录 ID 数组
     * @returns {Boolean} true=允许删除
     */
    beforeBatchDelete: async (ids) => {
      // 检查是否有已发布的文章
      const { getCollection } = await import('@/lib/mongodb');
      const articles = await getCollection('articles');
      const publishedCount = await articles.({
        id: { $in: ids },
        status: 'published',
      });
      
      if (publishedCount > 0) {
        throw new Error(`Cannot delete ${publishedCount} published articles`);
      }
      
      return true;
    },
  },
  
  // ============================================
  // 6. 数据转换
  // ============================================
  
  transforms: {
    /**
     * 输入转换（写入数据库前）
     * @param {Object} data - 原始数据
     * @returns {Object} 转换后的数据
     */
    input: (data) => {
      // 字符串字段去空格
      if (data.title) data.title = data.title.trim();
      if (data.content) data.content = data.content.trim();
      
      // tags 字段处理
      if (typeof data.tags === 'string') {
        data.tags = data.tags.split(',').map(tag => tag.trim());
      }
      
      // 确保布尔值类型
      if (data.enable !== undefined) {
        data.enable = data.enable === true || data.enable === 'true';
      }
      
      return data;
    },
    
    /**
     * 输出转换（从数据库读取后）
     * @param {Object} data - 原始数据
     * @returns {Object} 转换后的数据
     */
    output: (data) => {
      // 设置默认值
      if (data.enable === undefined) data.enable = true;
      if (data.sort === undefined) data.sort = 0;
      if (!data.tags) data.tags = [];
      if (!data.status) data.status = 'draft';
      
      // 日期格式化
      if (data.created_at && !(data.created_at instanceof Date)) {
        data.created_at = new Date(data.created_at);
      }
      if (data.updated_at && !(data.updated_at instanceof Date)) {
        data.updated_at = new Date(data.updated_at);
      }
      
      return data;
    },
  },
  
  // ============================================
  // 7. 软删除配置
  // ============================================
  
  /** 是否启用软删除（true=标记为已删除，false=物理删除） */
  softDelete: true,
};
```

### 配置说明

#### primaryKey（主键）

- **必须使用 `id`**（UUID 类型）
- 不要使用 `_id`（MongoDB 自动生成）
- 不要使用 `article_id` 等带前缀的字段

```javascript
// ✅ 正确
primaryKey: 'id'

// ❌ 错误
primaryKey: '_id'
primaryKey: 'article_id'
```

#### fields（字段权限）

- `creatable`：创建时允许提交的字段
- `updatable`：更新时允许修改的字段
- `searchable`：可用于文本搜索的字段

```javascript
fields: {
  creatable: ['title', 'content'],   // Create 操作允许的字段
  updatable: ['title', 'content'],   // Update 操作允许的字段
  searchable: ['title'],              // 搜索时可查询的字段
}
```

**注意**：
- `id` 主键**不要**放在 `creatable` 中（BaseDAO 会自动生成 UUID）
- `created_at`、`updated_at` **不要**放在 `updatable` 中（自动管理）
- 敏感字段（如 `author_id`）可以在 `beforeCreate` 钩子中自动设置

#### query.foreignDB（连表配置）

```javascript
foreignDB: [
  {
    dbName: 'users',              // 目标表名
    localKey: 'author_id',        // 本地外键字段
    foreignKey: 'id',             // 目标表主键字段
    as: 'authorInfo',             // 结果字段名
    limit: 1,                     // 限制结果数量（一对一用 1）
    fieldJson: {                  // 只返回需要的字段
      id: 1,
      name: 1,
      email: 1,
    },
    whereJson: {                  // 可选：目标表的过滤条件
      enable: true
    },
    sortJson: {                   // 可选：目标表的排序
      name: 1
    },
  },
]
```

**使用场景**：
- 显示关联数据的名称（如作者名称、分类名称）
- 避免 N+1 查询问题
- 自动在列表页面关联显示

#### validation（验证规则）

```javascript
validation: {
  title: {
    required: true,                    // 必填
    minLength: 5,                      // 最小长度
    maxLength: 200,                    // 最大长度
    pattern: /^[a-zA-Z0-9\s]+$/,      // 正则匹配
    unique: true,                      // 唯一性（检查数据库）
    validator: async (value) => {      // 自定义验证函数
      // 返回 true=验证通过，false=验证失败
      return value.length > 0;
    },
    message: 'Custom error message',   // 错误提示
  },
}
```

#### hooks（生命周期钩子）

执行顺序：

```
CREATE:  beforeCreate → validation → create → afterCreate
UPDATE:  beforeUpdate → validation → update → afterUpdate
DELETE:  beforeDelete → delete → afterDelete
```

**常见用途**：
- `beforeCreate`：设置默认值、自动填充字段
- `beforeUpdate`：权限检查、数据处理
- `beforeDelete`：权限检查、关联检查
- `afterDelete`：清理关联数据

#### transforms（数据转换）

```javascript
transforms: {
  input: (data) => {
    // 写入数据库前的处理
    // 场景：去空格、类型转换、格式化
    return data;
  },
  output: (data) => {
    // 从数据库读取后的处理
    // 场景：设置默认值、日期格式化、敏感信息脱敏
    return data;
  },
}
```

---

## Server Actions 编写规范

### 文件位置

`app/(admin)/actions/admin-articles.js`

### 完整模板

```javascript
/**
 * Article Management Server Actions
 * 
 * 提供文章管理的所有后端操作
 */

'use server';

import { checkAdminAction } from '@/app/(admin)/actions/admin-auth';
import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { articleCrudConfig } from '@/app/(admin)/actions/configs/article-crud.config';

// ============================================
// 1. 初始化 DAO
// ============================================

const articleCrud = new BaseDAO(articleCrudConfig);

// ============================================
// 2. 基础 CRUD 操作（必需）
// ============================================

/**
 * 获取文章列表（支持搜索、筛选、分页、排序）
 * @param {Object} params - 查询参数
 * @param {Number} params.pageIndex - 页码
 * @param {Number} params.pageSize - 每页数量
 * @param {String} params.search - 搜索关键词
 * @param {Object} params.filters - 筛选条件
 * @param {Object} params.sortJson - 排序条件
 * @returns {Promise<Object>} { success, data, total, pageIndex, pageSize }
 */
export async function getArticleListAction(params) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.getList(params);
}

/**
 * 创建文章
 * @param {Object} data - 文章数据
 * @returns {Promise<Object>} { success, data, error }
 */
export async function createArticleAction(data) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.create(data);
}

/**
 * 更新文章
 * @param {String} id - 文章 ID（UUID）
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} { success, data, error }
 */
export async function updateArticleAction(id, data) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.update(id, data);
}

/**
 * 删除文章
 * @param {String} id - 文章 ID（UUID）
 * @returns {Promise<Object>} { success, data, error }
 */
export async function deleteArticleAction(id) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.delete(id);
}

// ============================================
// 3. 批量操作（可选）
// ============================================

/**
 * 批量更新文章
 * @param {Array<String>} ids - 文章 ID 数组
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} { success, data, error }
 */
export async function batchUpdateArticlesAction(ids, updates) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.batchUpdate(ids, updates);
}

/**
 * 批量删除文章
 * @param {Array<String>} ids - 文章 ID 数组
 * @returns {Promise<Object>} { success, data, error }
 */
export async function batchDeleteArticlesAction(ids) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.batchDelete(ids);
}

// ============================================
// 4. 自定义操作（根据需求添加）
// ============================================

/**
 * 发布文章
 * @param {String} id - 文章 ID
 * @returns {Promise<Object>} { success, data, error }
 */
export async function publishArticleAction(id) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.update(id, {
    status: 'published',
    published_at: new Date(),
  });
}

/**
 * 下架文章
 * @param {String} id - 文章 ID
 * @returns {Promise<Object>} { success, data, error }
 */
export async function unpublishArticleAction(id) {
  const adminCheck = await checkAdminAction();
  if (!adminCheck.isAdmin) {
    return {
      success: false,
      error: adminCheck.error,
    };
  }
  
  return await articleCrud.update(id, {
    status: 'draft',
  });
}
```

### 编写规范

1. **必须使用 `'use server'`** 指令
2. **必须进行权限检查**（使用 `checkAdminAction()`）
3. **参数命名规范**：
   - 单个 ID：`id`（不是 `articleId`）
   - 多个 ID：`ids`（数组）
   - 更新数据：`data` 或 `updates`
4. **返回格式统一**：`{ success, data?, error? }`
5. **函数命名规范**：`{操作}{实体}Action`（如 `createArticleAction`）

---

## Page 页面开发规范

### 文件位置

`app/(admin)/admin/articles/page.js`

### 完整模板

```javascript
/**
 * Articles Management Page
 * 
 * 文章管理页面 - 使用 Smart CRUD 自动生成
 */

'use client';

import dynamic from 'next/dynamic';
import { Tag, Avatar, Space, Button } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

// ⚠️ 必须使用 dynamic import 避免 Hydration 错误
const SmartCrudPage = dynamic(() => import('@/components/admin/smart-crud-page'), {
  ssr: false,
  loading: () => <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>,
});

// 导入 Server Actions
import {
  getArticleListAction as getList,
  createArticleAction as create,
  updateArticleAction as update,
  deleteArticleAction as deleteItem,
  batchUpdateArticlesAction as batchUpdate,
  batchDeleteArticlesAction as batchDelete,
  publishArticleAction,
  unpublishArticleAction,
} from '@/app/(admin)/actions/admin-articles';

export default function ArticlesManagementPage() {
  // ============================================
  // 统一字段配置
  // ============================================
  
  const fieldsConfig = [
    // ------------------------------------------
    // UUID 主键（自动生成，不显示）
    // ------------------------------------------
    {
      key: 'id',
      title: 'ID',
      table: false,
      form: false,
      search: false,
    },
    
    // ------------------------------------------
    // 标题
    // ------------------------------------------
    {
      key: 'title',
      title: 'Title',
      type: 'text',
      table: {
        width: 200,
        ellipsis: true,
        copyable: true,
      },
      form: {
        required: true,
        placeholder: 'Enter article title',
      },
      search: {
        enabled: true,
        mode: 'like',  // 模糊搜索
      },
    },
    
    // ------------------------------------------
    // 内容（富文本）
    // ------------------------------------------
    {
      key: 'content',
      title: 'Content',
      type: 'richtext',
      table: false,  // 不在表格中显示
      form: {
        required: true,
        placeholder: 'Enter article content',
      },
      detail: {
        render: (value) => (
          <div dangerouslySetInnerHTML={{ __html: value }} />
        ),
      },
    },
    
    // ------------------------------------------
    // 作者（连表显示）
    // ------------------------------------------
    {
      key: 'author_id',
      title: 'Author',
      type: 'text',
      table: {
        width: 180,
        render: (value, record) => {
          // 使用连表数据 authorInfo
          const author = record.authorInfo;
          if (!author) {
            return <span style={{ color: '#999' }}>{value}</span>;
          }
          return (
            <Space>
              <Avatar src={author.image} size='small' icon={<UserOutlined />}>
                {author.name?.[0]}
              </Avatar>
              <div>
                <div style={{ fontWeight: 500 }}>{author.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{author.email}</div>
              </div>
            </Space>
          );
        },
      },
      detail: {
        render: (value, record) => {
          const author = record.authorInfo;
          return author ? `${author.name} (${author.email})` : value;
        },
      },
      form: false,  // 创建时自动填充，不显示
      search: false,
    },
    
    // ------------------------------------------
    // 分类（连表显示）
    // ------------------------------------------
    {
      key: 'category_id',
      title: 'Category',
      type: 'select',
      table: {
        width: 120,
        render: (value, record) => {
          const category = record.categoryInfo;
          return category ? (
            <Tag color='blue'>{category.name}</Tag>
          ) : (
            <span style={{ color: '#999' }}>Uncategorized</span>
          );
        },
      },
      form: {
        required: true,
        // 动态加载分类列表
        request: async () => {
          const { getCategoryListAction } = await import('@/app/(admin)/actions/admin-categories');
          const result = await getCategoryListAction({ pageSize: 100 });
          if (result.success) {
            return result.data.map(cat => ({
              label: cat.name,
              value: cat.id,
            }));
          }
          return [];
        },
      },
      search: {
        enabled: true,
        mode: 'exact',
      },
    },
    
    // ------------------------------------------
    // 状态
    // ------------------------------------------
    {
      key: 'status',
      title: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft', color: 'default' },
        { label: 'Published', value: 'published', color: 'green' },
        { label: 'Archived', value: 'archived', color: 'orange' },
      ],
      table: {
        width: 120,
        render: (value) => {
          const colorMap = {
            draft: 'default',
            published: 'green',
            archived: 'orange',
          };
          const textMap = {
            draft: 'Draft',
            published: 'Published',
            archived: 'Archived',
          };
          return <Tag color={colorMap[value]}>{textMap[value]}</Tag>;
        },
      },
      form: {
        initialValue: 'draft',
      },
      search: {
        enabled: true,
        mode: 'exact',
      },
    },
    
    // ------------------------------------------
    // 标签
    // ------------------------------------------
    {
      key: 'tags',
      title: 'Tags',
      type: 'tag',
      table: {
        width: 200,
        render: (tags) => {
          if (!Array.isArray(tags) || tags.length === 0) {
            return <span style={{ color: '#999' }}>No tags</span>;
          }
          return (
            <Space wrap>
              {tags.map((tag, index) => (
                <Tag key={index} color='blue'>{tag}</Tag>
              ))}
            </Space>
          );
        },
      },
      form: {
        placeholder: 'Enter tags, separated by commas',
      },
    },
    
    // ------------------------------------------
    // 封面图片
    // ------------------------------------------
    {
      key: 'cover_image',
      title: 'Cover Image',
      type: 'image',
      table: {
        width: 100,
        render: (url) => {
          if (!url) return <span style={{ color: '#999' }}>No image</span>;
          return (
            <img
              src={url}
              alt='cover'
              style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }}
            />
          );
        },
      },
      form: {
        max: 1,
        accept: 'image/*',
      },
    },
    
    // ------------------------------------------
    // 排序
    // ------------------------------------------
    {
      key: 'sort',
      title: 'Sort',
      type: 'number',
      table: {
        width: 80,
        sorter: true,
      },
      form: {
        initialValue: 0,
        min: 0,
        precision: 0,
      },
    },
    
    // ------------------------------------------
    // 启用状态
    // ------------------------------------------
    {
      key: 'enable',
      title: 'Enabled',
      type: 'switch',
      table: {
        width: 100,
      },
      form: {
        initialValue: true,
      },
    },
    
    // ------------------------------------------
    // 备注
    // ------------------------------------------
    {
      key: 'remark',
      title: 'Remark',
      type: 'textarea',
      table: false,
      form: {
        placeholder: 'Enter remark',
        props: {
          fieldProps: { rows: 3 },
        },
      },
    },
    
    // ------------------------------------------
    // 创建时间
    // ------------------------------------------
    {
      key: 'created_at',
      title: 'Created At',
      type: 'datetime',
      table: {
        width: 180,
        sorter: true,
      },
      form: false,
      search: {
        enabled: true,
        mode: 'range',
      },
    },
    
    // ------------------------------------------
    // 更新时间
    // ------------------------------------------
    {
      key: 'updated_at',
      title: 'Updated At',
      type: 'datetime',
      table: {
        width: 180,
        sorter: true,
      },
      form: false,
      search: false,
    },
  ];
  
  // ============================================
  // 自定义按钮配置
  // ============================================
  
  const customButtons = [
    {
      key: 'publish',
      text: 'Publish',
      icon: <CheckCircleOutlined />,
      type: 'primary',
      showInTable: (record) => record.status === 'draft',
      onClick: async (record) => {
        const result = await publishArticleAction(record.id);
        if (result.success) {
          message.success('Article published successfully');
          return true;  // 刷新列表
        } else {
          message.error(result.error || 'Failed to publish article');
          return false;
        }
      },
    },
    {
      key: 'unpublish',
      text: 'Unpublish',
      icon: <CloseCircleOutlined />,
      type: 'default',
      danger: true,
      showInTable: (record) => record.status === 'published',
      onClick: async (record) => {
        const result = await unpublishArticleAction(record.id);
        if (result.success) {
          message.success('Article unpublished successfully');
          return true;
        } else {
          message.error(result.error || 'Failed to unpublish article');
          return false;
        }
      },
    },
  ];
  
  // ============================================
  // 渲染页面
  // ============================================
  
  return (
    <SmartCrudPage
      title='Articles Management'
      description='Manage articles with author and category information'
      fieldsConfig={fieldsConfig}
      api={{
        getList,
        create,
        update,
        delete: deleteItem,
        batchUpdate,
        batchDelete,
      }}
      rowKey='id'                    // ✅ UUID 主键
      enableBatchSelect={true}
      enableExport={true}
      enableRefresh={true}
      customButtons={customButtons}  // 自定义操作按钮
    />
  );
}
```

### 页面开发规范

1. **必须使用 `dynamic import`** 导入 SmartCrudPage
2. **必须设置 `rowKey='id'`**（UUID 主键）
3. **字段配置顺序**：
   - 主键（`id`）
   - 核心字段（标题、内容）
   - 关联字段（作者、分类）
   - 状态字段（status、enable）
   - 辅助字段（sort、remark）
   - 时间字段（created_at、updated_at）
4. **连表字段渲染**：
   - 使用 `record.{as}` 访问连表数据（如 `record.authorInfo`）
   - 提供 fallback 到原始 UUID
5. **自定义按钮**：
   - `showInTable`：根据记录状态显示/隐藏
   - `onClick`：返回 `true` 刷新列表，`false` 不刷新

---

## 字段类型完整参考

### 基础输入类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `text` | 单行文本 | 名称、标题 |
| `textarea` | 多行文本 | 描述、备注 |
| `richtext` | 富文本编辑器 | 文章内容 |
| `number` | 数字输入 | 数量、价格 |
| `money` | 金额输入 | 价格、金额 |
| `percent` | 百分比输入 | 折扣、比例 |

### 选择类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `select` | 下拉选择 | 单选（状态、分类） |
| `radio` | 单选按钮 | 小数量选项 |
| `checkbox` | 多选框 | 多选选项 |
| `switch` | 开关 | 布尔值（启用/禁用） |

### 日期时间类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `date` | 日期选择 | 生日、日期 |
| `datetime` | 日期时间选择 | 创建时间、更新时间 |
| `daterange` | 日期范围选择 | 搜索时间段 |
| `time` | 时间选择 | 营业时间 |

### 上传类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `image` | 图片上传 | 封面图、轮播图 |
| `avatar` | 头像上传 | 用户头像 |
| `file` | 文件上传 | 附件、文档 |

### 高级类型

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `tag` | 标签输入 | 关键词、标签 |
| `tree-select` | 树形选择 | 父级选择、分类选择 |
| `cascader` | 级联选择 | 地区选择 |
| `password` | 密码输入 | 密码字段 |
| `rate` | 评分 | 评分 |
| `slider` | 滑块 | 数值范围 |
| `color` | 颜色选择 | 颜色配置 |
| `json` | JSON 编辑器 | 配置数据 |
| `array` | 数组编辑器 | 列表数据 |

---

## 连表查询配置

### 一对一关联

```javascript
// CRUD Config
foreignDB: [
  {
    dbName: 'users',
    localKey: 'author_id',
    foreignKey: 'id',
    as: 'authorInfo',
    limit: 1,                      // 一对一
    fieldJson: { id: 1, name: 1 },
  },
]

// Page 渲染
{
  key: 'author_id',
  table: {
    render: (value, record) => {
      const author = record.authorInfo;  // 访问连表数据
      return author ? author.name : value;
    }
  }
}
```

### 一对多关联

```javascript
// CRUD Config
foreignDB: [
  {
    dbName: 'roles',
    localKey: 'roles',             // 数组字段
    foreignKey: 'id',
    as: 'roleList',                // 结果也是数组
    fieldJson: { id: 1, name: 1 },
  },
]

// Page 渲染
{
  key: 'roles',
  table: {
    render: (value, record) => {
      const roles = record.roleList || [];
      return (
        <Space wrap>
          {roles.map(role => (
            <Tag key={role.id}>{role.name}</Tag>
          ))}
        </Space>
      );
    }
  }
}
```

### 自连表（树形结构）

```javascript
// CRUD Config
foreignDB: [
  {
    dbName: 'permissions',         // 自己关联自己
    localKey: 'parent_id',
    foreignKey: 'id',
    as: 'parentInfo',
    limit: 1,
    fieldJson: { id: 1, name: 1 },
  },
]

// Page 渲染
{
  key: 'parent_id',
  detail: {
    render: (value, record) => {
      if (!value) return 'Root';
      const parent = record.parentInfo;
      return parent ? parent.name : value;
    }
  }
}
```

---

## 完整示例

完整示例请参考现有页面：

1. **Roles 管理**：`app/(admin)/admin/roles/`
   - 连表查询 permissions 和 menus
   - 自定义按钮（Assign Permissions、Assign Menus）

2. **Users 管理**：`app/(admin)/admin/users/`
   - 连表查询 roles
   - 自定义按钮（Assign Roles）

3. **Credits 管理**：`app/(admin)/admin/credits/`
   - 连表查询 users（一对一）
   - 只读页面（无创建、编辑、删除）

4. **Permissions 管理**：`app/(admin)/admin/permissions/`
   - 自连表查询 parent permission
   - 树形表格展示

---

## 常见场景

### 场景 1：只读页面（日志、交易记录）

```javascript
// CRUD Config
fields: {
  creatable: [],     // 不允许创建
  updatable: [],     // 不允许更新
}

// Page
<SmartCrudPage
  enableCreate={false}
  enableEdit={false}
  enableDelete={false}
  enableBatchSelect={false}
/>
```

### 场景 2：权限控制（只能编辑自己的数据）

```javascript
// CRUD Config
hooks: {
  beforeUpdate: async (id, data, existing) => {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    
    if (existing.author_id !== session.user.id && session.user.role !== 'admin') {
      throw new Error('You can only edit your own articles');
    }
    
    return data;
  },
}
```

### 场景 3：自动填充当前用户

```javascript
// CRUD Config
hooks: {
  beforeCreate: async (data) => {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    data.author_id = session.user.id;
    return data;
  },
}
```

### 场景 4：软删除

```javascript
// CRUD Config
softDelete: true,

// 会自动添加 deleted_at 字段，删除时标记而非物理删除
// 查询时自动过滤已删除记录
```

### 场景 5：级联删除

```javascript
// CRUD Config
hooks: {
  afterDelete: async (id, deleted) => {
    const { getCollection } = await import('@/lib/mongodb');
    const comments = await getCollection('comments');
    await comments.deleteMany({ article_id: id });
  },
}
```

---

## 检查清单

### 创建新页面前

- [ ] 确定数据结构（字段、类型、关联）
- [ ] 确定主键使用 `id`（UUID）
- [ ] 确定需要哪些 CRUD 操作
- [ ] 确定是否需要连表查询
- [ ] 确定权限控制规则

### CRUD Config 检查

- [ ] `collectionName` 正确
- [ ] `primaryKey` 设置为 `id`
- [ ] `fields.creatable` 不包含 `id`
- [ ] `fields.updatable` 不包含 `id`、`created_at`、`updated_at`
- [ ] `query.foreignDB` 配置正确
- [ ] `validation` 规则完整
- [ ] `hooks` 中的权限检查正确
- [ ] `transforms` 数据处理正确

### Server Actions 检查

- [ ] 使用 `'use server'` 指令
- [ ] 所有 Action 都有权限检查
- [ ] 参数命名遵循规范（`id`、`ids`、`data`）
- [ ] 返回格式统一（`{ success, data, error }`）
- [ ] 函数命名遵循规范（`{操作}{实体}Action`）

### Page 检查

- [ ] 使用 `dynamic import` 导入 SmartCrudPage
- [ ] 设置 `rowKey='id'`
- [ ] 字段配置与 CRUD Config 一致
- [ ] 连表字段使用 `record.{as}` 访问
- [ ] 连表字段提供 fallback
- [ ] 自定义按钮（如果有）配置正确

### 测试检查

- [ ] 列表页加载正常
- [ ] 搜索功能正常
- [ ] 创建功能正常
- [ ] 编辑功能正常
- [ ] 删除功能正常
- [ ] 批量操作正常
- [ ] 连表数据显示正常
- [ ] 权限控制正常

---

## 相关文档

- [字段命名规范](../NAMING_STANDARDS.md)
- [BaseDAO 文档](./BASE_DAO.md)
- [DB API 文档](../database/DB_API_GUIDE.md)
- [RBAC 系统文档](../RBAC_SYSTEM.md)

---

## 许可证

MIT License

