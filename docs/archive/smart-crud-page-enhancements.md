# SmartCrudPage 增强需求文档

**日期：** 2024-11-13  
**目标：** 让 SmartCrudPage 像 vk-unicloud 一样智能，自动处理树形数据和复杂渲染

---

## 🎯 核心理念

**参考 vk-unicloud 的设计**：
- 配置简洁，无需手动构建复杂的 render 函数
- 树形数据自动识别和渲染
- 通过声明式配置实现复杂 UI（如 Tag、Switch、Array）

---

## 📋 需要增强的功能

### 1. Tree-Select 字段自动加载数据

**当前问题：**
```javascript
// ❌ 需要在 Page 组件中手动加载和管理 tree 数据
const [permissionTree, setPermissionTree] = useState([]);

useEffect(() => {
  loadPermissionTree();
}, []);

const fieldsConfig = useMemo(() => [{
  key: 'parent_id',
  type: 'tree-select',
  form: {
    fieldProps: {
      treeData: permissionTree,  // 手动传入
    }
  }
}], [permissionTree]);
```

**期望效果（参考 vk-unicloud）：**
```javascript
// Config 中声明 action，SmartCrudPage 自动调用
{
  key: 'parent_id',
  type: 'tree-select',
  form: {
    action: 'getPermissionTreeForSelectAction',  // 声明 action 名称
    fieldProps: {
      allowClear: true,
      showSearch: true,
    },
  },
}
```

**实现方案：**
1. SmartCrudPage 检测 `form.action` 存在
2. 从 `actions` prop 中查找对应的 action 函数
3. 组件挂载时自动调用 action 加载数据
4. 将返回的数据转换为 Ant Design TreeSelect 需要的格式
5. 自动填充到 TreeSelect 的 `treeData` prop

---

### 2. Tag 自动渲染（tagRender 配置）

**当前问题：**
```javascript
// ❌ 需要在 Page 中手动写 JSX render 函数
{
  key: 'crud_category',
  type: 'select',
  table: {
    render: (value) => {
      const categoryMap = {
        0: { text: 'Unclassified', color: 'default' },
        1: { text: 'Create', color: 'green' },
        // ...
      };
      const category = categoryMap[value] || categoryMap[0];
      return <Tag color={category.color}>{category.text}</Tag>;
    },
  },
}
```

**期望效果：**
```javascript
// 使用 tagRender 配置，SmartCrudPage 自动渲染
{
  key: 'crud_category',
  type: 'select',
  table: {
    tagRender: {
      0: { text: 'Unclassified', color: 'default' },
      1: { text: 'Create', color: 'green' },
      2: { text: 'Delete', color: 'red' },
      3: { text: 'Update', color: 'blue' },
      4: { text: 'Read', color: 'cyan' },
      5: { text: 'Special', color: 'purple' },
    },
  },
}
```

**实现方案：**
1. SmartCrudPage 检测 `table.tagRender` 存在
2. 自动生成 render 函数：
   ```javascript
   render: (value) => {
     const config = tagRender[value] || tagRender[0] || { text: value, color: 'default' };
     return <Tag color={config.color}>{config.text}</Tag>;
   }
   ```

---

### 3. Switch 自动渲染（switchRender 配置）

**当前问题：**
```javascript
// ❌ 需要手动写 JSX
{
  key: 'enable',
  type: 'switch',
  table: {
    render: (value) =>
      value ? (
        <Tag icon={<CheckCircleOutlined />} color='success'>Enabled</Tag>
      ) : (
        <Tag icon={<CloseCircleOutlined />} color='error'>Disabled</Tag>
      ),
  },
}
```

**期望效果：**
```javascript
// 使用 switchRender 配置
{
  key: 'enable',
  type: 'switch',
  table: {
    switchRender: {
      checkedText: 'Enabled',
      unCheckedText: 'Disabled',
      checkedColor: 'success',
      unCheckedColor: 'error',
      checkedIcon: 'CheckCircleOutlined',
      unCheckedIcon: 'CloseCircleOutlined',
    },
  },
}
```

**实现方案：**
1. SmartCrudPage 检测 `table.switchRender` 存在
2. 自动生成 render 函数并导入对应的图标

---

### 4. Array 自动渲染（arrayRender 配置）

**当前问题：**
```javascript
// ❌ 需要手动写复杂的 JSX
{
  key: 'actions',
  type: 'array',
  table: {
    render: (value) => {
      if (!value || value.length === 0) return '-';
      const displayCount = 2;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {value.slice(0, displayCount).map((action, index) => (
            <Tag key={index} color={action.includes('*') ? 'blue' : 'default'}>
              {action}
            </Tag>
          ))}
          {value.length > displayCount && (
            <Tag color='processing'>+{value.length - displayCount} more</Tag>
          )}
        </div>
      );
    },
  },
}
```

**期望效果：**
```javascript
// 使用 arrayRender 配置
{
  key: 'actions',
  type: 'array',
  table: {
    arrayRender: {
      maxDisplay: 2,
      tagColor: (item) => item.includes('*') ? 'blue' : 'default',
      // 或简单的固定颜色
      // tagColor: 'blue',
    },
  },
}
```

