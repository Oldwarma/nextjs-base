# 菜单管理功能文档

## 📋 功能概述

菜单管理模块实现了完整的后台菜单 CRUD 功能,支持树形结构、父子关系、排序、启用/禁用等特性。

**访问路径**: `/admin/menus`

---

## ✨ 核心功能

### 1. 树形表格展示 ✅
- 自动展开所有层级
- 清晰的层级缩进显示
- 支持无限层级嵌套

### 2. 完整的 CRUD 操作 ✅
- ✅ **创建菜单** - 支持根菜单和子菜单
- ✅ **编辑菜单** - 修改所有字段
- ✅ **删除菜单** - 软删除,有子菜单时禁止删除
- ✅ **查看详情** - 抽屉展示完整信息

### 3. 字段功能 ✅

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| **菜单标识** (key) | Text | ✅ | 唯一标识,如 `dashboard`, `users` |
| **菜单名称** (name) | Text | ✅ | 显示名称,如 "用户管理" |
| **图标** (icon) | Icon Picker | ❌ | 从图标库选择 |
| **URL** (url) | Text | ❌ | 内部: `/admin/users`<br>外部: `https://example.com` |
| **排序值** (sortOrder) | Number | ✅ | 数字越大越靠前(倒序) |
| **父级菜单** (parentId) | TreeSelect | ❌ | 留空为根菜单 |
| **备注** (remark) | TextArea | ❌ | 说明信息 |
| **是否启用** (enabled) | Switch | - | 默认启用 |
| **是否隐藏** (hidden) | Switch | - | 隐藏但可直接访问 |

---

## 🎯 使用示例

### 创建根菜单

```javascript
{
  key: 'dashboard',
  name: 'Dashboard',
  icon: 'LayoutDashboard', // 从 lucide-react 选择
  url: '/admin',
  sortOrder: 100,
  parentId: null, // 留空
  enabled: true,
  hidden: false,
}
```

### 创建子菜单

```javascript
{
  key: 'user_list',
  name: 'User List',
  icon: 'Users',
  url: '/admin/users',
  sortOrder: 90,
  parentId: 'user_management_id', // 选择父菜单
  enabled: true,
  hidden: false,
}
```

### 创建外部链接菜单

```javascript
{
  key: 'docs',
  name: 'Documentation',
  icon: 'BookOpen',
  url: 'https://docs.example.com',
  sortOrder: 10,
  parentId: null,
  enabled: true,
  hidden: false,
}
```

---

## 🔧 技术实现

### 数据库 Schema

```javascript
{
  _id: ObjectId,
  key: String,          // 菜单标识(唯一)
  name: String,         // 菜单名称
  icon: String,         // 图标名称
  url: String,          // URL 地址
  sortOrder: Number,    // 排序值(倒序)
  parentId: String,     // 父菜单 ID
  remark: String,       // 备注
  enabled: Boolean,     // 是否启用
  hidden: Boolean,      // 是否隐藏
  createdAt: Date,      // 创建时间
  updatedAt: Date,      // 更新时间
  deletedAt: Date,      // 软删除时间
}
```

### Server Actions

**文件**: `app/(admin)/actions/admin-menus.js`

```javascript
// 获取菜单列表(树形结构)
getMenuListAction({ pageIndex, pageSize, ...filters })

// 获取菜单树(用于父级选择)
getMenuTreeAction()

// 创建菜单
createMenuAction(data)

// 更新菜单
updateMenuAction(id, data)

// 删除菜单(软删除)
deleteMenuAction(id)
```

### 页面组件

**文件**: `app/(admin)/admin/menus/page.js`

- 使用 Smart CRUD 系统
- 配置化开发
- 树形表格展示
- 动态加载菜单树

---

## 🎨 核心特性

### 1. 树形结构处理

**后端构建树形结构**:
```javascript
function buildMenuTree(menus, parentId = null) {
  const tree = [];
  for (const menu of menus) {
    if (menu.parentId === parentId) {
      const children = buildMenuTree(menus, menu._id);
      if (children.length > 0) {
        menu.children = children;
      }
      tree.push(menu);
    }
  }
  return tree;
}
```

**前端树形表格**:
```javascript
tableProps={{
  expandable: {
    defaultExpandAllRows: true,
    indentSize: 24,
  },
  pagination: false, // 树形表格不分页
}}
```

### 2. 父级菜单选择

使用 `TreeSelect` 组件:

```javascript
{
  key: 'parentId',
  type: 'tree-select',
  data: menuTree, // 动态加载的菜单树
  form: {
    fieldProps: {
      treeData: menuTree,
      showSearch: true,
      allowClear: true, // 可清空=根菜单
    }
  }
}
```

### 3. 图标选择器

