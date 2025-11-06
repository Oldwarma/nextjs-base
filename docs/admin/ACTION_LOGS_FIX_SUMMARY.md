# Action Logs 页面修复总结

## 🐛 问题描述

1. **搜索不生效**：筛选 `action=delete` 无法查询到数据
2. **连表失败**：`userInfo` 字段没有正确显示用户信息
3. **架构不一致**：绕过了 BaseDAO 直接使用 `selects` 方法

## 🔍 根本原因分析

### 问题 1：参数格式不匹配

- **SmartCrudPage** 通过 `searchTransform` 将搜索参数转换为 **`whereJson`** 后传递给 Action
- **BaseDAO** 原本只支持 **`filters`** 参数，不支持 `whereJson`
- **User DAO** 手动处理 `filters` 转换为 MongoDB 查询（`getUserList` 方法）

**冲突**：BaseDAO 期望 `filters`，SmartCrudPage 传递 `whereJson`，导致查询条件丢失。

### 问题 2：foreignDB 配置错误

**错误配置**：

```javascript
foreignDB: [
	{
		dbName: 'users',
		localField: 'userId',  // ❌ 错误：应该是 localKey
		foreignField: 'id',    // ❌ 错误：应该是 foreignKey
		as: 'userInfo',
		limit: 1,
	},
],
```

**正确配置**：

```javascript
foreignDB: [
	{
		dbName: 'users',
		localKey: 'userId',    // ✅ 正确
		foreignKey: 'id',      // ✅ 正确
		as: 'userInfo',
		limit: 1,
	},
],
```

### 问题 3：绕过 DAO 层

最初的"解决方案"是直接使用 `selects` 方法，绕过了 BaseDAO，这违反了项目架构原则：

```javascript
// ❌ 错误做法：绕过 BaseDAO
export const getActionLogListAction = wrapQueryAction('action_logs', async (params) => {
	const result = await selects({
		dbName: 'action_logs',
		whereJson: params.whereJson,
		// ...
	});
	return { success: true, data: result.rows, ... };
});
```

**问题**：
- 破坏了架构一致性
- 丢失了 BaseDAO 的统一逻辑（软删除、验证、钩子等）
- 增加了维护成本

---

## ✅ 解决方案

### 修复 1：BaseDAO 支持 whereJson

修改 `app/(admin)/actions/dao/base.js` 的 `getList` 方法，**同时支持 `whereJson` 和 `filters` 两种参数格式**：

```javascript
async getList(params = {}) {
	const {
		pageIndex = 1,
		pageSize = this.config.query.defaultPageSize,
		search,
		filters = {},
		whereJson,  // ✅ 新增：支持直接传入 whereJson（SmartCrudPage 使用）
		sortJson,
		foreignDB,
	} = params;

	// ✅ 构建查询条件：优先使用 whereJson，其次使用 search + filters 构建
	let query;
	
	if (whereJson) {
		// SmartCrudPage 模式：直接使用已转换的 whereJson
		query = { ...this.config.query.baseFilter, ...whereJson };
	} else {
		// 传统模式：使用 search 和 filters 构建查询
		query = { ...this.config.query.baseFilter };
		const searchQuery = this.buildSearchQuery(search);
		const filtersQuery = this.buildFiltersQuery(filters);
		Object.assign(query, searchQuery, filtersQuery);
	}

	// 软删除过滤（始终应用）
	if (this.config.softDelete) {
		// ... 合并软删除条件
	}

	// 使用 selects 查询
	const result = await selects({
		dbName: this.config.collectionName,
		whereJson: query,
		sortJson: sortJson || this.config.query.defaultSort,
		pageIndex,
		pageSize,
		getCount: true,
		foreignDB: foreignDB || this.config.query?.foreignDB || [],
	});

	return { success: true, data: result.rows, ... };
}
```

**优势**：
- ✅ 同时支持两种模式，向后兼容
- ✅ 保持架构一致性
- ✅ 不破坏现有代码

### 修复 2：修正 foreignDB 配置

修改 `app/(admin)/actions/system/configs/action-logs-crud.config.js`：

```javascript
foreignDB: [
	{
		dbName: 'users',
		localKey: 'userId',      // ✅ 修正：action_logs.userId
		foreignKey: 'id',        // ✅ 修正：users.id
		as: 'userInfo',
		limit: 1,
	},
],
```

### 修复 3：恢复使用 BaseDAO

修改 `app/(admin)/actions/system/admin-action-logs.js`：

