# Admin Server Actions 开发规范

> **最后更新**: 2025-11-29  
> **版本**: v3.0.0

本目录包含管理后台的所有 Server Actions，采用统一的开发规范。

## 目录结构

```
app/(admin)/actions/
├── README.md                    # 本文档
├── rbac/                        # 权限管理模块
│   ├── crud-action.permission.js
│   ├── crud-action.role.js
│   ├── crud-action.menu.js
│   └── crud-action.user.js
├── cms/                         # 内容管理模块
│   └── crud-action.post.js
├── system/                      # 系统管理模块
│   ├── admin-action-logs.js
│   └── crud-action.assets.js
└── finance/                     # 财务管理模块
    ├── admin-credits.js
    └── admin-packages.js
```

## 命名规范

### 文件命名

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 标准 CRUD | `crud-action.{resource}.js` | `crud-action.permission.js` |
| 特殊 Actions | `admin-{resource}.js` | `admin-action-logs.js` |

### 函数命名

| 操作 | 命名规则 | 示例 |
|------|---------|------|
| 获取列表 | `get{Entity}ListAction` | `getPermissionListAction` |
| 获取详情 | `get{Entity}DetailAction` | `getPermissionDetailAction` |
| 创建 | `create{Entity}Action` | `createPermissionAction` |
| 更新 | `update{Entity}Action` | `updatePermissionAction` |
| 删除 | `delete{Entity}Action` | `deletePermissionAction` |
| 批量更新 | `batchUpdate{Entity}Action` | `batchUpdatePermissionAction` |
| 批量删除 | `batchDelete{Entity}Action` | `batchDeletePermissionAction` |
| 自定义操作 | `{verb}{Entity}Action` | `approvePermissionAction` |

## 标准模板

### 完整 CRUD Actions

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapQueryAction, wrapAdminAction } from '@/lib/core/action-wrapper';

/**
 * Xxx CRUD 配置
 * 
 * 配置直接写在 Action 文件中，不需要单独的 config 文件
 */
