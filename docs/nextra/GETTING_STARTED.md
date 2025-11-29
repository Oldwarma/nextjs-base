# 如何使用这些文档

> 开发者、AI 和管理员的完整使用指南

---

## 🎯 文档已完成

我们已经完成了 NextJS Base 文档的核心部分,包括:

- 完整的规划和路线图
- 高质量的核心文档 (12篇,52,000字)
- 清理的项目结构 (25+临时文档已归档)
- 可执行的实施方案

**当前进度**: 约 50% (核心功能完成)

---

## 📁 文档位置

所有新文档位于: `/docs/nextra/`

```
docs/nextra/
├── README.md                        # 项目总览
├── FINAL_SUMMARY.md                 # 完整总结
├── GETTING_STARTED.md               # 本文档
├── 01-DOCUMENTATION_PLAN.md         # 规划文档
├── 02-DOCUMENTATION_PROGRESS.md     # 进度报告
├── 03-NEXTRA_SETUP_GUIDE.md         # Nextra 搭建指南
│
└── pages/                           # 文档内容
    ├── index.mdx                    # 首页
    ├── getting-started/
    │   └── quick-start.mdx          # 5分钟教程
    └── admin/
        ├── smart-crud/              # SmartCRUD (3篇)
        ├── rbac/                    # RBAC (1篇)
        └── database/                # 数据库 (1篇)
```

---

## 👨‍💻 开发者使用指南

### 1. 快速了解框架

**阅读顺序**:

1. **首页** (`pages/index.mdx`)
   - 了解框架定位和核心特性
   - 查看 5 分钟快速示例

2. **快速开始** (`pages/getting-started/quick-start.mdx`)
   - 跟随教程创建第一个 CRUD 页面
   - 理解基本开发流程

3. **核心文档**
   - SmartCRUD 系统
   - RBAC 权限系统
   - 数据库操作

### 2. 开发新功能

#### 创建 CRUD 页面

参考:
- `pages/admin/smart-crud/introduction.mdx` - 理解设计思想
- `pages/admin/smart-crud/field-types.mdx` - 查看字段类型
- `pages/getting-started/quick-start.mdx` - 参考完整示例

#### 添加权限控制

参考:
- `pages/admin/rbac/configuration.mdx` - 管理员配置指南

#### 数据库操作

参考:
- `pages/admin/database/db-api.mdx` - DB API 接口

### 3. 解决问题

每篇文档都包含:
- 常见问题 FAQ
- 最佳实践建议
- 完整代码示例

---

## 🤖 AI 助手使用指南

### 1. 理解项目架构

**必读文档**:

1. **规划文档** (`01-DOCUMENTATION_PLAN.md`)
   - 框架定位: 开箱即用的 Next.js + MongoDB 开发框架
   - 核心特性: SmartCRUD 配置驱动,减少 60% 代码

2. **架构设计** (`pages/admin/smart-crud/introduction.mdx`)
   - 设计理念: 一份配置,多处使用
   - 数据流: 用户操作 → SmartCrudPage → Server Actions → MongoDB

3. **进度报告** (`02-DOCUMENTATION_PROGRESS.md`)
   - 已完成功能清单
   - 待完成工作列表

### 2. 辅助开发 CRUD 页面

**参考模板**:

```javascript
// 1. Server Actions (参考 quick-start.mdx)
'use server';

export const getListAction = wrapQueryAction('resource', async (params) => {
  // 标准查询逻辑
});

export async function createAction(data) {
  // 标准创建逻辑
}

// 2. 前端页面 (参考 field-types.mdx)
const fieldsConfig = [
  {
    key: 'name',
    title: 'Name',
    type: 'text',
    table: { width: 200 },
    form: { required: true },
    search: { enabled: true, mode: 'like' },
  },
  // 更多字段...
];

return <SmartCrudPage fieldsConfig={fieldsConfig} actions={actions} />;
```

### 3. 回答用户问题

**知识库**:

- **SmartCRUD**
  - 26+ 种字段类型 (`field-types.mdx`)
  - 11 种搜索模式 (`search-modes.mdx`)
  - 完整配置参数

- **RBAC**
  - 权限/角色/菜单配置 (`rbac/configuration.mdx`)
  - 3 个常见场景示例

- **数据库**
  - 20+ 个 DB API 方法 (`database/db-api.mdx`)
  - 实战示例

### 4. 生成代码

**基于文档的代码模板**:

1. **CRUD 页面**: 参考 `quick-start.mdx` 的完整示例
2. **字段配置**: 参考 `field-types.mdx` 的 26+ 种类型
3. **搜索功能**: 参考 `search-modes.mdx` 的 11 种模式
4. **权限控制**: 参考 `rbac/configuration.mdx` 的实现

---

## 👨‍💼 管理员使用指南

### 1. 配置权限系统

**完整流程** (参考 `pages/admin/rbac/configuration.mdx`):

1. 创建权限体系 → `/admin/rbac/permissions`
2. 创建菜单 → `/admin/rbac/menus`
3. 创建角色 → `/admin/rbac/roles`
4. 为角色分配权限和菜单
5. 为用户分配角色 → `/admin/rbac/users`

### 2. 常见场景配置

**内容管理系统**:
- 作者: 创建和编辑文章
- 编辑: 全部文章权限 + 评论管理
- 管理员: 所有权限

**电商系统**:
- 客服: 查看和处理订单
- 财务: 查看订单、退款、导出
- 运营: 商品管理

详细配置步骤参考 `pages/admin/rbac/configuration.mdx`。

---

## 🚀 搭建文档站点

### 方式 1: 使用 Nextra (推荐)

