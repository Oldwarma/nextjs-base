# 项目文档中心

> **最后更新**: 2025-11-07  
> **版本**: v2.0.0  
> **项目**: Jimeng SaaS 管理系统

---

## 📚 文档导航

### 🚀 快速开始

| 文档 | 描述 | 适用对象 |
|------|------|---------|
| [Smart CRUD 开发指南](./admin/SMART_CRUD_GUIDE.md) | 创建新页面的完整指南（Config + Actions + Page） | 开发者、AI |
| [字段命名规范](./NAMING_STANDARDS.md) | 统一的字段命名标准和迁移指南 | 开发者、AI |
| [RBAC 系统配置指南](./RBAC_SYSTEM.md) | 权限管理系统配置和使用 | 管理员、配置人员 |

### 🛠️ 核心组件

| 文档 | 描述 |
|------|------|
| [BaseDAO 文档](./admin/BASE_DAO.md) | 通用数据访问对象，支持 CRUD 和连表查询 |
| [DB API 文档](./database/DB_API_GUIDE.md) | 数据库操作 API，包含 selects 连表方法 |
| [Action Logger 文档](./admin/ACTION_LOGGER.md) | 管理操作日志记录系统 |

### 🔐 认证与权限

| 文档 | 描述 |
|------|------|
| [后台认证文档](./admin/AUTH.md) | Better Auth 集成和管理员认证 |
| [前端认证文档](./client/AUTH.md) | 前端用户认证和会话管理 |
| [权限系统文档](./client/PERMISSIONS.md) | 前端权限检查和路由保护 |
| [RBAC 实现指南](./rbac/RBAC_IMPLEMENTATION_GUIDE.md) | RBAC 权限系统技术实现 |

### 🌐 国际化

| 文档 | 描述 |
|------|------|
| [国际化指南](./client/I18N_GUIDE.md) | next-intl 配置和多语言实现 |

### 📝 其他功能

| 文档 | 描述 |
|------|------|
| [Markdown 编辑器指南](./admin/MARKDOWN_EDITOR_GUIDE.md) | Markdown 富文本编辑器使用 |
| [菜单管理文档](./admin/MENU_MANAGEMENT.md) | 动态菜单管理系统 |
| [Server Actions 文档](./client/SERVER_ACTIONS.md) | Next.js Server Actions 最佳实践 |

---

## 🎯 不同角色的文档路径

### 👨‍💻 开发者 / AI Assistant

创建新页面时按照以下顺序阅读：

1. **[Smart CRUD 开发指南](./admin/SMART_CRUD_GUIDE.md)** ⭐
   - 完整的三步流程（Config → Actions → Page）
   - 字段类型完整参考
   - 连表查询配置
   - 实战代码模板

2. **[字段命名规范](./NAMING_STANDARDS.md)** ⭐
   - UUID 主键规范
   - 统一字段命名
   - 废弃字段清单
   - 数据库迁移脚本

3. **[BaseDAO 文档](./admin/BASE_DAO.md)**
   - CRUD 操作 API
   - 生命周期钩子
   - 数据验证规则

4. **[DB API 文档](./database/DB_API_GUIDE.md)**
   - selects 连表查询
   - MongoDB 操作工具

### 👨‍💼 系统管理员 / 配置人员

配置权限系统时按照以下顺序阅读：

1. **[RBAC 系统配置指南](./RBAC_SYSTEM.md)** ⭐
   - 权限配置流程
   - 角色创建和分配
   - 常见场景配置
   - 最佳实践

2. **[菜单管理文档](./admin/MENU_MANAGEMENT.md)**
   - 菜单创建和配置
   - 树形结构管理

---

## 📖 核心概念

### UUID 主键体系

所有集合（表）统一使用 UUID 作为主键：

```javascript
{
  id: "a1b2c3d4-...",        // ✅ UUID 主键（标准）
  _id: ObjectId("..."),      // MongoDB 自动生成（兼容）
}
```

**优势**：
- ✅ 跨数据库兼容（MongoDB、PostgreSQL、CloudflareD1）
- ✅ 全局唯一，无需担心 ID 冲突
- ✅ 可预生成，支持离线场景

### 统一字段命名

| 用途 | 字段名 | 类型 | 说明 |
|------|--------|------|------|
| **主键** | `id` | UUID | 所有集合的主键 |
| **名称** | `name` | String | 通用名称字段 |
| **父级引用** | `parent_id` | UUID | 树形结构的父级 ID |
| **排序** | `sort` | Number | 排序值 |
| **备注** | `remark` | String | 备注信息 |
| **启用** | `enable` | Boolean | 是否启用 |
| **创建时间** | `created_at` | Date | 创建时间 |
| **更新时间** | `updated_at` | Date | 更新时间 |

