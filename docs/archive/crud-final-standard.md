# CRUD 最终统一标准

**版本：** 3.0（终极简化版）  
**日期：** 2024-11-13

---

## 🎯 核心原则

### ✅ 最简单的方案：只需 2 个文件！

**彻底删除所有 config 文件！**

1. **page.js** - UI 配置（fieldsConfig）
2. **crud-action.{resource}.js** - 所有服务端逻辑（config + validation + hooks + transforms + actions）

**为什么这样最好？**
1. ✅ 文件最少，结构最清晰
2. ✅ 不需要导入任何 config
3. ✅ 完全避免构建错误
4. ✅ 修改配置只需改一个文件
5. ✅ 符合 "关注点分离"：UI 和服务端逻辑完全分离

---

## 📁 标准文件结构

每个 CRUD 资源**只需 2 个文件**：

```
app/(admin)/
├── admin/{module}/{resource}/
│   └── page.js                          ← 页面（包含 fieldsConfig）
└── actions/{module}/
    └── crud-action.{resource}.js        ← 所有服务端逻辑
```

**就是这么简单！不需要任何 config 目录！**

---

## 📖 标准模板

### 1. page.js（UI 配置）

```javascript
'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import * as actions from '@/app/(admin)/actions/{module}/crud-action.{resource}';

/**
 * {Resource} Management Page
 * 
 * ✅ 只包含 UI 配置（fieldsConfig）
 * ✅ 不包含任何业务逻辑
 */
export default function {Resource}ManagementPage() {
  const fieldsConfig = [
    {
      key: 'name',
      title: 'Name',
      type: 'text',
      required: true,
      table: {
        width: 200,
        sorter: true,
        ellipsis: true,
      },
      form: {
        required: true,
        placeholder: 'Enter name',
        fieldProps: {
          showCount: true,
          maxLength: 100,
        },
      },
      search: {
        placeholder: 'Search by name',
      },
    },

    {
      key: 'status',
      title: 'Status',
      type: 'select',
      table: {
        width: 120,
        valueEnum: {
          0: { text: 'Inactive', status: 'Default' },
          1: { text: 'Active', status: 'Success' },
        },
      },
      form: {
        required: true,
        options: [
          { label: 'Inactive', value: 0 },
          { label: 'Active', value: 1 },
        ],
        initialValue: 1,
      },
    },

    {
      key: 'enable',
      title: 'Enable',
      type: 'switch',
      table: {
        width: 100,
        activeText: 'Enabled',
        inactiveText: 'Disabled',
        activeColor: 'success',
        inactiveColor: 'error',
        activeIcon: 'CheckCircleOutlined',
        inactiveIcon: 'CloseCircleOutlined',
      },
      form: {
        required: false,
        initialValue: true,
      },
    },

    {
      key: 'parent_id',
      title: 'Parent',
      type: 'tree-select',
      table: false,
      form: {
        required: false,
        placeholder: 'Select parent',
        action: 'get{Resource}TreeForSelectAction',  // ✅ 自动调用对应 action
        fieldProps: {
          allowClear: true,
          showSearch: true,
          treeNodeFilterProp: 'title',
        },
      },
    },

    {
      key: 'tags',
      title: 'Tags',
      type: 'array',
      table: {
        width: 200,
        formatter: (value) => {
          if (!Array.isArray(value) || value.length === 0) return '-';
          return value.slice(0, 2).join(', ') + 
            (value.length > 2 ? ` (+${value.length - 2})` : '');
        },
      },
      form: {
        type: 'list',
      },
    },

    {
      key: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      table: {
        width: 180,
        sorter: true,
      },
      form: false,
      search: false,
    },
  ];

  return (
    <SmartCrudPage
      title='{Resource} Management'
      description='Manage {resource} with full CRUD operations'
      fieldsConfig={fieldsConfig}
      actions={{
        getList: actions.get{Resource}ListAction,
        create: actions.create{Resource}Action,
        update: actions.update{Resource}Action,
        delete: actions.delete{Resource}Action,
        // ✅ 如果有树形结构，添加这个
        get{Resource}TreeForSelectAction: actions.get{Resource}TreeForSelectAction,
      }}
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
      enableDetail={true}
    />
  );
}
```

