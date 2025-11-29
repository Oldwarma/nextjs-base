# 文档重组计划 - Nextra Documentation Plan

> 将现有 SaaS 项目转型为通用开发框架的文档规划  
> 参考: VK Framework + Nextra Documentation

## 🎯 目标定位

### 框架定位
- **名称**: NextJS Base Framework (暂定)
- **定位**: 基于 Next.js + MongoDB 的开箱即用全栈开发框架
- **目标用户**: 
  - 独立开发者
  - 小团队快速开发
  - SaaS 产品原型开发
  - 企业内部系统开发

### 核心价值主张
1. **开箱即用** - 零配置快速启动
2. **配置驱动** - SmartCRUD 减少 60% 重复代码
3. **权限完善** - 内置 RBAC 权限系统
4. **文档完善** - 像 VK 一样的详细文档
5. **可扩展性** - 不限制开发者自由度

---

## 📚 文档组织结构

### 参考 VK 的文档组织

VK Framework 文档结构:
```
├── 指南 (快速开始、核心概念)
├── Client端框架
├── Admin端框架  
├── 统一支付
├── Redis
└── 数据库搬家
```

### Nextra 文档结构规范

```
nextra-docs/
├── pages/
│   ├── _meta.json                   # 顶层导航配置
│   ├── index.mdx                    # 首页
│   │
│   ├── introduction/                # 🎯 介绍
│   │   ├── _meta.json
│   │   ├── what-is-nextjs-base.mdx      # 什么是 NextJS Base Framework
│   │   ├── why-nextjs-base.mdx          # 为什么选择 NextJS Base
│   │   ├── comparison.mdx          # 与其他框架对比
│   │   └── architecture.mdx        # 整体架构
│   │
│   ├── getting-started/             # 🚀 快速开始
│   │   ├── _meta.json
│   │   ├── installation.mdx        # 安装
│   │   ├── quick-start.mdx         # 5分钟上手
│   │   ├── first-crud.mdx          # 第一个 CRUD 页面
│   │   ├── project-structure.mdx   # 项目结构
│   │   └── configuration.mdx       # 基础配置
│   │
│   ├── core-concepts/               # 💡 核心概念
│   │   ├── _meta.json
│   │   ├── database-design.mdx     # 数据库设计 (UUID主键)
│   │   ├── naming-standards.mdx    # 命名规范
│   │   ├── server-actions.mdx      # Server Actions 最佳实践
│   │   └── configuration-driven.mdx # 配置驱动开发
│   │
│   ├── admin/                       # 🎨 Admin 端框架
│   │   ├── _meta.json
│   │   │
│   │   ├── smart-crud/              # SmartCRUD 系统
│   │   │   ├── _meta.json
│   │   │   ├── introduction.mdx    # 介绍
│   │   │   ├── quick-start.mdx     # 快速开始
│   │   │   ├── fields-config.mdx   # 字段配置
│   │   │   ├── field-types.mdx     # 字段类型大全
│   │   │   ├── search-modes.mdx    # 搜索模式
│   │   │   ├── advanced.mdx        # 高级特性
│   │   │   └── examples.mdx        # 完整示例
│   │   │
│   │   ├── rbac/                    # RBAC 权限系统
│   │   │   ├── _meta.json
│   │   │   ├── introduction.mdx
│   │   │   ├── configuration.mdx   # 配置指南
│   │   │   ├── implementation.mdx  # 实现指南
│   │   │   ├── backend-control.mdx # 后端权限控制
│   │   │   ├── frontend-control.mdx # 前端权限控制
│   │   │   └── best-practices.mdx
│   │   │
│   │   ├── database/                # 数据库操作
│   │   │   ├── _meta.json
│   │   │   ├── db-api.mdx          # DB API 指南
│   │   │   ├── base-dao.mdx        # BaseDAO 指南
│   │   │   ├── comparison.mdx      # DB API vs BaseDAO
│   │   │   ├── foreign-db.mdx      # 连表查询
│   │   │   └── aggregation.mdx     # 聚合查询
│   │   │
│   │   ├── components/              # 组件
│   │   │   ├── _meta.json
│   │   │   ├── smart-crud-page.mdx
│   │   │   ├── dynamic-form.mdx
│   │   │   ├── markdown-editor.mdx
│   │   │   └── modals.mdx
│   │   │
│   │   └── advanced/                # 高级功能
│   │       ├── _meta.json
│   │       ├── action-logger.mdx
│   │       ├── menu-management.mdx
│   │       ├── custom-actions.mdx
│   │       └── performance.mdx
│   │
│   ├── client/                      # 👥 Client 端框架 (待开发)
│   │   ├── _meta.json
│   │   ├── introduction.mdx
│   │   ├── authentication.mdx
│   │   ├── i18n.mdx
│   │   └── permissions.mdx
│   │
│   ├── api/                         # 📖 API 参考
│   │   ├── _meta.json
│   │   │
│   │   ├── server-actions/          # Server Actions API
│   │   │   ├── _meta.json
│   │   │   ├── crud-actions.mdx
│   │   │   ├── auth-actions.mdx
│   │   │   └── custom-actions.mdx
│   │   │
│   │   ├── components/              # 组件 API
│   │   │   ├── _meta.json
│   │   │   ├── smart-crud-page.mdx
│   │   │   └── dynamic-form-fields.mdx
│   │   │
│   │   ├── hooks/                   # React Hooks
│   │   │   ├── _meta.json
│   │   │   ├── use-permission.mdx
│   │   │   └── use-mobile.mdx
│   │   │
│   │   └── utilities/               # 工具函数
│   │       ├── _meta.json
│   │       ├── db-api.mdx
│   │       └── base-dao.mdx
│   │
│   ├── guides/                      # 📚 开发指南
│   │   ├── _meta.json
│   │   ├── authentication.mdx
│   │   ├── authorization.mdx
│   │   ├── database-design.mdx
│   │   ├── internationalization.mdx
│   │   ├── error-handling.mdx
│   │   └── deployment.mdx
│   │
│   ├── examples/                    # 💡 示例
│   │   ├── _meta.json
│   │   ├── basic-crud.mdx
│   │   ├── tree-structure.mdx
│   │   ├── file-upload.mdx
│   │   ├── data-statistics.mdx
│   │   └── multi-tenancy.mdx
│   │
│   ├── recipes/                     # 🍳 实战菜谱
│   │   ├── _meta.json
│   │   ├── user-management.mdx
│   │   ├── content-management.mdx
│   │   ├── ecommerce-orders.mdx
│   │   └── saas-multi-tenant.mdx
│   │
│   ├── migration/                   # 🔄 迁移指南
│   │   ├── _meta.json
│   │   ├── from-v1.mdx
│   │   └── from-express.mdx
│   │
│   └── about/                       # ℹ️ 关于
│       ├── _meta.json
│       ├── changelog.mdx
│       ├── roadmap.mdx
│       ├── faq.mdx
│       └── contributing.mdx
│
├── public/                          # 静态资源
│   ├── images/
│   └── examples/
│
├── theme.config.tsx                 # Nextra 主题配置
├── next.config.js
└── package.json
```