使用自定义 Icon Picker:

```javascript
{
  key: 'icon',
  type: 'icon',
  table: {
    render: (icon) => renderIcon(icon, { style: { fontSize: 18 } }),
  },
  form: {
    placeholder: 'Select an icon',
  }
}
```

### 4. URL 类型识别

```javascript
// 内部 URL
url: '/admin/users'  // Next.js 路由

// 外部 URL
url: 'https://docs.example.com'  // 外部链接
```

### 5. 排序机制

- 使用 `sortOrder` 字段
- 数值越大越靠前(倒序)
- 同级菜单按排序值排列

```javascript
.sort({ sortOrder: -1, createdAt: 1 })
```

### 6. 软删除保护

```javascript
// 检查子菜单
const childMenus = await menusCollection.findOne({
  parentId: id,
  deletedAt: { $exists: false },
});

if (childMenus) {
  return {
    success: false,
    error: 'Cannot delete menu with child menus',
  };
}
```

---

## 📊 Smart CRUD 验证

### ✅ 测试的功能点

| 功能 | Smart CRUD 支持 | 验证结果 |
|------|----------------|---------|
| **树形表格** | ✅ expandable | ✅ 完美支持 |
| **TreeSelect** | ✅ tree-select 类型 | ✅ 完美支持 |
| **Icon Picker** | ✅ icon 类型 | ✅ 完美支持 |
| **Switch** | ✅ switch 类型 | ✅ 完美支持 |
| **TextArea** | ✅ textarea 类型 | ✅ 完美支持 |
| **Number** | ✅ number 类型 | ✅ 完美支持 |
| **自定义渲染** | ✅ table.render | ✅ 完美支持 |
| **动态数据** | ✅ useState + useEffect | ✅ 完美支持 |
| **回调函数** | ✅ beforeCreate/beforeEdit | ✅ 完美支持 |

### 🎉 结论

Smart CRUD 系统**完全满足**复杂业务需求:
- ✅ 树形结构处理
- ✅ 动态数据加载
- ✅ 复杂表单字段
- ✅ 自定义渲染
- ✅ 业务逻辑钩子

**代码量对比**:
- 传统方式: ~500-600 行
- Smart CRUD: ~250 行
- **减少 50%+ 代码**

---

## 🔐 权限控制

所有 Server Actions 都经过权限验证:

```javascript
const admin = await checkAdmin();
if (!admin.success) {
  return { success: false, error: admin.error };
}
```

---

## 🎯 下一步扩展

### 可选增强功能

1. **拖拽排序**
   - 实现拖拽改变菜单顺序
   - 自动更新 sortOrder

2. **批量操作**
   - 批量启用/禁用
   - 批量删除

3. **权限关联**
   - 菜单关联角色权限
   - 按角色显示不同菜单

4. **菜单预览**
   - 实时预览菜单结构
   - 模拟不同角色视图

5. **导入导出**
   - 导出菜单配置
   - 批量导入菜单

---

## 📝 使用流程

### 1. 访问菜单管理
```
/admin/menus
```

### 2. 创建根菜单
1. 点击 "Create" 按钮
2. 填写菜单信息
3. 父级菜单留空
4. 设置较大的排序值(如 100)
5. 提交

### 3. 创建子菜单
1. 点击 "Create" 按钮
2. 填写菜单信息
3. 选择父级菜单
4. 设置排序值(如 90)
5. 提交

### 4. 编辑菜单
1. 点击操作列的 "..." 按钮
2. 选择 "Edit"
3. 修改信息
4. 提交

### 5. 删除菜单
1. 确保没有子菜单
2. 点击操作列的 "..." 按钮
3. 选择 "Delete"
4. 确认删除

---

## 🐛 注意事项

### 1. 菜单标识唯一性
- `key` 字段必须唯一
- 建议使用小写+下划线
- 例如: `user_management`, `system_settings`

### 2. 删除限制
- 有子菜单的菜单无法删除
- 必须先删除所有子菜单

### 3. 循环引用
- 不能将菜单的父级设置为自己
- 不能将菜单的父级设置为自己的子菜单

### 4. URL 格式
- 内部 URL: 必须以 `/` 开头
- 外部 URL: 必须以 `http://` 或 `https://` 开头

### 5. 排序值
- 建议使用 10 的倍数 (10, 20, 30...)
- 便于后续插入新菜单

---

## 📚 相关文档

- [Smart CRUD 使用指南](./crud-antd-api-guide.md)
- [Ant Design TreeSelect](https://ant.design/components/tree-select-cn)
- [Pro Components ProTable](https://procomponents.ant.design/components/table)

---

**创建日期**: 2025-11-02  
**版本**: v1.0.0  
**状态**: ✅ 功能完整

