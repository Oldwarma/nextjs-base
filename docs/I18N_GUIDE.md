# 国际化（i18n）使用指南

## 概述

本项目使用 **next-intl** 实现多语言支持，目前支持：

-   🇺🇸 英语 (en)
-   🇨🇳 简体中文 (zh)
-   🇯🇵 日语 (ja)

## 项目结构

```
jimeng-saas/
├── i18n/
│   ├── config.js          # i18n 配置（语言列表、默认语言等）
│   └── request.js         # next-intl 请求配置
├── messages/
│   ├── en.json           # 英文翻译
│   ├── zh.json           # 中文翻译
│   └── ja.json           # 日文翻译
├── middleware.js          # 语言路由中间件
├── components/
│   ├── LanguageSwitcher.jsx        # 下拉菜单语言切换器
│   └── LanguageSwitcherSimple.jsx  # 按钮式语言切换器
└── app/
    └── [locale]/         # 动态语言路由
        ├── layout.js     # 多语言布局
        └── page.js       # 首页
```

## 快速开始

### 1. Server Components（服务端组件）

```javascript
import { useTranslations } from 'next-intl';

export default function Page() {
	const t = useTranslations('generate');

	return (
		<div>
			<h1>{t('title')}</h1>
			<p>{t('description')}</p>
		</div>
	);
}
```

### 2. Client Components（客户端组件）

```javascript
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
	const t = useTranslations('common');

	return <button>{t('save')}</button>;
}
```

### 3. Server Actions

```javascript
'use server';

import { getTranslations } from 'next-intl/server';

export async function someAction() {
	const t = await getTranslations('errors');

	return {
		success: false,
		error: t('insufficientCredits'),
	};
}
```

## 翻译文件结构

翻译文件使用 JSON 格式，支持嵌套结构：

```json
{
	"nav": {
		"home": "Home",
		"generate": "Generate",
		"dashboard": "Dashboard"
	},
	"generate": {
		"title": "Generate Image",
		"prompt": "Prompt",
		"promptPlaceholder": "Describe the image..."
	},
	"errors": {
		"unauthorized": "Please login first",
		"insufficientCredits": "Insufficient credits"
	}
}
```

### 访问翻译

```javascript
const t = useTranslations('nav');

t('home'); // "Home"
t('generate'); // "Generate"

const tGen = useTranslations('generate');
tGen('title'); // "Generate Image"
```

## 带变量的翻译

### 在翻译文件中定义

```json
{
	"generate": {
		"creditsUsed": "Credits used: {amount}",
		"welcomeBack": "Welcome back, {name}!"
	}
}
```

### 使用变量

```javascript
const t = useTranslations('generate');

t('creditsUsed', { amount: 10 }); // "Credits used: 10"
t('welcomeBack', { name: 'John' }); // "Welcome back, John!"
```

## 语言切换

### 方式 1：下拉菜单

```javascript
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
	return (
		<header>
			<LanguageSwitcher />
		</header>
	);
}
```

### 方式 2：按钮组

```javascript
import LanguageSwitcherSimple from '@/components/LanguageSwitcherSimple';

export default function Header() {
	return (
		<header>
			<LanguageSwitcherSimple />
		</header>
	);
}
```

## 路由结构

### URL 格式

```
/en              → 英文首页
/en/generate     → 英文生成页面
/en/dashboard    → 英文仪表盘

/zh              → 中文首页
/zh/generate     → 中文生成页面
/zh/dashboard    → 中文仪表盘
```

### 页面导航

```javascript
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function Navigation() {
	const locale = useLocale();

	return (
		<nav>
			<Link href={`/${locale}/generate`}>Generate</Link>
			<Link href={`/${locale}/dashboard`}>Dashboard</Link>
		</nav>
	);
}
```

### 使用 useRouter

```javascript
'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function MyComponent() {
	const router = useRouter();
	const locale = useLocale();

	const handleClick = () => {
		router.push(`/${locale}/dashboard`);
	};

	return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

## 元数据（SEO）

### 静态元数据

```javascript
// app/[locale]/layout.js
export async function generateMetadata({ params }) {
	const { locale } = await params;

	return {
		title: locale === 'zh' ? 'AI 图片生成' : 'AI Image Generation',
		description: locale === 'zh' ? '使用 AI 创建精美图片' : 'Create stunning images with AI',
		alternates: {
			canonical: `/${locale}`,
			languages: {
				en: '/en',
				zh: '/zh',
				ja: '/ja',
			},
		},
	};
}
```

### 使用翻译文件

```javascript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'metadata' });

	return {
		title: t('title'),
		description: t('description'),
	};
}
```

## 日期和时间格式化

### 使用 Intl API

```javascript
import { useLocale } from 'next-intl';

export default function DateDisplay({ date }) {
	const locale = useLocale();

	const formatted = new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(date);

	return <span>{formatted}</span>;
}
```

### 使用 next-intl 的 DateTimeFormat

```javascript
import { useFormatter } from 'next-intl';

export default function DateDisplay({ date }) {
	const format = useFormatter();

	return (
		<span>
			{format.dateTime(date, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			})}
		</span>
	);
}
```

## 数字和货币格式化

### 货币格式化

```javascript
import { useFormatter } from 'next-intl';

export default function PriceDisplay({ amount }) {
	const format = useFormatter();

	return (
		<span>
			{format.number(amount, {
				style: 'currency',
				currency: 'USD',
			})}
		</span>
	);
}
```

### 数字格式化

```javascript
const format = useFormatter();

