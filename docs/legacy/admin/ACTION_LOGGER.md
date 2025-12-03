# Server Actions 日志系统

## 📖 概述

本项目在 BaseDAO 层实现了自动化的 Server Actions 日志系统，所有使用 BaseDAO 的 CRUD 操作都会自动记录详细的请求和响应日志，方便开发调试。

---

## 🎯 工作原理

### 日志在 DAO 层自动添加

```
用户操作
  ↓
Page Component
  ↓
import from index.js (简单 re-export)
  ↓
admin-users.js (调用 userCrud.getList())
  ↓
base.js → createCrudActions() 🔵 在这里自动添加日志
  ↓
BaseDAO.getList()
  ↓
PostgreSQL
```

**优点**:
- 不会重复导入 Server Actions
- 所有使用 BaseDAO 的 actions 自动有日志
- 零配置，自动生效

---

## 📋 已自动启用日志的 Actions

### 通过 BaseDAO（自动）

所有使用 `createCrudActions()` 创建的 CRUD 操作都会自动记录日志：

- **Users** (`admin/users`): getList, getDetail, update, delete, batchUpdate, batchDelete
- **Packages** (`admin/packages`): getList, create, update, delete
- **Credit Transactions** (`admin/credits`): getList, getDetail
- **Usage Logs** (`admin/usage`): getList, getDetail, update, delete + 自定义统计方法
- **Menus** (`admin/menus`): getList, create, update, delete（手动添加日志）

### BaseDAO 聚合统计方法

BaseDAO 现在支持以下聚合统计方法，所有方法都会自动进行权限检查：

- `count(whereJson)` - 统计记录数量
- `sum(fieldName, whereJson)` - 字段求和
- `max(fieldName, whereJson)` - 获取最大值
- `min(fieldName, whereJson)` - 获取最小值
- `avg(fieldName, whereJson)` - 计算平均值
- `sample(size, whereJson)` - 随机获取 N 条记录
- `aggregate(pipeline)` - 自定义聚合查询
- `getAll(whereJson, sortJson)` - 获取所有记录（不分页）

---

## 🚀 快速测试

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 访问管理页面
```
http://localhost:3000/admin/users
```

### 3. 在终端查看日志

**预期输出**（在运行 `npm run dev` 的终端中）：

```bash
--------【开始】【Server Action】【admin/users】【getList】--------
21:05:53.400 【请求参数】: { pageIndex: 1, pageSize: 20 }
21:05:53.520 【返回数据】: { success: true, data: [...], total: 150 }
21:05:53.520 【总体耗时】: 120 毫秒  ← 绿色
21:05:53.520 【请求时间】: 2025-11-03 21:05:53
--------【结束】【Server Action】【admin/users】【getList】--------
```

---

## 📝 为新 Action 添加日志

### 方法 1: 使用 BaseDAO（推荐，零配置）

如果你的 action 执行 CRUD 操作，使用 BaseDAO 即可自动获得日志：

```javascript
// 1. 创建配置文件 (configs/post-crud.config.js)
export const postCrudConfig = {
	modelName: 'posts',
	primaryKey: '_id',
	logCategory: 'admin/posts',  // ← 添加这个字段
	fields: {
		creatable: ['title', 'content'],
		updatable: ['title', 'content'],
		searchable: ['title'],
	},
	// ... 其他配置
};

// 2. 创建 actions 文件 (actions/admin-posts.js)
import { createCrudActions } from '@/app/(admin)/actions/dao/base';
import { postCrudConfig } from './configs/post-crud.config';

const postCrud = createCrudActions(postCrudConfig);

export async function getPostListAction(params) {
	return await postCrud.getList(params);  // ← 自动记录日志！
}

export async function createPostAction(data) {
	return await postCrud.create(data);  // ← 自动记录日志！
}
```

### 方法 2: 手动添加日志（不使用 BaseDAO）

对于不使用 BaseDAO 的自定义 action：

```javascript
import { logAction } from '@/lib/logging/action-logger';

export async function myCustomAction(params) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// 业务逻辑
		const data = await someCustomOperation(params);
		const result = { success: true, data };
		
		// 记录日志
		logAction(
			'myCustom',           // action 名称
			'admin/custom',       // 分类
			startTime,
			requestTime,
			params,               // 请求参数
			result,               // 返回结果
			false                 // 是否错误
		);
		
		return result;
	} catch (error) {
		const errorResult = { success: false, error: error.message };
		logAction('myCustom', 'admin/custom', startTime, requestTime, params, errorResult, true);
		return errorResult;
	}
}
```

### 方法 3: 使用装饰器（最简洁）

```javascript
import { withActionLog } from '@/lib/action-logger';

export const myCustomAction = withActionLog(
	'myCustom',       // action 名称
	'admin/custom',   // 分类
	async (params) => {
		// 业务逻辑
		const data = await someCustomOperation(params);
		return { success: true, data };
	}
);
```

### 方法 4: 使用 BaseDAO 聚合统计方法

对于需要统计的业务场景，可以使用 BaseDAO 的聚合方法：

