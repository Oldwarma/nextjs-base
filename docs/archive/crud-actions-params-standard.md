# CRUD Actions 参数格式规范

## 概述

本文档定义了所有 CRUD Server Actions 的统一参数格式，确保 SmartCrudPage 和其他调用方都使用一致的接口。

## 统一参数格式

### 查询列表 (getList)

```javascript
{
	pageIndex: number,      // 页码，从 1 开始
	pageSize: number,       // 每页数量
	whereJson: object,      // 查询条件（MongoDB 格式）
	sortJson: object        // 排序条件（MongoDB 格式）
}
```

**示例**：
```javascript
{
	pageIndex: 1,
	pageSize: 20,
	whereJson: {
		name: 'John',
		email: { $regex: 'example.com', $options: 'i' },
		banned: false
	},
	sortJson: {
		createdAt: -1,
		name: 1
	}
}
```

### 创建 (create)

```javascript
{
	// 实体的所有字段
	name: string,
	email: string,
	// ...
}
```

### 更新 (update)

```javascript
// 第一个参数：ID
id: string

// 第二个参数：更新的数据
{
	name: string,
	email: string,
	// ...
}
```

### 删除 (delete)

```javascript
// 单个 ID 字符串
id: string
```

### 批量更新 (batchUpdate)

```javascript
// 第一个参数：ID 数组
ids: string[]

// 第二个参数：更新的数据
{
	enable: boolean,
	// ...
}
```

### 批量删除 (batchDelete)

```javascript
// ID 数组
ids: string[]
```

## whereJson 详细说明

### 基本查询

```javascript
{
	// 精确匹配
	name: 'John',
	age: 25,
	
	// 模糊搜索（需要在 fieldsConfig 中配置 search.mode: 'like'）
	email: 'john',  // 会自动转换为正则表达式
	
	// 布尔值
	enable: true,
	banned: false
}
```

### MongoDB 操作符

```javascript
{
	// 大于/小于
	age: { $gte: 18, $lte: 60 },
	
	// 正则表达式
	email: { $regex: '@example.com', $options: 'i' },
	
	// 数组包含
	roles: { $in: ['admin', 'editor'] },
	
	// 逻辑操作
	$or: [
		{ name: 'John' },
		{ email: 'john@example.com' }
	]
}
```

## sortJson 详细说明

```javascript
{
	// 1 = 升序 (ASC)
	// -1 = 降序 (DESC)
	createdAt: -1,   // 按创建时间降序
	name: 1,         // 按名称升序
	priority: -1     // 按优先级降序
}
```

**默认排序**：
```javascript
{
	createdAt: -1  // 默认按创建时间降序
}
```

## SmartCrudPage 搜索转换

### fieldsConfig 搜索配置

```javascript
const fieldsConfig = [
	{
		key: 'name',
		title: 'Name',
		type: 'text',
		search: {
			enabled: true,
			mode: 'like',  // 模糊搜索
		}
	},
	{
		key: 'email',
		title: 'Email',
		type: 'email',
		search: {
			enabled: true,
			mode: 'like',
		}
	},
	{
		key: 'enable',
		title: 'Status',
		type: 'switch',
		search: {
			enabled: true,
			mode: 'exact',  // 精确匹配
		}
	}
];
```

### 搜索模式 (search.mode)

| 模式 | 说明 | whereJson 输出 |
|------|------|----------------|
| `exact` 或 `==` | 精确匹配 | `{ field: value }` |
| `like` 或 `%%` | 模糊搜索 | `{ field: value }` （由 DAO 层转换为正则） |
| `range` 或 `[]` | 范围搜索 | `{ field_start: v1, field_end: v2 }` |
| `gt` 或 `>` | 大于 | `{ field_gt: value }` |
| `gte` 或 `>=` | 大于等于 | `{ field_gte: value }` |
| `lt` 或 `<` | 小于 | `{ field_lt: value }` |
| `lte` 或 `<=` | 小于等于 | `{ field_lte: value }` |
| `in` | 数组包含查询 | `{ field_in: [v1, v2] }` → `{ field: { $in: [...] } }` |

### 转换示例

**用户输入**：
```javascript
{
	name: 'John',
	email: 'example',
	enable: true
}
```

**转换后的 whereJson**：
```javascript
{
	name: 'John',      // like 模式，DAO 层会转换为正则
	email: 'example',  // like 模式，DAO 层会转换为正则
	enable: true       // exact 模式，直接匹配
}
```

## DAO 层处理

### UserDAO.getUserList 参数

