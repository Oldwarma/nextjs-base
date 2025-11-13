# CRUD Config 统一标准

**版本：** 1.0  
**日期：** 2024-11-13

---

## 📖 标准规范

### ✅ 统一原则

**所有 CRUD 配置统一使用 1 个文件：**
```
crud-config.{resource}.js
```

**不再使用分离配置！** ❌ `{resource}-fields-config.js`

---

## 📁 文件结构

每个 CRUD 资源需要 2 个文件：

```
app/(admin)/actions/{module}/
├── configs/
│   └── crud-config.{resource}.js  ← 配置文件（1 个）
└── crud-action.{resource}.js      ← Action 文件
```

**示例：**
```
app/(admin)/actions/rbac/
├── configs/
│   ├── crud-config.permission.js  ✅
│   ├── crud-config.role.js        ✅
│   └── crud-config.user.js        ✅
├── crud-action.permission.js
├── crud-action.role.js
└── crud-action.user.js
```

---

## 🎯 标准模板

### 完整模板（带注释）

```javascript
/**
 * {Resource} CRUD Config
 * 
 * 使用方法：
 * 1. 复制此文件到你的 configs 目录
 * 2. 替换所有 {resource} 为你的资源名
 * 3. 配置 fieldsConfig（字段定义）
 * 4. 根据需要配置 validation、hooks、transforms
 */

/**
 * {Resource} CRUD 配置
 */
export const {resource}CrudConfig = {
	/**
	 * 数据库集合名称
	 */
	collectionName: '{resource}',

	/**
	 * 主键字段名称
	 * MongoDB 默认使用 '_id'，如使用自定义主键需修改
	 */
	primaryKey: '_id', // 或 'id'

	/**
	 * 软删除配置（可选）
	 */
	softDelete: false,

	/**
	 * 字段配置（核心配置）
	 * 
	 * 每个字段支持的属性：
	 * - key: 字段唯一标识（必需）
	 * - type: 字段类型（text/number/select/switch/date/textarea等）
	 * - title: 显示标签
	 * - required: 是否必填
	 * - table: 表格显示配置
	 *   - width: 列宽
	 *   - sorter: 是否可排序
	 *   - ellipsis: 是否省略
	 *   - valueEnum: 值枚举（Ant Design Pro 风格）
	 *   - formatter: 纯 JS 格式化函数
	 *   - render: 自定义 JSX 渲染（不推荐，优先用 formatter）
	 * - form: 表单显示配置
	 *   - placeholder: 占位符
	 *   - fieldProps: 字段属性
	 *   - action: 自动数据加载（如 'getRoleListAction'）
	 *   - initialValue: 初始值
	 * - search: 搜索配置或 false
	 *   - mode: 搜索模式（'like', 'exact', '[]' 等）
	 *   - placeholder: 占位符
	 * - detail: 详情显示配置
	 *   - valueEnum: 值枚举
	 *   - formatter: 格式化函数
	 */
	fieldsConfig: [
		// 示例 1：文本字段
		{
			key: 'name',
			type: 'text',
			title: 'Name',
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

		// 示例 2：下拉选择（使用 valueEnum）
		{
			key: 'status',
			type: 'select',
			title: 'Status',
			table: {
				width: 120,
				// ✅ 使用 valueEnum（Ant Design Pro 风格）
				valueEnum: {
					0: { text: 'Inactive', status: 'Default' },
					1: { text: 'Active', status: 'Success' },
					2: { text: 'Suspended', status: 'Error' },
				},
			},
			form: {
				required: true,
				options: [
					{ label: 'Inactive', value: 0 },
					{ label: 'Active', value: 1 },
					{ label: 'Suspended', value: 2 },
				],
				initialValue: 1,
			},
			search: {
				type: 'select',
				options: [
					{ label: 'Inactive', value: 0 },
					{ label: 'Active', value: 1 },
				],
			},
		},

		// 示例 3：开关（使用 vk 风格）
		{
			key: 'enable',
			type: 'switch',
			title: 'Enable',
			table: {
				width: 100,
				// ✅ 使用 vk-unicloud 风格的声明式配置
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
			search: false,
		},

		// 示例 4：数组字段（使用 formatter）
		{
			key: 'tags',
			type: 'array',
			title: 'Tags',
			table: {
				width: 200,
				ellipsis: true,
				// ✅ 使用纯 JS formatter 函数
				formatter: (value) => {
					if (!value) return '-';
					if (!Array.isArray(value)) return String(value);
					if (value.length === 0) return '-';
					
					const maxDisplay = 2;
					const displayed = value.slice(0, maxDisplay);
					const remaining = value.length - maxDisplay;
					
					let result = displayed.join(', ');
					if (remaining > 0) {
						result += ` (+${remaining} more)`;
					}
					return result;
				},
			},
			form: {
				type: 'list',
				fieldProps: {
					copyIconProps: false,
					deleteIconProps: { tooltipText: 'Delete' },
					creatorButtonProps: { creatorButtonText: 'Add Tag' },
				},
			},
			search: false,
		},

		// 示例 5：数字字段
		{
			key: 'sort',
			type: 'number',
			title: 'Sort',
			table: {
				width: 80,
				sorter: true,
			},
			form: {
				required: false,
				initialValue: 0,
				fieldProps: {
					min: 0,
				},
			},
			search: false,
		},

		// 示例 6：多行文本
		{
			key: 'remark',
			type: 'textarea',
			title: 'Remark',
			table: {
				width: 200,
				ellipsis: true,
			},
			form: {
				required: false,
				fieldProps: {
					showCount: true,
					maxLength: 200,
					autoSize: { minRows: 2, maxRows: 5 },
				},
			},
			search: {
				placeholder: 'Search by remark',
			},
		},

		// 示例 7：日期时间字段
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			table: {
				width: 180,
				sorter: true,
			},
			form: false, // 自动生成，不在表单显示
			search: false,
		},
	],

	/**
	 * BaseDAO 字段配置（可选）
	 * 定义哪些字段可以创建、更新、搜索
	 */
	fields: {
		creatable: ['name', 'status', 'enable', 'sort', 'remark'],
		updatable: ['name', 'status', 'enable', 'sort', 'remark'],
		searchable: ['name', 'remark'],
	},

	/**
	 * 查询配置（可选）
	 */
	query: {
		defaultSort: { sort: 1, name: 1 },
		defaultPageSize: 20,
		populateFields: [], // 连表字段
	},

	/**
	 * 字段验证规则（可选，服务端专用）
	 * 在 BaseDAO 的 create/update 操作前执行
	 * 
	 * ⚠️ 如果包含 MongoDB 逻辑，必须使用 dynamic import
	 */
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 1,
			maxLength: 100,
			message: 'Name must be 1-100 characters',
		},
		// 复杂验证示例（需要 MongoDB）
		email: {
			required: true,
			type: 'string',
			custom: async (value, context) => {
				// ✅ 使用 dynamic import 避免构建错误
				const { getDb } = await import('@/lib/database/mongodb');
				const db = await getDb();
				
				const existing = await db.collection('users').findOne({ 
					email: value,
					_id: { $ne: context.id }
				});
				
				if (existing) {
					throw new Error('Email already exists');
				}
				
				return true;
			},
		},
	},

	/**
	 * 生命周期钩子（可选，服务端专用）
	 * 在 BaseDAO 操作的各个阶段执行
	 * 
	 * ⚠️ 必须使用 dynamic import
	 */
	hooks: {
		beforeCreate: async (data, context) => {
			// ✅ 使用 dynamic import
			const { getDb } = await import('@/lib/database/mongodb');
			const db = await getDb();
			
			// 自定义逻辑
			// ...
			
			return data;
		},

		beforeUpdate: async (id, data, context) => {
			const { getDb } = await import('@/lib/database/mongodb');
			const db = await getDb();
			
			// 自定义逻辑
			// ...
			
			return data;
		},

		beforeDelete: async (id, context) => {
			const { getDb } = await import('@/lib/database/mongodb');
			const db = await getDb();
			
			// 检查是否可以删除
			// ...
			
			return true;
		},

		afterFind: async (records, context) => {
			// 自动连表查询
			const { getDb } = await import('@/lib/database/mongodb');
			const db = await getDb();
			
			// 关联查询
			// ...
			
			return records;
		},
	},

	/**
	 * 数据转换（可选，服务端专用）
	 * output: 从数据库读取后的转换
	 * input: 写入数据库前的转换
	 */
	transforms: {
		output: (data) => {
			if (!data) return data;
			
			// 数据格式转换
			if (typeof data.sort !== 'number') {
				data.sort = parseInt(data.sort) || 0;
			}
			
			return data;
		},

		input: (data) => {
			if (!data) return data;
			
			// 数据清理
			if (data.remark === '') {
				data.remark = null;
			}
			
			return data;
		},
	},
};
```

