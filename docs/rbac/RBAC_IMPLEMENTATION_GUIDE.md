# RBAC 权限管理实现指南

> **最后更新**: 2025-11-04  
> **版本**: v1.0.0  
> **目标读者**: 开发人员  
> **用途**: RBAC 权限系统的技术实现文档

---

## 📋 目录

1. [系统架构](#系统架构)
2. [核心文件说明](#核心文件说明)
3. [菜单权限控制](#菜单权限控制)
4. [页面访问控制](#页面访问控制)
5. [Server Action 权限控制](#server-action-权限控制)
6. [前端权限控制](#前端权限控制)
7. [完整示例](#完整示例)
8. [最佳实践](#最佳实践)

---

## 系统架构

### RBAC 权限流程

```
用户登录
  ↓
获取用户角色 (roles 字段)
  ↓
获取角色的权限和菜单
  ↓
┌─────────────────┬──────────────────┬─────────────────┐
│   菜单显示控制    │   页面访问控制     │  操作权限控制    │
│  (Menu Filter)  │  (Page Access)   │ (Action Check)  │
└─────────────────┴──────────────────┴─────────────────┘
```

### 权限验证层次

1. **Layout 层**: 在 `AdminLayout` 中过滤菜单
2. **Page 层**: 在页面组件中验证访问权限
3. **Action 层**: 在 Server Actions 中验证操作权限
4. **Component 层**: 在组件中根据权限显示/隐藏 UI

---

## 核心文件说明

### 1. 权限验证库

**文件**: `lib/permission-auth.js`

提供权限验证的核心函数：

```javascript
// 验证特定权限 ID
checkPermission(permissionId)

// 验证 Action 路径权限
checkActionPermission(actionPath)

// 验证多个权限之一（OR）
checkAnyPermission(permissionIds)

// 验证所有权限（AND）
checkAllPermissions(permissionIds)

// 验证角色
checkRole(roleId)

// 获取用户权限
getUserPermissions()

// 获取用户菜单
getUserMenus()
```

### 2. 页面访问控制

**文件**: `lib/page-auth.js`

提供页面级别的权限保护：

```javascript
// 检查页面访问权限（重定向版）
checkPageAccess(pageUrl)

// 检查页面访问权限（返回结果版）
canAccessPage(pageUrl)

// Admin 或特定权限验证
checkAdminOrPermission(permissionId)
```

### 3. 用户权限 Actions

**文件**: `app/(admin)/actions/rbac/user-permissions.js`

提供客户端可调用的权限查询：

```javascript
// 获取用户可访问的菜单
getUserAccessibleMenusAction()

// 获取用户的权限 ID 列表
getUserPermissionIdsAction()

// 检查页面访问权限
checkPageAccessAction(pageUrl)

// 获取用户角色
getUserRolesAction()
```

### 4. 前端 Hooks

**文件**: `hooks/use-permission.js`

提供 React Hooks 用于前端权限控制：

```javascript
// 权限检查 Hook
usePermission()

// 页面访问检查 Hook
usePageAccess(pageUrl)

// 用户菜单 Hook
useUserMenus()
```

### 5. 数据访问层

**文件**: `app/(admin)/actions/dao/sys.js`

提供底层的数据库查询：

```javascript
// 用户相关
getUserRoleIds(userId)
getUserPermissionIds(userId)
getUserMenus(userId)

// 角色相关
findRoleById(roleId)
roleBindPermissions()
roleBindMenus()

// 权限相关
findPermissionById(permissionId)
getPermissionTree()
checkUserHasPermission()
checkUserHasActionPermission()

// 菜单相关
findMenuById(menuId)
getMenusByRoleIds()
```

---

## 菜单权限控制

### 实现原理

管理后台的 `AdminLayout` 组件会自动根据用户的 RBAC 角色过滤菜单。

### 实现代码

**文件**: `components/admin/admin-layout.jsx`

```javascript
import { getUserAccessibleMenusAction } from '@/app/(admin)/actions/rbac/user-permissions';

export default function AdminLayout({ children, user }) {
	const [menuData, setMenuData] = useState([]);

	useEffect(() => {
		const loadMenus = async () => {
			// 获取当前用户有权限访问的菜单
			const result = await getUserAccessibleMenusAction();
			if (result.success) {
				setMenuData(result.data || []);
			}
		};
		loadMenus();
	}, []);

	// 菜单会自动转换为路由配置
	// ...
}
```

### 菜单过滤规则

1. **Admin 角色**: 显示所有已启用的菜单
2. **普通用户**: 只显示其角色被分配的菜单
3. **自动过滤**: 
   - `enable: false` 的菜单不显示
   - `hidden: true` 的菜单不显示
   - 未被分配的菜单不显示

### 菜单数据结构

```javascript
{
  id: "menu-uuid",
  name: "用户管理",
  url: "/admin/users",
  icon: "UserOutlined",
  parent_id: null,
  enable: true,
  hidden: false,
  sort: 10,
  children: [...]  // 子菜单
}
```

---

## 页面访问控制

### 方式一: 使用 checkPageAccess（推荐）

在页面组件的服务端部分验证访问权限：

```javascript
// app/(admin)/admin/users/page.js
import { checkPageAccess } from '@/lib/page-auth';

export default async function UsersPage() {
	// ✅ 验证页面访问权限，无权限会自动重定向
	await checkPageAccess('/admin/users');

	return (
		<div>
			<h1>Users Management</h1>
			{/* 页面内容 */}
		</div>
	);
}
```

### 方式二: 使用 usePageAccess Hook

在客户端组件中验证访问权限：

```javascript
'use client';

import { usePageAccess } from '@/hooks/use-permission';
import { Alert, Spin } from 'antd';

export default function UsersPage() {
	const { hasAccess, loading } = usePageAccess('/admin/users');

	if (loading) {
		return <Spin />;
	}

	if (!hasAccess) {
		return <Alert message="Access Denied" type="error" />;
	}

	return (
		<div>
			<h1>Users Management</h1>
			{/* 页面内容 */}
		</div>
	);
}
```

### 页面访问验证流程

```
用户访问页面
  ↓
checkPageAccess(pageUrl)
  ↓
检查用户是否登录? ──No→ 重定向到登录页
  ↓ Yes
检查是否 Admin? ──Yes→ 允许访问
  ↓ No
获取用户的菜单权限
  ↓
检查 pageUrl 是否在菜单中? ──No→ 重定向到首页
  ↓ Yes
允许访问
```

---

## Server Action 权限控制

### 基本使用

在每个需要权限保护的 Server Action 中添加权限验证：

```javascript
'use server';

import { checkActionPermission } from '@/lib/permission-auth';

export async function createUserAction(data) {
	// ✅ 验证权限：检查用户是否有权限执行此 Action
	const permCheck = await checkActionPermission(
		'/admin/actions/user/create'
	);
	
	if (!permCheck.hasPermission) {
		return {
			success: false,
			error: permCheck.error || 'Permission denied',
		};
	}

	// 执行业务逻辑
	// ...

	return { success: true };
}
```

### Action 路径匹配规则

权限配置中的 `actions` 字段支持通配符：

| 权限配置 | Action 路径 | 匹配结果 |
|---------|------------|---------|
| `/admin/actions/user/create` | `/admin/actions/user/create` | ✅ 精确匹配 |
| `/admin/actions/user/*` | `/admin/actions/user/create` | ✅ 单层通配 |
| `/admin/actions/user/*` | `/admin/actions/user/role/assign` | ❌ 不匹配多层 |
| `/admin/actions/**` | `/admin/actions/user/create` | ✅ 多层通配 |
| `/admin/actions/**` | `/admin/actions/user/role/assign` | ✅ 多层通配 |

### 权限验证方式对比

#### 1. 使用 Action 路径验证（推荐）

```javascript
import { checkActionPermission } from '@/lib/permission-auth';

const permCheck = await checkActionPermission('/admin/actions/user/create');
```

**优点**：
- 自动匹配通配符
- 权限配置灵活
- 适合大多数场景

#### 2. 使用权限 ID 验证

```javascript
import { checkPermission } from '@/lib/permission-auth';

const permCheck = await checkPermission('user-create-permission');
```

**优点**：
- 精确控制
- 适合特殊场景

#### 3. 使用角色验证

```javascript
import { checkRole } from '@/lib/permission-auth';

const roleCheck = await checkRole('admin');
```

**优点**：
- 简单直接
- 适合角色专属功能

#### 4. 组合验证（任一权限）

```javascript
import { checkAnyPermission } from '@/lib/permission-auth';

const permCheck = await checkAnyPermission([
	'user-create',
	'user-manage',
	'admin-all',
]);
```

**优点**：
- 灵活的权限组合
- 适合需要多种权限之一的场景

#### 5. 组合验证（所有权限）

```javascript
import { checkAllPermissions } from '@/lib/permission-auth';

const permCheck = await checkAllPermissions([
	'user-read',
	'user-write',
	'user-delete',
]);
```

**优点**：
- 严格的权限要求
- 适合高级功能

### 完整的 Server Action 示例

```javascript
'use server';

import { checkActionPermission } from '@/lib/permission-auth';
import { logAction } from '@/lib/action-logger';

export async function updateUserRoleAction(userId, newRole) {
	const startTime = Date.now();
	const requestTime = new Date();
	const params = { userId, newRole };

	try {
		// ✅ 步骤1: 验证权限
		const permCheck = await checkActionPermission(
			'/admin/actions/user/updateRole'
		);
		
		if (!permCheck.hasPermission) {
			const result = {
				success: false,
				error: 'Permission denied: Cannot update user roles',
			};
			logAction('updateUserRole', 'user', startTime, requestTime, params, result, true);
			return result;
		}

		// ✅ 步骤2: 验证业务逻辑
		if (!userId || !newRole) {
			const result = {
				success: false,
				error: 'Invalid parameters',
			};
			logAction('updateUserRole', 'user', startTime, requestTime, params, result, true);
			return result;
		}

		// ✅ 步骤3: 执行操作
		const { getCollection } = await import('@/lib/mongodb');
		const usersCollection = await getCollection('users');
		
		const updateResult = await usersCollection.updateOne(
			{ id: userId },
			{ $set: { role: newRole, updatedAt: new Date() } }
		);

		// ✅ 步骤4: 返回结果
		if (updateResult.modifiedCount > 0) {
			const result = {
				success: true,
				message: 'User role updated successfully',
			};
			logAction('updateUserRole', 'user', startTime, requestTime, params, result, false);
			return result;
		}

		const result = {
			success: false,
			error: 'User not found or role not changed',
		};
		logAction('updateUserRole', 'user', startTime, requestTime, params, result, true);
		return result;

	} catch (error) {
		const result = {
			success: false,
			error: error.message,
		};
		logAction('updateUserRole', 'user', startTime, requestTime, params, result, true);
		return result;
	}
}
```

---

## 前端权限控制

### 使用 usePermission Hook

```javascript
'use client';

import { usePermission } from '@/hooks/use-permission';
import { Button } from 'antd';

export default function MyComponent() {
	const { 
		permissions,      // 权限 ID 数组
		isAdmin,          // 是否是管理员
		loading,          // 加载状态
		hasPermission,    // 检查单个权限
		hasAnyPermission, // 检查多个权限之一
		hasAllPermissions // 检查所有权限
	} = usePermission();

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			{/* 示例1: 根据权限显示按钮 */}
			{hasPermission('user-create') && (
				<Button type="primary">Create User</Button>
			)}

			{/* 示例2: 根据多个权限之一显示 */}
			{hasAnyPermission(['user-create', 'user-manage']) && (
				<Button>Edit User</Button>
			)}

			{/* 示例3: 需要所有权限 */}
			{hasAllPermissions(['user-read', 'user-write']) && (
				<Button>Advanced Operation</Button>
			)}

			{/* 示例4: Admin 专属 */}
			{isAdmin && (
				<Button danger>Admin Only</Button>
			)}

			{/* 示例5: 禁用而不是隐藏 */}
			<Button disabled={!hasPermission('user-delete')}>
				Delete
			</Button>
		</div>
	);
}
```

### Hook API 说明

#### usePermission()

返回对象：

```javascript
{
  permissions: string[],        // 用户的权限 ID 列表
  isAdmin: boolean,             // 是否是管理员
  loading: boolean,             // 是否正在加载
  hasPermission: (id) => boolean,
  hasAnyPermission: (ids) => boolean,
  hasAllPermissions: (ids) => boolean
}
```

#### usePageAccess(pageUrl)

参数：
- `pageUrl`: 要检查的页面 URL

返回对象：

```javascript
{
  hasAccess: boolean,  // 是否有访问权限
  loading: boolean,    // 是否正在加载
  error: string|null   // 错误信息
}
```

#### useUserMenus()

返回对象：

```javascript
{
  menus: array,        // 用户的菜单树
  loading: boolean,    // 是否正在加载
  error: string|null   // 错误信息
}
```

---

## 完整示例

### 场景: 用户管理功能

假设我们要实现一个用户管理功能，包含以下权限控制：

1. 查看用户列表：所有登录用户
2. 创建用户：需要 `user-create` 权限
3. 编辑用户：需要 `user-update` 权限
4. 删除用户：需要 `user-delete` 权限
5. 修改角色：只有 Admin

#### 步骤1: 配置权限

在权限管理页面创建权限：

```
用户管理 (user-manage)
├── 创建用户 (user-create)
│   └── actions: ["/admin/actions/user/create"]
├── 编辑用户 (user-update)
│   └── actions: ["/admin/actions/user/update"]
└── 删除用户 (user-delete)
    └── actions: ["/admin/actions/user/delete"]
```

#### 步骤2: 配置菜单

在菜单管理页面创建菜单：

```
用户管理
├── name: "User Management"
├── url: "/admin/users"
├── icon: "UserOutlined"
└── enable: true
```

#### 步骤3: 创建角色并分配权限

```
编辑员角色
├── 分配权限: [user-create, user-update]
└── 分配菜单: [用户管理]

管理员角色
├── 分配权限: [user-create, user-update, user-delete]
└── 分配菜单: [用户管理]
```

#### 步骤4: 创建 Server Actions

**文件**: `app/(admin)/actions/user/admin-users-protected.js`

```javascript
'use server';

import { checkActionPermission } from '@/lib/permission-auth';
import { getCollection } from '@/lib/mongodb';

// 获取用户列表 - 无需特殊权限
export async function getUserListAction() {
	try {
		const usersCollection = await getCollection('users');
		const users = await usersCollection.find({});
		
		return {
			success: true,
			data: users,
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

// 创建用户 - 需要权限
export async function createUserAction(data) {
	const permCheck = await checkActionPermission('/admin/actions/user/create');
	
	if (!permCheck.hasPermission) {
		return {
			success: false,
			error: 'Permission denied: Cannot create users',
		};
	}

	try {
		const usersCollection = await getCollection('users');
		const result = await usersCollection.insertOne(data);
		
		return {
			success: true,
			data: { id: result.insertedId },
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

// 更新用户 - 需要权限
export async function updateUserAction(userId, data) {
	const permCheck = await checkActionPermission('/admin/actions/user/update');
	
	if (!permCheck.hasPermission) {
		return {
			success: false,
			error: 'Permission denied: Cannot update users',
		};
	}

	try {
		const usersCollection = await getCollection('users');
		const result = await usersCollection.updateOne(
			{ id: userId },
			{ $set: data }
		);
		
		return {
			success: true,
			data: { modifiedCount: result.modifiedCount },
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

// 删除用户 - 需要权限
export async function deleteUserAction(userId) {
	const permCheck = await checkActionPermission('/admin/actions/user/delete');
	
	if (!permCheck.hasPermission) {
		return {
			success: false,
			error: 'Permission denied: Cannot delete users',
		};
	}

	try {
		const usersCollection = await getCollection('users');
		const result = await usersCollection.deleteOne({ id: userId });
		
		return {
			success: true,
			data: { deletedCount: result.deletedCount },
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}
```

#### 步骤5: 创建页面组件

**文件**: `app/(admin)/admin/users/page.jsx`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/use-permission';
import {
	getUserListAction,
	createUserAction,
	updateUserAction,
	deleteUserAction,
} from '@/app/(admin)/actions/user/admin-users-protected';

export default function UsersPage() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingUser, setEditingUser] = useState(null);
	const [form] = Form.useForm();
	
	const { hasPermission, isAdmin, loading: permLoading } = usePermission();

	// 加载用户列表
	const loadUsers = async () => {
		setLoading(true);
		const result = await getUserListAction();
		if (result.success) {
			setUsers(result.data);
		}
		setLoading(false);
	};

	useEffect(() => {
		loadUsers();
	}, []);

	// 创建用户
	const handleCreate = () => {
		setEditingUser(null);
		form.resetFields();
		setModalVisible(true);
	};

	// 编辑用户
	const handleEdit = (user) => {
		setEditingUser(user);
		form.setFieldsValue(user);
		setModalVisible(true);
	};

	// 删除用户
	const handleDelete = async (userId) => {
		Modal.confirm({
			title: 'Delete User',
			content: 'Are you sure you want to delete this user?',
			okText: 'Delete',
			okType: 'danger',
			onOk: async () => {
				const result = await deleteUserAction(userId);
				if (result.success) {
					message.success('User deleted successfully');
					loadUsers();
				} else {
					message.error(result.error);
				}
			},
		});
	};

	// 提交表单
	const handleSubmit = async (values) => {
		const result = editingUser
			? await updateUserAction(editingUser.id, values)
			: await createUserAction(values);

		if (result.success) {
			message.success(
				editingUser ? 'User updated successfully' : 'User created successfully'
			);
			setModalVisible(false);
			loadUsers();
		} else {
			message.error(result.error);
		}
	};

	// 表格列定义
	const columns = [
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: 'Email',
			dataIndex: 'email',
			key: 'email',
		},
		{
			title: 'Role',
			dataIndex: 'role',
			key: 'role',
		},
		{
			title: 'Actions',
			key: 'actions',
			render: (_, record) => (
				<Space>
					{/* 编辑按钮 - 需要权限 */}
					{hasPermission('user-update') && (
						<Button
							icon={<EditOutlined />}
							onClick={() => handleEdit(record)}
						>
							Edit
						</Button>
					)}
					
					{/* 删除按钮 - 需要权限 */}
					{hasPermission('user-delete') && (
						<Button
							danger
							icon={<DeleteOutlined />}
							onClick={() => handleDelete(record.id)}
						>
							Delete
						</Button>
					)}
				</Space>
			),
		},
	];

	if (permLoading) {
		return <div>Loading permissions...</div>;
	}

	return (
		<div style={{ padding: 24 }}>
			<div style={{ marginBottom: 16 }}>
				<Space>
					{/* 创建按钮 - 需要权限 */}
					{hasPermission('user-create') && (
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={handleCreate}
						>
							Create User
						</Button>
					)}
				</Space>
			</div>

			<Table
				columns={columns}
				dataSource={users}
				loading={loading}
				rowKey="id"
			/>

			{/* 创建/编辑弹窗 */}
			<Modal
				title={editingUser ? 'Edit User' : 'Create User'}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				onOk={() => form.submit()}
			>
				<Form form={form} onFinish={handleSubmit} layout="vertical">
					<Form.Item
						name="name"
						label="Name"
						rules={[{ required: true }]}
					>
						<Input />
					</Form.Item>
					<Form.Item
						name="email"
						label="Email"
						rules={[{ required: true, type: 'email' }]}
					>
						<Input />
					</Form.Item>
					{/* 只有 Admin 可以修改角色 */}
					{isAdmin && (
						<Form.Item name="role" label="Role">
							<Input />
						</Form.Item>
					)}
				</Form>
			</Modal>
		</div>
	);
}
```

---

## 最佳实践

### 1. 权限粒度设计

#### ✅ 推荐

```
用户管理
├── 创建用户
├── 编辑用户
├── 删除用户
└── 查看用户
```

**优点**: 粒度适中，易于管理

#### ❌ 不推荐

```
用户管理  # 粒度太粗
用户管理 → 编辑姓名字段  # 粒度太细
```

### 2. Action 路径命名

#### ✅ 推荐

```javascript
// 使用模块化的路径结构
'/admin/actions/user/create'
'/admin/actions/user/update'
'/admin/actions/user/delete'
```

#### ❌ 不推荐

```javascript
// 路径混乱，难以管理
'/createUser'
'/admin/updateUser'
'/actions/user_delete'
```

### 3. 通配符使用

#### ✅ 推荐

```javascript
// 精确路径或单层通配
actions: ['/admin/actions/user/create']
actions: ['/admin/actions/user/*']
```

#### ⚠️ 谨慎使用

```javascript
// 多层通配，权限范围太大
actions: ['/admin/actions/**']
actions: ['/**']  // 全局通配（危险）
```

### 4. 前端权限控制策略

#### 显示 vs 隐藏

根据场景选择合适的策略：

```javascript
// 场景1: 完全隐藏（用户不知道功能存在）
{hasPermission('user-delete') && (
  <Button>Delete</Button>
)}

// 场景2: 禁用但显示（让用户知道功能存在但需要权限）
<Button disabled={!hasPermission('user-delete')}>
  Delete {!hasPermission('user-delete') && '(需要权限)'}
</Button>
```

### 5. 错误处理

在 Server Actions 中提供清晰的错误信息：

```javascript
if (!permCheck.hasPermission) {
	return {
		success: false,
		error: 'Permission denied: You need "user-create" permission to create users',
		//      ↑ 清晰的错误信息，告诉用户需要什么权限
	};
}
```

### 6. 性能优化

#### 前端缓存权限

```javascript
// ✅ Hook 已自动缓存权限，避免重复请求
const { hasPermission } = usePermission();

// ✅ 多次调用不会重复请求
{hasPermission('perm-1') && <Button>Action 1</Button>}
{hasPermission('perm-2') && <Button>Action 2</Button>}
```

#### 批量权限检查

```javascript
// ✅ 使用 hasAnyPermission 一次检查多个权限
const canEdit = hasAnyPermission(['user-create', 'user-update']);

// ❌ 避免多次单独检查
const canEdit = hasPermission('user-create') || hasPermission('user-update');
```

### 7. 安全建议

#### Server Actions 必须验证权限

```javascript
// ✅ 正确：在 Server Action 中验证权限
export async function deleteUserAction(userId) {
	const permCheck = await checkActionPermission('/admin/actions/user/delete');
	if (!permCheck.hasPermission) {
		return { success: false, error: 'Permission denied' };
	}
	// 执行删除
}

// ❌ 错误：只在前端隐藏按钮，没有后端验证
// 恶意用户可以直接调用 Action
export async function deleteUserAction(userId) {
	// 直接执行删除，没有权限验证
}
```

#### 永远不要信任前端

- 前端权限控制只是为了提升用户体验
- 后端 Server Actions 必须进行权限验证
- 敏感操作必须有审计日志

---

## 常见问题

### Q1: Admin 角色和 RBAC 角色有什么区别？

**A**: 

- `role: 'admin'` (Better Auth): 基础角色，拥有所有权限
- `roles: ['role-uuid']` (RBAC): 自定义角色，可精细控制权限

两者可以共存。

### Q2: 如何实现"用户只能编辑自己的数据"？

**A**: 在 Server Action 中添加所有权检查：

```javascript
export async function updateProfileAction(userId, data) {
	const session = await auth.api.getSession({ headers: await headers() });
	
	// 允许用户编辑自己的数据
	if (session.user.id === userId) {
		// 执行更新
		return { success: true };
	}
	
	// 编辑其他用户需要权限
	const permCheck = await checkActionPermission('/admin/actions/user/update');
	if (!permCheck.hasPermission) {
		return { success: false, error: 'Permission denied' };
	}
	
	// 执行更新
	return { success: true };
}
```

### Q3: 如何调试权限问题？

**A**: 

1. 检查用户的角色：使用 `getUserRolesAction()`
2. 检查角色的权限：查看角色详情页
3. 检查权限的 Actions 配置：查看权限详情页
4. 检查 Action 路径是否匹配：在浏览器控制台查看错误信息

---

## 相关文档

- [RBAC 系统配置指南](./RBAC_SYSTEM.md) - 管理员配置权限的指南
- [数据库 API 文档](../database/DB_API_GUIDE.md) - 数据库操作文档
- [Smart CRUD 开发指南](../admin/SMART_CRUD_GUIDE.md) - 快速开发 CRUD 页面

---

## 许可证

MIT License

