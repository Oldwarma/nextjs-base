# RBAC 权限系统文档索引

> **最后更新**: 2024-11-14  
> **版本**: v2.0

本目录包含完整的 RBAC 权限系统设计与实施文档。

---

## 📚 文档导航

### 🎯 核心文档（必读）

1. **[权限系统最终设计总结](./PERMISSION_SYSTEM_FINAL_DESIGN.md)** ⭐️
   - 最终定案的设计方案
   - 设计决策过程
   - 最佳实践和安全建议
   - **推荐首先阅读**

2. **[Actions 路径配置指南](./ACTIONS_PATH_GUIDE.md)**
   - 如何配置 `actions` 字段
   - 通配符规则详解
   - 实际案例和最佳实践
   - 常见问题排查

3. **[Server Actions vs Client Actions](./SERVER_VS_CLIENT_ACTIONS.md)**
   - 概念对比和区别说明
   - 使用场景划分
   - 权限验证流程对比
   - 决策树和快速判断表

### 🔧 实施文档

4. **[权限系统扩展方案](./PERMISSION_SYSTEM_EXTENSION.md)**
   - 技术实现细节
   - 代码示例和使用方法
   - API 中间件实现
   - 性能优化建议

5. **[数据库迁移指南](./DATABASE_MIGRATION_GUIDE.md)**
   - 添加 `apis` 字段的迁移步骤
   - 迁移脚本和验证方法
   - 回滚方案
   - 常见问题 FAQ

### 📖 参考文档

6. **[RBAC 系统总览](./RBAC_SYSTEM.md)**
   - 系统架构概览
   - 数据结构说明
   - 角色、权限、菜单关系

---

## 🚀 快速开始

### 新手入门

如果你是第一次接触本权限系统，推荐按以下顺序阅读：

```
1. PERMISSION_SYSTEM_FINAL_DESIGN.md (了解整体设计)
   ↓
2. ACTIONS_PATH_GUIDE.md (学习如何配置权限)
   ↓
3. SERVER_VS_CLIENT_ACTIONS.md (理解前后台区别)
   ↓
4. PERMISSION_SYSTEM_EXTENSION.md (查看代码实现)
```

### 常见任务

#### 任务 1: 配置一个新权限

1. 阅读 [Actions 路径配置指南](./ACTIONS_PATH_GUIDE.md)
2. 在权限管理页面 (`/admin/rbac/permissions`) 创建权限
3. 配置 `actions` 字段（如 `**/getUserAction`）
4. 将权限分配给角色
5. 将角色分配给用户

#### 任务 2: 为 Client Action 添加 RBAC

1. 在 `app/(client)/actions/` 中编写 Action
2. 使用 `wrapClientAction` 包装
3. 配置 `permissionId`（函数名）
4. 在权限系统中添加对应的权限配置

#### 任务 3: 为 API Route 添加权限控制

1. 阅读 [权限系统扩展方案](./PERMISSION_SYSTEM_EXTENSION.md) 的 API 部分
2. 使用 `withApiPermission` 包装 API handler
3. 在权限配置中添加 `apis` 字段（如 `/api/v1/users/*`）
4. 将权限分配给角色

---

## 🎯 核心设计

### 权限字段（定案）

```javascript
{
  "actions": [        // Server Actions（函数名匹配）
    "**/getUserAction",
    "**/deleteMyAccountAction"
  ],
  
  "apis": [          // API Routes（HTTP 路径匹配）
    "/api/v1/users/*"
  ]
}
```

**只需要 2 个字段！**

- `actions` - 所有 Server Actions（不区分前后台）
- `apis` - API Routes

### 设计原则

1. **简洁原则** - 能用 2 个字段解决，不用 3 个或 4 个
2. **统一原则** - 前后台使用统一的权限模型
3. **YAGNI 原则** - 不为"可能需要"的功能提前设计
4. **明确职责** - 每个字段有清晰的匹配对象

---

## 📊 设计决策

### 为什么不区分 client_actions？

- ❌ **不需要** `client_actions` 字段
- Backend Admin Actions 和 Client Actions 统一使用 `actions`
- 理由：它们都是 Server Actions（函数名匹配），本质相同

### 为什么不需要 resources？

- ❌ **不需要** `resources` 字段
- `actions` 已经能表达"对资源的操作"
- 理由：功能重叠，YAGNI 原则

### 为什么 apis 不叫 api_routes？

- ❌ `api_routes` 太长，拗口
- `apis` 简洁，与 `actions` 命名风格一致

---

## 🔗 相关文档

### 后台管理相关

- [后台认证系统](../admin/AUTH.md)
- [BaseDAO 使用指南](../admin/BASE_DAO.md)
- [Action Wrapper 文档](../admin/ACTION_LOGGER.md)

### 数据库相关

- [DB API 使用指南](../database/DB_API_GUIDE.md)
- [MongoDB 集成文档](../database/MONGODB.md)

---

## 📝 更新日志

### v2.0 (2024-11-14)

**重大更新**：简化权限字段设计

- 移除 `client_actions` 字段（与 `actions` 合并）
- 移除 `resources` 字段（YAGNI 原则）
- 改名 `api_routes` → `apis`（更简洁）
- 最终定案：只需要 2 个字段（`actions` 和 `apis`）

**新增文档**：
- [权限系统最终设计总结](./PERMISSION_SYSTEM_FINAL_DESIGN.md)
- [数据库迁移指南](./DATABASE_MIGRATION_GUIDE.md)

**更新文档**：
- [权限系统扩展方案](./PERMISSION_SYSTEM_EXTENSION.md) - v2.0 简化版
- [Server Actions vs Client Actions](./SERVER_VS_CLIENT_ACTIONS.md) - 澄清概念

### v1.0 (2024-11-05)

- 初始 RBAC 系统实现
- 基础文档创建

---

## 🎓 常见问题

### Q1: actions 和 apis 有什么区别？

**A**: 它们的**匹配对象不同**：
- `actions` 匹配 **Action 函数名**（如 `getUserAction`）
- `apis` 匹配 **HTTP 路径**（如 `/api/v1/users/123`）

### Q2: Backend Admin Actions 和 Client Actions 有什么区别？

**A**: 
- **使用者不同**：Backend 是给管理员用的，Client 是给普通用户用的
- **权限模型不同**：Backend 需要 RBAC，Client 可选 RBAC
- **但它们都是 Server Actions**，统一使用 `actions` 字段配置权限

### Q3: 为什么不区分 client_actions？

**A**: 因为它们本质相同：
- 都是 Server Actions（函数名匹配）
- 使用相同的模式匹配逻辑
- 区分只会增加复杂度，没有实际价值

### Q4: 如何为现有系统添加 apis 字段？

**A**: 查看 [数据库迁移指南](./DATABASE_MIGRATION_GUIDE.md)，按步骤执行：
1. 备份数据库
2. 运行迁移脚本
3. 验证结果
4. 渐进式配置 `apis` 值

### Q5: admin 角色和 RBAC 的关系？

**A**: 
- `admin` 角色自动拥有所有权限（跳过 RBAC 检查）
- `user` 角色需要通过 RBAC 检查
- `user` + `isBackendAllowed = true` 可以访问后台，但受 RBAC 限制

---

## 📞 技术支持

如有疑问，请查看：
1. 相关文档（优先）
2. 代码注释和示例
3. 测试用例

---

**维护团队**: 开发团队  
**最后更新**: 2024-11-14
