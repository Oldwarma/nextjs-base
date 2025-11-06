# 重构为 BaseDAO 详解

## 什么是"重构为 BaseDAO"？

"重构为 BaseDAO"是指将**自定义的 UserDAO** 改造成**继承 BaseDAO 的类**，从而获得 BaseDAO 提供的标准功能（日志记录、统一的 CRUD 操作、配置管理等）。

---

## 📊 重构前后对比

### 【重构前】当前架构 - UserDAO 是完全独立的

```
UserDAO (完全自定义)
├── createUser()        - 自己实现
├── getUserList()       - 自己实现
├── updateUser()        - 自己实现
├── deleteUser()        - 自己实现
├── getUserById()       - 自己实现
├── resetUserPassword() - 自己实现
└── ... 其他方法 ...

特点：
❌ 所有方法都要自己写
❌ 没有日志记录
❌ 没有统一的错误处理
❌ 配置分散在代码中
✅ 但是完全自由，想怎么写就怎么写
```

### 【重构后】目标架构 - UserDAO 继承 BaseDAO

```
UserDAO extends BaseDAO
├── 继承的标准方法（自动获得）
│   ├── getList()      ✅ 自动有日志
│   ├── getDetail()    ✅ 自动有日志
│   ├── update()       ✅ 自动有日志
│   ├── delete()       ✅ 自动有日志
│   └── batchUpdate()  ✅ 自动有日志
│
└── 自定义的特殊方法（保留）
    ├── createUser()        - Better Auth 特殊逻辑
    ├── resetUserPassword() - 密码重置特殊逻辑
    └── mapUserFields()     - _id → id 转换

特点：
✅ 标准 CRUD 自动继承，不用写
✅ 自动有完整的日志记录
✅ 统一的错误处理
✅ 配置统一管理
✅ 特殊方法可以覆盖或新增
```

---

## 💻 代码对比：重构前 vs 重构后

### 1️⃣ 重构前：完全自定义的 UserDAO

```javascript
// ❌ 重构前：app/(admin)/actions/dao/user.js

import { selects, add, updateOne, remove } from '@/lib/db-api';

// 完全独立，不继承任何类
export async function getUserList({ page = 1, pageSize = 20, filters = {}, sort = { createdAt: -1 } }) {
	// ❌ 自己构建查询条件
	const query = {};
	if (filters.email) {
		query.email = { $regex: filters.email, $options: 'i' };
	}
	if (filters.name) {
		query.name = { $regex: filters.name, $options: 'i' };
	}
	if (filters.role) {
		query.role = filters.role;
	}

	// ❌ 自己配置连表
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
				localKey: 'roles',
				foreignKey: 'id',
				as: 'roleList',
				fieldJson: { id: 1, name: 1, enable: 1 },
			},
		],
	});

	// ❌ 没有日志记录
	// ❌ 没有错误处理

	return {
		data: mapUsersFields(results.rows || []),
		total: results.total || 0,
		page,
		pageSize,
	};
}

export async function updateUser(userId, updateData) {
	// ❌ 自己实现更新逻辑
	const whereJson = await mapIdToQuery(userId);
	const { id, _id, createdAt, password, ...allowedFields } = updateData;

	const result = await updateOne({
		dbName: 'users',
		whereJson,
		dataJson: {
			...allowedFields,
			updatedAt: new Date(),
		},
	});

	// ❌ 没有日志记录
	// ❌ 没有错误处理

	if (!result) {
		throw new Error('User not found');
	}

	const updated = await selects({
		dbName: 'users',
		getOne: true,
		whereJson,
	});

	return mapUserFields(updated);
}

export async function deleteUser(userId) {
	// ❌ 自己实现删除逻辑
	const whereJson = await mapIdToQuery(userId);

	const { ObjectId } = await import('mongodb');
	await remove({
		dbName: 'account',
		whereJson: { userId: new ObjectId(userId) },
	});

	const result = await remove({
		dbName: 'users',
		whereJson,
	});

	// ❌ 没有日志记录
	// ❌ 没有错误处理

	return result > 0;
}

// 特殊方法
export async function createUser(userData) {
	// Better Auth 特殊逻辑
	const { hashPassword } = await import('better-auth/crypto');
	const hashedPassword = await hashPassword(password);
	// ...
}

export async function resetUserPassword(userId, newPassword) {
	// 密码重置特殊逻辑
	// ...
}
```

