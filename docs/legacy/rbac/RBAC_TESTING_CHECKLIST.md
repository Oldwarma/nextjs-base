# RBAC 权限系统测试清单

> 用于验证 RBAC 权限系统是否正常工作的测试清单

---

## 核心功能测试

### 1. 菜单权限控制

#### 测试步骤

1. **创建测试角色**
   - 在 `/admin/roles` 创建角色 "编辑员"
   - 为角色分配部分菜单（例如：只分配"用户管理"菜单）

2. **创建测试用户**
   - 在 `/admin/users` 创建新用户
   - 为用户分配"编辑员"角色

3. **验证菜单显示**
   - 使用测试用户登录
   - 检查侧边栏是否只显示被分配的菜单
   - Admin 用户应该看到所有菜单

#### 预期结果

- 测试用户只能看到被分配的菜单
- 未被分配的菜单不显示
- Admin 用户看到所有菜单
- 菜单树形结构正确

---

### 2. 页面访问控制

#### 测试步骤

1. **配置菜单权限**
   - 确保测试用户有"用户管理"菜单权限
   - 确保测试用户没有"角色管理"菜单权限

2. **测试允许访问的页面**
   - 用测试用户访问 `/admin/users`
   - 应该能正常访问

3. **测试未授权的页面**
   - 用测试用户访问 `/admin/roles`
   - 应该被重定向到首页并显示错误

#### 预期结果

- 有权限的页面可以正常访问
- 无权限的页面被拦截
- 显示友好的错误提示
- Admin 可以访问所有页面

---

### 3. Server Actions 权限控制

#### 测试步骤

1. **配置操作权限**
   - 创建权限 "用户创建"
   - Actions: `["/admin/actions/user/create"]`
   - 为测试角色分配此权限

2. **测试允许的操作**
   - 用测试用户调用创建用户 Action
   - 应该能成功执行

3. **测试未授权的操作**
   - 创建权限 "用户删除" 但不分配给测试角色
   - 用测试用户调用删除用户 Action
   - 应该返回权限错误

#### 预期结果

- 有权限的操作可以执行
- 无权限的操作被拦截
- 返回清晰的错误消息
- Admin 可以执行所有操作

---

### 4. 前端权限控制

#### 测试步骤

1. **测试按钮显示/隐藏**
   - 创建页面使用 `usePermission` Hook
   - 根据权限显示/隐藏按钮
   - 用测试用户访问页面

2. **测试按钮禁用**
   - 创建页面使用 `disabled={!hasPermission()}`
   - 用测试用户访问页面

#### 预期结果

- 有权限时按钮显示/启用
- 无权限时按钮隐藏/禁用
- Hook 返回正确的权限状态
- 权限状态实时更新

---

## 🔄 权限组合测试

### 测试场景 1: 多角色用户

#### 测试步骤

1. 创建两个角色：
   - 角色 A: 有 "用户创建" 权限
   - 角色 B: 有 "用户删除" 权限

2. 为用户分配两个角色

3. 验证用户同时拥有两个权限

#### 预期结果

- 用户拥有所有角色的权限（并集）
- 可以执行创建和删除操作

---

### 测试场景 2: 权限继承

#### 测试步骤

1. 创建权限树：
   ```
   用户管理
   ├── 用户创建
   └── 用户删除
   ```

2. 为角色分配顶级权限 "用户管理"

3. 验证用户是否拥有子权限

#### 预期结果

- 分配父权限时包含所有子权限
- Actions 通配符正确匹配

---

### 测试场景 3: 通配符权限

#### 测试步骤

1. 配置权限：
   - Actions: `["/admin/actions/user/*"]`

2. 验证匹配规则：
   - `/admin/actions/user/create` 应该匹配
   - `/admin/actions/user/update` 应该匹配
   - `/admin/actions/user/role/assign` ❌ 不应该匹配（多层）

3. 配置权限：
   - Actions: `["/admin/actions/**"]`

4. 验证匹配规则：
   - `/admin/actions/user/create` 应该匹配
   - `/admin/actions/user/role/assign` 应该匹配（多层）

#### 预期结果

- `*` 只匹配单层路径
- `**` 匹配任意层级
- 精确路径优先级最高

---

## 🔐 安全测试

### 测试场景 1: 绕过前端验证

#### 测试步骤

1. 用测试用户登录
2. 在浏览器控制台直接调用 Server Action（绕过前端按钮）
3. 验证是否被后端拦截

#### 预期结果

- 后端正确验证权限
- 返回权限错误
- 操作不被执行

---

### 测试场景 2: Token 过期

#### 测试步骤

1. 用户登录后等待 Session 过期
2. 尝试访问受保护的页面或操作

#### 预期结果

- 自动重定向到登录页
- 显示会话过期提示

---

### 测试场景 3: 权限修改后立即生效

#### 测试步骤

1. 用户 A 正在使用系统
2. Admin 修改用户 A 的角色权限
3. 用户 A 刷新页面或执行操作

#### 预期结果

- 菜单立即更新（刷新页面后）
- 操作权限立即生效
- 不需要重新登录

---

## 📱 边界情况测试

### 测试场景 1: 空权限用户

#### 测试步骤