const xxxConfig = {
	// 基础配置
	collectionName: 'xxx',
	primaryKey: 'id',
	softDelete: false,

	// 字段权限
	fields: {
		creatable: ['name', 'status', 'remark'],
		updatable: ['name', 'status', 'remark'],
		searchable: ['name', 'remark'],
	},

	// 查询配置
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		foreignDB: [],  // 连表查询配置
	},

	// 验证规则
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 100,
		},
	},

	// 生命周期钩子
	hooks: {
		beforeCreate: async (data) => data,
		beforeUpdate: async (id, data) => data,
		beforeDelete: async (id) => true,
	},
};

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions(xxxConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getXxxListAction = crudActions.getList;
export const getXxxDetailAction = crudActions.getDetail;
export const createXxxAction = crudActions.create;
export const updateXxxAction = crudActions.update;
export const deleteXxxAction = crudActions.delete;
export const batchUpdateXxxAction = crudActions.batchUpdate;
export const batchDeleteXxxAction = crudActions.batchDelete;

/**
 * 自定义 Action 示例
 */
export const customXxxAction = wrapAdminAction(
	'custom',
	'xxx',
	async (params, context) => {
		const { userId } = context;
		// 业务逻辑
		return { success: true, data: {} };
	}
);
```

### 只读 Actions（日志、记录类）

```javascript
'use server';

import { createReadOnlyActions } from '@/lib/core/crud-helper';

/**
 * Action Logs 配置
 */
const actionLogsConfig = {
	collectionName: 'action_logs',
	primaryKey: 'id',
	fields: {
		searchable: ['action', 'resourceType', 'userId'],
	},
	query: {
		defaultSort: { createdAt: -1 },
		foreignDB: [
			{
				dbName: 'users',
				localKey: 'userId',
				foreignKey: 'id',
				as: 'userInfo',
				limit: 1,
				fieldJson: { id: 1, name: 1, email: 1 },
			},
		],
	},
};

/**
 * 创建只读 Actions
 */
const crudActions = createReadOnlyActions(actionLogsConfig);

export const getActionLogListAction = crudActions.getList;
export const getActionLogDetailAction = crudActions.getDetail;
```

## 核心函数

### createCrudActions(config)

自动生成标准 CRUD Actions：

```javascript
const crudActions = createCrudActions(config);

// 自动生成的 Actions：
crudActions.getList     // 获取列表
crudActions.getDetail   // 获取详情
crudActions.create      // 创建
crudActions.update      // 更新
crudActions.delete      // 删除
crudActions.batchUpdate // 批量更新
crudActions.batchDelete // 批量删除
crudActions._dao        // 底层 DAO 实例
```

### createReadOnlyActions(config)

生成只读 Actions：

```javascript
const crudActions = createReadOnlyActions(config);

// 只生成查询 Actions：
crudActions.getList
crudActions.getDetail
```

### wrapQueryAction(resourceType, handler)

包装查询类 Action：

```javascript
export const getXxxTreeAction = wrapQueryAction('xxx', async (params) => {
	// 自动处理权限验证
	return { success: true, data: [] };
});
```

### wrapAdminAction(action, resourceType, handler, options)

包装管理类 Action：

```javascript
export const approveXxxAction = wrapAdminAction(
	'approve',           // 操作类型
	'xxx',               // 资源类型
	async (params, context) => {
		const { userId, isAdmin } = context;
		// 业务逻辑
		return { success: true };
	},
	{
		permissionId: 'approveXxxAction',  // 权限标识
		skipLog: false,                     // 是否跳过日志
	}
);
```

## 配置详解

### fields（字段权限）

```javascript
fields: {
	// Create 时允许的字段
	// ❌ 不要包含 id（自动生成）
	creatable: ['name', 'status'],

	// Update 时允许的字段
	// ❌ 不要包含 id、createdAt、updatedAt
	updatable: ['name', 'status'],

	// 可搜索的字段
	searchable: ['name'],
}
```

### validation（验证规则）

```javascript
validation: {
	name: {
		required: true,                    // 必填
		type: 'string',                    // 类型
		minLength: 2,                      // 最小长度
		maxLength: 100,                    // 最大长度
		pattern: /^[a-zA-Z0-9]+$/,        // 正则
		enum: ['active', 'inactive'],      // 枚举值
		message: 'Custom error message',   // 错误提示
	},
}
```

### hooks（生命周期钩子）

```javascript
hooks: {
	beforeCreate: async (data) => {
		// 创建前：设置默认值
		return data;
	},
	beforeUpdate: async (id, data) => {
		// 更新前：权限检查
		return data;
	},
	beforeDelete: async (id) => {
		// 删除前：关联检查
		return true; // 返回 true 允许删除
	},
	afterDelete: async (id) => {
		// 删除后：清理关联数据
	},
	afterFind: async (records) => {
		// 查询后：数据转换
		return records;
	},
}
```

### query.foreignDB（连表查询）

```javascript
query: {
	foreignDB: [
		// 一对一关联
		{
			dbName: 'users',
			localKey: 'userId',
			foreignKey: 'id',
			as: 'userInfo',
			limit: 1,
			fieldJson: { id: 1, name: 1, email: 1 },
		},

		// 一对多关联
		{
			dbName: 'roles',
			localKey: 'roles',        // 数组字段
			foreignKey: 'id',
			as: 'roleList',
			fieldJson: { id: 1, name: 1 },
		},
	],
}
```

## 注意事项

### 正确做法

1. **配置写在 Action 文件中**
   ```javascript
   // crud-action.xxx.js
   const xxxConfig = { ... };
   const crudActions = createCrudActions(xxxConfig);
   ```

2. **使用 'use server' 指令**
   ```javascript
   'use server';
   ```

3. **导出具名函数**
   ```javascript
   export const getXxxListAction = crudActions.getList;
   ```

### ❌ 错误做法

1. **不要创建单独的 config 文件**
   ```javascript
   // ❌ 不要这样做
   // configs/xxx-crud.config.js
   export const xxxConfig = { ... };
   ```

2. **不要在 creatable 中包含 id**
   ```javascript
   // ❌ 错误
   fields: {
     creatable: ['id', 'name'],
   }
   ```

3. **不要在 updatable 中包含时间戳**
   ```javascript
   // ❌ 错误
   fields: {
     updatable: ['name', 'createdAt', 'updatedAt'],
   }
   ```

## 相关文档

- [SmartCrudPage 完整指南](/docs/SMART_CRUD_COMPLETE_GUIDE.md)
- [SmartCrudPage 开发指南](/docs/admin/SMART_CRUD_GUIDE.md)
- [BaseDAO 文档](/docs/admin/BASE_DAO.md)
- [crud-helper 源码](/lib/core/crud-helper.js)
- [action-wrapper 源码](/lib/core/action-wrapper.js)

## 许可证

MIT License
