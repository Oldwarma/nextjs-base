# i18n 快速参考

## 快速开始

### Server Component
```javascript
import { useTranslations } from 'next-intl';

const t = useTranslations('namespace');
<h1>{t('key')}</h1>
```

### Client Component
```javascript
'use client';
import { useTranslations } from 'next-intl';

const t = useTranslations('namespace');
```

### Server Action
```javascript
'use server';
import { getTranslations } from 'next-intl/server';

const t = await getTranslations('namespace');
return { error: t('key') };
```

## 常用Hook

| Hook | 用途 | 示例 |
|------|------|------|
| `useTranslations('ns')` | 获取翻译 | `t('key')` |
| `useLocale()` | 获取当前语言 | `'en'`, `'zh'` |
| `useFormatter()` | 格式化 | `format.number()` |

## 带变量的翻译

```json
{
  "welcome": "Hello, {name}!",
  "credits": "{amount} credits remaining"
}
```

```javascript
t('welcome', { name: 'John' })
t('credits', { amount: 100 })
```

## 路由

```
/en/dashboard  → 英文仪表盘
/zh/dashboard  → 中文仪表盘
```

```javascript
import Link from 'next/link';
const locale = useLocale();

<Link href={`/${locale}/dashboard`}>Dashboard</Link>
```

## 语言切换

```javascript
import LanguageSwitcher from '@/components/LanguageSwitcher';

<LanguageSwitcher />
```

## 翻译文件

```
messages/
├── en.json
├── zh.json
└── ja.json
```

## 配置文件

- `i18n/config.js` - 语言列表和名称
- `i18n/request.js` - next-intl 配置
- `middleware.js` - 路由中间件

## 常见模式

### 错误消息（Server Actions）
```javascript
const t = await getTranslations('errors');
return { success: false, error: t('insufficientCredits') };
```

### 成功消息
```javascript
const t = useTranslations('success');
toast.success(t('saved'));
```

### 表单验证
```javascript
const t = useTranslations('validation');
if (!email) return t('required');
if (!isValidEmail(email)) return t('invalidEmail');
```

### 格式化货币
```javascript
const format = useFormatter();
format.number(29.99, { style: 'currency', currency: 'USD' })
// → "$29.99"
```

### 格式化日期
```javascript
const format = useFormatter();
format.dateTime(new Date(), { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})
// → "January 1, 2024" (en)
// → "2024年1月1日" (zh)
```

## 添加新翻译

1. 编辑 `messages/en.json`
2. 复制到 `messages/zh.json` 并翻译
3. 复制到 `messages/ja.json` 并翻译
4. 在组件中使用 `t('newKey')`

## 检查清单

- [ ] 翻译文件有相同的键结构
- [ ] Server Actions 使用 `getTranslations`
- [ ] Client Components 使用 `useTranslations`
- [ ] 路由链接包含 `/${locale}`
- [ ] 错误消息已翻译
- [ ] 表单验证消息已翻译

## 完整文档

查看 [I18N_GUIDE.md](./I18N_GUIDE.md) 了解详细信息。

