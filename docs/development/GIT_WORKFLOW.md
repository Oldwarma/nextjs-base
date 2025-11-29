# Git 分支与仓库管理策略

> **创建日期**: 2025-11-27  
> **状态**: 📋 规划中（待实施）  
> **参考**: [MkSaaS 代码库模式](https://mksaas.com/zh/docs/codebase)

---

## 📋 概述

本文档描述项目的 Git 分支和多仓库管理策略，用于支持：
- 核心开发（私有）
- 开源版本（公开）
- 客户版本（付费用户访问）

---

## 🎯 仓库架构

### 三仓库模式

| 仓库 | GitHub 地址 | 可见性 | 用途 |
|------|-------------|--------|------|
| **核心开发仓库** | `github.com/huglemon/nextjs-base` | 🔒 私有 | 主开发仓库，包含所有代码 |
| **开源仓库** | `github.com/huglemon/nextjs-base-opensource` | 🌍 公开 | 基础功能，供社区使用 |
| **客户仓库** | `github.com/huglemon/nextjs-base-pro` | 🔒 私有 | 高级功能，邀请付费客户访问 |

### 本地分支结构

```
main (核心开发分支)
  │
  ├── opensource (开源分支) → 推送到开源仓库
  │
  └── pro (客户分支) → 推送到客户仓库
```

| 分支 | 说明 | 推送目标 |
|------|------|----------|
| `main` | 核心开发分支，所有开发在此进行 | `origin` (私有核心仓库) |
| `opensource` | 开源版本，只包含基础功能 | `opensource` remote (公开仓库) |
| `pro` | 客户版本，包含高级功能 | `pro` remote (客户仓库) |

---

## 🔄 工作流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    main (核心开发分支)                        │
│                    包含所有代码和功能                          │
│                    🔒 私有仓库: nextjs-base                   │
└─────────────────────────────────────────────────────────────┘
                    │                    │
          ┌────────┴────────┐   ┌────────┴────────┐
          │  cherry-pick    │   │     merge       │
          │  基础功能        │   │   高级功能       │
          ▼                 │   ▼                 │
┌─────────────────────┐     │   ┌─────────────────────┐
│  opensource 分支     │     │   │     pro 分支        │
│  基础功能            │     │   │  基础 + 高级功能     │
└─────────────────────┘     │   └─────────────────────┘
          │                 │             │
          ▼                 │             ▼
┌─────────────────────┐     │   ┌─────────────────────┐
│ 🌍 公开仓库          │     │   │ 🔒 客户仓库          │
│ nextjs-base-opensource│    │   │ nextjs-base-pro     │
│ 社区可 fork/clone    │     │   │ 邀请客户访问         │
└─────────────────────┘     │   └─────────────────────┘
```

---

## 🚀 实施步骤

### 第一步：创建 GitHub 仓库

1. **开源仓库**（公开）
   - 访问 https://github.com/new
   - 仓库名：`nextjs-base-opensource`
   - 可见性：Public
   - 不勾选任何初始化选项

2. **客户仓库**（私有）
   - 访问 https://github.com/new
   - 仓库名：`nextjs-base-pro`
   - 可见性：Private
   - 不勾选任何初始化选项

### 第二步：配置本地 Remote

```bash
# 查看当前 remote
git remote -v

# 添加开源仓库 remote
git remote add opensource https://github.com/huglemon/nextjs-base-opensource.git

# 添加客户仓库 remote
git remote add pro https://github.com/huglemon/nextjs-base-pro.git

# 验证配置
git remote -v
# 应该显示：
# origin      https://github.com/huglemon/nextjs-base.git (fetch)
# origin      https://github.com/huglemon/nextjs-base.git (push)
# opensource  https://github.com/huglemon/nextjs-base-opensource.git (fetch)
# opensource  https://github.com/huglemon/nextjs-base-opensource.git (push)
# pro         https://github.com/huglemon/nextjs-base-pro.git (fetch)
# pro         https://github.com/huglemon/nextjs-base-pro.git (push)
```

### 第三步：创建本地分支

```bash
# 确保在 main 分支
git checkout main

# 创建开源分支
git checkout -b opensource

# 创建客户分支
git checkout -b pro

# 回到 main 分支继续开发
git checkout main
```

### 第四步：初始推送

```bash
# 推送开源分支到开源仓库
git checkout opensource
git push -u opensource opensource:main

# 推送客户分支到客户仓库
git checkout pro
git push -u pro pro:main

# 回到 main 分支
git checkout main
```

---

## 📝 日常操作

### 场景 1：开发新功能（在 main 分支）

```bash
# 1. 在 main 分支开发
git checkout main
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 场景 2：同步基础功能到开源分支

```bash
# 方式 A：Cherry-pick 特定提交
git checkout opensource
git cherry-pick <commit-hash>
git push opensource opensource:main

# 方式 B：合并整个分支（谨慎使用）
git checkout opensource
git merge main --no-commit
# 手动移除不想开源的代码
git commit -m "chore: 同步基础功能"
git push opensource opensource:main
```

### 场景 3：同步高级功能到客户分支

```bash
git checkout pro
git merge main
git push pro pro:main
```

### 场景 4：邀请客户访问仓库

1. 访问 https://github.com/huglemon/nextjs-base-pro/settings/access
2. 点击 "Add people"
3. 输入客户的 GitHub 用户名
4. 选择权限级别（通常是 Read）
5. 发送邀请

---

## 🔐 代码分层建议

### 开源版本包含（基础功能）

- 基础 CRUD 框架
- 认证系统基础
- 国际化框架
- UI 组件库
- 基础文档

### 客户版本额外包含（高级功能）

- 完整 RBAC 权限系统
- 高级 CRUD 配置
- 操作日志系统
- 完整文档和示例
- 技术支持

### 核心仓库独有（内部功能）

- 🔒 商业敏感代码
- 🔒 内部工具和脚本
- 🔒 开发中的实验功能

---

## 📊 未来扩展

### 多数据库分支（参考 MkSaaS）

未来可以添加不同数据库支持的分支：

| 分支 | 数据库 | 部署平台 |
|------|--------|----------|
| `main` | MongoDB | Vercel |
| `postgresql` | PostgreSQL/Neon | Vercel |
| `cloudflare` | - | Cloudflare Workers |
| `cloudflare-d1` | Cloudflare D1 | Cloudflare Workers |

---

## ⚠️ 注意事项

1. **不要在 opensource/pro 分支直接开发**，所有开发都在 main 分支进行
2. **定期同步**，避免分支差异过大
3. **敏感信息检查**，同步前确保没有泄露敏感配置
4. **文档同步**，确保各版本文档与功能匹配
5. **版本号管理**，建议使用 git tag 管理版本

---

## 📚 参考资料

- [MkSaaS 代码库模式](https://mksaas.com/zh/docs/codebase)
- [Git Remote 文档](https://git-scm.com/docs/git-remote)
- [GitHub 仓库访问管理](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-teams-and-people-with-access-to-your-repository)

