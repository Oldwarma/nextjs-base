# Nextra 站点搭建指南

> 详细的 Nextra 文档站点配置指南

---

## 📦 项目结构

```
nextjs-base-docs/           # 新项目根目录
├── package.json
├── next.config.js
├── tsconfig.json
├── theme.config.tsx
├── .gitignore
│
├── pages/                       # 文档页面
│   ├── _meta.json              # 顶层导航配置
│   ├── index.mdx               # 首页 ✅
│   │
│   ├── introduction/           # 介绍
│   │   ├── _meta.json
│   │   ├── what-is-nextjs-base.mdx
│   │   ├── why-nextjs-base.mdx
│   │   ├── comparison.mdx
│   │   └── architecture.mdx
│   │
│   ├── getting-started/        # 快速开始 ✅
│   │   ├── _meta.json
│   │   ├── installation.mdx
│   │   ├── quick-start.mdx     ✅
│   │   ├── first-crud.mdx
│   │   ├── project-structure.mdx
│   │   └── configuration.mdx
│   │
│   ├── admin/                  # Admin 框架
│   │   ├── _meta.json
│   │   ├── smart-crud/         (部分)
│   │   ├── rbac/
│   │   ├── database/
│   │   ├── components/
│   │   └── advanced/
│   │
│   └── ...
│
├── public/                     # 静态资源
│   ├── images/
│   └── logo.png
│
├── styles/                     # 自定义样式
│   └── globals.css
│
└── components/                 # 自定义组件
    └── ...
```

---

## 🚀 初始化项目

### 方式 1: 使用 Nextra CLI (推荐)

```bash
# 安装 Nextra
npx create-nextra-app nextjs-base-docs

# 选择模板
? Select a template › Docs

# 进入项目
cd nextjs-base-docs

# 启动开发服务器
npm run dev
```

### 方式 2: 手动安装

```bash
# 创建项目目录
mkdir nextjs-base-docs
cd nextjs-base-docs

# 初始化 package.json
npm init -y

# 安装依赖
npm install next react react-dom nextra nextra-theme-docs

# 创建必要文件
touch next.config.js
touch theme.config.tsx
mkdir pages
mkdir public
```

---

## 📝 配置文件

### package.json

```json
{
  "name": "nextjs-base-docs",
  "version": "1.0.0",
  "description": "NextJS Base Framework Documentation",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build && next export"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "nextra": "^3.0.0",
    "nextra-theme-docs": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### next.config.js

```javascript
const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  latex: true,
  search: {
    codeblocks: true,
  },
});

module.exports = withNextra({
  reactStrictMode: true,
  swcMinify: true,
  
  // i18n 配置 (可选)
  i18n: {
    locales: ['en', 'zh', 'ja'],
    defaultLocale: 'en',
  },
  
  // 静态导出 (可选)
  output: 'export',
  images: {
    unoptimized: true,
  },
});
```

### theme.config.tsx

```tsx
import React from 'react';
import { DocsThemeConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  // Logo
  logo: (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
        />
      </svg>
      <span style={{ marginLeft: '.4em', fontWeight: 800 }}>
        NextJS Base Framework
      </span>
    </>
  ),
  
  // Project Link
  project: {
    link: 'https://github.com/your-org/nextjs-base',
  },
  
  // Chat Link (可选)
  chat: {
    link: 'https://discord.gg/nextjsbase',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24">
        {/* Discord icon */}
      </svg>
    ),
  },
  
  // Docs Repository Base
  docsRepositoryBase: 'https://github.com/your-org/nextjs-base/tree/main/docs',
  
  // Footer
  footer: {
    text: (
      <span>
        MIT Licensed | © {new Date().getFullYear()} NextJS Base Framework
      </span>
    ),
  },
  
  // Sidebar
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <div style={{ fontWeight: 'bold', marginTop: '1.5rem' }}>{title}</div>;
      }
      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  
  // TOC
  toc: {
    float: true,
    backToTop: true,
    title: 'On This Page',
  },
  
  // Navigation
  navigation: {
    prev: true,
    next: true,
  },
  
  // Edit Link
  editLink: {
    text: 'Edit this page on GitHub →',
  },
  
  // Feedback Link
  feedback: {
    content: 'Question? Give us feedback →',
    labels: 'feedback',
  },
  
  // Search
  search: {
    placeholder: 'Search documentation...',
  },
  
  // Banner (可选)
  banner: {
    key: 'v1.0-release',
    text: (
      <a href="/blog/v1.0-release">
        🎉 NextJS Base Framework v1.0 is released. Read more →
      </a>
    ),
  },
  
  // Head
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="NextJS Base Framework" />
      <meta property="og:description" content="Next.js + MongoDB 开箱即用开发框架" />
      <link rel="icon" href="/favicon.ico" />
    </>
  ),
  
  // Primary Hue
  primaryHue: 212,
  
  // Dark Mode
  darkMode: true,
  
  // Next SEO Props
  useNextSeoProps() {
    return {
      titleTemplate: '%s – NextJS Base Framework',
    };
  },
};

export default config;
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## 🗂️ 导航配置

### pages/_meta.json (顶层导航)