---

## 📝 文档编写优先级

### Phase 1: 基础框架 (P0 - 必须)
1. **首页** (`index.mdx`) - 吸引人的首页
2. **介绍** - 什么是 NextJS Base, 为什么选择
3. **快速开始** - 5分钟创建第一个 CRUD 页面
4. **核心概念** - 数据库设计、命名规范

### Phase 2: Admin 核心功能 (P1 - 重要)
1. **SmartCRUD 完整文档** - 从现有文档整理
2. **RBAC 权限系统** - 从现有文档整理
3. **数据库操作** - DB API + BaseDAO
4. **组件文档** - SmartCrudPage, DynamicForm

### Phase 3: API 参考 (P2 - 重要)
1. **Server Actions API** - 所有 Actions 的完整参考
2. **组件 API** - Props, Events 完整文档
3. **工具函数 API** - 所有 utilities

### Phase 4: 进阶内容 (P3 - 可选)
1. **开发指南** - 认证、授权、国际化
2. **示例代码** - 完整可运行示例
3. **实战菜谱** - 真实业务场景

---

## 🎨 文档风格指南

### 参考 VK 的文档风格

1. **清晰的标题层级**
   ```markdown
   # 一级标题 - 页面标题
   ## 二级标题 - 主要章节
   ### 三级标题 - 小节
   #### 四级标题 - 细节
   ```

2. **丰富的代码示例**
   - 每个功能都有完整的代码示例
   - 注释详细
   - 可复制粘贴直接使用

3. **表格对比**
   - 用表格对比不同方案
   - 清晰的 ❌ 标记

4. **实际案例**
   - 基于真实业务场景
   - 完整的前后端代码

5. **常见问题 FAQ**
   - 每个大章节都有 FAQ
   - 解决实际遇到的问题