### 2. crud-action.{resource}.js（服务端逻辑）

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction } from '@/lib/core/action-wrapper';

/**
 * {Resource} CRUD 配置
 * 
 * ✅ 所有服务端配置集中在这里：
 *    - 基础配置（collectionName, primaryKey, fields）
 *    - 验证规则（validation）
 *    - 生命周期钩子（hooks）
 *    - 数据转换（transforms）
 */
const {resource}Config = {
  // ==================== 基础配置 ====================
  collectionName: '{resource}',
  primaryKey: '_id',  // 或 'id'
  softDelete: false,

  // ==================== 字段配置 ====================
  fields: {
    creatable: ['name', 'status', 'enable', 'parent_id', 'sort', 'remark'],
    updatable: ['name', 'status', 'enable', 'parent_id', 'sort', 'remark'],
    searchable: ['name', 'remark'],
  },

  // ==================== 查询配置 ====================
  query: {
    defaultSort: { sort: 1, name: 1 },
    defaultPageSize: 20,
    populateFields: [],
  },

  // ==================== 验证规则 ====================
  validation: {
    name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 100,
      message: 'Name must be 1-100 characters',
    },
    email: {
      required: false,
      type: 'string',
      custom: async (value, context) => {
        if (!value) return true;
        
        // ✅ 使用 dynamic import
        const { getDb } = await import('@/lib/database/mongodb');
        const db = await getDb();
        
        // 检查邮箱是否已存在
        const existing = await db.collection('{resource}').findOne({ 
          email: value,
          _id: { $ne: context.id }
        });
        
        if (existing) {
          throw new Error('Email already exists');
        }
        
        return true;
      },
    },
    status: {
      required: false,
      type: 'number',
      enum: [0, 1],
      default: 1,
    },
    enable: {
      required: false,
      type: 'boolean',
      default: true,
    },
  },

  // ==================== 生命周期钩子 ====================
  hooks: {
    beforeCreate: async (data, context) => {
      const { getDb } = await import('@/lib/database/mongodb');
      const db = await getDb();
      
      // 检查同名记录
      const existing = await db.collection('{resource}').findOne({ 
        name: data.name 
      });
      
      if (existing) {
        throw new Error(`{Resource} name "${data.name}" already exists`);
      }
      
      return data;
    },

    beforeUpdate: async (id, data, context) => {
      const { getDb } = await import('@/lib/database/mongodb');
      const db = await getDb();
      
      // 检查同名记录（排除自己）
      if (data.name !== undefined) {
        const existing = await db.collection('{resource}').findOne({ 
          name: data.name,
          _id: { $ne: id }
        });
        
        if (existing) {
          throw new Error(`{Resource} name "${data.name}" already exists`);
        }
      }
      
      return data;
    },

    beforeDelete: async (id, context) => {
      const { getDb } = await import('@/lib/database/mongodb');
      const db = await getDb();
      
      // 检查是否有子项
      const children = await db.collection('{resource}').findOne({ 
        parent_id: id 
      });
      
      if (children) {
        throw new Error('Cannot delete {resource} with children');
      }
      
      return true;
    },

    afterFind: async (records, context) => {
      if (!Array.isArray(records) || records.length === 0) {
        return records;
      }
      
      const { getDb } = await import('@/lib/database/mongodb');
      const db = await getDb();
      
      // 自动关联查询父项
      const parentIds = [...new Set(
        records.map(r => r.parent_id).filter(id => id)
      )];
      
      if (parentIds.length === 0) return records;
      
      const parents = await db.collection('{resource}')
        .find({ _id: { $in: parentIds } })
        .toArray();
      
      const parentMap = new Map(parents.map(p => [p._id.toString(), p]));
      
      return records.map(record => {
        if (record.parent_id && parentMap.has(record.parent_id.toString())) {
          return {
            ...record,
            parentInfo: parentMap.get(record.parent_id.toString()),
          };
        }
        return record;
      });
    },
  },

  // ==================== 数据转换 ====================
  transforms: {
    output: (data) => {
      if (!data) return data;
      
      // 从数据库读取后的转换
      if (typeof data.sort !== 'number') {
        data.sort = parseInt(data.sort) || 0;
      }
      if (typeof data.status !== 'number') {
        data.status = parseInt(data.status) || 0;
      }
      if (typeof data.enable !== 'boolean') {
        data.enable = data.enable === true || data.enable === 'true';
      }
      
      return data;
    },

    input: (data) => {
      if (!data) return data;
      
      // 写入数据库前的转换
      if (data.parent_id === '') data.parent_id = null;
      if (data.remark === '') data.remark = null;
      if (data.sort !== undefined) data.sort = parseInt(data.sort) || 0;
      if (data.status !== undefined) data.status = parseInt(data.status) || 0;
      if (data.enable !== undefined) {
        data.enable = data.enable === true || data.enable === 'true';
      }
      
      return data;
    },
  },
};

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions({resource}Config);

