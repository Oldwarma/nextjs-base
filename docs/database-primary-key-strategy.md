# 数据库主键策略说明

**日期：** 2024-11-13  
**版本：** 1.0

---

## 🎯 当前策略：使用自定义 `id` 字段

### 为什么使用 UUID 作为主键`？

1. **跨数据库兼容性**
   - 使用标准 UUID 格式
   - 已迁移到 PostgreSQL
   - 使用 Prisma 的 UUID 生成

2. **API 统一性**
   - 所有表使用相同的主键字段名
   - 前端代码不需要处理 `_id` 的特殊性

3. **可读性**
   - UUID 格式更容易识别和调试
   - 符合 Prisma 最佳实践

---

## 📋 配置清单

使用自定义 `id` 字段时，需要在以下位置配置：

### 1. CRUD Config（Server Actions）

```javascript
// app/(admin)/actions/{module}/crud-action.{resource}.js
const {resource}Config = {
  modelName: '{resource}',
  primaryKey: 'id',  // 必需：指定使用 'id' 而不是 '_id'
  // ...
};
```

### 2. SmartCrudPage（前端页面）

```javascript
// app/(admin)/admin/{module}/{resource}/page.js
<SmartCrudPage
  rowKey='id'  // 必需：指定表格行的唯一标识
  // ...
/>
```

### 3. 数据库 Schema（如果有定义）

```javascript
{
  id: { type: String, required: true, unique: true },  // UUID
  // Prisma 会自动处理主键
}
```

---

## 🔧 实施指南

### 新建资源时的检查清单

创建新的 CRUD 资源时，确保：

- [ ] `crud-action.{resource}.js` 中设置 `primaryKey: 'id'`
- [ ] `page.js` 中的 SmartCrudPage 设置 `rowKey='id'`
- [ ] DAO 层的 create 方法生成 UUID（如果使用 BaseDAO，会自动处理）
- [ ] 数据库中有 `id` 字段的唯一索引

### 标准模板

**crud-action.{resource}.js**：
```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';

const {resource}Config = {
  modelName: '{resource}',
  primaryKey: 'id',  // 重要！
  softDelete: false,
  
  fields: {
    creatable: ['field1', 'field2'],
    updatable: ['field1', 'field2'],
    searchable: ['field1'],
  },
  
  query: {
    defaultSort: { createdAt: 'desc' },
    defaultPageSize: 20,
  },
};

const crudActions = createCrudActions({resource}Config);

export const get{Resource}ListAction = crudActions.getList;
export const create{Resource}Action = crudActions.create;
export const update{Resource}Action = crudActions.update;
export const delete{Resource}Action = crudActions.delete;
```

**page.js**：
```javascript
'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import * as actions from '@/app/(admin)/actions/{module}/crud-action.{resource}';

export default function {Resource}Page() {
  const fieldsConfig = [
    {
      key: 'id',
      title: 'ID',
      type: 'text',
      table: false,  // 通常不显示 ID
      form: false,   // 自动生成，不需要输入
      search: false,
    },
    // ... 其他字段
  ];

  return (
    <SmartCrudPage
      title='{Resource} Management'
      fieldsConfig={fieldsConfig}
      rowKey='id'  // 重要！
      actions={{
        getList: actions.get{Resource}ListAction,
        create: actions.create{Resource}Action,
        update: actions.update{Resource}Action,
        delete: actions.delete{Resource}Action,
      }}
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
    />
  );
}
```

---

## ⚠️ 常见错误

### 错误 1：忘记配置 primaryKey

**现象：** update/delete 操作报错 "Record not found"

**原因：** BaseDAO 默认使用 `_id`，但数据实际使用 `id`

**修复：**
```javascript
const config = {
  primaryKey: 'id',  // 添加这一行
};
```

### 错误 2：忘记配置 rowKey

**现象：** update/delete 操作传递了错误的 ID

