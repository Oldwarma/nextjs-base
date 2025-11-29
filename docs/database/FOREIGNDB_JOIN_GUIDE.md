# ForeignDB 连表查询指南

## 概述

本文档说明如何在项目中正确使用 `foreignDB` 进行连表查询，包括参数格式、配置位置以及常见问题。

## ForeignDB 参数格式

### selects() 函数的 foreignDB 格式

`lib/db-api.js` 中的 `selects()` 函数使用以下参数格式：

```javascript
foreignDB: [
	{
		dbName: 'roles',           // 副表集合名称
		localKey: 'roles',         // 主表字段名（可以是数组）
		foreignKey: 'id',          // 副表字段名
		as: 'roleList',            // 连表结果存放的字段名
		fieldJson: { id: 1, name: 1 }, // 可选：只返回指定字段
		limit: 10,                 // 可选：限制返回数量
		whereJson: {},             // 可选：副表额外查询条件
		sortJson: {},              // 可选：副表排序
	},
]
```

### ⚠️ 常见错误

❌ **错误写法（不会生效）：**

```javascript
foreignDB: [
	{
		from: 'roles',           // ❌ 错误：应该是 dbName
		localField: 'roles',     // ❌ 错误：应该是 localKey
		foreignField: 'id',      // ❌ 错误：应该是 foreignKey
		as: 'roleList',
	},
]
```

这种写法不会报错，但连表不会生效，因为 `selects()` 函数会跳过缺少必填字段的配置：

```javascript
if (!foreignDbName || !localKey || !foreignKey || !as) {
	console.warn('foreignDB item missing required fields:', foreign);
	continue; // 跳过此配置
}
```

## 配置位置选择

### 1. 在 DAO 层直接配置（推荐用于复杂场景）

**适用场景：**
- 需要动态连表
- 连表逻辑复杂
- 需要在多个方法中使用不同的连表配置

**示例：** `app/(admin)/actions/dao/user.js`

```javascript
export async function getUserList({ page = 1, pageSize = 20, filters = {}, sort = { createdAt: -1 } }) {
	// 构建查询条件
	const query = {};
	// ... 省略查询条件构建 ...

	// 直接在 DAO 方法中配置连表
	const results = await selects({
		dbName: 'users',
		whereJson: query,
		pageIndex: page,
		pageSize,
		sortJson: sort,
		getCount: true,
		foreignDB: [
			{
				dbName: 'roles',
				localKey: 'roles',        // users.roles 是数组
				foreignKey: 'id',         // roles.id 是 UUID
				as: 'roleList',
				fieldJson: { id: 1, name: 1, enable: 1 },
			},
		],
	});

	return {
		data: mapUsersFields(results.rows || []),
		total: results.total || 0,
		page,
		pageSize,
	};
}
```

### 2. 在 CRUD Config 中配置（推荐用于通用场景）

**适用场景：**
- 使用 BaseDAO
- 连表配置固定
- 希望配置统一管理

**示例：** `app/(admin)/actions/rbac/configs/user-crud.config.js`

```javascript
export const userCrudConfig = {
	collectionName: 'users',
	primaryKey: '_id',
	
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		
		// 在 config 中配置连表
		foreignDB: [
			{
				dbName: 'roles',
				localKey: 'roles',
				foreignKey: 'id',
				as: 'roleList',
				fieldJson: { id: 1, name: 1, enable: 1 },
			},
		],
	},
	
	// ... 其他配置 ...
};
```

**使用方式（通过 BaseDAO）：**

```javascript
import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { userCrudConfig } from './configs/user-crud.config';

const userDAO = new BaseDAO(userCrudConfig);

// BaseDAO.getList 会自动使用 config 中的 foreignDB
export async function getUserListAction(params) {
	return await userDAO.getList(params);
}
```

## 数组字段连表

`selects()` 函数支持数组字段的连表查询，会自动检测：

```javascript
// 在 users 表中，roles 字段是数组
{
	id: 'user-1',
	name: 'John',
	roles: ['role-1', 'role-2', 'role-3'], // 数组字段
}

// 连表配置
foreignDB: [
	{
		dbName: 'roles',
		localKey: 'roles',     // 数组字段
		foreignKey: 'id',
		as: 'roleList',
	},
]

// 查询结果
{
	id: 'user-1',
	name: 'John',
	roles: ['role-1', 'role-2', 'role-3'],
	roleList: [                           // 连表结果
		{ id: 'role-1', name: 'Admin' },
		{ id: 'role-2', name: 'Editor' },
		{ id: 'role-3', name: 'Viewer' },
	],
}
```

**内部实现原理：**

```javascript
$lookup: {
	from: foreignDbName,
	let: { local_field: `$${localKey}` },
	pipeline: [
		{
			$match: {
				$expr: {
					// 自动检测是否为数组
					$cond: {
						if: { $isArray: '$$local_field' },
						then: { $in: [`$${foreignKey}`, '$$local_field'] },  // 数组使用 $in
						else: { $eq: [`$${foreignKey}`, '$$local_field'] },  // 非数组使用 $eq
					},
				},
			},
		},
		...lookupPipeline,
	],
	as,
}
```

## 前端展示连表数据

在 Smart CRUD Page 中展示连表数据：

