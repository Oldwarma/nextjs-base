# 项目文档中心

> **最后更新**: 2025-12-01  
> **版本**: v3.0.0  
> **项目**: NextJS Base 管理系统

---

## 📚 文档导航

### 🚀 快速开始

| 文档 | 描述 | 适用对象 |
|------|------|---------|
| [PostgreSQL + Prisma 配置指南](./database/POSTGRESQL_SETUP.md) | 数据库配置和使用 | 开发者 |
| [Smart CRUD 开发指南](./admin/SMART_CRUD_GUIDE.md) | 创建新页面的完整指南 | 开发者、AI |
| [RBAC 系统配置指南](./rbac/README.md) | 权限管理系统配置和使用 | 管理员 |

### 🛠️ 核心组件

| 文档 | 描述 |
|------|------|
| [BaseDAO 文档](./admin/BASE_DAO.md) | 通用数据访问对象 |
| [Action Logger 文档](./admin/ACTION_LOGGER.md) | 管理操作日志记录系统 |

### 🔐 认证与权限

| 文档 | 描述 |
|------|------|
| [后台认证文档](./admin/AUTH.md) | Better Auth 集成和管理员认证 |
| [前端认证文档](./client/AUTH.md) | 前端用户认证和会话管理 |
| [RBAC 实现指南](./rbac/RBAC_IMPLEMENTATION_GUIDE.md) | RBAC 权限系统技术实现 |

### 🌐 国际化

| 文档 | 描述 |
|------|------|
| [国际化指南](./client/I18N_GUIDE.md) | next-intl 配置和多语言实现 |

---

## 📖 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| **框架** | Next.js 15 | App Router |
| **数据库** | PostgreSQL | 关系型数据库 |
| **ORM** | Prisma | 类型安全的数据库客户端 |
| **认证** | Better Auth | Prisma Adapter |
| **UI** | Ant Design | ProComponents |

---

## 📊 文档结构

```
docs/
├── README.md                    # 本文档（文档中心）
│
├── database/                    # 数据库相关文档
│   ├── README.md               # 数据库文档索引
│   └── POSTGRESQL_SETUP.md     # PostgreSQL + Prisma 配置指南
│
├── admin/                       # 后台管理相关文档
│   ├── SMART_CRUD_GUIDE.md     # Smart CRUD 开发指南
│   ├── BASE_DAO.md             # BaseDAO 文档
│   ├── ACTION_LOGGER.md        # 操作日志系统
│   └── AUTH.md                 # 后台认证
│
├── client/                      # 前端相关文档
│   ├── AUTH.md                 # 前端认证
│   └── I18N_GUIDE.md           # 国际化指南
│
└── rbac/                        # RBAC 系统相关文档
    ├── README.md               # RBAC 文档索引
    └── RBAC_IMPLEMENTATION_GUIDE.md  # 实现指南
```

---

## 🔄 版本历史

### v3.0.0 (2025-12-01) - PostgreSQL 迁移

**重大变更**：
- 从 MongoDB 迁移到 PostgreSQL
- 使用 Prisma 作为 ORM
- 删除所有 MongoDB 相关代码和文档

**删除内容**：
- ❌ MongoDB 连接和工具函数
- ❌ db-api 抽象层
- ❌ MongoDB 相关文档

**新增内容**：
- ✅ Prisma Schema 定义
- ✅ PostgreSQL 配置指南
- ✅ 直接使用 Prisma Client

---

## 💡 快速链接

### 常用操作

- [配置 PostgreSQL 数据库](./database/POSTGRESQL_SETUP.md)
- [创建新的管理页面](./admin/SMART_CRUD_GUIDE.md)
- [配置权限系统](./rbac/README.md)

### 参考示例

- [Roles 管理页面](../app/(admin)/admin/rbac/roles/page.js)
- [Users 管理页面](../app/(admin)/admin/rbac/users/page.js)
- [Permissions 管理页面](../app/(admin)/admin/rbac/permissions/page.js)
- [Menus 管理页面](../app/(admin)/admin/rbac/menus/page.js)

---

## 📄 许可证

MIT License