**问题：**
- ❌ 每个方法都要自己实现
- ❌ 代码重复度高（查询条件、错误处理等）
- ❌ 没有日志记录
- ❌ 配置分散

---

### 2️⃣ 重构后：继承 BaseDAO 的 UserDAO

```javascript
// ✅ 重构后：app/(admin)/actions/dao/user.js

import { BaseDAO } from './base';
import { userCrudConfig } from '../rbac/configs/user-crud.config';
import { add } from '@/lib/db-api';

/**
 * UserDAO - 用户数据访问层
 * 继承 BaseDAO，获得标准 CRUD 功能和日志记录
 */
class UserDAO extends BaseDAO {
	constructor() {
		// ✅ 使用配置文件初始化
		super(userCrudConfig);
	}

	/**
	 * 覆盖 getList 方法
	 * 因为需要特殊的字段映射（_id → id）
	 */
	async getList(params) {
		const {
			pageIndex = 1,
			pageSize = this.config.query.defaultPageSize,
			search,
			filters = {},
			sortJson,
		} = params;

		// ✅ 使用父类的方法构建查询条件
		const query = { ...this.config.query.baseFilter };

		// 软删除过滤
		if (this.config.softDelete) {
			query.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
		}

		// ✅ 使用父类的方法构建搜索条件
		const searchQuery = this.buildSearchQuery(search);
		if (searchQuery.$or) {
			if (query.$or) {
				query.$and = [{ $or: query.$or }, searchQuery];
				delete query.$or;
			} else {
				Object.assign(query, searchQuery);
			}
		}

		// 额外过滤条件
		const filtersQuery = this.buildFiltersQuery(filters);
		Object.assign(query, filtersQuery);

		// ✅ 使用 config 中的配置
		const sortOption = sortJson || this.config.query.defaultSort || {};
		const finalForeignDB = this.config.query?.foreignDB || [];

		// 查询数据
		const results = await selects({
			dbName: this.config.collectionName,
			whereJson: query,
			pageIndex,
			pageSize,
			sortJson: sortOption,
			getCount: true,
			foreignDB: finalForeignDB,  // ✅ 从 config 读取
		});

		// ✅ 应用输出转换（包括 _id → id）
		const transform = this.config.transforms?.output;
		const data = transform ? results.rows.map(transform) : results.rows.map(this.mapUserFields);

		return {
			success: true,
			data,
			total: results.total || 0,
			pageIndex,
			pageSize,
		};
	}

	/**
	 * 字段映射：_id → id
	 */
	mapUserFields(user) {
		if (!user) return null;
		return {
			...user,
			id: user._id ? user._id.toString() : user.id,
		};
	}

	/**
	 * 覆盖 create 方法
	 * 因为用户创建需要 Better Auth 集成
	 */
	async create(userData) {
		const {
			email,
			password,
			name,
			username,
			role = 'user',
			isBackendAllowed = false,
			roles = [],
			credits = 0,
		} = userData;

		// Better Auth 密码哈希
		const { hashPassword } = await import('better-auth/crypto');
		const hashedPassword = await hashPassword(password);

		const now = new Date();
		const newUser = {
			email: email.toLowerCase(),
			emailVerified: false,
			name,
			username,
			role,
			roles,
			isBackendAllowed,
			credits,
			totalCreditsEarned: 0,
			totalCreditsUsed: 0,
			banned: false,
			createdAt: now,
			updatedAt: now,
		};

		const result = await add({
			dbName: this.config.collectionName,
			dataJson: newUser,
		});

		if (!result || !result._id) {
			throw new Error('Failed to create user');
		}

		// 创建 credential account
		await add({
			dbName: 'account',
			dataJson: {
				userId: result._id,
				accountId: email.toLowerCase(),
				providerId: 'credential',
				password: hashedPassword,
				createdAt: now,
				updatedAt: now,
			},
		});

		return {
			success: true,
			data: this.mapUserFields(result),
		};
	}

	/**
	 * 新增特殊方法：重置密码
	 */
	async resetPassword(userId, newPassword) {
		const { hashPassword } = await import('better-auth/crypto');
		const hashedPassword = await hashPassword(newPassword);

		const { ObjectId } = await import('mongodb');
		const user = await this.getDetail(userId);
		if (!user.success) {
			throw new Error('User not found');
		}

		const existingAccount = await selects({
			dbName: 'account',
			getOne: true,
			whereJson: {
				userId: new ObjectId(userId),
				providerId: 'credential',
			},
		});

		if (existingAccount) {
			await updateOne({
				dbName: 'account',
				whereJson: { _id: existingAccount._id },
				dataJson: {
					password: hashedPassword,
					updatedAt: new Date(),
				},
			});
		} else {
			await add({
				dbName: 'account',
				dataJson: {
					userId: new ObjectId(userId),
					accountId: user.data.email,
					providerId: 'credential',
					password: hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});
		}

		return { success: true, message: 'Password reset successfully' };
	}

	// ✅ 标准方法直接继承自 BaseDAO，不需要写：
	// - getDetail(id)
	// - update(id, data)
	// - delete(id)
	// - batchUpdate(ids, data)
	// - batchDelete(ids)
}

// 导出单例
export const userDao = new UserDAO();

// 导出方法（兼容旧代码）
export const createUser = (userData) => userDao.create(userData);
export const getUserList = (params) => userDao.getList(params);
export const updateUser = (id, data) => userDao.update(id, data);
export const deleteUser = (id) => userDao.delete(id);
export const getUserById = (id) => userDao.getDetail(id);
export const resetUserPassword = (userId, newPassword) => userDao.resetPassword(userId, newPassword);
export const batchUpdateUsers = (ids, data) => userDao.batchUpdate(ids, data);
```

