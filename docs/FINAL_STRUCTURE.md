# 最终路由结构

## ✅ 正确的结构

```
app/
├── page.js                          # 根路径 "/" → 重定向到 "/en"
│
├── (client)/                        # 路由组：前端用户界面
│   ├── layout.js                   # ❌ 不需要（使用 [locale]/layout.js）
│   ├── [locale]/                   # 多语言路由
│   │   ├── layout.js               # ✅ 多语言布局（包含 NextIntlClientProvider）
│   │   ├── page.js                 # ✅ 首页 /en, /zh, /ja
│   │   ├── dashboard/              # /en/dashboard, /zh/dashboard
│   │   └── generate/               # /en/generate, /zh/generate
│   │
│   └── actions/                    # 客户端 Server Actions
│       ├── credits.js
│       ├── generate.js
│       ├── packages.js
│       ├── usage.js
│       └── user.js
│
├── (admin)/                         # 路由组：管理后台
│   ├── layout.js                   # ✅ 管理后台布局（不使用多语言）
│   ├── admin/                      # 实际路径目录
│   │   └── page.js                 # ✅ /admin 首页
│   │
│   └── actions/                    # 管理员 Server Actions
│       ├── admin-users.js
│       ├── admin-credits.js
│       ├── admin-packages.js
│       └── admin-usage.js
│
├── api/
│   └── auth/[...all]/
│       └── route.js                # Better Auth 路由
│
└── globals.css
```

## 🌐 URL 映射关系

### 前端（多语言）

| 访问 URL | 文件路径 | 说明 |
|---------|---------|------|
| `/` | `app/page.js` | 重定向到 `/en` |
| `/en` | `app/(client)/[locale]/page.js` | 英文首页（locale=en） |
| `/zh` | `app/(client)/[locale]/page.js` | 中文首页（locale=zh） |
| `/ja` | `app/(client)/[locale]/page.js` | 日文首页（locale=ja） |
| `/en/dashboard` | `app/(client)/[locale]/dashboard/...` | 英文仪表盘 |
| `/zh/generate` | `app/(client)/[locale]/generate/...` | 中文生成页 |

### 管理后台（无多语言）

| 访问 URL | 文件路径 | 说明 |
|---------|---------|------|
| `/admin` | `app/(admin)/admin/page.js` | 管理后台首页 |
| `/admin/users` | `app/(admin)/admin/users/page.js` | 用户管理 |
| `/admin/packages` | `app/(admin)/admin/packages/page.js` | 套餐管理 |

## 🔑 关键点理解

### 1. 路由组（Route Groups）

- **`(client)`** 和 **`(admin)`** 是路由组，用括号包裹
- 路由组**不会**出现在 URL 中
- 路由组用于：
  - 组织文件结构
  - 共享 layout
  - 分离不同的功能区域

### 2. 实际路径

- `(client)/[locale]/` → URL: `/en`, `/zh`, `/ja`
- `(admin)/admin/` → URL: `/admin`

**注意**：`(admin)` 不会出现在 URL 中，所以需要在里面创建 `admin/` 目录才能访问 `/admin`

### 3. 布局层级

#### 前端布局

```
(client)/[locale]/layout.js
└── <html lang={locale}>
    └── <NextIntlClientProvider messages={messages}>
        └── {children}
```

#### 管理后台布局

```
(admin)/layout.js
└── <html lang="en">
    └── {children}
```

## 📝 为什么这样设计？

### ✅ 优点

1. **清晰的结构**
   - `(client)` 和 `(admin)` 在文件系统中明确分离
   - 一眼就能看出哪些是前端，哪些是管理后台

2. **共享布局**
   - `(client)` 下所有页面共享多语言布局
   - `(admin)` 下所有页面共享管理后台布局

3. **灵活扩展**
   - 添加新的前端页面：`(client)/[locale]/new-page/`
   - 添加新的管理页面：`(admin)/admin/new-page/`

4. **中间件控制**
   - 可以精确控制哪些路径需要多语言处理
   - `/admin` 路径被排除，不经过语言检测

## 🚀 创建新页面

### 前端页面（需要多语言）

```bash
# 创建新页面
mkdir -p app/\(client\)/\[locale\]/my-feature
touch app/\(client\)/\[locale\]/my-feature/page.js

# 访问 URL
/en/my-feature
/zh/my-feature
/ja/my-feature
```

### 管理后台页面（不需要多语言）

```bash
# 创建新页面
mkdir -p app/\(admin\)/admin/my-admin-feature
touch app/\(admin\)/admin/my-admin-feature/page.js

# 访问 URL
/admin/my-admin-feature
```

## 🔗 导航示例

### 前端导航（需要 locale）

```javascript
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function ClientNav() {
  const locale = useLocale();
  
  return (
    <nav>
      <Link href={`/${locale}`}>Home</Link>
      <Link href={`/${locale}/dashboard`}>Dashboard</Link>
      <Link href={`/${locale}/generate`}>Generate</Link>
    </nav>
  );
}
```

### 管理后台导航（不需要 locale）

```javascript
import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav>
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/users">Users</Link>
      <Link href="/admin/packages">Packages</Link>
    </nav>
  );
}
```

## ⚙️ 中间件配置

```javascript
// middleware.js
export const config = {
  matcher: [
    // ✅ 匹配前端路由（需要多语言处理）
    '/((?!api|admin|_next|_vercel|.*\\..*).*)',
    '/',
  ],
};
```

**处理逻辑**：
- ✅ 处理：`/`, `/en`, `/zh`, `/en/dashboard` 等
- ❌ 跳过：`/admin`, `/api`, `/_next` 等

## 📊 对比表

| 特性 | (client)/[locale] | (admin)/admin |
|------|-------------------|---------------|
| 路由组 | `(client)` | `(admin)` |
| 实际路径 | `[locale]` | `admin` |
| URL 格式 | `/[locale]/path` | `/admin/path` |
| 多语言 | ✅ 支持 | ❌ 不支持 |
| 布局 | NextIntlClientProvider | 普通布局 |
| 中间件 | ✅ 处理 | ❌ 跳过 |
| 目标用户 | 全球用户 | 内部管理员 |

## 🎯 常见问题

### Q: 为什么不直接用 `app/admin/` 而要用 `app/(admin)/admin/`？

A: 使用 `(admin)` 路由组的好处：
1. 可以共享 layout
2. 组织结构更清晰
3. 可以在 `(admin)` 下放置共享的组件、工具等
4. 未来如果有其他管理相关路径（如 `/dashboard-admin`），可以都放在 `(admin)` 组下

### Q: 为什么前端不需要 `(client)/client/` 而是 `(client)/[locale]/`？

A: 因为前端使用动态路由 `[locale]`，它本身就是路径的一部分。而管理后台是固定路径 `/admin`，所以需要显式创建 `admin/` 目录。

### Q: 可以在 `(admin)` 下直接放 page.js 吗？

A: 不推荐。这样 URL 会是根路径 `/`，会和前端的根路径冲突。应该在 `(admin)/admin/page.js` 中创建。

## 📚 相关文档

- [I18N_STRUCTURE.md](./I18N_STRUCTURE.md) - 多语言结构详解
- [ROUTING.md](./ROUTING.md) - 路由快速参考
- [I18N_GUIDE.md](./I18N_GUIDE.md) - 多语言使用指南

---

**总结**：
- 路由组 `(name)` 不出现在 URL 中，只是组织工具
- 前端：`(client)/[locale]/` → `/en`, `/zh`, `/ja`
- 管理后台：`(admin)/admin/` → `/admin`