/**
 * 导出标准 CRUD Actions
 */
export const get{Resource}ListAction = crudActions.getList;
export const get{Resource}DetailAction = crudActions.getDetail;
export const create{Resource}Action = crudActions.create;
export const update{Resource}Action = crudActions.update;
export const delete{Resource}Action = crudActions.delete;
export const batchUpdate{Resource}sAction = crudActions.batchUpdate;
export const batchDelete{Resource}sAction = crudActions.batchDelete;

/**
 * 自定义 Actions（如果需要）
 */

// 示例：获取树形数据
export const get{Resource}TreeAction = wrapQueryAction('{resource}', async ({ pageIndex = 1, pageSize = 1000, filters = {} } = {}) => {
  // 自定义树形查询逻辑
  // ...
  
  return {
    success: true,
    data: treeData,
    total: treeData.length,
  };
});

// 示例：获取选择器树形数据
export const get{Resource}TreeForSelectAction = wrapQueryAction('{resource}', async () => {
  const { getDb } = await import('@/lib/database/mongodb');
  const db = await getDb();
  
  const records = await db.collection('{resource}')
    .find({ enable: true })
    .sort({ sort: 1, name: 1 })
    .toArray();
  
  // 转换为树形结构
  const tree = buildTree(records);
  
  return {
    success: true,
    data: tree,
  };
});

// 辅助函数：构建树形结构
function buildTree(records, parentId = null) {
  return records
    .filter(r => r.parent_id === parentId)
    .map(r => ({
      title: r.name,
      value: r._id.toString(),
      key: r._id.toString(),
      children: buildTree(records, r._id.toString()),
    }));
}
```

---

## ✨ 完整示例

### 示例 1：简单 CRUD（Post）

**文件结构：**
```
app/(admin)/
├── admin/cms/post/
│   └── page.js                (fieldsConfig)
└── actions/cms/
    └── crud-action.post.js    (所有配置 + Actions)
```

**特点：**
- 只需简单的 validation
- 无复杂 hooks
- 简单直接

### 示例 2：复杂 CRUD（Permission）

**文件结构：**
```
app/(admin)/
├── admin/rbac/permissions/
│   └── page.js                      (fieldsConfig)
└── actions/rbac/
    └── crud-action.permission.js    (所有配置 + Actions)
```

**特点：**
- 包含复杂的循环引用检查
- 包含同名检查
- 包含自动关联查询
- 包含自定义树形 Actions
- **所有逻辑都在一个文件中！**

---

## 🎯 最佳实践

### 1. fieldsConfig 定义位置

✅ **必须：直接在 page.js 中定义**
```javascript
export default function Page() {
  const fieldsConfig = [ /* ... */ ];
  return <SmartCrudPage fieldsConfig={fieldsConfig} />;
}
```

❌ **禁止：单独文件导出**
```javascript
// ❌ 不要这样做
export const fieldsConfig = [ /* ... */ ];
```

### 2. 服务端配置位置

✅ **必须：直接在 crud-action.{resource}.js 中定义**
```javascript
'use server';

const {resource}Config = {
  collectionName: '{resource}',
  validation: { /* ... */ },
  hooks: { /* ... */ },
  transforms: { /* ... */ },
};

