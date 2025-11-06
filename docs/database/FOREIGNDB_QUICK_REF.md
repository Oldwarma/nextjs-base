# ForeignDB 快速参考

## 正确的参数格式 ✅

```javascript
foreignDB: [
	{
		dbName: 'roles',           // ✅ 副表集合名称
		localKey: 'roles',         // ✅ 主表字段名
		foreignKey: 'id',          // ✅ 副表字段名
		as: 'roleList',            // ✅ 结果字段名
		fieldJson: { id: 1, name: 1 }, // 可选：字段过滤
		limit: 10,                 // 可选：数量限制
	},
]
```

## 常见错误 ❌

```javascript
foreignDB: [
	{
		from: 'roles',             // ❌ 应该是 dbName
		localField: 'roles',       // ❌ 应该是 localKey
		foreignField: 'id',        // ❌ 应该是 foreignKey
		as: 'roleList',
	},
]
```

## 数组字段连表

```javascript
// 主表数据
{
	roles: ['role-1', 'role-2']  // 数组字段
}

// 连表配置
foreignDB: [{
	dbName: 'roles',
	localKey: 'roles',  // 数组字段
	foreignKey: 'id',
	as: 'roleList'
}]

// 结果
{
	roles: ['role-1', 'role-2'],
	roleList: [  // 自动展开
		{ id: 'role-1', name: 'Admin' },
		{ id: 'role-2', name: 'Editor' }
	]
}
```

## 配置位置选择

### DAO 层直接配置（灵活）

```javascript
const results = await selects({
	dbName: 'users',
	foreignDB: [{ ... }],
});
```

### Config 配置（统一）

```javascript
export const config = {
	query: {
		foreignDB: [{ ... }],
	},
};

// 通过 BaseDAO 使用
const dao = new BaseDAO(config);
```

## 前端展示

```jsx
{
	key: 'roles',
	detail: {
		render: (value, record) => {
			const roles = record.roleList || []; // 使用连表数据
			return roles.map(role => (
				<Tag key={role.id}>{role.name}</Tag>
			));
		}
	}
}
```

## 性能优化

```javascript
foreignDB: [{
	dbName: 'roles',
	localKey: 'roles',
	foreignKey: 'id',
	as: 'roleList',
	fieldJson: { id: 1, name: 1 },  // ✅ 只返回需要的字段
	limit: 5,                       // ✅ 限制数量
}]
```

## 调试检查

```javascript
// 1. 检查参数格式
console.log('foreignDB:', foreignDB);

// 2. 检查查询结果
console.log('Result:', results.rows[0]);
console.log('Has roleList?', !!results.rows[0]?.roleList);

// 3. 检查数据库索引
// db.roles.createIndex({ id: 1 });
// db.users.createIndex({ roles: 1 });
```

## 完整示例

```javascript
export async function getUserList({ page = 1, pageSize = 20, filters = {} }) {
	const query = {};
	
	// 构建查询条件
	if (filters.email) {
		query.email = { $regex: filters.email, $options: 'i' };
	}
	
	// 查询并连表
	const results = await selects({
		dbName: 'users',
		whereJson: query,
		pageIndex: page,
		pageSize,
		sortJson: { createdAt: -1 },
		getCount: true,
		foreignDB: [
			{
				dbName: 'roles',
				localKey: 'roles',
				foreignKey: 'id',
				as: 'roleList',
				fieldJson: { id: 1, name: 1, enable: 1 },
			},
		],
	});
	
	return {
		data: results.rows,
		total: results.total,
	};
}
```

## 详细文档

- [完整使用指南](./FOREIGNDB_JOIN_GUIDE.md)
- [修复总结](./FOREIGNDB_FIX_SUMMARY.md)
- [数据库 API 文档](./DB_API_GUIDE.md)