**废弃字段**：`role_id`、`permission_id`、`menu_id`、`key`、`parentId`、`sortOrder`、`enabled`、`comment`、`role_ids`

### 连表查询机制

通过 `foreignDB` 配置自动关联其他表：

```javascript
// CRUD Config
query: {
  foreignDB: [
    {
      dbName: 'users',           // 目标表
      localKey: 'author_id',     // 本地外键
      foreignKey: 'id',          // 目标表主键
      as: 'authorInfo',          // 结果字段名
      fieldJson: { id: 1, name: 1 },
    },
  ],
}

// 返回数据
{
  author_id: "user-uuid",       // 原始字段
  authorInfo: {                 // 连表结果
    id: "user-uuid",
    name: "张三"
  }
}

// 前端渲染
const author = record.authorInfo;
return author ? author.name : record.author_id;
```

---

## 📊 文档结构

```
docs/
├── README.md                    # 本文档（文档中心）
├── NAMING_STANDARDS.md          # 字段命名规范
├── RBAC_SYSTEM.md              # RBAC 系统配置指南
│
├── admin/                       # 后台管理相关文档
│   ├── SMART_CRUD_GUIDE.md     # Smart CRUD 开发指南
│   ├── BASE_DAO.md             # BaseDAO 文档
│   ├── ACTION_LOGGER.md        # 操作日志系统
│   ├── AUTH.md                 # 后台认证
│   ├── MARKDOWN_EDITOR_GUIDE.md # Markdown 编辑器
│   └── MENU_MANAGEMENT.md      # 菜单管理
│
├── client/                      # 前端相关文档
│   ├── AUTH.md                 # 前端认证
│   ├── PERMISSIONS.md          # 权限系统
│   ├── I18N_GUIDE.md          # 国际化指南
│   └── SERVER_ACTIONS.md       # Server Actions
│
├── database/                    # 数据库相关文档
│   ├── README.md               # 数据库文档索引
│   ├── DB_API_GUIDE.md         # DB API 完整指南
│   ├── DB_API_VS_BASEDAO.md    # 对比分析
│   └── FOREIGNDB_JOIN_GUIDE.md # 连表查询指南
│
└── rbac/                        # RBAC 系统相关文档
    ├── README.md               # RBAC 文档索引
    ├── RBAC_IMPLEMENTATION_GUIDE.md  # 实现指南
    ├── RBAC_QUICK_REFERENCE.md       # 快速参考
    ├── RBAC_TESTING_CHECKLIST.md     # 测试清单
    ├── TESTING_GUIDE.md              # 测试指南
    ├── PAGE_ACCESS_CONTROL.md        # 页面访问控制
    ├── BACKEND_ACCESS_CONTROL.md     # 后台访问控制
    └── PAGE_404_VS_403.md            # 404 vs 403 处理
```

---

## 🔄 版本历史

### v2.0.0 (2025-11-07) - 文档重构

**文档优化**：
- ✅ 清理重复和过时文档
- ✅ 合并同类文档
- ✅ 优化文档结构
- ✅ 更新文档索引

**删除内容**：
- ❌ 过时的调试和修复总结
- ❌ 重复的开发指南
- ❌ 临时的测试脚本

### v2.0.0 (2025-11-04) - 重大更新

**架构变更**：
- ✅ UUID 主键体系
- ✅ 统一字段命名
- ✅ 连表查询机制
- ✅ 文档全面重构

**新增功能**：
- ✅ Smart CRUD 完整开发指南
- ✅ 字段命名规范文档
- ✅ 数据库迁移脚本

**废弃内容**：
- ❌ 旧的字段命名（`role_id`、`permission_id` 等）
- ❌ 手动拼接查询
- ❌ 分散的文档

---

## 💡 快速链接

### 常用操作

- [创建新的管理页面](./admin/SMART_CRUD_GUIDE.md#三步创建新页面)
- [配置权限系统](./RBAC_SYSTEM.md#权限配置流程)
- [迁移旧数据到新字段](./NAMING_STANDARDS.md#迁移指南)
- [添加连表查询](./admin/SMART_CRUD_GUIDE.md#连表查询配置)

### 参考示例

- [Roles 管理页面](../app/(admin)/admin/rbac/roles/page.js)
- [Users 管理页面](../app/(admin)/admin/rbac/users/page.js)
- [Permissions 管理页面](../app/(admin)/admin/rbac/permissions/page.js)
- [Menus 管理页面](../app/(admin)/admin/rbac/menus/page.js)

---

## 🆘 获取帮助

### 遇到问题？

1. **查找文档**：使用本页面的导航查找相关文档
2. **查看示例**：参考现有页面的实现
3. **检查命名**：确保使用统一的字段命名规范
4. **阅读常见问题**：每个文档都有常见问题解答

### 贡献文档

欢迎提交文档改进建议和错误修正。

---

## 📄 许可证

MIT License
