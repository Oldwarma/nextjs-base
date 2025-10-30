# 多语言路由结构说明

## 📁 项目路由结构

```
app/
├── page.js                    # 根页面（自动重定向到 /en）
│
├── (client)/                  # 前端用户界面（支持多语言）
│   ├── [locale]/             # 动态语言路由
│   │   ├── layout.js         # 多语言布局
│   │   ├── page.js           # 首页
│   │   ├── dashboard/        # 仪表盘
│   │   └── generate/         # 图片生成
│   │
│   └── actions/              # 客户端 Server Actions
│       ├── credits.js
│       ├── generate.js
│       ├── packages.js
│       ├── usage.js
│       └── user.js
│
├── (admin)/                   # 管理后台（不支持多语言）
│   ├── layout.js             # 管理后台布局（英文固定）
│   ├── page.js               # 管理后台首页
│   │
│   └── actions/              # 管理员 Server Actions
│       ├── admin-credits.js
│       ├── admin-packages.js
│       ├── admin-usage.js
│       └── admin-users.js
│
├── api/
│   └── auth/[...all]/        # Better Auth 路由
│       └── route.js
│
└── globals.css               # 全局样式
```

## 🌍 URL 结构

### 前端用户界面（多语言）

```
访问路径                        实际路由
─────────────────────────────────────────────────
/                            → 重定向到 /en
/en                          → (client)/[locale]/page.js (locale=en)
/zh                          → (client)/[locale]/page.js (locale=zh)
/ja                          → (client)/[locale]/page.js (locale=ja)

/en/dashboard                → (client)/[locale]/dashboard/...
/zh/dashboard                → (client)/[locale]/dashboard/...
/ja/dashboard                → (client)/[locale]/dashboard/...

/en/generate                 → (client)/[locale]/generate/...
/zh/generate                 → (client)/[locale]/generate/...
/ja/generate                 → (client)/[locale]/generate/...
```

### 管理后台（无多语言）

```
访问路径                        实际路由
─────────────────────────────────────────────────
/admin                       → (admin)/page.js
/admin/users                 → (admin)/users/page.js
/admin/packages              → (admin)/packages/page.js
/admin/credits               → (admin)/credits/page.js
```

## 🔧 中间件配置

`middleware.js` 配置为：

```javascript
export const config = {
  matcher: [
    // ✅ 匹配：所有前端路由（支持多语言）
    '/((?!api|admin|_next|_vercel|.*\\..*).*)',
    '/',
  ],
};
```

**排除的路径**：
- ❌ `/api/*` - API 路由
- ❌ `/admin/*` - 管理后台（不需要多语言）
- ❌ `/_next/*` - Next.js 内部文件
- ❌ `/favicon.ico` 等静态资源

## 📝 路由组说明

### (client) 路由组

- **用途**：面向终端用户的前端界面
- **多语言**：✅ 支持（en, zh, ja）
- **路由格式**：`/[locale]/...`
- **布局**：`(client)/[locale]/layout.js`（包含 NextIntlClientProvider）

### (admin) 路由组

- **用途**：管理员后台
- **多语言**：❌ 不支持（固定英文）
- **路由格式**：`/admin/...`
- **布局**：`(admin)/layout.js`（普通布局）

### 为什么这样设计？

1. **前端用户需要多语言**
   - 来自不同国家的用户
   - 提升用户体验
   - SEO 优化

2. **管理后台不需要多语言**
   - 管理员通常是内部团队
   - 统一使用英文更高效
   - 减少翻译和维护成本
   - 简化开发和测试

## 🚀 使用示例

### 前端页面（使用多语言）

```javascript
// app/(client)/[locale]/dashboard/page.js
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome', { name: 'John' })}</p>
    </div>
  );
}
```

### 管理后台页面（不使用多语言）

```javascript
// app/(admin)/users/page.js
export default function AdminUsersPage() {
  return (
    <div>
      <h1>User Management</h1>
      <p>Manage all users in the system</p>
    </div>
  );
}
```

## 🔗 导航链接

### 前端链接（需要包含 locale）

```javascript
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function Navigation() {
  const locale = useLocale();
  
  return (
    <nav>
      <Link href={`/${locale}/dashboard`}>Dashboard</Link>
      <Link href={`/${locale}/generate`}>Generate</Link>
      <Link href={`/${locale}/credits`}>Credits</Link>
    </nav>
  );
}
```

### 管理后台链接（不需要 locale）

```javascript
import Link from 'next/link';

export default function AdminNavigation() {
  return (
    <nav>
      <Link href="/admin">Dashboard</Link>
      <Link href="/admin/users">Users</Link>
      <Link href="/admin/packages">Packages</Link>
    </nav>
  );
}
```

## 🔄 路由重定向

### 根路径重定向

访问 `/` 会自动重定向到 `/en`（默认语言）

### 从管理后台跳转到前端

```javascript
// 在管理后台中，如果需要跳转到前端页面
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/en/dashboard'); // 指定语言
```

### 从前端跳转到管理后台

```javascript
// 在前端中，管理员可以直接访问 /admin
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/admin'); // 不需要 locale
```

## ⚠️ 注意事项

1. **前端页面必须在 `(client)/[locale]/` 下**
   - 所有用户可见的页面
   - 需要多语言支持的页面

2. **管理后台页面必须在 `(admin)/` 下**
   - 只有管理员可访问的页面
   - 不需要多语言支持

3. **Server Actions 分开存放**
   - 前端 Actions: `app/(client)/actions/`
   - 管理员 Actions: `app/(admin)/actions/`

4. **中间件只处理前端路由**
   - `/admin/*` 路径被排除
   - 不会经过语言检测和重定向

## 📊 路由对比表

| 特性 | (client)/[locale] | (admin) |
|------|-------------------|---------|
| 多语言 | ✅ 支持 | ❌ 不支持 |
| URL 格式 | `/[locale]/path` | `/admin/path` |
| 目标用户 | 终端用户 | 管理员 |
| 翻译文件 | 使用 | 不使用 |
| 中间件 | 处理 | 跳过 |
| SEO | 重要 | 不重要 |
| Layout | NextIntlClientProvider | 普通 |

## 🎯 开发建议

### 创建新的前端页面

```bash
# ✅ 正确位置
app/(client)/[locale]/new-page/page.js

# ❌ 错误位置
app/new-page/page.js
app/(admin)/new-page/page.js
```

### 创建新的管理后台页面

```bash
# ✅ 正确位置
app/(admin)/new-feature/page.js

# ❌ 错误位置
app/new-feature/page.js
app/(client)/[locale]/admin/new-feature/page.js
```

## 📚 相关文档

- [I18N_GUIDE.md](./I18N_GUIDE.md) - 完整多语言使用指南
- [I18N_QUICK_REF.md](./I18N_QUICK_REF.md) - 快速参考
- [SERVER_ACTIONS.md](./SERVER_ACTIONS.md) - Server Actions 文档
- [PERMISSIONS.md](./PERMISSIONS.md) - 权限管理文档

---

**总结**：前端用户界面使用多语言 `(client)/[locale]`，管理后台不使用多语言 `(admin)`。