```javascript
'use server';

import { createReadOnlyActions } from '@/lib/core/crud-helper';
import { actionLogsCrudConfig } from './configs/action-logs-crud.config';

/**
 * 创建只读 CRUD Actions
 * BaseDAO 已支持 SmartCrudPage 的 whereJson 参数
 */
const crudActions = createReadOnlyActions(actionLogsCrudConfig);

export const getActionLogListAction = crudActions.getList;
export const getActionLogDetailAction = crudActions.getDetail;
```

**优势**：
- ✅ 恢复了架构一致性
- ✅ 代码简洁，遵循 DRY 原则
- ✅ 自动享受 BaseDAO 的所有功能

---

## 📊 修复前后对比

### 修复前

| 问题 | 表现 | 影响 |
|------|------|------|
| 参数格式不匹配 | 搜索无效 | 用户无法筛选数据 |
| foreignDB 配置错误 | 连表失败 | 无法显示用户信息 |
| 绕过 DAO 层 | 架构混乱 | 维护困难，代码重复 |

### 修复后

| 改进 | 实现 | 效果 |
|------|------|------|
| BaseDAO 支持 whereJson | 双模式支持 | ✅ 搜索正常，向后兼容 |
| 修正 foreignDB 配置 | 使用 localKey/foreignKey | ✅ 连表成功，显示用户信息 |
| 恢复使用 BaseDAO | 统一架构 | ✅ 代码简洁，易于维护 |

---

## 🎯 关键学习点

### 1. 架构一致性至关重要

❌ **错误做法**：遇到问题就绕过框架，直接使用底层 API

✅ **正确做法**：分析根本原因，修复框架层的问题

### 2. 参数格式统一

- **SmartCrudPage** 使用 `whereJson`（已转换的 MongoDB 查询）
- **传统 Actions** 使用 `filters`（原始搜索参数）
- **BaseDAO** 应该同时支持两种模式

### 3. foreignDB 配置规范

| 字段 | 说明 | 示例 |
|------|------|------|
| `dbName` | 副表集合名称 | `'users'` |
| `localKey` | 本表字段 | `'userId'` |
| `foreignKey` | 副表字段 | `'id'` |
| `as` | 结果存放字段 | `'userInfo'` |
| `limit` | 限制数量（可选） | `1`（一对一）或不设置（一对多） |
| `fieldJson` | 返回字段（可选） | `{ id: 1, name: 1, email: 1 }` |

### 4. 渲染连表数据的正确方式

```javascript
// ✅ 正确：处理数组结果（即使 limit: 1）
render: (userInfo, record) => {
	const user = Array.isArray(userInfo) && userInfo.length > 0 ? userInfo[0] : null;
	if (user) {
		return <div>{user.name}</div>;
	}
	return <div>{record.userId}</div>;
}
```

---

## 📚 相关文档

- **创建指南**：`docs/admin/SMARTCRUD_PAGE_CREATION_GUIDE.md`（新建）
- **BaseDAO 文档**：`docs/admin/BASE_DAO.md`
- **连表查询指南**：`docs/database/FOREIGNDB_JOIN_GUIDE.md`
- **SmartCrudPage 指南**：`docs/admin/SMART_CRUD_GUIDE.md`

---

## ✅ 验证清单

- [x] 搜索 `action=delete` 可以正确筛选
- [x] 搜索 `userId` 可以正确筛选
- [x] `userInfo` 列显示用户名称和邮箱
- [x] 日期范围搜索正常工作
- [x] 详情页显示完整的连表数据
- [x] 所有代码使用 BaseDAO，无直接数据库操作
- [x] Linter 无错误
- [x] 架构一致性检查通过

---

## 🎉 总结

通过本次修复，我们：

1. ✅ **修复了 BaseDAO**：支持 `whereJson` 参数，兼容 SmartCrudPage
2. ✅ **修正了 foreignDB 配置**：使用正确的字段名（`localKey`/`foreignKey`）
3. ✅ **恢复了架构一致性**：移除绕过 DAO 的代码，统一使用 BaseDAO
4. ✅ **创建了指导性文档**：`SMARTCRUD_PAGE_CREATION_GUIDE.md`，规范未来开发流程

**核心原则**：
- 🚫 **禁止绕过 DAO 层**
- ✅ **始终使用 BaseDAO + action-wrapper 架构**
- ✅ **遇到问题修复框架，而不是绕过框架**

**未来开发**：
- 所有新页面严格遵循 `SMARTCRUD_PAGE_CREATION_GUIDE.md`
- 遇到 BaseDAO 不支持的场景，优先扩展 BaseDAO 而不是绕过
- 保持代码风格和架构的一致性

