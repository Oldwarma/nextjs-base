# 素材管理（Assets Management）

> **最后更新**: 2025-11-28  
> **版本**: v1.0.0  
> **目标读者**: 开发者、AI Assistant

---

## 📋 目录

1. [功能概述](#功能概述)
2. [文件结构](#文件结构)
3. [数据模型](#数据模型)
4. [核心功能](#核心功能)
5. [Server Actions](#server-actions)
6. [上传服务](#上传服务)
7. [使用示例](#使用示例)
8. [注意事项](#注意事项)

---

## 功能概述

素材管理模块提供统一的文件/图片管理功能，支持：

- **文件上传**：支持图片、文档、头像等多种类型
- **卡片式展示**：响应式网格布局，缩略图预览
- **搜索筛选**：按文件名搜索、按类型筛选
- **批量操作**：批量选择、批量删除
- **文件预览**：图片预览、文件详情查看
- **URL 复制**：一键复制文件 URL
- **R2 存储**：使用 Cloudflare R2 作为文件存储

---

## 文件结构

```
app/(admin)/
├── admin/system/assets/
│   └── page.js                      # 素材管理页面（卡片式布局）
└── actions/system/
    └── crud-action.assets.js        # Server Actions

lib/upload/
├── upload-service.js                # 上传服务（核心逻辑）
├── r2-client.js                     # R2 存储客户端
├── use-upload.js                    # 上传 Hook（前端使用）
└── index.js                         # 导出入口

components/admin/uploads/
└── file-select-modal.jsx            # 文件选择弹窗组件
```

---

## 数据模型

### assets 集合

```javascript
{
  id: String,              // UUID 主键（项目规范）
  _id: ObjectId,           // MongoDB 自动生成
  key: String,             // R2 存储路径（唯一）
  url: String,             // 文件访问 URL
  originalName: String,    // 原始文件名
  mimeType: String,        // MIME 类型
  size: Number,            // 文件大小（字节）
  type: String,            // 上传类型：image | images | file | avatar
  directory: String,       // 存储目录：images | files | avatars
  userId: String,          // 上传用户 ID
  remark: String,          // 备注（可选）
  createdAt: Date,         // 创建时间
  updatedAt: Date,         // 更新时间
}
```

### 上传类型配置

| 类型 | 目录 | 允许的 MIME 类型 | 最大大小 |
|------|------|-----------------|---------|
| `image` | images | jpeg, png, gif, webp, svg | 10MB |
| `images` | images | jpeg, png, gif, webp, svg | 10MB |
| `avatar` | avatars | jpeg, png, gif, webp | 2MB |
| `file` | files | 所有类型 | 50MB |

---

## 核心功能

### 1. 卡片式布局

素材管理页面采用卡片式布局，而非传统的表格布局，更适合文件管理场景：

```jsx
<Row gutter={[12, 12]}>
  {files.map((file) => (
    <Col key={getFileId(file)} xs={12} sm={8} md={6} lg={4} xl={3}>
      <FileCard file={file} />
    </Col>
  ))}
</Row>
```

**响应式断点**：
- `xs`: 2 列（手机）
- `sm`: 3 列
- `md`: 4 列
- `lg`: 6 列
- `xl`: 8 列

### 2. 文件卡片组件

每个文件卡片包含：
- 缩略图/文件图标
- 文件名（超长省略）
- 文件大小和类型
- 选择复选框
- Hover 时显示的操作按钮

```jsx
const FileCard = ({ file }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 缩略图 */}
      {renderCover(file)}
      
      {/* 文件信息 */}
      <div>{file.originalName}</div>
      
      {/* 操作按钮 - hover 时显示 */}
      <div style={{ opacity: isHovered ? 1 : 0 }}>
        <Button icon={<EyeOutlined />} />      {/* 预览 */}
        <Button icon={<FileOutlined />} />     {/* 详情 */}
        <Button icon={<CopyOutlined />} />     {/* 复制 URL */}
        <Button icon={<DeleteOutlined />} />   {/* 删除 */}
      </div>
    </div>
  );
};
```

### 3. 搜索和筛选

- **搜索**：按文件名模糊搜索，点击按钮或按回车触发
- **类型筛选**：All Files / Images / Documents / Avatars

```jsx
// 搜索框（点击按钮触发，非实时搜索）
<Input.Search
  placeholder="Search files..."
  onSearch={handleSearch}
  enterButton
  allowClear
/>

// 类型筛选
<Select
  value={typeFilter}
  onChange={handleTypeFilterChange}
  options={FILE_TYPE_OPTIONS}
/>
```

### 4. 批量操作

支持全选和批量删除：

```jsx
// 全选
<Checkbox
  checked={selectedIds.length === files.length}
  indeterminate={selectedIds.length > 0 && selectedIds.length < files.length}
  onChange={handleSelectAll}
>
  Select All
</Checkbox>

// 批量删除
{selectedIds.length > 0 && (
  <Button danger onClick={handleBatchDelete}>
    Delete ({selectedIds.length})
  </Button>
)}
```

---

## Server Actions

### crud-action.assets.js

基于 `createCrudActions` 创建标准 CRUD 操作：

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';

const crudActions = createCrudActions({
  collectionName: 'assets',
  resourceType: 'asset',
  primaryKey: 'id',  // 使用 UUID 作为主键
  
  fields: {
    creatable: [],  // 素材通过上传接口创建，不支持手动创建
    updatable: ['originalName', 'remark'],
    searchable: ['originalName', 'type', 'mimeType'],
  },
  
  query: {
    defaultSort: { createdAt: -1 },
    baseFilter: {},
  },
  
  softDelete: false,  // 硬删除（同时删除 R2 文件）
});

// 导出标准操作
export async function getList(params) {
  return crudActions.getList(params);
}

export async function getDetail(id) {
  return crudActions.getDetail(id);
}

export async function update(id, data) {
  return crudActions.update(id, data);
}
```

### 删除操作（特殊处理）

删除文件需要同时删除 R2 存储中的文件：

```javascript
import { deleteFile } from '@/lib/upload/upload-service';
import { wrapAdminAction } from '@/lib/core/action-wrapper';

// 单个删除
export const remove = wrapAdminAction('delete', 'assets', async (id, context) => {
  const { userId } = context;
  
  // 获取文件信息
  const detail = await crudActions.getDetail(id);
  if (!detail.success || !detail.data) {
    return { success: false, error: 'File not found' };
  }
  
  // 删除 R2 文件和数据库记录
  const result = await deleteFile(detail.data.url || detail.data.key, userId);
  return result;
});

// 批量删除
export const batchDelete = wrapAdminAction('batch_delete', 'assets', async ({ ids }, context) => {
  const { userId } = context;
  const errors = [];
  let successCount = 0;
  
  for (const id of ids) {
    try {
      const detail = await crudActions.getDetail(id);
      if (detail.success && detail.data) {
        const result = await deleteFile(detail.data.url || detail.data.key, userId);
        if (result.success) {
          successCount++;
        } else {
          errors.push(`${detail.data.originalName}: ${result.error}`);
        }
      }
    } catch (error) {
      errors.push(`${id}: ${error.message}`);
    }
  }
  
  return {
    success: errors.length === 0,
    deletedCount: successCount,
    errors: errors.length > 0 ? errors : undefined,
  };
});
```

---

## 上传服务

### upload-service.js

核心上传服务，处理文件上传、验证、存储：

```javascript
import { uploadToR2, generateFileKey, deleteFromR2 } from './r2-client';
import { add, remove, getOne } from '@/lib/database/db-api';

const COLLECTION_NAME = 'assets';

/**
 * 上传单个文件
 */
export async function uploadFile({ file, type, directory, userId, options = {} }) {
  // 1. 验证上传类型和文件
  const config = UPLOAD_TYPE_CONFIG[type];
  const validation = validateFile(file, type, options);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // 2. 生成文件路径
  const key = generateFileKey(originalName, uploadDirectory);
  
  // 3. 上传到 R2
  const uploadResult = await uploadToR2({
    body: buffer,
    key,
    contentType: mimeType,
    metadata: { originalName, uploadType: type, userId },
  });
  
  // 4. 保存数据库记录（使用 UUID 作为 id）
  const uploadRecord = {
    id: crypto.randomUUID(),
    key,
    url: uploadResult.url,
    originalName,
    mimeType,
    size,
    type,
    directory: uploadDirectory,
    userId,
  };
  
  await add({ dbName: COLLECTION_NAME, dataJson: uploadRecord });
  
  return { success: true, data: { key, url, originalName, mimeType, size } };
}

/**
 * 删除文件
 */
export async function deleteFile(keyOrUrl, userId) {
  // 1. 从 URL 提取 key
  let key = keyOrUrl;
  if (keyOrUrl.startsWith('http')) {
    const url = new URL(keyOrUrl);
    key = url.pathname.replace(/^\//, '');
  }
  
  // 2. 查找记录
  const record = await getOne({ dbName: COLLECTION_NAME, whereJson: { key } });
  if (!record) {
    return { success: false, error: 'File not found' };
  }
  
  // 3. 从 R2 删除
  await deleteFromR2(key);
  
  // 4. 删除数据库记录
  await remove({ dbName: COLLECTION_NAME, whereJson: { key } });
  
  return { success: true };
}
```

---

## 使用示例

### 在页面中使用素材管理

```jsx
import * as uploadActions from '@/app/(admin)/actions/system/crud-action.assets';

// 加载文件列表
const result = await uploadActions.getList({
  pageIndex: 1,
  pageSize: 24,
  whereJson: {
    type: 'image',  // 只加载图片
  },
});

// 删除文件
await uploadActions.remove(fileId);

// 批量删除
await uploadActions.batchDelete({ ids: selectedIds });
```

### 在表单中使用文件选择

```jsx
import FileSelectModal from '@/components/admin/uploads/file-select-modal';

const [modalOpen, setModalOpen] = useState(false);

<FileSelectModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  onSelect={(file) => {
    console.log('Selected:', file.url);
  }}
  fileType="image"  // 只显示图片
  multiple={false}  // 单选
/>
```

### 直接调用上传服务

```javascript
import { uploadFile } from '@/lib/upload/upload-service';

const result = await uploadFile({
  file: fileObject,
  type: 'image',
  userId: currentUserId,
});

if (result.success) {
  console.log('Uploaded:', result.data.url);
}
```

---

## 注意事项

### 1. 主键兼容性

素材数据同时支持 `id`（UUID）和 `_id`（MongoDB ObjectId）作为主键：

```javascript
// 获取文件唯一标识（兼容新旧数据）
function getFileId(file) {
  return file.id || file._id;
}
```

### 2. 硬删除

素材管理使用硬删除而非软删除，因为需要同时删除 R2 存储中的文件。

### 3. 搜索触发方式

搜索不是实时触发的，需要点击搜索按钮或按回车键才会执行搜索，避免频繁请求。

### 4. 文件类型图标

根据 MIME 类型自动显示对应图标：

| MIME 类型 | 图标 |
|----------|------|
| `image/*` | FileImageOutlined |
| `application/pdf` | FilePdfOutlined |
| `*word*`, `*document*` | FileWordOutlined |
| `*excel*`, `*spreadsheet*` | FileExcelOutlined |
| `*zip*`, `*compressed*` | FileZipOutlined |
| 其他 | FileOutlined |

### 5. R2 存储配置

确保环境变量正确配置：

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-r2-domain.com
```

---

## 相关文档

- [上传组件指南](./UPLOAD_GUIDE.md)
- [Smart CRUD 开发指南](./SMART_CRUD_GUIDE.md)
- [BaseDAO 文档](./BASE_DAO.md)
- [DB API 文档](../database/DB_API_GUIDE.md)

---

## 许可证

MIT License

