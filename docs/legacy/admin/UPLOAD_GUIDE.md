# 文件上传配置指南

本文档介绍如何配置 Cloudflare R2 作为文件存储服务。

## 1. 创建 Cloudflare R2 存储桶

### 步骤 1: 登录 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 登录你的账号

### 步骤 2: 创建 R2 存储桶

1. 在左侧菜单中点击 **R2 Object Storage**
2. 点击 **Create bucket**
3. 输入存储桶名称（如 `your-project-uploads`）
4. 选择 **Location Hint**（建议选择离用户最近的区域）
5. 点击 **Create bucket**

### 步骤 3: 配置公开访问（可选但推荐）

如果需要直接通过 URL 访问文件：

1. 进入创建的存储桶
2. 点击 **Settings** 标签
3. 在 **Public access** 部分，点击 **Allow Access**
4. 配置自定义域名（推荐）或使用 R2.dev 子域名

#### 方式 A: 使用 R2.dev 子域名（简单）

1. 在 **Public access** 中启用 **R2.dev subdomain**
2. 你会得到类似 `https://pub-xxxx.r2.dev` 的公开 URL

#### 方式 B: 使用自定义域名（推荐）

1. 点击 **Connect Domain**
2. 输入你的子域名（如 `files.yourdomain.com`）
3. 按照提示添加 DNS 记录

### 步骤 4: 创建 API Token

1. 在 R2 页面右侧，点击 **Manage R2 API Tokens**
2. 点击 **Create API token**
3. 配置权限：
   - **Permissions**: Object Read & Write
   - **Specify bucket(s)**: 选择刚创建的存储桶
4. 点击 **Create API Token**
5. **重要**：保存显示的以下信息：
   - Access Key ID
   - Secret Access Key
   - Endpoint URL（格式：`https://<account_id>.r2.cloudflarestorage.com`）

## 2. 配置环境变量

在项目根目录的 `.env.local` 文件中添加以下配置：

```env
# ============================================
# Cloudflare R2 配置
# ============================================

# R2 Account ID（在 Cloudflare Dashboard 右上角可以找到）
R2_ACCOUNT_ID=your_account_id

# R2 Access Key ID（创建 API Token 时获得）
R2_ACCESS_KEY_ID=your_access_key_id

# R2 Secret Access Key（创建 API Token 时获得）
R2_SECRET_ACCESS_KEY=your_secret_access_key

# R2 存储桶名称
R2_BUCKET_NAME=your-bucket-name

# R2 公开访问 URL（用于生成文件访问链接）
# 如果使用 R2.dev 子域名：https://pub-xxxx.r2.dev
# 如果使用自定义域名：https://files.yourdomain.com
R2_PUBLIC_URL=https://your-public-url

# R2 Endpoint URL（可选，默认会自动生成）
# R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
```

## 3. 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `R2_ACCOUNT_ID` | | Cloudflare 账户 ID |
| `R2_ACCESS_KEY_ID` | | R2 API Access Key |
| `R2_SECRET_ACCESS_KEY` | | R2 API Secret Key |
| `R2_BUCKET_NAME` | | R2 存储桶名称 |
| `R2_PUBLIC_URL` | | 文件公开访问的基础 URL |
| `R2_ENDPOINT` | ❌ | 自定义 Endpoint（默认自动生成） |

## 4. 上传 API 使用说明

### 基本用法

```javascript
// 上传单个文件
const formData = new FormData();
formData.append('file', fileObject);
formData.append('type', 'image'); // image | images | file | avatar
formData.append('directory', 'posts'); // 可选，上传目录

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
// { success: true, url: 'https://...', key: 'posts/xxx.jpg' }
```

### 上传类型说明

| 类型 | 说明 | 默认目录 |
|------|------|----------|
| `image` | 单张图片 | `images/` |
| `images` | 多张图片 | `images/` |
| `file` | 文件 | `files/` |
| `avatar` | 头像 | `avatars/` |

### 自定义目录

```javascript
formData.append('directory', 'products/covers');
// 文件将上传到: products/covers/xxx.jpg
```

## 5. 文件命名规则

上传的文件会自动重命名，格式为：

```
{directory}/{timestamp}-{random}.{extension}

示例：
images/1701234567890-a1b2c3d4.jpg
avatars/1701234567890-e5f6g7h8.png
files/1701234567890-i9j0k1l2.pdf
```

## 6. 数据库记录

每次上传都会在 `uploads` 表中创建记录：

```javascript
{
  
  key: 'images/1701234567890-a1b2c3d4.jpg',  // R2 中的文件路径
  url: 'https://files.example.com/images/...', // 公开访问 URL
  originalName: 'my-photo.jpg',               // 原始文件名
  mimeType: 'image/jpeg',                     // MIME 类型
  size: 102400,                               // 文件大小（字节）
  type: 'image',                              // 上传类型
  directory: 'images',                        // 上传目录
  userId: 'user_xxx',                         // 上传用户 ID
  createdAt: Date,                            // 创建时间
}
```

## 7. 安全说明

1. **认证要求**：所有上传接口都需要用户登录
2. **文件类型验证**：服务端会验证文件类型
3. **文件大小限制**：默认最大 10MB，可在 API 中配置
4. **用户追踪**：所有上传都会记录用户 ID

## 8. 开发调试

### 开启上传日志

上传 API 的日志默认关闭。如需调试，可以手动开启：

**文件位置**：`app/api/upload/route.js`

```javascript
// 找到这行配置，将 false 改为 true
const UPLOAD_LOG_ENABLED = true;  // 默认为 false
```

开启后，控制台会输出详细的上传日志：

```
--------【开始】【API】【upload】【upload_image】--------
[09:30:15.123] 【请求参数】: {
  userId: 'user123',
  type: 'image',
  directory: 'images',
  files: [{ name: 'photo.jpg', size: '1.2MB' }]
}
[09:30:15.456] 【返回数据】: {
  success: true,
  url: 'https://r2.example.com/images/xxx.jpg',
  key: 'images/xxx.jpg',
  originalName: 'photo.jpg',
  size: '1.2MB'
}
[09:30:15.456] 【总体耗时】: 333 毫秒
--------【结束】【API】【upload】【upload_image】--------
```

> ⚠️ 调试完成后记得关闭日志，避免影响性能。

## 9. 故障排查

### 常见错误

1. **403 Forbidden**
   - 检查 API Token 权限是否正确
   - 确认存储桶名称是否正确

2. **文件无法访问**
   - 检查是否启用了公开访问
   - 确认 `R2_PUBLIC_URL` 配置正确

3. **上传失败**
   - 检查文件大小是否超限
   - 确认文件类型是否允许

### 测试连接

可以使用以下命令测试 R2 连接：

```bash
# 安装 AWS CLI
brew install awscli

# 配置 AWS CLI（使用 R2 凭证）
aws configure --profile r2
# Access Key ID: 你的 R2_ACCESS_KEY_ID
# Secret Access Key: 你的 R2_SECRET_ACCESS_KEY
# Region: auto
# Output format: json

# 测试列出存储桶
aws s3 ls --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com --profile r2
```