---

## 📊 现有文档映射

### 需要保留并整理的文档

| 现有文档 | 新位置 | 状态 |
|---------|--------|------|
| SMART_CRUD_COMPLETE_GUIDE.md | `/admin/smart-crud/` | 拆分成多个页面 |
| SMART_CRUD_ARCHITECTURE.md | `/admin/smart-crud/introduction.mdx` | 整合 |
| admin/RBAC_SYSTEM.md | `/admin/rbac/configuration.mdx` | 用户配置指南 |
| rbac/RBAC_IMPLEMENTATION_GUIDE.md | `/admin/rbac/implementation.mdx` | 开发者实现指南 |
| database/DB_API_GUIDE.md | `/admin/database/db-api.mdx` | 完整保留 |
| admin/BASE_DAO.md | `/admin/database/base-dao.mdx` | 完整保留 |
| database/FOREIGNDB_JOIN_GUIDE.md | `/admin/database/foreign-db.mdx` | 连表查询 |
| admin/ACTION_LOGGER.md | `/admin/advanced/action-logger.mdx` | 保留 |
| admin/MENU_MANAGEMENT.md | `/admin/advanced/menu-management.mdx` | 保留 |
| admin/MARKDOWN_EDITOR_GUIDE.md | `/admin/components/markdown-editor.mdx` | 保留 |
| database-primary-key-strategy.md | `/core-concepts/database-design.mdx` | 整合 |
| NAMING_STANDARDS.md | `/core-concepts/naming-standards.mdx` | 保留 |
| client/* | `/client/` | 保留待扩展 |

### 需要删除的文档 (临时/调试)

- `bugfix-*.md` - 临时修复文档
- `crud-fixes-*.md` - 调试记录
- `crud-refactor-*.md` - 重构记录
- `refactor-*.md` - 重构过程文档
- `smart-crud-page-progress-*.md` - 进度记录
- `*-comparison.md` - 临时对比文档

### 需要新增的文档

1. **首页** - 吸引人的项目介绍
2. **快速开始** - 5分钟教程
3. **完整示例** - 端到端的真实案例
4. **API 参考** - 完整的 API 文档
5. **迁移指南** - 从其他框架迁移
6. **最佳实践** - 生产环境建议

---

## 🔄 文档迁移步骤

### Step 1: 清理临时文档
```bash
# 移动到 archive 文件夹
mkdir -p docs/archive
mv docs/bugfix-*.md docs/archive/
mv docs/crud-fixes-*.md docs/archive/
mv docs/*-refactor-*.md docs/archive/
```

### Step 2: 创建 Nextra 项目结构
```bash
cd docs
mkdir -p nextra/pages
# 按照上面的目录结构创建文件夹
```

### Step 3: 拆分和重组现有文档
- SmartCRUD 从一个大文档拆分成多个小文档
- RBAC 分为配置指南（管理员）和实现指南（开发者）
- 数据库文档保持独立但增加更多示例

### Step 4: 编写新增文档
- 首页
- 快速开始
- API 参考
- 完整示例

### Step 5: 配置 Nextra
- 设置主题
- 配置导航
- 配置搜索

---

## 🎯 里程碑

### Milestone 1: 基础可用 (Week 1)
- [ ] 首页
- [ ] 快速开始
- [ ] SmartCRUD 基础文档
- [ ] RBAC 配置指南

### Milestone 2: 核心完整 (Week 2-3)
- [ ] SmartCRUD 完整文档
- [ ] RBAC 完整文档
- [ ] 数据库文档
- [ ] 组件文档

### Milestone 3: API 参考 (Week 4)
- [ ] Server Actions API
- [ ] Components API
- [ ] Hooks API
- [ ] Utilities API

### Milestone 4: 高级内容 (Week 5+)
- [ ] 完整示例
- [ ] 实战菜谱
- [ ] 迁移指南
- [ ] 最佳实践

---

## 📖 参考资料

### VK Framework 文档
- https://vkdoc.fsq.pub/
- 学习其文档组织方式
- 学习其示例代码风格

### Nextra 文档
- https://nextra.site/docs
- 学习文档站点搭建
- 学习 Markdown 增强功能

### 其他优秀文档站点
- Next.js Docs
- Ant Design Pro Docs  
- Supabase Docs

---

## 💡 下一步行动

1. 完成此规划文档
2. 创建 Nextra 项目
3. 开始编写第一批核心文档
4. 迭代优化文档内容