---

## 📝 使用说明

### 1. 客户端导入（page.js）

```javascript
'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import { permissionCrudConfig } from '@/app/(admin)/actions/rbac/configs/crud-config.permission';
import * as actions from '@/app/(admin)/actions/rbac/crud-action.permission';

export default function PermissionsPage() {
  return (
    <SmartCrudPage
      title='Permission Management'
      fieldsConfig={permissionCrudConfig.fieldsConfig} // ✅ 只导入 fieldsConfig
      actions={{
        getList: actions.getPermissionTreeAction,
        create: actions.createPermissionAction,
        update: actions.updatePermissionAction,
        delete: actions.deletePermissionAction,
      }}
      enableCreate={true}
      enableEdit={true}
      enableDelete={true}
    />
  );
}
```

### 2. 服务端使用（crud-action.js）

```javascript
'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { permissionCrudConfig } from './configs/crud-config.permission';

// ✅ createCrudActions 会使用完整的 config（包括 validation、hooks）
const crudActions = createCrudActions(permissionCrudConfig);

export const getPermissionListAction = crudActions.getList;
export const createPermissionAction = crudActions.create;
export const updatePermissionAction = crudActions.update;
export const deletePermissionAction = crudActions.delete;
```

---

## 🔒 安全性保证

### ✅ 为什么客户端导入是安全的？

