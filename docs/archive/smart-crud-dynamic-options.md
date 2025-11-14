# SmartCrudPage 动态选项配置指南

## 概述

本文档说明如何在 SmartCrudPage 的搜索表单中使用动态加载的下拉选项，而不是手动输入。这适用于具有固定选项集的字段，如角色、状态、分类等。

## 使用场景

- **角色选择**: 从数据库动态加载所有可用角色
- **状态筛选**: 显示固定的状态选项（Active/Inactive）
- **分类过滤**: 从 API 获取所有分类
- **用户选择**: 动态加载用户列表
- **标签筛选**: 从数据库获取所有标签

## 实现方式

### 方案 1: 静态选项（固定选项）

**适用场景**: 选项固定，不需要从 API 获取

```javascript
const fieldsConfig = [
	{
		key: 'status',
		title: 'Status',
		type: 'select',  // ✅ 使用 select 类型
		options: [
			{ label: 'Active', value: 'active' },
			{ label: 'Inactive', value: 'inactive' },
			{ label: 'Pending', value: 'pending' },
		],
		search: {
			enabled: true,
			mode: 'exact',  // 精确匹配
		}
	}
];
```

### 方案 2: 动态选项（从 API 加载）⭐

**适用场景**: 选项需要从数据库或 API 动态获取

#### 步骤 1: 定义状态存储选项数据

```javascript
export default function UsersManagementPage() {
	const [roleOptions, setRoleOptions] = useState([]);
	const [rolesLoaded, setRolesLoaded] = useState(false);
	
	// ... 其他状态
}
```

#### 步骤 2: 使用 useEffect 加载选项

```javascript
useEffect(() => {
	const loadRoleOptions = async () => {
		try {
			const result = await getRoleListForSelectAction({ withLabel: true });
			
			if (result.success) {
				const roles = result.data || [];
				
				// 转换为 select 组件需要的格式
				const options = roles
					.filter(role => role && role.id && role.enable)  // 只包含启用的
					.map(role => ({
						label: String(role.label || role.name || 'Unknown'),
						value: String(role.id),
					}));
				
				setRoleOptions(options);
				setRolesLoaded(true);
			}
		} catch (error) {
			console.error('Failed to load roles:', error);
			setRolesLoaded(true);
		}
	};
	
	loadRoleOptions();
}, []);  // ✅ 空依赖数组，只在组件挂载时加载一次
```

#### 步骤 3: 在 fieldsConfig 中使用动态选项

```javascript
const fieldsConfig = useMemo(() => [
	{
		key: 'roles',
		title: 'Roles',
		type: 'select',  // ✅ 使用 select 类型
		options: roleOptions,  // ✅ 使用动态加载的选项
		form: {
			mode: 'multiple',  // 多选模式
			placeholder: 'Select roles',
		},
		search: {
			enabled: true,
			mode: 'in',  // 数组包含查询（MongoDB $in 操作符）
			placeholder: 'Filter by roles',
			fieldProps: {
				mode: 'multiple',  // 搜索时也支持多选
				loading: !rolesLoaded,  // ✅ 加载中状态
			},
		},
	}
], [roleOptions, rolesLoaded]);  // ✅ 依赖动态选项
```

## 完整示例

### 用户管理页面 - 角色筛选

```javascript
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getRoleListForSelectAction } from '@/app/(admin)/actions/rbac/admin-roles';

export default function UsersManagementPage() {
	// 1. 定义状态
	const [roleOptions, setRoleOptions] = useState([]);
	const [rolesLoaded, setRolesLoaded] = useState(false);
	
	// 2. 加载选项
	useEffect(() => {
		const loadRoleOptions = async () => {
			try {
				const result = await getRoleListForSelectAction({ withLabel: true });
				
				if (result.success) {
					const roles = result.data || [];
					
					// 转换为 select 格式
					const options = roles
						.filter(role => role && role.id && role.enable)
						.map(role => ({
							label: String(role.label || role.name),
							value: String(role.id),
						}));
					
					setRoleOptions(options);
				}
			} catch (error) {
				console.error('Failed to load roles:', error);
			} finally {
				setRolesLoaded(true);
			}
		};
		
		loadRoleOptions();
	}, []);
	
	// 3. 配置字段（使用 useMemo）
	const fieldsConfig = useMemo(() => [
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			search: { enabled: true, mode: 'like' }
		},
		{
			key: 'roles',
			title: 'Roles',
			type: 'select',
			options: roleOptions,  // ✅ 动态选项
			search: {
				enabled: true,
				mode: 'in',
				fieldProps: {
					mode: 'multiple',
					loading: !rolesLoaded,  // ✅ 显示加载状态
				},
			},
		},
	], [roleOptions, rolesLoaded]);
	
	// 4. 渲染 SmartCrudPage
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			title="User Management"
		/>
	);
}
```

## 搜索模式配置

### 单选精确匹配

```javascript
{
	key: 'status',
	type: 'select',
	options: statusOptions,
	search: {
		enabled: true,
		mode: 'exact',  // 精确匹配
	}
}
```

**生成的查询**：
```javascript
whereJson: { status: 'active' }
```

### 多选数组包含

```javascript
{
	key: 'roles',
	type: 'select',
	options: roleOptions,
	search: {
		enabled: true,
		mode: 'in',  // 数组包含（MongoDB $in）
		fieldProps: {
			mode: 'multiple',  // 多选
		},
	}
}
```