```javascript
const fieldsConfig = [
	{
		key: 'roles',
		title: 'RBAC Roles',
		type: 'text',
		table: false,  // 在表格中不显示原始字段
		form: false,
		detail: {
			render: (value, record) => {
				// 优先使用连表数据 roleList
				const roles = record.roleList || value || [];
				
				if (!Array.isArray(roles) || roles.length === 0) {
					return <span style={{ color: '#999' }}>No roles assigned</span>;
				}
				
				return (
					<Space wrap>
						{roles.map((item, index) => {
							// 如果是对象（连表数据），取 name；否则显示原值（UUID）
							const displayText = item?.name || item;
							const key = item?.id || item;
							return (
								<Tag key={key || index} color='blue'>
									{displayText}
								</Tag>
							);
						})}
					</Space>
				);
			},
		},
	},
];
```

## 配置重复问题说明

### 为什么会出现重复配置？

在用户管理中，我们发现了两处 `foreignDB` 配置：

1. **`app/(admin)/actions/dao/user.js` (getUserList 方法)** - 实际使用
2. **`app/(admin)/actions/rbac/configs/user-crud.config.js`** - 未被使用

### 原因分析

- `user.js` 是**自定义 DAO**，直接调用 `selects()` 函数
- 页面调用链：`page.js` → `admin-users.js` → `user.js` (getUserList)
- **没有经过 BaseDAO**，所以 config 中的 foreignDB 没有被读取

### 解决方案

**方案 1：保持现状（推荐）**

- DAO 层直接配置（灵活性高）
- Config 作为文档和备用（便于理解）

**方案 2：统一使用 BaseDAO**

将 UserDAO 改为继承 BaseDAO，统一使用 config：

```javascript
import { BaseDAO } from '@/app/(admin)/actions/dao/base';
import { userCrudConfig } from '../rbac/configs/user-crud.config';

// 继承 BaseDAO
class UserDAO extends BaseDAO {
	constructor() {
		super(userCrudConfig);
	}
	
	// 保留特殊方法
	async createUser(userData) {
		// ... 自定义逻辑 ...
	}
	
	// 其他方法可以直接使用 BaseDAO 的实现
	// 如 getList, update, delete 等
}

export const userDao = new UserDAO();

// 导出标准方法
export const getUserList = userDao.getList.bind(userDao);
export const createUser = userDao.createUser.bind(userDao);
// ...
```

**方案 3：移除 Config 中的 foreignDB**

如果确定只使用自定义 DAO，可以移除 config 中的 foreignDB，避免混淆。

## 调试技巧

### 1. 检查 foreignDB 配置是否生效

在 `lib/db-api.js` 的 `selects()` 函数中添加日志：

```javascript
// 2. Lookup stages - 连表查询
if (Array.isArray(foreignDB) && foreignDB.length > 0) {
	console.log('[selects] foreignDB config:', JSON.stringify(foreignDB, null, 2));
	
	for (const foreign of foreignDB) {
		const { dbName: foreignDbName, localKey, foreignKey, as } = foreign;
		
		if (!foreignDbName || !localKey || !foreignKey || !as) {
			console.warn('[selects] ⚠️ foreignDB item missing required fields:', foreign);
			continue;
		}
		
		console.log('[selects] Processing lookup:', { foreignDbName, localKey, foreignKey, as });
		// ...
	}
}
```

### 2. 检查查询结果

```javascript
const results = await selects({
	dbName: 'users',
	whereJson: query,
	foreignDB: [...],
});

console.log('[getUserList] Sample result:', JSON.stringify(results.rows[0], null, 2));
console.log('[getUserList] Has roleList?', !!results.rows[0]?.roleList);
```

### 3. 检查前端数据

在页面组件中：

```javascript
const request = async (params, sort, filter) => {
	const result = await actions.getList(requestParams);
	
	console.log('[SmartCrudPage] Sample data:', result.data[0]);
	console.log('[SmartCrudPage] Has roleList?', !!result.data[0]?.roleList);
	
	return { data: result.data, success: true, total: result.total };
};
```

## 常见问题

### Q1: 为什么连表数据没有显示？

**检查清单：**

1. foreignDB 参数格式是否正确（`dbName`, `localKey`, `foreignKey`, `as`）
2. 副表集合名称是否正确
3. 字段名是否匹配
4. 前端 render 函数是否使用了正确的字段名（`record.roleList`）
5. 数据是否真的存在（检查数据库）

### Q2: 数组字段连表返回空数组？

**可能原因：**

1. 主表的数组字段为空
2. 副表中没有匹配的记录
3. 字段类型不匹配（如 UUID vs ObjectId）

### Q3: 性能问题？

**优化建议：**

1. 使用 `fieldJson` 只返回需要的字段
2. 使用 `limit` 限制连表数量
3. 为连表字段添加索引
4. 考虑数据冗余，避免频繁连表

## 总结

- **参数格式：** 使用 `dbName`, `localKey`, `foreignKey`, `as`
- **配置位置：** DAO 层（灵活）或 Config（统一）
- **数组支持：** 自动检测并处理数组字段
- **调试方法：** 添加日志，检查每一步的数据流
- **避免重复：** 明确配置位置，统一管理

## 参考

- `lib/db-api.js` - selects() 函数实现
- `app/(admin)/actions/dao/base.js` - BaseDAO.getList() 实现
- `app/(admin)/actions/dao/user.js` - UserDAO 示例
- `docs/database/DB_API_GUIDE.md` - 数据库 API 完整文档