```javascript
// admin-usage.js 示例
import { createCrudActions } from './dao/base';
import { usageCrudConfig } from './configs/usage-crud.config';
import { logAction } from '@/lib/action-logger';

const crudActions = createCrudActions(usageCrudConfig);
const { dao } = crudActions; // 获取 DAO 实例

export async function getUsageStatisticsAction(options = {}) {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// 使用 BaseDAO 的 getAll 方法获取所有记录
		const logs = await dao.getAll(whereJson);

		// 使用 JavaScript 进行统计（适合复杂的业务逻辑）
		const statistics = {
			total: logs.length,
			totalCreditsUsed: logs.reduce((sum, log) => sum + log.creditsUsed, 0),
			// ... 其他统计
		};

		const result = { success: true, data: statistics };
		logAction('getUsageStatistics', 'admin/usage', startTime, requestTime, options, result, false);
		return result;
	} catch (error) {
		const result = { success: false, error: error.message };
		logAction('getUsageStatistics', 'admin/usage', startTime, requestTime, options, result, true);
		return result;
	}
}

// 或者使用 BaseDAO 的聚合方法（适合简单统计）
export async function getTotalCreditsUsedAction() {
	const startTime = Date.now();
	const requestTime = new Date();

	try {
		// 直接使用 sum 方法
		const total = await dao.sum('creditsUsed', { status: 'success' });
		
		const result = { success: true, data: { total } };
		logAction('getTotalCreditsUsed', 'admin/usage', startTime, requestTime, {}, result, false);
		return result;
	} catch (error) {
		const result = { success: false, error: error.message };
		logAction('getTotalCreditsUsed', 'admin/usage', startTime, requestTime, {}, result, true);
		return result;
	}
}
```

---

## 🎨 日志格式说明

### 颜色编码（终端支持的情况下）
- 🔵 **蓝色** - 开始/结束分隔线
- 🟢 **绿色** - 成功操作的耗时
- 🟡 **黄色** - 失败操作的耗时
- 🔴 **红色** - 错误信息

### 日志内容
1. **请求参数** - 完整的输入参数（JSON 格式）
2. **返回数据** - 操作结果（JSON 格式）
3. **总体耗时** - 毫秒级精度
4. **请求时间** - 精确到秒

---

## 💡 常见问题

### Q: 为什么我看不到日志？

**A:** 检查以下几点：
1. 确认在 **开发环境**（`NODE_ENV=development`）
2. 查看 **运行 `npm run dev` 的终端**，不是浏览器控制台
3. 确认你的 action 已经集成了日志（使用 BaseDAO 或手动添加）

### Q: 日志太多怎么办？

**A:** 可以通过环境变量禁用日志。

修改 `lib/action-logger.js`：

```javascript
function isDevelopment() {
	return process.env.NODE_ENV === 'development' && !process.env.DISABLE_ACTION_LOGS;
}
```

然后在 `.env.local` 中设置：
```env
DISABLE_ACTION_LOGS=true  # 禁用日志
```

### Q: 为什么不在 index.js 中拦截所有 actions？

**A:** Next.js 的 Server Actions 有特殊的导入机制：

- ❌ **错误方案**：在 index.js 中包装所有 actions
  - 会导致 actions 被执行多次
  - Server Actions 的 "use server" 指令会失效
  - 可能导致状态管理混乱

- **正确方案**：在 DAO 层或 action 内部添加日志
  - 日志代码和业务代码在同一个 "use server" 上下文中
  - 不会重复执行
  - 性能更好

### Q: 生产环境会打印日志吗？

**A:** 不会。日志系统会检查 `NODE_ENV`，只在开发环境（`development`）打印日志。

---

## 🔧 配置说明

### logCategory 字段

在 CRUD 配置中添加 `logCategory` 字段来定义日志分类：

```javascript
export const xxxCrudConfig = {
	modelName: 'xxx',
	logCategory: 'admin/xxx',  // ← 日志分类，用于区分不同模块
	// ... 其他配置
};
```

**推荐命名规则**：
- 管理端：`admin/模块名`（如 `admin/users`、`admin/posts`）
- 客户端：`client/模块名`（如 `client/profile`、`client/orders`）

---

## 📚 相关文件

- `lib/action-logger.js` - 日志工具函数
- `app/(admin)/actions/dao/base.js` - BaseDAO 日志集成
- `app/(admin)/actions/configs/*.config.js` - CRUD 配置文件
- `docs/admin/BASE_DAO.md` - BaseDAO 完整文档

---

## 📊 日志示例

### 成功的请求

```bash
--------【开始】【Server Action】【admin/users】【getList】--------
15:30:45.123 【请求参数】: {
  "pageIndex": 1,
  "pageSize": 20,
  "role": "user"
}
15:30:45.280 【返回数据】: {
  "success": true,
  "data": [
    { "_id": "...", "name": "张三", ... },
    { "_id": "...", "name": "李四", ... }
  ],
  "total": 150
}
15:30:45.280 【总体耗时】: 157 毫秒  ← 绿色
15:30:45.280 【请求时间】: 2025-11-03 15:30:45
--------【结束】【Server Action】【admin/users】【getList】--------
```

### 失败的请求

```bash
--------【开始】【Server Action】【admin/users】【delete】--------
15:31:20.456 【请求参数】: "invalid-user-id"
15:31:20.580 【Error】: {  ← 红色
  "success": false,
  "error": "User not found"
}
15:31:20.580 【总体耗时】: 124 毫秒  ← 黄色
15:31:20.580 【请求时间】: 2025-11-03 15:31:20
--------【结束】【Server Action】【admin/users】【delete】--------
```

---

## 🎯 最佳实践

1. **使用 BaseDAO**: 优先使用 BaseDAO 创建 CRUD actions，自动获得日志功能
2. **添加 logCategory**: 在配置中明确指定 `logCategory`，方便区分不同模块
3. **保持一致**: 所有同类 actions 使用相同的 logCategory 前缀
4. **避免重复日志**: 不要在多个层级重复记录相同的日志
5. **生产环境**: 确保生产环境不打印敏感信息

---

**享受高效的调试体验！** 🚀

