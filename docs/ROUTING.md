# 路由结构快速参考

## 📋 URL 映射

### 前端用户界面（多语言）

| URL | 文件路径 | 说明 |
|-----|---------|------|
| `/` | `app/page.js` | 自动重定向到 `/en` |
| `/en` | `app/(client)/[locale]/page.js` | 英文首页 |
| `/zh` | `app/(client)/[locale]/page.js` | 中文首页 |
| `/ja` | `app/(client)/[locale]/page.js` | 日文首页 |
| `/en/dashboard` | `app/(client)/[locale]/dashboard/page.js` | 英文仪表盘 |
| `/zh/dashboard` | `app/(client)/[locale]/dashboard/page.js` | 中文仪表盘 |
| `/en/generate` | `app/(client)/[locale]/generate/page.js` | 英文生成页 |

### 管理后台（无多语言）

| URL | 文件路径 | 说明 |
|-----|---------|------|
| `/admin` | `app/(admin)/page.js` | 管理后台首页 |
| `/admin/users` | `app/(admin)/users/page.js` | 用户管理 |
| `/admin/packages` | `app/(admin)/packages/page.js` | 套餐管理 |

## 🎯 创建新页面

### 前端页面（需要多语言）

```bash
# 创建新页面
app/(client)/[locale]/my-page/page.js

# 访问 URL
/en/my-page
/zh/my-page
/ja/my-page
```

### 管理后台页面（不需要多语言）

```bash
# 创建新页面
app/(admin)/my-admin-page/page.js

# 访问 URL
/admin/my-admin-page
```

## 🔗 导航代码示例

### 前端导航（带语言前缀）

```javascript
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function Nav() {
  const locale = useLocale();
  
  return (
    <nav>
      <Link href={`/${locale}/dashboard`}>Dashboard</Link>
      <Link href={`/${locale}/generate`}>Generate</Link>
    </nav>
  );
}
```

### 管理后台导航（不带语言前缀）

```javascript
import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav>
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/users">Users</Link>
    </nav>
  );
}
```

## ⚙️ 布局层级

```
前端（多语言）：
app/(client)/[locale]/layout.js
└── NextIntlClientProvider
    └── 页面内容

管理后台（无多语言）：
app/(admin)/layout.js
└── 页面内容（直接渲染，无翻译）
```

## 🚦 中间件处理

```javascript
// middleware.js 配置
matcher: [
  '/((?!api|admin|_next|_vercel|.*\\..*).*)',  // ✅ 处理前端路由
  '/',                                           // ✅ 处理根路径
]

// ✅ 被处理：/, /en, /zh, /en/dashboard
// ❌ 被跳过：/admin, /api, /_next
```

## 📝 完整文档

- [I18N_STRUCTURE.md](./I18N_STRUCTURE.md) - 详细路由结构说明
- [I18N_GUIDE.md](./I18N_GUIDE.md) - 多语言使用指南
- [SERVER_ACTIONS.md](./SERVER_ACTIONS.md) - Server Actions 文档