**优点：**
- ✅ 标准 CRUD 方法自动继承
- ✅ 只需覆盖特殊方法
- ✅ 代码量大幅减少
- ✅ 配置统一管理

---

### 3️⃣ Server Actions 的变化

```javascript
// ✅ 重构后：app/(admin)/actions/rbac/admin-users.js

import { userDao } from '@/app/(admin)/actions/dao/user';
import { userCrudConfig } from './configs/user-crud.config';
import { BaseDAO } from '@/app/(admin)/actions/dao/base';

// ⭐ 创建带日志的 Actions（关键变化）
const userActions = BaseDAO.createAction(userDao, userCrudConfig);

/**
 * 获取用户列表
 * ✅ 自动记录日志
 */
export async function getUserListAction(params) {
	const backendCheck = await checkBackendAccess();
	if (!backendCheck.hasAccess) {
		return { success: false, error: backendCheck.error };
	}
	
	// ⭐ 调用 userActions，自动记录日志
	return await userActions.getList(params);
}

/**
 * 更新用户
 * ✅ 自动记录日志
 */
export async function updateUserAction(userId, updateData) {
	const backendCheck = await checkBackendAccess();
	if (!backendCheck.hasAccess) {
		return { success: false, error: backendCheck.error };
	}
	
	// ⭐ 调用 userActions，自动记录日志
	return await userActions.update(userId, updateData);
}

/**
 * 创建用户
 * ✅ 自动记录日志
 */
export async function createUserAction(userData) {
	const backendCheck = await checkBackendAccess();
	if (!backendCheck.hasAccess) {
		return { success: false, error: backendCheck.error };
	}
	
	// ⭐ 调用 userActions，自动记录日志
	return await userActions.create(userData);
}

/**
 * 重置密码（自定义方法）
 * ⚠️ 需要手动添加日志
 */
export async function resetUserPasswordAction(userId, newPassword) {
	const backendCheck = await checkBackendAccess();
	if (!backendCheck.hasAccess) {
		return { success: false, error: backendCheck.error };
	}
	
	const startTime = Date.now();
	const requestTime = new Date();
	
	try {
		const result = await userDao.resetPassword(userId, newPassword);
		
		// 手动记录日志（因为是自定义方法）
		await logAction('resetPassword', 'admin/users', startTime, requestTime, 
			{ userId }, result, !result.success);
		
		return result;
	} catch (error) {
		const errorResult = { success: false, error: error.message };
		await logAction('resetPassword', 'admin/users', startTime, requestTime, 
			{ userId }, errorResult, true);
		return errorResult;
	}
}
```