**生成的查询**：
```javascript
whereJson: { roles: ['role-id-1', 'role-id-2'] }
```

**DAO 层处理**（自动转换为 MongoDB $in 查询）：
```javascript
{ roles: { $in: ['role-id-1', 'role-id-2'] } }
```

## 性能优化

### 1. 只加载一次（组件挂载时）

```javascript
useEffect(() => {
	loadOptions();
}, []);  // ✅ 空依赖数组
```

### 2. 显示加载状态

```javascript
search: {
	fieldProps: {
		loading: !optionsLoaded,  // ✅ 加载中时显示 loading
	},
}
```

### 3. 使用 useMemo 避免重复渲染

```javascript
const fieldsConfig = useMemo(() => [
	// ... 字段配置
], [roleOptions, rolesLoaded]);  // ✅ 只在选项变化时重新生成
```

### 4. 异步加载不阻塞页面

```javascript
useEffect(() => {
	// ✅ 异步加载，不阻塞主渲染
	loadOptions();
}, []);

// 页面会先渲染（搜索框显示 loading），然后加载选项
```

## 高级用法

### 1. 多个动态选项字段

```javascript
const [roleOptions, setRoleOptions] = useState([]);
const [categoryOptions, setCategoryOptions] = useState([]);
const [statusOptions, setStatusOptions] = useState([]);

useEffect(() => {
	// 并行加载多个选项
	Promise.all([
		loadRoleOptions(),
		loadCategoryOptions(),
		loadStatusOptions(),
	]);
}, []);

const fieldsConfig = useMemo(() => [
	{ key: 'roles', type: 'select', options: roleOptions },
	{ key: 'category', type: 'select', options: categoryOptions },
	{ key: 'status', type: 'select', options: statusOptions },
], [roleOptions, categoryOptions, statusOptions]);
```

### 2. 选项带颜色标签

```javascript
const options = [
	{ label: 'Active', value: 'active', color: 'green' },
	{ label: 'Inactive', value: 'inactive', color: 'gray' },
	{ label: 'Pending', value: 'pending', color: 'orange' },
];

// 在表格中会自动显示带颜色的 Tag
```

### 3. 选项分组

```javascript
const options = [
	{
		label: 'System Roles',
		options: [
			{ label: 'Admin', value: 'admin' },
			{ label: 'User', value: 'user' },
		],
	},
	{
		label: 'Custom Roles',
		options: [
			{ label: 'Editor', value: 'editor' },
			{ label: 'Viewer', value: 'viewer' },
		],
	},
];
```

### 4. 可搜索选项

```javascript
{
	key: 'user',
	type: 'select',
	options: userOptions,  // 可能有很多用户
	search: {
		enabled: true,
		mode: 'exact',
		fieldProps: {
			showSearch: true,  // ✅ 启用搜索
			filterOption: (input, option) =>
				option.label.toLowerCase().includes(input.toLowerCase()),
		},
	},
}
```

### 5. 远程搜索（输入时实时查询）

```javascript
const [searchOptions, setSearchOptions] = useState([]);

const handleSearch = async (value) => {
	if (value) {
		const result = await searchUsersAction({ keyword: value });
		if (result.success) {
			setSearchOptions(result.data.map(u => ({
				label: u.name,
				value: u.id,
			})));
		}
	}
};

{
	key: 'user',
	type: 'select',
	options: searchOptions,
	search: {
		enabled: true,
		fieldProps: {
			showSearch: true,
			onSearch: handleSearch,  // ✅ 输入时触发远程搜索
			filterOption: false,  // 禁用本地过滤
		},
	},
}
```

## 常见问题

### Q1: 选项加载慢，影响页面显示？

**A**: 使用异步加载 + loading 状态，不会阻塞页面：

```javascript
search: {
	fieldProps: {
		loading: !optionsLoaded,  // 加载中时显示 spinner
	},
}
```

### Q2: 如何重新加载选项？

**A**: 调用加载函数或添加依赖：

```javascript
useEffect(() => {
	loadOptions();
}, [someRefreshTrigger]);  // 当 trigger 变化时重新加载
```

### Q3: 选项数据格式不对怎么办？

**A**: 确保转换为标准格式：

```javascript
const options = data.map(item => ({
	label: String(item.name),  // 显示文本
	value: String(item.id),    // 值
}));
```

### Q4: 如何在搜索和表单中使用不同的选项？

**A**: 分别配置：

```javascript
{
	key: 'roles',
	type: 'select',
	options: formRoleOptions,  // 表单中的选项（可能包含所有）
	search: {
		enabled: true,
		options: searchRoleOptions,  // 搜索中的选项（可能只包含常用）
	},
}
```

## 最佳实践

1. ✅ 使用 `useState` + `useEffect` 异步加载选项
2. ✅ 使用 `useMemo` 包裹 `fieldsConfig` 并声明依赖
3. ✅ 显示 `loading` 状态，提升用户体验
4. ✅ 在 `useEffect` 的 `finally` 中设置 `loaded` 状态
5. ✅ 并行加载多个选项数据（使用 `Promise.all`）
6. ✅ 过滤掉无效数据（如已禁用的选项）
7. ✅ 使用 `String()` 确保 `label` 和 `value` 是字符串
8. ✅ 对于大量选项，使用 `showSearch` 启用搜索功能

## 参考资料

- [Ant Design Select](https://ant.design/components/select-cn)
- [SmartCrudPage 文档](./smart-crud-page.md)
- [CRUD Actions 参数规范](./crud-actions-params-standard.md)

