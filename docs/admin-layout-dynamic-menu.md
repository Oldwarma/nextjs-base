# 后台布局动态菜单功能

## 概述

后台管理系统的菜单已从硬编码方式改为从数据库动态读取，支持实时更新菜单配置。

## 功能特性

### 1. 动态菜单加载
- 从 MongoDB `menus` 集合读取菜单数据
- 按 `sortOrder` 升序排序（数值小的在前）
- 支持多级菜单树形结构
- 自动过滤禁用和隐藏的菜单项

### 2. 菜单数据结构

```javascript
{
  _id: 'ObjectId',
  key: 'dashboard',           // 菜单唯一标识
  name: 'Dashboard',          // 菜单显示名称
  icon: 'DashboardOutlined',  // Ant Design 图标名称
  url: '/admin',              // 菜单链接地址
  sortOrder: 0,               // 排序值（越小越靠前）
  parentId: null,             // 父菜单ID（顶级菜单为null）
  enabled: true,              // 是否启用
  hidden: false,              // 是否隐藏
  remark: '...',             // 备注说明
  createdAt: Date,
  updatedAt: Date
}
```

### 3. 图标动态渲染

菜单支持 Ant Design 的所有图标组件：

```javascript
// 在数据库中存储图标名称
icon: 'DashboardOutlined'

// 组件自动转换为图标组件
import * as Icons from '@ant-design/icons';
const IconComponent = Icons['DashboardOutlined'];
```

**常用图标名称：**
- `DashboardOutlined` - 仪表盘
- `UserOutlined` - 用户
- `MenuFoldOutlined` - 菜单
- `GiftOutlined` - 礼物/套餐
- `CreditCardOutlined` - 积分/信用卡
- `BarChartOutlined` - 图表/统计
- `SettingOutlined` - 设置
- `ShopOutlined` - 商店
- `TeamOutlined` - 团队

### 4. 面包屑导航

面包屑会自动从菜单数据中匹配当前页面名称：

```javascript
// 递归查找当前路径对应的菜单
const findMenuByPath = (menus, path) => {
  for (const menu of menus) {
    const menuPath = menu.url || `/admin/${menu.key}`;
    if (menuPath === path) return menu;
    if (menu.children?.length > 0) {
      const found = findMenuByPath(menu.children, path);
      if (found) return found;
    }
  }
  return null;
};
```

### 5. 加载状态

菜单加载时显示友好的加载提示：

```jsx
if (menuLoading) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Spin size="large" tip="Loading..." />
    </div>
  );
}
```

## 技术实现

### 1. AdminLayout 组件改动

**文件路径：** `components/admin/admin-layout.jsx`

**主要变更：**

1. **导入菜单 Action**
```javascript
import { getMenuListAction } from '@/app/(admin)/actions/admin-menus';
```

2. **添加状态管理**
```javascript
const [menuData, setMenuData] = useState([]);
const [menuLoading, setMenuLoading] = useState(true);
```

3. **加载菜单数据**
```javascript
useEffect(() => {
  const loadMenus = async () => {
    setMenuLoading(true);
    try {
      const result = await getMenuListAction({});
      if (result.success) {
        setMenuData(result.data || []);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    } finally {
      setMenuLoading(false);
    }
  };
  loadMenus();
}, []);
```

4. **转换菜单格式**
```javascript
const convertMenuToRoute = (menu) => {
  const IconComponent = menu.icon && Icons[menu.icon] ? Icons[menu.icon] : null;
  
  const route = {
    path: menu.url || `/admin/${menu.key}`,
    name: menu.name,
    key: menu.key,
    icon: IconComponent ? <IconComponent /> : null,
  };

  // 递归处理子菜单
  if (menu.children?.length > 0) {
    route.routes = menu.children
      .filter(child => child.enabled && !child.hidden)
      .map(convertMenuToRoute);
  }

  return route;
};
```

### 2. 菜单排序逻辑

**文件路径：** `app/(admin)/actions/admin-menus.js`

```javascript
const menus = await menusCollection.find(query, {
  sort: { sortOrder: 1, createdAt: 1 }, // 按排序值升序，创建时间正序
});
```

- `sortOrder: 1` - 按排序值升序（数值小的在前）
- `createdAt: 1` - 相同排序值时，按创建时间升序

### 3. 树形结构构建

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

## 使用方法

### 1. 添加新菜单