---

## 🔍 关键差异总结

### 代码量对比

| 文件 | 重构前 | 重构后 | 减少 |
|------|--------|--------|------|
| **user.js** | ~435 行 | ~250 行 | **-42%** |
| **admin-users.js** | ~478 行 | ~350 行 | **-27%** |
| **总计** | ~913 行 | ~600 行 | **-34%** |

### 功能对比

| 功能 | 重构前 | 重构后 |
|------|--------|--------|
| **标准 CRUD** | 自己实现 | 自动继承 ✅ |
| **日志记录** | 无 ❌ | 自动记录 ✅ |
| **错误处理** | 手动 | 统一处理 ✅ |
| **配置管理** | 分散 | 统一管理 ✅ |
| **连表查询** | 代码中硬编码 | Config 配置 ✅ |
| **字段验证** | 手动 | Config 配置 ✅ |
| **特殊方法** | 支持 ✅ | 支持 ✅ |

---

## ⏰ 为什么"在系统稳定后进行"？

### 1. **重构风险**

重构是**改变代码结构但不改变功能**，但仍有风险：

```
重构前：UserDAO (自定义) → 工作正常 ✅
         ↓ 重构
重构后：UserDAO (继承 BaseDAO) → 可能有 Bug ⚠️
```

**可能的问题：**
- ❌ 方法签名不匹配
- ❌ 字段映射错误（_id vs id）
- ❌ 连表配置错误
- ❌ 特殊逻辑遗漏
- ❌ 日志格式不兼容

### 2. **需要完整测试**

重构后需要测试**所有功能**：

```
✅ 用户列表查询
✅ 用户详情查看
✅ 用户信息更新
✅ 用户创建
✅ 用户删除
✅ 批量操作
✅ 角色绑定
✅ 密码重置
✅ 搜索过滤
✅ 排序分页
✅ 连表查询（roleList）
✅ 日志记录
✅ 错误处理
```

**测试工作量大**，需要时间和资源。

### 3. **系统稳定的时机**

**系统稳定**是指：

- ✅ 当前功能都已实现
- ✅ 主要 Bug 已修复
- ✅ 用户反馈良好
- ✅ 没有紧急需求
- ✅ 有时间做充分测试

**不适合重构的时机：**
- ❌ 正在开发新功能
- ❌ 有紧急 Bug 要修
- ❌ 即将上线新版本
- ❌ 用户报告问题频繁
- ❌ 团队资源紧张

### 4. **统一架构的好处**

**统一架构**是指所有 DAO 都使用相同的设计模式：

```
当前架构（不统一）：
├── RoleDAO   → 使用 BaseDAO ✅
├── MenuDAO   → 使用 BaseDAO ✅
├── PermDAO   → 使用 BaseDAO ✅
└── UserDAO   → 完全自定义 ❌  （不统一）

目标架构（统一）：
├── RoleDAO   → 继承 BaseDAO ✅
├── MenuDAO   → 继承 BaseDAO ✅
├── PermDAO   → 继承 BaseDAO ✅
└── UserDAO   → 继承 BaseDAO ✅  （统一了！）
```

**统一架构的好处：**
- ✅ 代码风格一致
- ✅ 新人容易理解
- ✅ 维护成本降低
- ✅ Bug 修复一处，全部生效
- ✅ 功能增强一处，全部受益

---

## 📋 重构实施步骤

### 阶段 1: 准备（1-2 天）

1. **备份代码**
   ```bash
   git checkout -b refactor/user-dao-to-basedao
   git add .
   git commit -m "backup: 准备重构 UserDAO"
   ```

2. **完善测试**
   - 编写或补充用户管理的测试用例
   - 确保当前所有功能都有测试覆盖

3. **文档准备**
   - 记录当前 UserDAO 的所有方法
   - 标记哪些需要覆盖，哪些可以继承

