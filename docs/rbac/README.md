# RBAC 权限管理系统文档

> 完整的 RBAC (Role-Based Access Control) 权限管理系统实现

---

## 📚 文档导航

### 对于管理员

- **[RBAC 系统配置指南](../RBAC_SYSTEM.md)** ⭐ 推荐
  - 如何配置权限、角色、菜单
  - 如何为用户分配权限
  - 权限配置最佳实践
  - 常见场景配置示例

### 对于开发者

- **[RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)**
  - 技术架构说明
  - 核心文件和 API 说明
  - 完整代码示例
  - 开发最佳实践

- **[页面访问控制](./PAGE_ACCESS_CONTROL.md)**
  - 基于菜单的自动页面保护
  - 完全由 RBAC 系统管理
  - 零代码实现

- **[后台访问控制](./BACKEND_ACCESS_CONTROL.md)**
  - Server Actions 权限验证
  - API 权限检查
  - 最佳实践

- **[404 vs 403 错误处理](./PAGE_404_VS_403.md)**
  - 正确区分页面不存在和无权访问
  - 先检查页面存在性，再验证权限
  - 提升用户体验

- **[RBAC 快速参考](./RBAC_QUICK_REFERENCE.md)**
  - 常用代码片段
  - API 快速查询
  - 错误处理示例

### 对于测试人员

- **[RBAC 测试清单](./RBAC_TESTING_CHECKLIST.md)**
  - 完整测试场景
  - 测试步骤和预期结果
  - 测试报告模板

- **[RBAC 测试指南](./TESTING_GUIDE.md)**
  - 详细测试方法
  - 测试工具使用
  - 自动化测试

---

## 📖 快速开始

### 我是管理员，想配置权限

→ 阅读 **[RBAC 系统配置指南](../RBAC_SYSTEM.md)**

### 我是开发者，想实现权限控制

→ 阅读 **[RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)**

### 我想了解页面权限如何工作

→ 阅读 **[页面访问控制](./PAGE_ACCESS_CONTROL.md)**

---

## 🎯 核心概念

### RBAC 权限模型

```
用户 (User) → 角色 (Role) → 权限 (Permission) → 资源 (Resource)
```

- **用户**: 系统使用者
- **角色**: 职能分组（如管理员、编辑、查看者）
- **权限**: 操作权限（如创建、查看、编辑、删除）
- **资源**: 受保护的页面或功能

### 权限检查流程

```
1. 用户访问页面/API
2. 系统查找用户的所有角色
3. 获取角色关联的所有权限
4. 检查是否有访问目标资源的权限
5. 允许访问 / 拒绝访问
```

---

## 📊 文档结构

```
docs/rbac/
├── README.md                       # 本文档
├── RBAC_IMPLEMENTATION_GUIDE.md    # 实现指南
├── RBAC_QUICK_REFERENCE.md         # 快速参考
├── RBAC_TESTING_CHECKLIST.md       # 测试清单
├── TESTING_GUIDE.md                # 测试指南
├── PAGE_ACCESS_CONTROL.md          # 页面访问控制
├── BACKEND_ACCESS_CONTROL.md       # 后台访问控制
└── PAGE_404_VS_403.md              # 404 vs 403 处理
```

---

## 🔑 核心功能

### ✅ 已实现功能

- [x] 基于角色的权限管理
- [x] 动态菜单生成
- [x] 页面级权限控制
- [x] API 级权限控制
- [x] 菜单树自动补全
- [x] 权限继承机制
- [x] 灵活的权限配置
- [x] 完整的测试覆盖

---

## 🆘 获取帮助

### 配置问题

如果在配置权限时遇到问题，请查阅 [RBAC 系统配置指南](../RBAC_SYSTEM.md)

### 开发问题

如果在实现权限控制时遇到问题，请查阅 [RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)

### 测试问题

如果在测试权限功能时遇到问题，请查阅 [RBAC 测试指南](./TESTING_GUIDE.md)

---

## 🎉 开始使用

准备好了吗？根据你的角色选择对应的文档：

- 👨‍💼 **管理员** → [RBAC 系统配置指南](../RBAC_SYSTEM.md)
- 👨‍💻 **开发者** → [RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)
- 🧪 **测试人员** → [RBAC 测试清单](./RBAC_TESTING_CHECKLIST.md)

---

**文档版本**：v2.0.0  
**最后更新**：2025-11-07