通过菜单管理页面添加菜单：

```javascript
{
  key: 'products',
  name: 'Product Management',
  icon: 'ShopOutlined',
  url: '/admin/products',
  sortOrder: 30,
  parentId: null,
  enabled: true,
  hidden: false
}
```

### 2. 添加子菜单

设置 `parentId` 为父菜单的 ID：

```javascript
{
  key: 'product-list',
  name: 'Product List',
  icon: 'UnorderedListOutlined',
  url: '/admin/products/list',
  sortOrder: 0,
  parentId: '父菜单的_id',
  enabled: true,
  hidden: false
}
```

### 3. 调整菜单顺序

修改 `sortOrder` 值即可：
- 值越小，显示越靠前
- 建议使用 10 的倍数，方便后续插入新菜单
- 例如：0, 10, 20, 30...

### 4. 隐藏菜单

```javascript
{
  hidden: true  // 菜单不会显示在侧边栏
}
```

### 5. 禁用菜单

```javascript
{
  enabled: false  // 菜单及其子菜单都不会显示
}
```

## 性能优化

### 1. useMemo 缓存

使用 `useMemo` 缓存路由配置和面包屑，避免不必要的重新计算：

```javascript
const route = useMemo(() => {
  // ... 转换逻辑
}, [menuData]);

const breadcrumbItems = useMemo(() => {
  // ... 面包屑生成逻辑
}, [pathname, menuData]);
```

### 2. 按需加载图标

图标组件通过 `Icons[iconName]` 动态引用，避免导入所有图标。

### 3. 客户端渲染

ProLayout 使用 `dynamic` 动态导入，避免 SSR hydration 问题：

```javascript
const ProLayout = dynamic(
  () => import('@ant-design/pro-components').then((mod) => mod.ProLayout),
  { ssr: false }
);
```

## 注意事项

1. **图标名称必须正确**
   - 必须是 Ant Design Icons 中存在的图标名称
   - 区分大小写
   - 错误的图标名称会导致图标不显示（但不会报错）

2. **URL 路径要匹配**
   - 菜单的 `url` 必须与实际页面路径一致
   - 否则面包屑可能无法正确显示

3. **sortOrder 规划**
   - 建议使用 10 的倍数留出调整空间
   - 相同 sortOrder 时按创建时间排序

4. **父子关系**
   - 删除父菜单前必须先删除所有子菜单
   - 不能将菜单的父级设置为自己或自己的子菜单

5. **权限控制**
   - 当前版本只检查 `enabled` 和 `hidden` 状态
   - 后续可扩展基于用户角色的菜单权限

## 相关文件

- `components/admin/admin-layout.jsx` - 后台布局组件
- `app/(admin)/actions/admin-menus.js` - 菜单 Server Actions
- `app/(admin)/admin/menus/page.js` - 菜单管理页面
- `docs/menu-management-feature.md` - 菜单管理功能文档
- `docs/menu-management-quickstart.md` - 菜单管理快速开始

## 测试建议

1. **基础功能测试**
   - 添加顶级菜单
   - 添加子菜单
   - 修改菜单顺序
   - 禁用/启用菜单
   - 隐藏/显示菜单

2. **边界情况测试**
   - 无菜单数据
   - 所有菜单都被禁用
   - 深层次嵌套菜单（3层以上）
   - 特殊字符在菜单名称中
   - 无效的图标名称

3. **性能测试**
   - 大量菜单项（100+）
   - 频繁切换页面
   - 菜单实时更新

## 未来扩展

1. **角色权限控制**
   - 根据用户角色显示不同菜单
   - 菜单项级别的权限控制

2. **菜单徽章**
   - 显示未读消息数量
   - 状态提示标记

3. **拖拽排序**
   - 通过拖拽调整菜单顺序
   - 拖拽修改父子关系

4. **菜单搜索**
   - 快速搜索定位菜单
   - 快捷键支持

5. **菜单缓存**
   - 本地缓存菜单数据
   - 减少数据库查询

## 更新日志

### 2024-11-03
- ✅ 确认菜单排序为正序（sortOrder 升序）
- ✅ 将后台布局菜单改为从数据库读取
- ✅ 实现动态图标渲染
- ✅ 实现面包屑动态匹配
- ✅ 添加菜单加载状态
- ✅ 支持多级菜单树形结构
- ✅ 自动过滤禁用和隐藏菜单