1. **只导入 fieldsConfig 属性**
   ```javascript
   fieldsConfig={permissionCrudConfig.fieldsConfig}
   ```

2. **函数只有调用时才执行**
   - `validation` 和 `hooks` 中的函数不会在 import 时执行
   - 只有 BaseDAO 在服务端调用时才会执行

3. **使用 dynamic import**
   ```javascript
   const { getDb } = await import('@/lib/database/mongodb');
   ```
   - MongoDB 模块只在服务端运行时加载
   - 不会被打包到客户端

### ⚠️ 注意事项

**不要在 fieldsConfig 中直接使用 MongoDB：**

❌ **错误示例：**
```javascript
fieldsConfig: [
  {
    key: 'name',
    form: {
      render: () => {
        const { getDb } = require('@/lib/database/mongodb'); // ❌ 会导致构建错误
        // ...
      }
    }
  }
]
```

✅ **正确示例：**
```javascript
fieldsConfig: [
  {
    key: 'name',
    form: {
      placeholder: 'Enter name',  // ✅ 只使用静态配置
      action: 'getOptionsAction',  // ✅ 通过 action 字符串加载数据
    }
  }
]
```

---

## 📚 完整示例

### 参考文件

1. **简单配置：** `app/(admin)/actions/cms/configs/crud-config.post.js`
   - 基础 CRUD
   - 无复杂验证

2. **复杂配置：** `app/(admin)/actions/rbac/configs/crud-config.permission.js`
   - 包含 validation
   - 包含 hooks
   - 包含 transforms
   - 使用 dynamic import

3. **模板：** `templates/crud/crud-config.template.js`
   - 快速开始模板

---

## ✨ 新特性

### vk-unicloud 风格的声明式配置

**1. Switch 字段**
```javascript
{
  key: 'enable',
  type: 'switch',
  table: {
    activeText: 'Enabled',     // ✅ vk 风格
    inactiveText: 'Disabled',
    activeColor: 'success',
    inactiveColor: 'error',
    activeIcon: 'CheckCircleOutlined',
    inactiveIcon: 'CloseCircleOutlined',
  },
}
```

**2. Select 字段（valueEnum）**
```javascript
{
  key: 'status',
  type: 'select',
  table: {
    valueEnum: {  // ✅ Ant Design Pro 风格
      0: { text: 'Inactive', status: 'Default' },
      1: { text: 'Active', status: 'Success' },
    },
  },
}
```

**3. formatter 函数**
```javascript
{
  key: 'tags',
  type: 'array',
  table: {
    formatter: (value) => {  // ✅ 纯 JS，非 JSX
      if (!Array.isArray(value)) return '-';
      return value.slice(0, 2).join(', ') + '...';
    },
  },
}
```

**4. action 自动加载**
```javascript
{
  key: 'parent_id',
  type: 'tree-select',
  form: {
    action: 'getPermissionTreeForSelectAction', // ✅ 自动调用
  },
}
```

**5. 树形数据自动识别**
- SmartCrudPage 自动检测 `children` 字段
- 自动启用树形表格
- 自动禁用分页

---

## 🎯 最佳实践

### 1. 文件命名

```
crud-config.{resource}.js  ✅
crud-action.{resource}.js  ✅
```

### 2. 配置顺序

```javascript
export const {resource}CrudConfig = {
  // 1. 基础配置
  collectionName,
  primaryKey,
  softDelete,
  
  // 2. 字段配置（核心）
  fieldsConfig: [...],
  
  // 3. BaseDAO 配置（可选）
  fields: { ... },
  query: { ... },
  
  // 4. 高级配置（可选）
  validation: { ... },
  hooks: { ... },
  transforms: { ... },
};
```

### 3. 注释规范

- 文件头注释说明使用方法
- 每个配置块添加注释
- 复杂逻辑添加说明

### 4. Dynamic Import

```javascript
// ✅ 在 validation 和 hooks 中使用
const { getDb } = await import('@/lib/database/mongodb');
```

---

**统一标准版本：** 1.0  
**最后更新：** 2024-11-13  
**统一原则：** 1 个文件配置，简单明确，易于维护！

