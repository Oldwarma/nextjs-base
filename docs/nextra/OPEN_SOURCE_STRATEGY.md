# NextJS Base 开源策略

> **文档版本**: 1.0.0  
> **创建日期**: 2025-11-14  
> **状态**: 规划中 🔒 Internal Only

---

## 📋 目录

1. [开源策略概述](#开源策略概述)
2. [版本控制方案](#版本控制方案)
3. [代码分层架构](#代码分层架构)
4. [Git 仓库管理](#git-仓库管理)
5. [实施步骤](#实施步骤)
6. [常见问题](#常见问题)

---

## 🎯 开源策略概述

### 核心目标

1. **开源核心框架** - 吸引开发者，建立社区
2. **保留商业价值** - 高级功能、企业特性作为付费插件
3. **可持续发展** - 开源 + 商业化并行

### 开源模式选择

**推荐**: **Open Core 模式**

```
┌─────────────────────────────────────┐
│                                     │
│   NextJS Base (Open Source - MIT)  │
│                                     │
│   - Smart CRUD 核心                 │
│   - 基础 RBAC                       │
│   - 20+ 基础字段类型                │
│   - DB API                          │
│   - 基础文档                        │
│                                     │
└────────────┬────────────────────────┘
             │
             ├─ 插件生态 (部分开源、部分付费)
             │
┌────────────▼────────────────────────┐
│                                     │
│   NextJS Base Pro (闭源/付费)      │
│                                     │
│   - 高级字段类型 (富文本、图表)    │
│   - 文件上传 OSS 集成               │
│   - 数据导入导出                    │
│   - 审批流引擎                      │
│   - 可视化报表                      │
│   - 企业级支持                      │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔀 版本控制方案

### 方案一: 双仓库策略 (推荐) ⭐⭐⭐⭐⭐

#### 架构

```
GitHub
├─ nextjs-base/nextjs-base              # 开源仓库 (Public)
│  ├─ lib/core/                         # 核心代码
│  ├─ lib/crud/                         # Smart CRUD
│  ├─ lib/rbac/                         # 基础 RBAC
│  ├─ components/                       # 基础组件
│  ├─ docs/                             # 用户文档
│  └─ examples/                         # 示例项目
│
└─ nextjs-base/nextjs-base-pro          # 私有仓库 (Private)
   ├─ plugins/                          # 付费插件
   │  ├─ rich-editor/                   # 富文本编辑器
   │  ├─ oss-upload/                    # OSS 上传
   │  ├─ data-export/                   # 数据导出
   │  └─ workflow-engine/               # 审批流
   ├─ enterprise/                       # 企业功能
   ├─ internal/                         # 内部工具
   └─ docs/internal/                    # 内部文档
```

#### 优点
- ✅ 清晰分离：开源和闭源代码完全分开
- ✅ 安全性高：商业代码不会意外泄露
- ✅ 易于管理：独立的版本控制
- ✅ 灵活定价：按插件单独售卖

#### 缺点
- ❌ 维护成本：需要同步核心代码
- ❌ 集成复杂：用户需要安装多个包

#### 适用场景
- 有明确的开源核心 + 付费插件边界
- 团队有能力维护多个仓库
- 商业化策略清晰

---

### 方案二: 单仓库 + 私有子模块 ⭐⭐⭐⭐

#### 架构

```
nextjs-base/                            # 开源仓库 (Public)
├─ packages/
│  ├─ core/                             # 开源核心
│  ├─ crud/                             # 开源 CRUD
│  ├─ rbac/                             # 开源 RBAC
│  └─ pro/                              # Git Submodule → 私有仓库
│     ├─ plugins/
│     └─ enterprise/
├─ docs/
│  ├─ public/                           # 公开文档
│  └─ internal/ (ignored)               # 内部文档 (不提交)
└─ .gitmodules
```

#### .gitmodules 配置

```gitmodules
[submodule "packages/pro"]
    path = packages/pro
    url = https://github.com/nextjs-base/nextjs-base-pro-private.git
    branch = main
```

#### .gitignore 配置

```gitignore
# Private code (not in public repo)
/packages/pro/
/docs/internal/
/INTERNAL_*.md

# Development only
.env.local
.env.development.local
```

#### 优点
- ✅ 单一入口：用户体验好
- ✅ 代码复用：核心代码易于共享
- ✅ 灵活控制：可选择性安装 Pro 功能

#### 缺点
- ❌ 配置复杂：Git Submodule 学习曲线
- ❌ 同步风险：子模块更新容易出错

#### 适用场景
- 希望保持统一的项目结构
- 用户需要一次性安装所有功能
- 团队熟悉 Git Submodule

---

### 方案三: 分支策略 (不推荐) ⭐⭐

#### 架构

```
nextjs-base 仓库
├─ main (Public)                        # 开源版本
├─ pro (Private)                        # 付费版本
└─ internal (Private)                   # 内部开发
```

#### 优点
- ✅ 简单：只需一个仓库

#### 缺点
- ❌ 风险高：容易误 push 私有代码到公开分支
- ❌ 历史泄露：Git 历史包含所有代码
- ❌ 权限混乱：难以精确控制访问

#### 结论
**不推荐使用**，除非是个人项目且不涉及敏感信息。

---

## 🏗️ 代码分层架构

### 核心原则

```
功能 = 核心层 (开源) + 扩展层 (可选开源/闭源)
```

### 1. 核心层 (Open Source)

**位置**: `packages/core/`

**包含内容**:
```javascript
// ✅ 开源
packages/core/
├─ lib/
│  ├─ crud/
│  │  ├─ SmartCrudPage.jsx           // 核心 CRUD 组件
│  │  ├─ field-types.js              // 基础字段类型 (20+)
│  │  └─ field-generator.js          // 字段生成器
│  ├─ rbac/
│  │  ├─ checkPermission.js          // 权限检查
│  │  └─ RBACProvider.jsx            // RBAC Provider
│  ├─ database/
│  │  ├─ db-api.js                   // 数据库 API
│  │  └─ BaseDAO.js                  // 基础 DAO
│  └─ auth/
│     ├─ auth.js                     // Better Auth 集成
│     └─ session.js                  // Session 管理
└─ components/
   ├─ Table/                          // 基础表格
   ├─ Form/                           // 基础表单
   └─ Layout/                         // 基础布局
```

---

### 2. 插件层 (部分开源 / 部分闭源)

#### 开源插件 (Community Plugins)

**位置**: `packages/plugins/` (Public Repo)

```javascript
// ✅ 开源示例插件
packages/plugins/
├─ plugin-template/                   // 插件模板
├─ plugin-markdown/                   // Markdown 编辑器 (开源)
└─ plugin-theme-switcher/             // 主题切换 (开源)
```

#### 闭源插件 (Pro Plugins)

**位置**: `packages/pro/plugins/` (Private Repo)

```javascript
// 🔒 闭源付费插件
packages/pro/plugins/
├─ plugin-rich-editor/                // 富文本编辑器
│  ├─ index.js
│  ├─ package.json
│  └─ README.md
├─ plugin-oss-upload/                 // OSS 文件上传
├─ plugin-data-export/                // 数据导入导出
├─ plugin-workflow/                   // 审批流引擎
├─ plugin-chart-builder/              // 可视化图表
└─ plugin-email-service/              // 邮件服务
```

---

### 3. 企业层 (Enterprise - 完全闭源)

**位置**: `packages/enterprise/` (Private Repo)

```javascript
// 🔒 企业版功能
packages/enterprise/
├─ multi-tenant/                      // 多租户支持
├─ sso/                               // 单点登录 (SSO)
├─ audit-log/                         // 审计日志
├─ backup-restore/                    // 备份恢复
└─ license-manager/                   // 授权管理
```

---

### 插件接口设计

#### 插件注册机制

```javascript
// packages/core/lib/plugin-system.js (开源)

export class PluginManager {
  constructor() {
    this.plugins = new Map();
  }

  // 注册插件
  register(plugin) {
    if (!plugin.name || !plugin.version) {
      throw new Error('Invalid plugin');
    }
    
    this.plugins.set(plugin.name, plugin);
  }

  // 获取插件
  get(name) {
    return this.plugins.get(name);
  }

  // 加载所有插件
  async loadAll() {
    for (const [name, plugin] of this.plugins) {
      if (plugin.onLoad) {
        await plugin.onLoad();
      }
    }
  }
}
```

#### 插件标准接口

```javascript
// 插件必须实现的接口
export interface Plugin {
  name: string;                        // 插件名称
  version: string;                     // 版本号
  description?: string;                // 描述
  author?: string;                     // 作者
  license?: string;                    // 许可证 (开源插件必须)
  
  // 生命周期钩子
  onLoad?: () => Promise<void>;        // 加载时
  onUnload?: () => Promise<void>;      // 卸载时
  
  // 功能注册
  registerFieldTypes?: () => FieldType[];    // 注册字段类型
  registerActions?: () => Action[];          // 注册操作
  registerComponents?: () => Component[];    // 注册组件
}
```

#### 示例：开源插件

```javascript
// packages/plugins/plugin-markdown/index.js (开源)

export default {
  name: 'markdown-editor',
  version: '1.0.0',
  description: 'Markdown 编辑器插件',
  author: 'NextJS Base Team',
  license: 'MIT',
  
  registerFieldTypes() {
    return [
      {
        type: 'markdown',
        label: 'Markdown 编辑器',
        component: MarkdownEditor,
        validator: (value) => typeof value === 'string',
      }
    ];
  }
};
```

#### 示例：付费插件

```javascript
// packages/pro/plugins/plugin-rich-editor/index.js (闭源)

export default {
  name: 'rich-editor-pro',
  version: '1.0.0',
  description: '富文本编辑器 Pro',
  author: 'NextJS Base Team',
  license: 'Commercial',                // 商业许可
  requireLicense: true,                 // 需要授权
  
  async onLoad() {
    // 检查授权
    const license = await checkLicense();
    if (!license.isValid) {
      throw new Error('Invalid license');
    }
  },
  
  registerFieldTypes() {
    return [
      {
        type: 'rich-editor',
        label: '富文本编辑器 Pro',
        component: RichEditorPro,        // 闭源组件
        features: ['图片上传', 'Markdown', '表格', '代码高亮'],
      }
    ];
  }
};
```

---

## 📦 Git 仓库管理

### 推荐方案: 双仓库 + Monorepo

#### 1. 开源仓库 (Public)

**仓库**: `github.com/nextjs-base/nextjs-base`

**结构**:
```
nextjs-base/
├─ packages/
│  ├─ core/                   # 核心包
│  ├─ cli/                    # CLI 工具
│  └─ plugins/                # 社区插件
├─ apps/
│  └─ example/                # 示例应用
├─ docs/
│  ├─ pages/                  # 文档站点
│  └─ examples/               # 代码示例
├─ .github/
│  ├─ workflows/              # CI/CD
│  └─ ISSUE_TEMPLATE/         # Issue 模板
├─ LICENSE                    # MIT License
├─ package.json
├─ pnpm-workspace.yaml        # pnpm workspace
└─ README.md
```

#### 2. 私有仓库 (Private)

**仓库**: `github.com/nextjs-base/nextjs-base-pro` (Private)

**结构**:
```
nextjs-base-pro/
├─ packages/
│  ├─ pro/                    # Pro 功能
│  ├─ enterprise/             # 企业功能
│  └─ internal/               # 内部工具
├─ apps/
│  └─ admin-dashboard/        # 内部管理后台
├─ docs/
│  └─ internal/               # 内部文档
├─ scripts/
│  ├─ build-pro.sh            # 构建 Pro 版本
│  └─ release.sh              # 发布脚本
├─ LICENSE                    # Commercial License
└─ README.md                  # 内部说明
```

---

### Git 工作流

#### 开源仓库工作流

```bash
# 1. 开发新功能 (在开源仓库)
git checkout -b feature/new-field-type
# 开发代码...
git add .
git commit -m "feat: 添加新字段类型"
git push origin feature/new-field-type

# 2. PR Review
# 团队审查后合并到 main

# 3. 发布新版本
npm version minor
git push --tags
npm publish
```

#### 私有仓库工作流

```bash
# 1. 开发 Pro 功能 (在私有仓库)
git checkout -b feature/rich-editor
# 开发代码...
git add .
git commit -m "feat: 添加富文本编辑器"
git push origin feature/rich-editor

# 2. 内部审查后合并

# 3. 发布到私有 npm registry
npm version minor
git push --tags
npm publish --registry https://npm.nextjsbase.com
```

#### 同步核心代码

```bash
# 如果核心代码更新，需要同步到私有仓库

# 在私有仓库中
git remote add public https://github.com/nextjs-base/nextjs-base.git
git fetch public
git merge public/main --allow-unrelated-histories

# 解决冲突后
git push origin main
```

---

## 🚀 实施步骤

### Phase 1: 代码重构 (2-3 周)

#### Week 1: 代码分层

**任务**:
- [ ] 分析现有代码，确定开源/闭源边界
- [ ] 创建 `packages/core/` 目录
- [ ] 创建 `packages/pro/` 目录
- [ ] 将核心代码移动到 `core/`
- [ ] 将商业代码移动到 `pro/`

**检查点**:
```bash
# 验证核心包可以独立运行
cd packages/core
npm install
npm run build
npm test
```

---

#### Week 2: 插件化改造

**任务**:
- [ ] 实现插件系统 (`PluginManager`)
- [ ] 定义插件接口 (`Plugin` interface)
- [ ] 改造现有功能为插件
- [ ] 编写插件开发文档

**检查点**:
```bash
# 验证插件可以正常加载
npm run test:plugins
```

---

#### Week 3: 文档和示例

**任务**:
- [ ] 分离公开文档和内部文档
- [ ] 创建示例项目
- [ ] 编写贡献指南 (`CONTRIBUTING.md`)
- [ ] 编写插件开发教程

---

### Phase 2: 仓库设置 (1 周)

#### 创建开源仓库

```bash
# 1. 创建新仓库
gh repo create nextjs-base/nextjs-base --public

# 2. 初始化 monorepo
cd nextjs-base
pnpm init
pnpm add -Dw typescript turbo

# 3. 配置 workspace
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
  - 'apps/*'
EOF

# 4. 添加核心代码
cp -r ../jimeng-saas/packages/core ./packages/
cp -r ../jimeng-saas/docs/nextra/pages ./docs/

# 5. 初始提交
git add .
git commit -m "chore: 初始化开源仓库"
git push origin main
```

#### 创建私有仓库

```bash
# 1. 创建私有仓库
gh repo create nextjs-base/nextjs-base-pro --private

# 2. 添加商业代码
cd nextjs-base-pro
cp -r ../jimeng-saas/packages/pro ./packages/
cp -r ../jimeng-saas/docs/nextra/INTERNAL_ANALYSIS.md ./docs/internal/

# 3. 初始提交
git add .
git commit -m "chore: 初始化私有仓库"
git push origin main
```

---

### Phase 3: CI/CD 设置 (3-5 天)

#### 开源仓库 CI/CD

**文件**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm build

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Publish to npm
        run: pnpm publish -r
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

### Phase 4: 发布准备 (1 周)

#### 清理敏感信息

**检查清单**:
- [ ] 移除所有 API keys
- [ ] 移除内部文档 (`INTERNAL_*.md`)
- [ ] 移除商业代码引用
- [ ] 移除客户信息
- [ ] 检查 Git 历史

**自动化检查脚本**:

```bash
#!/bin/bash
# scripts/check-sensitive-info.sh

echo "检查敏感信息..."

# 检查 API keys
if grep -r "API_KEY\|SECRET\|PASSWORD" packages/core; then
  echo "❌ 发现敏感信息!"
  exit 1
fi

# 检查内部文档
if find docs -name "INTERNAL_*.md" | grep -q .; then
  echo "❌ 发现内部文档!"
  exit 1
fi

# 检查邮箱
if grep -r "@nextjsbase.com" packages/core | grep -v "example"; then
  echo "⚠️  发现内部邮箱地址"
fi

echo "✅ 检查通过"
```

---

#### 编写开源文档

**必须文档**:
- [ ] `README.md` - 项目简介
- [ ] `CONTRIBUTING.md` - 贡献指南
- [ ] `CODE_OF_CONDUCT.md` - 行为准则
- [ ] `LICENSE` - MIT License
- [ ] `CHANGELOG.md` - 变更日志
- [ ] `SECURITY.md` - 安全政策

---

### Phase 5: 正式开源 (发布日)

#### 发布检查清单

**技术准备**:
- [ ] 所有测试通过
- [ ] 文档完整
- [ ] CI/CD 配置正确
- [ ] npm 包可以安装
- [ ] 示例项目可以运行

**营销准备**:
- [ ] 撰写发布博客
- [ ] 准备 Product Hunt 发布
- [ ] 准备 Hacker News 发布
- [ ] 准备 Twitter 发布
- [ ] 准备 Reddit 发布

**执行步骤**:

```bash
# 1. 最后一次检查
pnpm test
pnpm build
./scripts/check-sensitive-info.sh

# 2. 创建发布标签
git tag v1.0.0
git push origin v1.0.0

# 3. 发布到 npm
pnpm publish -r

# 4. 创建 GitHub Release
gh release create v1.0.0 \
  --title "NextJS Base v1.0.0" \
  --notes-file RELEASE_NOTES.md

# 5. 发布到社区
# Product Hunt, Hacker News, Twitter, Reddit
```

---

## 🔒 安全性考虑

### 1. 防止代码泄露

**策略**:

```bash
# .gitignore (开源仓库)
# 确保私有代码不会被提交

# Private packages
/packages/pro/
/packages/enterprise/

# Internal docs
/docs/internal/
INTERNAL_*.md

# Sensitive files
.env*
*.key
*.pem
secrets/

# Build artifacts
dist/
build/
*.log
```

---

### 2. License 检查

**自动化脚本**:

```bash
#!/bin/bash
# scripts/check-licenses.sh

echo "检查依赖许可证..."

# 检查是否有不兼容的许可证
npx license-checker --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;ISC" \
  --production \
  --summary

if [ $? -ne 0 ]; then
  echo "❌ 发现不兼容的许可证!"
  exit 1
fi

echo "✅ 所有依赖许可证兼容"
```

---

### 3. 代码审查流程

**PR 模板**: `.github/pull_request_template.md`

```markdown
## PR Checklist

**安全检查**:
- [ ] 不包含敏感信息 (API keys, passwords)
- [ ] 不包含内部文档
- [ ] 不包含商业代码
- [ ] 所有新依赖许可证兼容

**代码质量**:
- [ ] 测试通过
- [ ] 文档已更新
- [ ] 遵循代码规范

**功能检查**:
- [ ] 功能完整
- [ ] 向后兼容
- [ ] 性能测试通过
```

---

## ❓ 常见问题

### Q1: 如何决定哪些功能开源，哪些闭源？

**决策框架**:

| 功能类型 | 开源 | 闭源 | 理由 |
|---------|------|------|------|
| **核心框架** | ✅ | ❌ | 建立社区信任 |
| **基础 CRUD** | ✅ | ❌ | 核心价值主张 |
| **基础 RBAC** | ✅ | ❌ | 通用需求 |
| **基础字段类型 (20+)** | ✅ | ❌ | 足够使用 |
| **富文本编辑器** | ❌ | ✅ | 复杂功能，商业价值高 |
| **文件上传 OSS** | ❌ | ✅ | 需要外部服务集成 |
| **数据导入导出** | ❌ | ✅ | 企业常用，付费意愿强 |
| **审批流引擎** | ❌ | ✅ | 复杂度高，商业价值高 |
| **多租户支持** | ❌ | ✅ | 企业级功能 |

**判断原则**:
1. **必需性**: 核心功能必须开源
2. **复杂度**: 高复杂度可以闭源
3. **商业价值**: 高价值功能可以闭源
4. **竞争力**: 差异化功能可以闭源

---

### Q2: 如何防止付费代码被破解？

**策略**:

1. **License 验证**:
```javascript
// packages/pro/lib/license.js

async function verifyLicense(licenseKey) {
  // 1. 本地验证
  const decoded = jwt.decode(licenseKey);
  if (!decoded || decoded.exp < Date.now()) {
    throw new Error('Invalid license');
  }
  
  // 2. 在线验证 (可选)
  const response = await fetch('https://api.nextjsbase.com/verify', {
    method: 'POST',
    body: JSON.stringify({ key: licenseKey }),
  });
  
  if (!response.ok) {
    throw new Error('License verification failed');
  }
  
  return true;
}
```

2. **代码混淆**:
```bash
# 使用 webpack/terser 混淆关键代码
pnpm add -D terser-webpack-plugin
```

3. **定期更新**:
- 快速迭代，让破解版失去价值
- 付费用户享受持续更新

4. **社区监督**:
- 鼓励社区举报盗版
- 为正版用户提供更好的服务

**现实态度**:
- ✅ 接受一定程度的盗版
- ✅ 通过服务而非技术防止盗版
- ✅ 让正版用户感到物有所值

---

### Q3: 开源后如何保持商业竞争力？

**策略**:

1. **服务差异化**:
   - 开源版: 社区支持
   - 付费版: 技术支持 (24小时响应)
   - 企业版: SLA + 专属顾问

2. **功能差异化**:
   - 开源版: 基础功能 (80% 用户够用)
   - 付费版: 高级功能 (20% 用户需要)
   - 企业版: 定制功能 (大客户)

3. **生态差异化**:
   - 开源版: 社区插件
   - 付费版: 官方插件 + 优先支持
   - 企业版: 定制插件开发

4. **品牌差异化**:
   - 开源版: GitHub Star + 社区口碑
   - 付费版: 成功案例 + 技术博客
   - 企业版: 合作伙伴 + 行业认证

---

### Q4: 如何管理开源社区贡献？

**贡献指南**: `CONTRIBUTING.md`

```markdown
# 贡献指南

## 欢迎贡献!

我们欢迎所有形式的贡献，包括但不限于:
- 🐛 Bug 报告
- ✨ 功能建议
- 📝 文档改进
- 💻 代码贡献

## 贡献范围

### ✅ 欢迎的贡献
- 核心功能优化
- Bug 修复
- 文档改进
- 测试用例
- 示例项目
- 社区插件

### ⚠️ 需要讨论的贡献
- 新的核心功能
- API 变更
- 架构调整

### ❌ 不接受的贡献
- 付费功能的实现
- 绕过 License 验证
- 破坏性变更

## 提交 PR 流程

1. Fork 仓库
2. 创建分支 (`git checkout -b feature/amazing-feature`)
3. 提交改动 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## Code Review

- 所有 PR 必须通过 CI
- 至少 1 个 maintainer approve
- 代码覆盖率不降低
```

---

## 📊 成功指标

### 开源项目指标

| 指标 | 3个月 | 6个月 | 12个月 |
|------|-------|-------|--------|
| **GitHub Stars** | 500 | 2,000 | 5,000 |
| **npm 周下载** | 500 | 2,000 | 10,000 |
| **Contributors** | 5 | 20 | 50 |
| **Issues** | 50 | 200 | 500 |
| **PRs** | 10 | 50 | 100 |

### 商业化指标

| 指标 | 3个月 | 6个月 | 12个月 |
|------|-------|-------|--------|
| **付费用户** | 10 | 50 | 200 |
| **MRR** | $500 | $2,000 | $10,000 |
| **企业客户** | 1 | 5 | 20 |
| **年度收入** | $1,500 | $12,000 | $100,000 |

---

## 📝 总结

### 推荐方案

**双仓库 + Open Core 模式**:

1. **开源仓库** (`nextjs-base`):
   - 核心框架 (MIT License)
   - 社区插件
   - 完整文档
   - 示例项目

2. **私有仓库** (`nextjs-base-pro`):
   - 付费插件
   - 企业功能
   - 内部工具
   - 商业文档

### 关键成功因素

1. **清晰的边界**: 开源/闭源功能明确分离
2. **插件化架构**: 易于扩展和商业化
3. **完善的文档**: 降低使用门槛
4. **活跃的社区**: 持续贡献和反馈
5. **优质的服务**: 让付费用户感到值得

### 风险控制

1. **代码泄露**: 双仓库 + 严格的 .gitignore
2. **License 验证**: 在线验证 + 代码混淆
3. **社区管理**: 明确的贡献指南 + Code Review
4. **商业竞争**: 服务差异化 + 快速迭代

---

**下一步**: 开始 Phase 1 代码重构，预计 2-3 周完成。

---

**文档版本**: 1.0.0  
**创建日期**: 2025-11-14  
**维护人**: Project Team  
**状态**: 规划中 🔒