format.number(1234.56); // "1,234.56" (en) / "1,234.56" (zh)
format.number(0.95, { style: 'percent' }); // "95%" (所有语言)
```

## 添加新语言

### 1. 添加语言到配置

```javascript
// i18n/config.js
export const locales = ['en', 'zh', 'ja', 'ko']; // 添加韩语

export const localeNames = {
	en: {
		name: 'English',
		shortName: 'EN',
		flag: '🇺🇸',
	},
	zh: { name: '简体中文', shortName: 'CN', flag: '🇨🇳' },
	ja: { name: '日本語', shortName: 'JP', flag: '🇯🇵' },
};
```

### 2. 创建翻译文件

复制 `messages/en.json` 到 `messages/ko.json`，然后翻译内容。

### 3. 完成！

中间件和路由会自动识别新语言。

## 数据库内容本地化

对于存储在数据库中的动态内容（如套餐描述），建议使用以下结构：

### 数据库设计

```javascript
// packages 集合
{
  _id: ObjectId,
  nameTranslations: {
    en: 'Pro Plan',
    zh: '专业版',
    ja: 'プロプラン'
  },
  descriptionTranslations: {
    en: 'For professional users',
    zh: '适合专业用户',
    ja: 'プロフェッショナルユーザー向け'
  },
  price: 29.99,
  credits: 500
}
```

### 获取翻译内容

```javascript
import { useLocale } from 'next-intl';

export default function PackageCard({ package }) {
	const locale = useLocale();

	return (
		<div>
			<h3>{package.nameTranslations[locale]}</h3>
			<p>{package.descriptionTranslations[locale]}</p>
		</div>
	);
}
```

### 辅助函数

```javascript
// lib/i18n-helpers.js

/**
 * 获取翻译字段，如果当前语言不存在则回退到英语
 */
export function getTranslatedField(translations, locale) {
	return translations[locale] || translations['en'] || '';
}

// 使用
const name = getTranslatedField(package.nameTranslations, locale);
```

## 常见问题

### Q: 如何设置默认语言？

A: 在 `i18n/config.js` 中修改 `defaultLocale`：

```javascript
export const defaultLocale = 'zh'; // 改为中文
```

### Q: 如何隐藏默认语言的前缀（如 `/en/`）？

A: 修改 `middleware.js`：

```javascript
export default createMiddleware({
	locales,
	defaultLocale,
	localePrefix: 'as-needed', // 默认语言不显示前缀
});
```

### Q: 翻译键不存在时如何处理？

A: next-intl 会自动回退显示键名。可以在 `i18n/request.js` 中配置：

```javascript
export default getRequestConfig(async ({ requestLocale }) => {
	// ...
	return {
		locale,
		messages,
		onError: (error) => {
			console.error('Translation error:', error);
		},
		getMessageFallback: ({ namespace, key }) => {
			return `${namespace}.${key}`; // 或返回默认值
		},
	};
});
```

### Q: 如何在 Server Actions 中获取当前语言？

A: 使用 `headers()` 和 `getLocale()`：

```javascript
import { getLocale } from 'next-intl/server';

export async function someAction() {
	const locale = await getLocale();
	// 使用 locale
}
```

### Q: 如何保存用户的语言偏好？

A: next-intl 自动使用 Cookie 保存，也可以存储到数据库：

```javascript
// 在用户更改语言时
export async function updateUserLanguage(userId, locale) {
	await db.collection('users').updateOne({ id: userId }, { $set: { preferredLanguage: locale } });
}
```

## 最佳实践

### 1. 翻译文件组织

✅ **按功能模块组织**

```json
{
	"nav": {
		/* 导航相关 */
	},
	"generate": {
		/* 生成页面相关 */
	},
	"credits": {
		/* 积分相关 */
	}
}
```

❌ **不要全部放在一起**

```json
{
	"home": "Home",
	"generate": "Generate",
	"save": "Save"
}
```

### 2. 命名规范

✅ **使用描述性键名**

```json
{
	"generate": {
		"promptPlaceholder": "Describe the image...",
		"generatingProgress": "Generating..."
	}
}
```

❌ **不要使用模糊的键名**

```json
{
	"text1": "Describe...",
	"msg": "Generating..."
}
```

### 3. 保持一致性

所有语言的翻译文件应该有相同的键结构：

```json
// en.json
{
  "nav": { "home": "Home", "about": "About" }
}

// zh.json
{
  "nav": { "home": "首页", "about": "关于" }
}
```

### 4. 使用命名空间

```javascript
// ✅ 好的做法
const t = useTranslations('generate');
t('title');

// ❌ 避免这样
const t = useTranslations();
t('generate.title');
```

## 性能优化

1. **按需加载**：next-intl 自动按需加载翻译文件
2. **服务端渲染**：翻译在服务端完成，无客户端开销
3. **缓存**：翻译文件会被 Next.js 缓存

## 总结

-   ✅ 使用 `useTranslations` 在组件中获取翻译
-   ✅ 使用 `getTranslations` 在 Server Actions 中获取翻译
-   ✅ 翻译文件按功能模块组织
-   ✅ 支持变量插值 `{variable}`
-   ✅ 自动路由处理 `/[locale]/...`
-   ✅ SEO 友好的 alternate links
-   ✅ 数据库内容使用多语言字段

有问题？查看 [next-intl 官方文档](https://next-intl-docs.vercel.app/)
