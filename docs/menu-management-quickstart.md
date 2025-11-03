# 菜单管理功能 - 快速开始

## 🚀 立即体验

1. **访问菜单管理页面**
   ```
   http://localhost:3000/admin/menus
   ```

2. **创建第一个菜单**
   
   点击右上角 "Create" 按钮,填写以下信息:

   ```
   菜单标识: dashboard
   菜单名称: Dashboard
   图标: [点击选择] LayoutDashboard
   URL: /admin
   排序值: 100
   父级菜单: [留空]
   是否启用: 开启
   是否隐藏: 关闭
   ```

3. **创建子菜单**

   再次点击 "Create",创建一个子菜单:

   ```
   菜单标识: user_list
   菜单名称: User List  
   图标: [点击选择] Users
   URL: /admin/users
   排序值: 90
   父级菜单: [选择] Dashboard
   是否启用: 开启
   是否隐藏: 关闭
   ```

4. **查看树形结构**

   在表格中可以看到:
   ```
   📊 Dashboard (100)
     └─ 👥 User List (90)
   ```

5. **编辑菜单**

   点击菜单行的 "..." → "Edit" 即可编辑

6. **删除菜单**

   点击菜单行的 "..." → "Delete" 即可删除
   (注意: 有子菜单时无法删除)

---

## 📋 初始菜单推荐

### 系统管理菜单结构

```
系统管理 (sortOrder: 100)
├─ 用户管理 (sortOrder: 90)
├─ 菜单管理 (sortOrder: 80)
├─ 角色管理 (sortOrder: 70)
└─ 系统设置 (sortOrder: 60)

业务管理 (sortOrder: 50)
├─ 套餐管理 (sortOrder: 40)
├─ 积分管理 (sortOrder: 30)
└─ 使用统计 (sortOrder: 20)
```

### 批量创建示例

#### 1. 系统管理 (根菜单)
```javascript
{
  key: 'system',
  name: 'System Management',
  icon: 'Settings',
  url: null, // 不设置 URL,仅作为分组
  sortOrder: 100,
  parentId: null,
  enabled: true,
  hidden: false,
}
```

#### 2. 用户管理 (子菜单)
```javascript
{
  key: 'users',
  name: 'User Management',
  icon: 'Users',
  url: '/admin/users',
  sortOrder: 90,
  parentId: '[系统管理的_id]',
  enabled: true,
  hidden: false,
}
```

#### 3. 菜单管理 (子菜单)
```javascript
{
  key: 'menus',
  name: 'Menu Management',
  icon: 'Menu',
  url: '/admin/menus',
  sortOrder: 80,
  parentId: '[系统管理的_id]',
  enabled: true,
  hidden: false,
}
```

---

## 🎯 最佳实践

### 1. 菜单标识命名规范

✅ **推荐**:
```
dashboard
user_management
system_settings
order_list
```

❌ **不推荐**:
```
Dashboard  // 避免大写
user-management  // 避免连字符
用户管理  // 避免中文
```

### 2. 排序值规划

使用 10 的倍数便于插入:
```
100 - 第一个菜单
 90 - 第二个菜单
 80 - 第三个菜单
 ...
```

如需在 100 和 90 之间插入:
```
100
 95 - 新插入的菜单
 90
```

### 3. URL 格式

**内部链接** (Next.js 路由):
```
/admin
/admin/users
/admin/settings
```

**外部链接**:
```
https://docs.example.com
https://help.example.com
```

### 4. 图标选择

优先使用语义化图标:
- Dashboard → `LayoutDashboard`
- Users → `Users`
- Settings → `Settings`
- Package → `Package`
- Chart → `BarChart`

---

## 💡 高级技巧

### 1. 创建分组菜单

不设置 URL,仅作为菜单分组:
```javascript
{
  key: 'system_group',
  name: 'System',
  icon: 'Folder',
  url: null, // 不设置
  sortOrder: 100,
  enabled: true,
}
```

### 2. 创建隐藏页面

某些页面不在菜单显示,但可以直接访问:
```javascript
{
  key: 'user_detail',
  name: 'User Detail',
  url: '/admin/users/[id]',
  hidden: true, // 隐藏
  enabled: true,
}
```

### 3. 临时禁用菜单

不删除菜单,只是暂时禁用:
```javascript
{
  enabled: false, // 禁用
}
```

### 4. 快速调整顺序

修改 sortOrder 即可调整顺序:
```
用户管理: 90 → 95  (向上移动)
角色管理: 80 (保持不变)
```

---

## 🔍 常见问题

### Q1: 为什么删除失败?

**A**: 菜单有子菜单时无法删除,请先删除所有子菜单。

### Q2: 如何改变菜单顺序?

**A**: 编辑菜单,修改 "排序值" 字段。数字越大越靠前。

### Q3: 菜单标识重复怎么办?

**A**: 系统会提示 "Menu key already exists",请使用唯一的标识。

### Q4: 如何创建三级菜单?

**A**: 
1. 先创建一级菜单 A
2. 创建二级菜单 B,父级选择 A
3. 创建三级菜单 C,父级选择 B

### Q5: 外部链接如何打开?

**A**: 系统会自动识别外部链接(http/https 开头),在新标签页打开。

---

## 📊 功能验证清单

测试以下功能确保系统正常:

- [ ] ✅ 创建根菜单
- [ ] ✅ 创建子菜单
- [ ] ✅ 创建三级菜单
- [ ] ✅ 编辑菜单信息
- [ ] ✅ 修改父级菜单
- [ ] ✅ 调整排序顺序
- [ ] ✅ 启用/禁用菜单
- [ ] ✅ 显示/隐藏菜单
- [ ] ✅ 删除叶子菜单
- [ ] ✅ 删除父菜单失败(有子菜单时)
- [ ] ✅ 树形表格展开/收起
- [ ] ✅ 图标选择器
- [ ] ✅ 搜索功能
- [ ] ✅ 详情查看

---

## 🎉 完成!

现在你已经掌握了菜单管理的基本使用。

接下来可以:
1. 根据业务需求创建完整的菜单结构
2. 配置每个菜单的权限(后续功能)
3. 实现动态菜单加载到侧边栏

---

**需要帮助?** 查看 [完整文档](./menu-management-feature.md)