1. 创建用户但不分配任何角色
2. 用户登录并尝试访问系统

#### 预期结果

- 用户可以登录
- 看不到任何菜单（除了默认的首页）
- 无法执行任何受保护的操作

---

### 测试场景 2: 禁用的权限

#### 测试步骤

1. 创建权限并分配给角色
2. 将权限的 `enable` 字段设为 `false`
3. 验证用户是否还有此权限

#### 预期结果

- 禁用的权限不生效
- 用户无法执行对应操作

---

### 测试场景 3: 禁用的菜单

#### 测试步骤

1. 将菜单的 `enable` 字段设为 `false`
2. 验证菜单是否显示

#### 预期结果

- 禁用的菜单不显示
- 即使用户有权限也看不到

---

### 测试场景 4: 隐藏的菜单

#### 测试步骤

1. 将菜单的 `hidden` 字段设为 `true`
2. 验证菜单是否显示
3. 验证是否可以直接访问 URL

#### 预期结果

- 隐藏的菜单不在侧边栏显示
- 直接访问 URL 时根据权限判断

---

## 🎯 性能测试

### 测试场景 1: 大量权限

#### 测试步骤

1. 创建 100+ 个权限
2. 为用户分配所有权限
3. 测试页面加载速度

#### 预期结果

- 页面加载时间 < 2 秒
- 菜单渲染流畅
- 权限检查不阻塞 UI

---

### 测试场景 2: 深层菜单树

#### 测试步骤

1. 创建 5 层嵌套的菜单结构
2. 测试菜单加载和渲染

#### 预期结果

- 菜单正确展开/折叠
- 层级关系正确
- 性能良好

---

## 📊 测试报告模板

```markdown
# RBAC 测试报告

**测试日期**: YYYY-MM-DD
**测试人员**: [姓名]
**测试环境**: [开发/测试/生产]

## 测试结果总览

- 通过: X 项
- ❌ 失败: X 项
- ⚠️ 警告: X 项

## 详细测试结果

### 1. 菜单权限控制
- [x] 测试用户只能看到被分配的菜单
- [x] 未被分配的菜单不显示
- [x] Admin 用户看到所有菜单
- [x] 菜单树形结构正确

### 2. 页面访问控制
- [x] 有权限的页面可以正常访问
- [x] 无权限的页面被拦截
- [x] 显示友好的错误提示
- [x] Admin 可以访问所有页面

### 3. Server Actions 权限控制
- [x] 有权限的操作可以执行
- [x] 无权限的操作被拦截
- [x] 返回清晰的错误消息
- [x] Admin 可以执行所有操作

### 4. 前端权限控制
- [x] 有权限时按钮显示/启用
- [x] 无权限时按钮隐藏/禁用
- [x] Hook 返回正确的权限状态
- [x] 权限状态实时更新

## 发现的问题

### 问题 1: [问题描述]
- **严重程度**: 高/中/低
- **复现步骤**: ...
- **预期行为**: ...
- **实际行为**: ...
- **解决方案**: ...

## 总结

[测试总结和建议]
```

---

## 🚀 自动化测试建议

### 推荐测试框架

```javascript
// 使用 Jest + Testing Library 进行单元测试
describe('RBAC Permission System', () => {
  describe('usePermission Hook', () => {
    it('should return correct permissions', async () => {
      const { result } = renderHook(() => usePermission());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.hasPermission('user-create')).toBe(true);
    });
  });

  describe('checkActionPermission', () => {
    it('should allow action with permission', async () => {
      const result = await checkActionPermission('/admin/actions/user/create');
      expect(result.hasPermission).toBe(true);
    });

    it('should deny action without permission', async () => {
      const result = await checkActionPermission('/admin/actions/user/delete');
      expect(result.hasPermission).toBe(false);
    });
  });
});
```

---

## 📝 测试数据准备

### 创建测试角色

```javascript
// 编辑员角色
{
  name: "Editor",
  permissions: ["article-create", "article-update"],
  menus: ["articles"]
}

// 审核员角色
{
  name: "Reviewer",
  permissions: ["article-read", "article-approve"],
  menus: ["articles", "reviews"]
}

// 管理员角色（Better Auth）
{
  role: "admin"  // 拥有所有权限
}
```

### 创建测试用户

```javascript
{
  name: "Test Editor",
  email: "editor@test.com",
  roles: ["editor-role-uuid"]
}

{
  name: "Test Reviewer",
  email: "reviewer@test.com",
  roles: ["reviewer-role-uuid"]
}

{
  name: "Test Admin",
  email: "admin@test.com",
  role: "admin"  // Better Auth admin
}
```

---

## 验收标准

RBAC 系统通过测试的标准：

1. 所有核心功能测试通过
2. 所有安全测试通过
3. 边界情况处理正确
4. 性能满足要求（< 2 秒）
5. 错误提示清晰友好
6. 文档完整准确

---

## 📞 问题反馈

如果在测试过程中发现问题，请：

1. 查看 [RBAC 实现指南](./RBAC_IMPLEMENTATION_GUIDE.md)
2. 检查浏览器控制台错误
3. 查看服务器日志
4. 向开发团队反馈

---

MIT License