**实现方案：**
1. SmartCrudPage 检测 `table.arrayRender` 存在
2. 自动生成 render 函数处理数组显示
3. 支持 `maxDisplay` 限制显示数量
4. 支持 `tagColor` 函数或固定值

---

### 5. 自动识别树形数据

**当前问题：**
- 需要在 Page 中配置 `expandable` prop
- 需要确保数据有 `children` 字段

**期望效果：**
```javascript
// SmartCrudPage 自动检测
// 当 getList 返回的数据包含 children 字段时，自动启用树形表格
```

**实现方案：**
1. SmartCrudPage 在接收到数据后检查第一层是否有任何记录包含 `children` 字段
2. 如果存在，自动设置 Ant Design Table 的 `expandable` 配置
3. 用户可通过 prop 覆盖默认行为

---

## 🎨 最终效果对比

### 重构前（433行）

```javascript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import SmartCrudPage from '@/components/admin/smart-crud-page';
import * as actions from '@/app/(admin)/actions/rbac/crud-action.permission';

export default function PermissionsManagementPage() {
  const [permissionTree, setPermissionTree] = useState([]);
  
  // 手动加载树数据
  useEffect(() => {
    loadPermissionTree();
  }, []);

  // 手动构建 fieldsConfig（300+ 行）
  const fieldsConfig = useMemo(() => [
    // ... 300+ 行配置
  ], [permissionTree]);

  return (
    <SmartCrudPage
      fieldsConfig={fieldsConfig}
      // ...
    />
  );
}
```

### 重构后（25行）

```javascript
'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import { permissionCrudConfig } from '@/app/(admin)/actions/rbac/configs/crud-config.permission';
import * as actions from '@/app/(admin)/actions/rbac/crud-action.permission';

export default function PermissionsManagementPage() {
  return (
    <SmartCrudPage
      title='Permission Management'
      fieldsConfig={permissionCrudConfig.fieldsConfig}
      actions={{
        getList: actions.getPermissionTreeAction,
        create: actions.createPermissionAction,
        update: actions.updatePermissionAction,
        delete: actions.deletePermissionAction,
        // tree-select 自动调用
        getPermissionTreeForSelectAction: actions.getPermissionTreeForSelectAction,
      }}
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
    />
  );
}
```

**代码减少：94%（433行 → 25行）**

---

## 📊 Config 文件对比

### 重构前（需要在 Page 中）
- 无法在 Config 中定义（因为包含 JSX）
- 必须在每个 Page 组件中重复编写

### 重构后（在 Config 中定义）

```javascript
// crud-config.permission.js
export const permissionCrudConfig = {
  collectionName: 'permissions',
  primaryKey: 'id',
  
  fieldsConfig: [
    {
      key: 'parent_id',
      type: 'tree-select',
      form: {
        action: 'getPermissionTreeForSelectAction',  // 自动加载
      },
    },
    {
      key: 'crud_category',
      type: 'select',
      table: {
        tagRender: {  // 自动渲染 Tag
          0: { text: 'Unclassified', color: 'default' },
          1: { text: 'Create', color: 'green' },
        },
      },
    },
    {
      key: 'enable',
      type: 'switch',
      table: {
        switchRender: {  // 自动渲染 Switch
          checkedText: 'Enabled',
          unCheckedText: 'Disabled',
        },
      },
    },
    {
      key: 'actions',
      type: 'array',
      table: {
        arrayRender: {  // 自动渲染 Array
          maxDisplay: 2,
          tagColor: (item) => item.includes('*') ? 'blue' : 'default',
        },
      },
    },
  ],
  
  // BaseDAO 配置
  fields: { /* ... */ },
  validation: { /* ... */ },
  hooks: { /* ... */ },
};
```

---

## 🚀 实现优先级

### Phase 1（高优先级）
1. Tree-Select 自动加载数据
2. Tag 自动渲染（tagRender）
3. 自动识别树形数据

### Phase 2（中优先级）
4. Switch 自动渲染（switchRender）
5. Array 自动渲染（arrayRender）

### Phase 3（低优先级 - 可选）
6. 支持更多复杂渲染模式
7. 自定义渲染器注册机制

---

## 💡 设计原则

1. **零配置优先**：常见场景无需额外配置
2. **渐进增强**：简单场景用简单配置，复杂场景支持自定义 render
3. **向后兼容**：不破坏现有的 render 函数用法
4. **类型安全**：提供完整的 TypeScript 类型定义

---

## 🎓 参考实现

**vk-unicloud 的核心特性：**
1. `action` 字段自动请求数据
2. `type` 字段自动推断渲染方式
3. 树形数据自动识别和展开
4. 声明式配置，零 JSX 编写

**Ant Design Pro 的 ProTable：**
1. `valueType` 自动渲染（money、percent、date 等）
2. `valueEnum` 自动转换为 Tag
3. `request` 函数自动加载数据

---

**文档版本：** 1.0  
**作者：** AI Assistant  
**最后更新：** 2024-11-13