**原因：** SmartCrudPage 默认使用 `_id` 作为行标识

**修复：**
```javascript
<SmartCrudPage
  rowKey='id'  // 添加这一行
/>
```

### 错误 3：数据库中同时有 _id 和 id

**现象：** 查询结果混乱，ID 不一致

**原因：** 使用 UUID 作为主键是最佳实践`

**说明：** 这是正常的！Prisma 会自动处理主键生成。

---

## 🎯 最佳实践

### 1. 创建统一的配置常量

```javascript
// lib/constants/database.js
export const DATABASE_CONFIG = {
  PRIMARY_KEY: 'id',  // 全局主键字段名
  ROW_KEY: 'id',      // 前端表格行标识
};
```

然后在代码中引用：

```javascript
import { DATABASE_CONFIG } from '@/lib/constants/database';

const config = {
  primaryKey: DATABASE_CONFIG.PRIMARY_KEY,
};

<SmartCrudPage rowKey={DATABASE_CONFIG.ROW_KEY} />
```

### 2. 在 SmartCrudPage 中设置默认值

修改 `SmartCrudPage` 的默认 props：

```javascript
// components/admin/smart-crud-page.jsx
export default function SmartCrudPage({
  rowKey = 'id',  // 改为默认使用 'id'
  // ...
}) {
  // ...
}
```

### 3. 在 BaseDAO 中设置默认值

修改 `BaseDAO` 的默认配置：

```javascript
// app/(admin)/actions/dao/base.js
constructor(config) {
  this.config = {
    primaryKey: 'id',  // 改为默认使用 'id'
    softDelete: false,
    ...config,
  };
}
```

---

## 🔄 迁移现有代码

如果需要统一所有表使用 `id`：

### 步骤 1：更新 SmartCrudPage 默认值

```javascript
// components/admin/smart-crud-page.jsx
export default function SmartCrudPage({
  rowKey = 'id',  // 从 '_id' 改为 'id'
  // ...
})
```

### 步骤 2：更新 BaseDAO 默认值

```javascript
// app/(admin)/actions/dao/base.js
constructor(config) {
  this.config = {
    primaryKey: 'id',  // 从 '_id' 改为 'id'
    // ...
  };
}
```

### 步骤 3：确保所有表都有 id 字段

运行迁移脚本（如果需要）：

```javascript
// scripts/migrate-id-field.js
const { getDb } = require('../lib/database/prisma');
const { v4: uuidv4 } = require('uuid');

async function migrateIdField() {
  const db = await getDb();
  const collections = ['permissions', 'roles', 'menus', 'users'];
  
  for (const modelName of collections) {
    const collection = db.collection(modelName);
    const docs = await collection.find({ id: { $exists: false } });
    
    for (const doc of docs) {
      await collection.update(
        { _id: doc._id },
        { $set: { id: uuidv4() } }
      );
    }
    
    console.log(`Migrated ${docs.length} documents in ${modelName}`);
  }
}
```

---

## 📊 决策矩阵

| 场景 | 使用 _id | 使用 id |
|------|---------|---------|
| **PostgreSQL 项目** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **计划迁移到其他数据库** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **需要与外部系统集成** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **快速原型开发** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **长期维护的生产系统** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 当前项目建议

基于你的需求（未来兼容其他数据库），**继续使用 `id` 字段是正确的选择**。

为了降低复杂度，我建议：

1. **立即修改默认值**
   - SmartCrudPage 的 `rowKey` 默认改为 `'id'`
   - BaseDAO 的 `primaryKey` 默认改为 `'id'`

2. **创建配置常量**
   - 统一在一个地方定义主键字段名
   - 所有地方引用这个常量

3. **更新文档和模板**
   - 在 CRUD 标准文档中明确说明
   - 模板中自动包含这些配置

这样就不需要每次都手动配置了！

---

**文档版本：** 1.0  
**最后更新：** 2024-11-13