const crudActions = createCrudActions({resource}Config);
```

❌ **禁止：单独的 config 文件**
```javascript
// ❌ 不要创建 crud-config.{resource}.js
// ❌ 不要创建 {resource}-server.config.js
```

### 3. 使用声明式配置

✅ **推荐：使用 valueEnum, formatter, action**
```javascript
{
  key: 'status',
  type: 'select',
  table: {
    valueEnum: {  // ✅ 声明式
      0: { text: 'Inactive', status: 'Default' },
      1: { text: 'Active', status: 'Success' },
    },
  },
}
```

✅ **推荐：使用 action 字符串自动加载数据**
```javascript
{
  key: 'parent_id',
  type: 'tree-select',
  form: {
    action: 'get{Resource}TreeForSelectAction',  // ✅ 自动调用
  },
}
```

### 4. Dynamic Import MongoDB

✅ **必须：所有 MongoDB 导入使用 await import**
```javascript
const { getDb } = await import('@/lib/database/mongodb'); // ✅
```

❌ **禁止：static import 或 require**
```javascript
import { getDb } from '@/lib/database/mongodb'; // ❌
const { getDb } = require('@/lib/database/mongodb'); // ❌
```

### 5. 代码组织

✅ **推荐：按功能分段，添加清晰注释**
```javascript
const {resource}Config = {
  // ==================== 基础配置 ====================
  collectionName: '{resource}',
  
  // ==================== 字段配置 ====================
  fields: { /* ... */ },
  
  // ==================== 验证规则 ====================
  validation: { /* ... */ },
  
  // ==================== 生命周期钩子 ====================
  hooks: { /* ... */ },
  
  // ==================== 数据转换 ====================
  transforms: { /* ... */ },
};
```

---

## 📊 新旧方案对比

| 方案 | 文件数 | 复杂度 | 构建错误 | 维护性 |
|------|--------|--------|---------|--------|
| **旧方案（分离 config）** | 3-4 | 😰 高 | ❌ 易发生 | 😐 中 |
| - page.js | | | | |
| - crud-config.{resource}.js | | | | |
| - {resource}-server.config.js | | | | |
| - crud-action.{resource}.js | | | | |
| **新方案（合并 config）** | **2** | **😊 低** | **✅ 不会** | **✅ 好** |
| - page.js (fieldsConfig) | | | | |
| - crud-action.{resource}.js (所有配置) | | | | |

---

## 🔄 迁移指南

### 从旧方案迁移到新方案

**步骤 1：合并 config 文件**
```bash
# 将所有配置合并到 crud-action.{resource}.js 的顶部
# 删除 crud-config.{resource}.js
# 删除 {resource}-server.config.js
```

**步骤 2：更新 page.js**
```javascript
// 移除 config 导入
- import { {resource}CrudConfig } from '@/app/(admin)/actions/...';

// 直接定义 fieldsConfig
+ const fieldsConfig = [ /* ... */ ];
```

**步骤 3：清理目录**
```bash
# 删除 configs 目录（如果为空）
rm -rf app/(admin)/actions/{module}/configs/
```

---

## ✅ 核心要点总结

1. **只需 2 个文件** ✅
   - `page.js` - UI 配置（fieldsConfig）
   - `crud-action.{resource}.js` - 所有服务端逻辑

2. **不需要任何 config 文件** ✅
   - ❌ 不要创建 `crud-config.{resource}.js`
   - ❌ 不要创建 `{resource}-server.config.js`
   - ❌ 不要创建 `{resource}-fields.config.js`

3. **配置位置清晰** ✅
   - fieldsConfig → page.js
   - validation/hooks/transforms → crud-action.{resource}.js

4. **完全避免构建错误** ✅
   - page.js 不导入任何服务端模块
   - 所有 MongoDB 使用 dynamic import

5. **代码组织清晰** ✅
   - 按功能分段
   - 添加清晰注释
   - 便于维护和扩展

---

## 🔗 参考文件

1. **Permission（复杂示例）：**
   - `app/(admin)/admin/rbac/permissions/page.js`
   - `app/(admin)/actions/rbac/crud-action.permission.js`

2. **Post（简单示例）：**
   - `app/(admin)/admin/cms/post/page.js`
   - `app/(admin)/actions/cms/crud-action.post.js`

---

**最终标准版本：** 3.0（终极简化版）  
**核心理念：** 最少文件、最清晰结构、最简单维护！  
**最后更新：** 2024-11-13

---

## 🎉 总结

**这是最简洁、最清晰、最不容易出错的方案！**

只需记住：
- 📄 **page.js** = UI 配置
- 🔧 **crud-action.{resource}.js** = 所有服务端逻辑

**就是这么简单！** 🚀
