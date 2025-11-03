# 菜单图标与父级菜单联动功能

## 概述

按照 Ant Design Pro 的官方设计规范，子菜单项不显示图标，只有顶级菜单才显示图标。为了避免用户在创建子菜单时误设置图标，我们添加了表单联动功能：**当选择了上级菜单时，图标选择器自动禁用并清空**。

## 设计规范

### Ant Design Pro 菜单设计规范

- ✅ **顶级菜单**：显示图标
- ❌ **子菜单项**：不显示图标（保持界面简洁）

这是 ProLayout 的默认行为，符合 Ant Design 的设计系统。

## 功能特性

### 1. 图标选择器禁用

当在表单中选择了"父级菜单"时：
- 图标选择器自动变为禁用状态（disabled）
- 已选择的图标会被自动清空
- 提示文案告知用户子菜单不显示图标

### 2. 动态联动

表单字段使用 `dependencies` 和 `fieldProps` 实现动态联动：

```javascript
{
  key: 'icon',
  title: 'Icon',
  type: 'icon',
  form: {
    placeholder: 'Select an icon',
    tips: 'Icon is only for top-level menus. Sub-menu items do not display icons.',
    // 依赖 parentId 字段
    dependencies: ['parentId'],
    fieldProps: (form) => {
      const parentId = form?.getFieldValue('parentId');
      return {
        disabled: !!parentId, // 有父级菜单时禁用
      };
    },
  },
}
```

### 3. 自动清空图标

当用户选择父级菜单时，通过 `onChange` 回调自动清空图标字段：

```javascript
{
  key: 'parentId',
  title: 'Parent Menu',
  type: 'tree-select',
  form: {
    fieldProps: (form) => ({
      treeData: menuTree,
      // 选择父级菜单时清空图标
      onChange: (value) => {
        if (value) {
          form?.setFieldValue('icon', null);
        }
      },
    }),
    tips: 'Sub-menus do not display icons. Selecting a parent will clear the icon field.',
  },
}
```

## 技术实现

### 1. 字段依赖

使用 ProForm 的 `dependencies` 属性监听字段变化：

```javascript
dependencies: ['parentId']
```

当 `parentId` 字段值变化时，会触发 `icon` 字段重新渲染。

### 2. 动态 fieldProps

`fieldProps` 可以是一个函数，接收 `form` 实例作为参数：

```javascript
fieldProps: (form) => {
  const parentId = form?.getFieldValue('parentId');
  return {
    disabled: !!parentId,
  };
}
```

- 获取当前表单的 `parentId` 值
- 如果有值（选择了父级菜单），返回 `disabled: true`
- 如果没有值（顶级菜单），返回 `disabled: false`

### 3. onChange 回调

在 `parentId` 的 `onChange` 中主动设置其他字段的值：

```javascript
onChange: (value) => {
  if (value) {
    form?.setFieldValue('icon', null);
  }
}
```

## 用户体验

### 创建顶级菜单

1. 不选择"父级菜单"
2. 图标选择器可用
3. 可以选择任意图标
4. 图标会显示在侧边栏

### 创建子菜单

1. 选择"父级菜单"
2. 图标选择器自动禁用（变灰）
3. 如果之前选择了图标，会被自动清空
4. 提示："Sub-menus do not display icons. Selecting a parent will clear the icon field."

### 编辑菜单

#### 从顶级菜单改为子菜单

1. 选择一个父级菜单
2. 原有的图标自动清空
3. 图标选择器变为禁用状态

#### 从子菜单改为顶级菜单

1. 清空父级菜单选择
2. 图标选择器自动启用
3. 可以重新选择图标

## 代码位置

**文件路径：** `app/(admin)/admin/menus/page.js`

### 修改的字段配置

1. **图标字段（icon）**
```javascript
{
  key: 'icon',
  // ...
  form: {
    tips: 'Icon is only for top-level menus. Sub-menu items do not display icons.',
    dependencies: ['parentId'],
    fieldProps: (form) => {
      const parentId = form?.getFieldValue('parentId');
      return {
        disabled: !!parentId,
      };
    },
  },
}
```

2. **父级菜单字段（parentId）**
```javascript
{
  key: 'parentId',
  // ...
  form: {
    fieldProps: (form) => ({
      // ...
      onChange: (value) => {
        if (value) {
          form?.setFieldValue('icon', null);
        }
      },
    }),
    tips: 'Sub-menus do not display icons. Selecting a parent will clear the icon field.',
  },
}
```

## 兼容性

- ✅ 创建新菜单
- ✅ 编辑现有菜单
- ✅ 从顶级改为子菜单
- ✅ 从子菜单改为顶级
- ✅ 清空父级菜单选择

## 注意事项

1. **图标字段的 disabled 状态**
   - 由 `dependencies` 和 `fieldProps` 动态控制
   - 用户无法通过手动操作绕过此限制

2. **图标自动清空**
   - 只在选择父级菜单时触发
   - 清空父级菜单不会影响图标字段

3. **数据库数据**
   - 如果数据库中子菜单有图标数据，不会在侧边栏显示
   - 编辑子菜单时图标选择器会被禁用，无法修改

4. **向后兼容**
   - 已有的子菜单数据不受影响
   - 编辑时会按照新规则禁用图标选择

## 测试场景

### 场景 1：创建顶级菜单
1. 打开创建菜单表单
2. 不选择父级菜单
3. 图标选择器可用 ✅
4. 选择图标后保存
5. 在侧边栏看到图标 ✅

### 场景 2：创建子菜单
1. 打开创建菜单表单
2. 先选择图标
3. 然后选择父级菜单
4. 图标自动清空，选择器禁用 ✅
5. 保存后在侧边栏不显示图标 ✅

### 场景 3：编辑菜单 - 改为子菜单
1. 编辑一个顶级菜单（有图标）
2. 选择一个父级菜单
3. 图标自动清空，选择器禁用 ✅
4. 保存后变为子菜单，不显示图标 ✅

### 场景 4：编辑菜单 - 改为顶级
1. 编辑一个子菜单（原本可能有图标数据）
2. 清空父级菜单选择
3. 图标选择器启用 ✅
4. 可以选择新图标
5. 保存后变为顶级菜单，显示图标 ✅

### 场景 5：反复切换
1. 编辑菜单
2. 选择父级菜单 → 图标禁用并清空
3. 清空父级菜单 → 图标启用
4. 重新选择图标
5. 再次选择父级菜单 → 图标再次清空
6. 所有切换都正常工作 ✅

## 相关文档

- `docs/admin-layout-dynamic-menu.md` - 后台动态菜单功能
- `docs/menu-management-feature.md` - 菜单管理功能文档
- `docs/menu-management-quickstart.md` - 菜单管理快速开始

## 更新日志

### 2024-11-03
- ✅ 恢复 AdminLayout 到官方原版（子菜单不显示图标）
- ✅ 添加图标字段与父级菜单的联动
- ✅ 实现图标选择器动态禁用功能
- ✅ 选择父级菜单时自动清空图标
- ✅ 更新表单提示文案