按照 `03-NEXTRA_SETUP_GUIDE.md` 操作:

```bash
# 1. 创建 Nextra 项目
npx create-nextra-app nextjs-base-docs
# 选择: Docs 模板

# 2. 进入项目
cd nextjs-base-docs

# 3. 复制已创建的文档
cp -r ../docs/nextra/pages/* pages/

# 4. 配置主题 (参考 03-NEXTRA_SETUP_GUIDE.md)
# - 复制 theme.config.tsx
# - 复制 next.config.js
# - 创建 _meta.json 文件

# 5. 启动开发服务器
npm run dev

# 6. 访问 http://localhost:3000
```

### 方式 2: 直接阅读 Markdown

所有文档都是标准 Markdown (MDX) 格式,可以:

```bash
# 使用任何 Markdown 阅读器
# 例如 VS Code、Typora、MarkText 等

# 或者转换为 HTML
npx markdown-it pages/index.mdx > index.html
```

---

## 📖 核心文档清单

### 必读文档 (P0)

| 文档 | 说明 | 字数 | 位置 |
|------|------|------|------|
| **首页** | 框架介绍和快速示例 | 2000 | `pages/index.mdx` |
| **快速开始** | 5分钟完整教程 | 4000 | `pages/getting-started/quick-start.mdx` |
| **SmartCRUD 介绍** | 核心设计思想 | 3500 | `pages/admin/smart-crud/introduction.mdx` |
| **字段类型** | 26+ 种类型详解 | 6000 | `pages/admin/smart-crud/field-types.mdx` |

### 重要文档 (P1)

| 文档 | 说明 | 字数 | 位置 |
|------|------|------|------|
| **搜索模式** | 11 种搜索模式 | 5000 | `pages/admin/smart-crud/search-modes.mdx` |
| **RBAC 配置** | 权限系统配置 | 8000 | `pages/admin/rbac/configuration.mdx` |
| **DB API** | 数据库接口 | 5000 | `pages/admin/database/db-api.mdx` |

### 参考文档 (P2)

| 文档 | 说明 | 字数 | 位置 |
|------|------|------|------|
| **规划文档** | 完整规划 | 5000 | `01-DOCUMENTATION_PLAN.md` |
| **进度报告** | 详细进度 | 4000 | `02-DOCUMENTATION_PROGRESS.md` |
| **搭建指南** | Nextra 配置 | 3500 | `03-NEXTRA_SETUP_GUIDE.md` |
| **最终总结** | 完整总结 | 4000 | `FINAL_SUMMARY.md` |

---

## 💡 使用技巧

### 1. 快速查找

**按功能查找**:
- 创建 CRUD → `quick-start.mdx`
- 字段类型 → `field-types.mdx`
- 搜索功能 → `search-modes.mdx`
- 权限配置 → `rbac/configuration.mdx`
- 数据库操作 → `database/db-api.mdx`

**按关键词查找**:
```bash
# 使用 grep 搜索
grep -r "关键词" pages/

# 或使用 VS Code 全局搜索
Cmd/Ctrl + Shift + F
```

### 2. 复制代码

所有代码示例都可以直接复制使用:

- 完整可运行
- 包含注释
- 最佳实践

### 3. 查看示例

每篇文档都包含:
- 📝 理论说明
- 💻 完整代码示例
- 最佳实践
- ❓ 常见问题 FAQ

---

## 🔗 相关链接

### 文档位置

- **Nextra 文档**: `/docs/nextra/`
- **归档文档**: `/docs/archive/`
- **原始文档**: `/docs/` (保留部分核心文档)

### 外部参考

- **Nextra**: https://nextra.site/
- **Next.js**: https://nextjs.org/docs
- **Ant Design**: https://ant.design/

---

## ❓ 常见问题

### Q: 如何开始使用?

**A**: 按照以下顺序:
1. 阅读首页了解框架
2. 跟随 5 分钟教程创建第一个页面
3. 查阅详细文档深入学习

### Q: 文档不完整怎么办?

**A**: 当前进度约 50%,核心功能已完成:
- SmartCRUD 核心功能 60%
- RBAC 配置指南 30%
- 数据库操作 30%

待完成部分参考 `FINAL_SUMMARY.md`。

### Q: 如何贡献文档?

**A**: 
1. Fork 项目
2. 创建分支
3. 编写/改进文档
4. 提交 Pull Request

### Q: 文档有错误怎么办?

**A**: 
1. 在 GitHub 上提 Issue
2. 或直接提交 Pull Request 修复

---

## 🎯 下一步

### 立即可做

1. **阅读核心文档**
   - 首页
   - 快速开始
   - SmartCRUD 介绍

2. **搭建文档站点**
   - 按照 `03-NEXTRA_SETUP_GUIDE.md` 操作
   - 本地预览效果

3. **尝试开发**
   - 跟随 5 分钟教程
   - 创建第一个 CRUD 页面

### 持续改进

1. **完成剩余文档** (参考 `FINAL_SUMMARY.md`)
2. **添加更多示例**
3. **收集用户反馈**
4. **持续优化完善**

---

## 📞 获取帮助

### 文档相关

- 📖 查看 `README.md` - 项目总览
- 📊 查看 `FINAL_SUMMARY.md` - 完整总结
- 🔧 查看 `03-NEXTRA_SETUP_GUIDE.md` - 搭建指南

### 技术支持

- **GitHub**: [提交 Issue](https://github.com/your-org/nextjs-base/issues)
- **Email**: docs@nextjsbase.com
- **Discord**: [加入社区](https://discord.gg/nextjsbase)

---

**祝你使用愉快!** 🎉