```json
{
  "index": {
    "title": "Home",
    "type": "page",
    "display": "hidden",
    "theme": {
      "layout": "raw"
    }
  },
  "introduction": {
    "title": "Introduction",
    "type": "page"
  },
  "getting-started": {
    "title": "Getting Started",
    "type": "page"
  },
  "core-concepts": {
    "title": "Core Concepts",
    "type": "page"
  },
  "---": {
    "type": "separator"
  },
  "admin": {
    "title": "Admin Framework",
    "type": "page"
  },
  "client": {
    "title": "Client Framework",
    "type": "page"
  },
  "---2": {
    "type": "separator"
  },
  "api": {
    "title": "API Reference",
    "type": "page"
  },
  "examples": {
    "title": "Examples",
    "type": "page"
  },
  "recipes": {
    "title": "Recipes",
    "type": "page"
  },
  "---3": {
    "type": "separator"
  },
  "about": {
    "title": "About",
    "type": "page"
  },
  "changelog": {
    "title": "Changelog",
    "type": "page"
  }
}
```

### pages/admin/_meta.json (Admin 导航)

```json
{
  "index": {
    "title": "Overview",
    "type": "page"
  },
  "smart-crud": {
    "title": "SmartCRUD System",
    "type": "page"
  },
  "rbac": {
    "title": "RBAC System",
    "type": "page"
  },
  "database": {
    "title": "Database",
    "type": "page"
  },
  "components": {
    "title": "Components",
    "type": "page"
  },
  "advanced": {
    "title": "Advanced",
    "type": "page"
  }
}
```

### pages/admin/smart-crud/_meta.json

```json
{
  "introduction": {
    "title": "Introduction"
  },
  "quick-start": {
    "title": "Quick Start"
  },
  "fields-config": {
    "title": "Fields Configuration"
  },
  "field-types": {
    "title": "Field Types"
  },
  "search-modes": {
    "title": "Search Modes"
  },
  "advanced": {
    "title": "Advanced Features"
  },
  "examples": {
    "title": "Complete Examples"
  }
}
```

---

## 🎨 自定义样式

### styles/globals.css

```css
/* 自定义变量 */
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
}

/* 代码块样式 */
.nextra-code-block {
  margin: 1.5rem 0;
}

/* 卡片样式 */
.feature-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.feature-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🚀 开发与部署

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建生产版本

```bash
# 构建
npm run build

# 预览
npm run start
```

### 静态导出

```bash
# 导出静态文件
npm run export

# 输出到 out/ 目录
```

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 部署到其他平台

**Netlify**:
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "out"
```

**GitHub Pages**:
```bash
# 需要在 next.config.js 中配置 basePath
module.exports = withNextra({
  basePath: '/nextjs-base',
  output: 'export',
});
```

---

## 📚 常用功能

### 代码高亮

````markdown
```javascript filename="app/page.js" {3,5-7}
export default function Page() {
  return (
    <div>Hello World</div>
  );
}
```
````

### Callout (提示框)

```markdown
import { Callout } from 'nextra/components'

<Callout type="info">
  This is an info callout.
</Callout>

<Callout type="warning">
  This is a warning callout.
</Callout>

<Callout type="error">
  This is an error callout.
</Callout>
```

### Steps (步骤)

```markdown
import { Steps } from 'nextra/components'

<Steps>
### Step 1

Install dependencies.

### Step 2

Start the development server.

### Step 3

Build your application.
</Steps>
```

### Tabs

```markdown
import { Tabs, Tab } from 'nextra/components'

<Tabs items={['npm', 'yarn', 'pnpm']}>
  <Tab>npm install</Tab>
  <Tab>yarn add</Tab>
  <Tab>pnpm add</Tab>
</Tabs>
```

### Cards

```markdown
import { Cards, Card } from 'nextra/components'

<Cards>
  <Card icon="📝" title="Quick Start" href="/getting-started/quick-start" />
  <Card icon="🎨" title="SmartCRUD" href="/admin/smart-crud/introduction" />
</Cards>
```

---

## 🔍 SEO 优化

### 页面元数据

```mdx
---
title: Quick Start Guide
description: Get started with NextJS Base Framework in 5 minutes
---

# Quick Start
```

### Open Graph

在 `theme.config.tsx` 中配置:

```tsx
head: (
  <>
    <meta property="og:title" content="NextJS Base Framework" />
    <meta property="og:description" content="Next.js + MongoDB 开箱即用开发框架" />
    <meta property="og:image" content="/og-image.png" />
    <meta property="og:url" content="https://nextjsbase.com" />
    <meta name="twitter:card" content="summary_large_image" />
  </>
)
```

---

## 📊 分析与监控

### Google Analytics

安装:

```bash
npm install @next/third-parties
```

配置:

```tsx
// theme.config.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

head: (
  <>
    <GoogleAnalytics gaId="G-XXXXXXXXXX" />
  </>
)
```

---

## 🎯 下一步

1. 安装 Nextra 项目
2. 复制已创建的文档到 `pages/` 目录
3. 配置导航 `_meta.json` 文件
4. 自定义主题和样式
5. 本地测试
6. 部署到生产环境

---

## 📖 参考资料

- [Nextra 官方文档](https://nextra.site/)
- [Nextra Theme Docs](https://nextra.site/docs/docs-theme/start)
- [Next.js 文档](https://nextjs.org/docs)
- [Vercel 部署指南](https://vercel.com/docs)