```javascript
{
	page: number,        // 页码
	pageSize: number,    // 每页数量
	filters: object,     // 查询条件（对应 whereJson）
	sort: object         // 排序条件（对应 sortJson）
}
```

**注意**：DAO 层接收的参数名称可能不同（`filters` vs `whereJson`），但语义相同。

### 模糊搜索转换

DAO 层负责将 `filters` 中的字符串转换为正则表达式：

```javascript
// whereJson 输入
{
	name: 'John',
	email: 'example'
}

// DAO 层转换为 MongoDB 查询
{
	name: { $regex: 'John', $options: 'i' },
	email: { $regex: 'example', $options: 'i' }
}
```

## Action Logger 日志格式

使用 `wrapQueryAction` 包装的查询操作会自动打印统一格式的日志：

```
--------【开始】【Server Action】【user】【query_user】--------
15:01:37.336 【请求参数】: {
  pageIndex: 1,
  pageSize: 20,
  whereJson: { name: 'John', banned: false },
  sortJson: { createdAt: -1 }
}
15:01:37.336 【返回数据】: {
  success: true,
  data: '[Array(20)]',
  total: 100
}
15:01:37.336 【总体耗时】: 150 毫秒
15:01:37.336 【请求时间】: 2025-11-06 15:01:37
--------【结束】【Server Action】【user】【query_user】--------
```

## 兼容性说明

### 向后兼容

为了兼容旧代码，Actions 支持多种参数格式：

```javascript
// ✅ 新格式（推荐）
{
	pageIndex: 1,
	pageSize: 20,
	whereJson: { name: 'John' },
	sortJson: { createdAt: -1 }
}

// ✅ 旧格式 1
{
	page: 1,
	pageSize: 20,
	filters: { name: 'John' },
	sort: { createdAt: -1 }
}

// ✅ 旧格式 2（SmartCrudPage 早期版本）
{
	pageIndex: 1,
	pageSize: 20,
	name: 'John',  // 搜索字段直接放在顶层
	sortJson: { createdAt: -1 }
}
```

### 迁移指南

**旧代码**：
```javascript
const result = await getUserListAction({
	page: 1,
	pageSize: 20,
	filters: { name: 'John' },
	sort: { createdAt: -1 }
});
```

**新代码**：
```javascript
const result = await getUserListAction({
	pageIndex: 1,
	pageSize: 20,
	whereJson: { name: 'John' },
	sortJson: { createdAt: -1 }
});
```

## 最佳实践

### 1. 使用统一的参数名称

- ✅ `pageIndex`（不是 `page`）
- ✅ `whereJson`（不是 `filters` 或 `conditions`）
- ✅ `sortJson`（不是 `sort` 或 `orderBy`）

### 2. 分离查询条件和分页参数

❌ **不推荐**：
```javascript
{
	pageIndex: 1,
	pageSize: 20,
	name: 'John',        // 混在一起
	email: 'example',
	sortJson: { createdAt: -1 }
}
```

✅ **推荐**：
```javascript
{
	pageIndex: 1,
	pageSize: 20,
	whereJson: {          // 清晰分离
		name: 'John',
		email: 'example'
	},
	sortJson: { createdAt: -1 }
}
```

### 3. 使用 wrapQueryAction 包装查询操作

```javascript
export const getUserListAction = wrapQueryAction('user', async (params) => {
	const { pageIndex, pageSize, whereJson, sortJson } = params;
	
	const result = await userDao.getUserList({
		page: pageIndex,
		pageSize,
		filters: whereJson,
		sort: sortJson,
	});
	
	return {
		success: true,
		data: result.data,
		total: result.total,
	};
});
```

### 4. 在 fieldsConfig 中明确搜索模式

```javascript
{
	key: 'name',
	search: {
		enabled: true,
		mode: 'like',  // 明确指定模式
	}
}
```

## 错误处理

### 缺少必需参数

```javascript
if (!params.pageIndex || !params.pageSize) {
	return {
		success: false,
		error: 'pageIndex and pageSize are required'
	};
}
```

### 无效的查询条件

```javascript
if (whereJson && typeof whereJson !== 'object') {
	return {
		success: false,
		error: 'whereJson must be an object'
	};
}
```

## 参考资料

- [MongoDB Query Operators](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [MongoDB Sort](https://www.mongodb.com/docs/manual/reference/method/cursor.sort/)
- [SmartCrudPage 文档](./smart-crud-page.md)
- [Action Wrapper 文档](../app/(admin)/actions/README.md)