### 阶段 2: 重构 DAO 层（2-3 天）

1. **修改 user.js**
   ```javascript
   // 从
   export async function getUserList() { ... }
   
   // 改为
   class UserDAO extends BaseDAO { ... }
   export const userDao = new UserDAO();
   ```

2. **测试 DAO 方法**
   - 单独测试每个 DAO 方法
   - 确保返回格式一致

### 阶段 3: 重构 Actions 层（1-2 天）

1. **修改 admin-users.js**
   ```javascript
   // 添加
   const userActions = BaseDAO.createAction(userDao, userCrudConfig);
   
   // 修改所有 Action 使用 userActions
   ```

2. **测试 Actions**
   - 确保日志正常记录
   - 确保错误处理正确

### 阶段 4: 完整测试（2-3 天）

1. **功能测试**
   - 手动测试所有用户管理功能
   - 检查前端显示是否正常

2. **日志测试**
   - 检查 action_logs 表
   - 确认日志格式正确

3. **性能测试**
   - 对比重构前后的性能
   - 确保没有性能倒退

### 阶段 5: 上线观察（1 周）

1. **灰度发布**（如果可能）
   - 先给部分用户使用
   - 观察是否有问题

2. **监控日志**
   - 重点关注错误日志
   - 检查异常数据

3. **用户反馈**
   - 收集用户反馈
   - 快速响应问题

---

## ⚖️ 是否应该重构？决策树

```
是否应该重构 UserDAO？
│
├─ 当前系统是否稳定？
│  ├─ 否 → ❌ 不要重构，先稳定系统
│  └─ 是 → 继续
│
├─ 是否有紧急需求？
│  ├─ 是 → ❌ 不要重构，先完成需求
│  └─ 否 → 继续
│
├─ 是否有时间和资源？
│  ├─ 否 → ❌ 不要重构，等有时间再说
│  └─ 是 → 继续
│
├─ 是否真的需要日志？
│  ├─ 不需要 → ⚠️ 可以不重构
│  └─ 需要 → 继续
│
└─ 是否需要统一架构？
   ├─ 不需要 → ⚠️ 可以只添加日志（方案 1）
   └─ 需要 → ✅ 可以重构了！
```

---

## 🎯 推荐方案

### 短期（立即 - 1 周）

**方案 1：手动添加日志**

只在 `admin-users.js` 中添加 `logAction`，不改 DAO 层：

- ✅ 快速（1-2 天）
- ✅ 风险低
- ✅ 立即有日志
- ❌ 不统一架构

**适用场景：**
- 急需日志功能
- 不想大改代码
- 资源紧张

### 长期（1-2 月后）

**方案 2：重构为 BaseDAO**

完整重构，统一架构：

- ✅ 架构统一
- ✅ 代码量减少
- ✅ 维护性提高
- ❌ 需要时间（1-2 周）
- ❌ 需要完整测试

**适用场景：**
- 系统已稳定
- 有充足时间
- 追求代码质量
- 团队成熟度高

---

## 📚 相关文档

- [用户管理 DAO 架构说明](./USER_DAO_ARCHITECTURE.md)
- [用户管理日志对比](./USER_DAO_LOGGING_COMPARISON.md)
- [BaseDAO 文档](../admin/BASE_DAO.md)
- [Smart CRUD 指南](../admin/SMART_CRUD_GUIDE.md)

---

## 总结

**"重构为 BaseDAO"** 是指：
- 📝 **改造代码结构**：让 UserDAO 继承 BaseDAO
- 🎯 **获得标准功能**：自动获得日志、CRUD、配置管理
- 🔧 **保留特殊逻辑**：覆盖或新增特殊方法
- 📈 **提升代码质量**：统一架构、减少重复

**为什么"在系统稳定后"？**
- ⚠️ **有风险**：改变代码结构，可能引入 Bug
- ✅ **需要测试**：完整测试所有功能，工作量大
- ⏰ **需要时间**：1-2 周的开发和测试时间
- 🎯 **非紧急**：是优化，不是必须

**建议：**
- 短期用方案 1（手动加日志）
- 长期用方案 2（重构为 BaseDAO）

