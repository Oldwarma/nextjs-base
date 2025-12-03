# 菜单管理指南

<div align="center">

**后台菜单配置和管理**

[菜单结构](#-菜单结构) · [配置方法](#-配置方法) · [图标使用](#-图标使用)

</div>

---

## 🎯 概述

菜单系统控制后台侧边栏的显示，支持多级菜单、图标、权限关联等功能。

### 功能特点

- ✅ 支持多级菜单（树形结构）
- ✅ 支持图标配置
- ✅ 支持权限关联
- ✅ 支持显示/隐藏控制
- ✅ 支持排序

---

## 📋 菜单结构

### 数据模型

```prisma
model Menu {
  id         String    @id @default(cuid())
  name       String                          // 菜单名称
  parentId   String?                         // 父级 ID
  url        String?                         // 页面路径
  icon       String?                         // 图标名称
  permission String[]  @default([])          // 关联权限 ID
  sort       Int       @default(0)           // 排序
  enable     Boolean   @default(true)        // 是否启用
  hidden     Boolean   @default(false)       // 是否隐藏
  remark     String?                         // 备注
}
```

### 菜单层级

```
系统管理（一级菜单）
├── 用户管理（二级菜单）
├── 角色管理
├── 权限管理
└── 菜单管理

内容管理
├── 文章管理
├── 分类管理
└── 标签管理

数据统计
├── 概览
└── 报表
```

---

## 📝 配置方法

### 创建一级菜单

| 字段 | 值 | 说明 |
|:---|:---|:---|
| 名称 | 系统管理 | 显示名称 |
| 父级 | - | 一级菜单不选父级 |
| URL | - | 一级菜单通常不配置 URL |
| 图标 | SettingOutlined | Ant Design 图标名 |
| 排序 | 100 | 数字越小越靠前 |
| 启用 | ✅ | 是否显示 |

### 创建二级菜单

| 字段 | 值 | 说明 |
|:---|:---|:---|
| 名称 | 用户管理 | 显示名称 |
| 父级 | 系统管理 | 选择父级菜单 |
| URL | /admin/rbac/users | 页面路径 |
| 图标 | UserOutlined | 可选 |
| 排序 | 10 | 同级菜单排序 |
| 关联权限 | [查看用户, 编辑用户...] | 访问此菜单需要的权限 |

### 配置示例

```javascript
// 系统管理菜单组
{
  name: '系统管理',
  parentId: null,
  url: null,
  icon: 'SettingOutlined',
  permission: [],
  sort: 100,
  enable: true,
}

// 用户管理
{
  name: '用户管理',
  parentId: '系统管理ID',
  url: '/admin/rbac/users',
  icon: 'UserOutlined',
  permission: ['查看用户ID', '编辑用户ID', '删除用户ID'],
  sort: 10,
}

// 角色管理
{
  name: '角色管理',
  parentId: '系统管理ID',
  url: '/admin/rbac/roles',
  icon: 'TeamOutlined',
  permission: ['查看角色ID', '编辑角色ID'],
  sort: 20,
}
```

---

## 🎨 图标使用

### 支持的图标

NextJS Base 使用 Ant Design 图标库，常用图标：

| 分类 | 图标名称 | 说明 |
|:---|:---|:---|
| **系统** | `SettingOutlined` | 设置 |
| | `DashboardOutlined` | 仪表盘 |
| | `AppstoreOutlined` | 应用 |
| **用户** | `UserOutlined` | 用户 |
| | `TeamOutlined` | 团队 |
| | `SolutionOutlined` | 解决方案 |
| **内容** | `FileTextOutlined` | 文件 |
| | `FolderOutlined` | 文件夹 |
| | `PictureOutlined` | 图片 |
| **数据** | `BarChartOutlined` | 柱状图 |
| | `LineChartOutlined` | 折线图 |
| | `PieChartOutlined` | 饼图 |
| **操作** | `EditOutlined` | 编辑 |
| | `DeleteOutlined` | 删除 |
| | `PlusOutlined` | 添加 |
| **状态** | `CheckCircleOutlined` | 成功 |
| | `CloseCircleOutlined` | 失败 |
| | `ExclamationCircleOutlined` | 警告 |

### 图标选择器

在菜单管理页面，点击图标字段会弹出图标选择器，可以直观地选择图标。

---

## 🔐 菜单权限

### 权限关联

菜单可以关联多个权限，用户必须拥有**至少一个**关联权限才能看到该菜单。

```javascript
// 文章管理菜单
{
  name: '文章管理',
  url: '/admin/content/posts',
  permission: [
    '查看文章ID',    // 只要有查看权限就能看到菜单
    '创建文章ID',
    '编辑文章ID',
    '删除文章ID',
  ],
}
```

### 菜单权限继承

角色可以选择是否继承菜单权限：

```javascript
// 开启继承：角色自动获得菜单关联的所有权限
{
  name: 'admin',
  menu: ['文章管理ID'],
  inheritMenuPermissions: true,
  // 自动获得：查看文章、创建文章、编辑文章、删除文章
}

// 关闭继承：需要显式分配权限
{
  name: 'editor',
  menu: ['文章管理ID'],
  permission: ['查看文章ID', '编辑文章ID'],  // 只有查看和编辑
  inheritMenuPermissions: false,
}
```

---

## 📊 菜单显示逻辑

### 显示条件

菜单显示需要满足以下条件：

1. **菜单启用** (`enable: true`)
2. **菜单未隐藏** (`hidden: false`)
3. **用户角色包含此菜单**
4. **用户拥有至少一个关联权限**（如果菜单有关联权限）

### 渲染流程

```javascript
// 1. 获取用户角色
const roles = await getRoles(user.roles)

// 2. 汇总菜单 ID
const menuIds = [...new Set(roles.flatMap(r => r.menu))]

// 3. 获取菜单详情
const menus = await getMenus(menuIds)

// 4. 过滤可见菜单
const visibleMenus = menus.filter(menu => {
  // 检查启用和隐藏状态
  if (!menu.enable || menu.hidden) return false
  
  // 如果菜单有关联权限，检查用户是否有权限
  if (menu.permission.length > 0) {
    const userPermissions = getUserPermissions(user)
    const hasPermission = menu.permission.some(p => 
      userPermissions.includes(p)
    )
    if (!hasPermission) return false
  }
  
  return true
})

// 5. 构建菜单树
const menuTree = buildTree(visibleMenus)
```

---

## ✅ 最佳实践

### 1. 菜单分组

```
✅ 推荐：按功能模块分组
系统管理
├── 用户管理
├── 角色管理
└── 权限管理

内容管理
├── 文章管理
└── 分类管理

❌ 不推荐：扁平结构
├── 用户管理
├── 角色管理
├── 文章管理
├── 分类管理
└── ...
```

### 2. 排序规范

```
一级菜单排序：100, 200, 300...
二级菜单排序：10, 20, 30...

示例：
系统管理 (sort: 100)
├── 用户管理 (sort: 10)
├── 角色管理 (sort: 20)
└── 权限管理 (sort: 30)

内容管理 (sort: 200)
├── 文章管理 (sort: 10)
└── 分类管理 (sort: 20)
```

### 3. URL 规范

```
/admin/{模块}/{资源}

示例：
/admin/rbac/users       - 用户管理
/admin/rbac/roles       - 角色管理
/admin/content/posts    - 文章管理
/admin/system/logs      - 系统日志
```

### 4. 权限关联

```
✅ 推荐：关联所有相关权限
{
  name: '文章管理',
  permission: ['查看文章', '创建文章', '编辑文章', '删除文章'],
}

❌ 不推荐：只关联部分权限
{
  name: '文章管理',
  permission: ['查看文章'],  // 其他权限怎么办？
}
```

---

## 📚 相关文档

| 文档 | 说明 |
|:---|:---|
| [RBAC 配置](./CONFIGURATION.md) | 权限配置指南 |
| [权限模型](../../architecture/PERMISSION_MODEL.md) | RBAC 架构设计 |
| [Ant Design Icons](https://ant.design/components/icon) | 图标库文档 |

---

<div align="center">

[← RBAC 配置](./CONFIGURATION.md) · [认证系统 →](../client/AUTH.md)

</div>

