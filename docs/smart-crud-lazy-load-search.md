# SmartCrudPage 搜索字段延迟加载指南

## 概述

当查询表单中有多个需要远程获取数据的下拉选项字段时,会导致页面初始加载变慢。为了优化性能和用户体验,SmartCrudPage 提供了**搜索字段延迟加载**功能。

> **实际案例**: 用户管理页面原本在页面加载时就获取角色列表,现在改为只在搜索表单展开时才获取,初始加载速度提升明显。
> 
> 参考实现: `app/(admin)/admin/rbac/users/page.js`

## 问题场景

```javascript
// ❌ 问题：多个字段都需要远程获取数据
export default function UsersPage() {
	const [roleOptions, setRoleOptions] = useState([]);
	const [deptOptions, setDeptOptions] = useState([]);
	const [categoryOptions, setCategoryOptions] = useState([]);
	const [statusOptions, setStatusOptions] = useState([]);
	
	// 页面加载时同时发起 4 个请求
	useEffect(() => {
		loadRoleOptions();    // 请求 1
		loadDeptOptions();    // 请求 2
		loadCategoryOptions(); // 请求 3
		loadStatusOptions();  // 请求 4
	}, []);
	
	// 导致页面初始加载很慢 ⏱️
}
```

## 解决方案

使用 `search.lazyLoad` 配置,让某些字段**仅在搜索表单展开时才加载和显示**。

### 工作原理

1. **收起状态**: 标记为 `lazyLoad: true` 的字段不显示,也不会触发数据加载
2. **展开状态**: 用户点击"展开"按钮后,这些字段才显示并加载数据

```
┌─────────────────────────────────────┐
│ 搜索表单 (收起)                      │
│ ┌─────────────┐  ┌─────────────┐   │
│ │ 用户名      │  │ 邮箱        │   │
│ └─────────────┘  └─────────────┘   │
│ [展开 ▼]                            │
└─────────────────────────────────────┘

用户点击"展开" ↓

┌─────────────────────────────────────┐
│ 搜索表单 (展开)                      │
│ ┌─────────────┐  ┌─────────────┐   │
│ │ 用户名      │  │ 邮箱        │   │
│ └─────────────┘  └─────────────┘   │
│ ┌─────────────┐  ┌─────────────┐   │
│ │ 角色 📡     │  │ 部门 📡     │   │ ← 这时才加载远程数据
│ └─────────────┘  └─────────────┘   │
│ [收起 ▲]                            │
└─────────────────────────────────────┘
```

## 使用方法

### 1. 标记需要延迟加载的字段

在字段配置中添加 `search.lazyLoad: true`:

```javascript
const fieldsConfig = [
	// ✅ 普通字段：无需远程数据,默认显示
	{
		key: 'username',
		title: 'Username',
		type: 'text',
		search: {
			enabled: true,
			mode: 'like',
		}
	},
	
	// ✅ 延迟加载字段：需要远程数据,展开时才显示
	{
		key: 'role_ids',
		title: 'Role',
		type: 'select',
		options: roleOptions,
		search: {
			enabled: true,
			mode: 'exact',
			lazyLoad: true, // 🔑 关键配置
		}
	},
	
	// ✅ 延迟加载字段：需要远程数据,展开时才显示
	{
		key: 'department_id',
		title: 'Department',
		type: 'select',
		options: deptOptions,
		search: {
			enabled: true,
			mode: 'exact',
			lazyLoad: true, // 🔑 关键配置
		}
	},
];
```

### 2. 在展开时才加载数据

有两种实现方式:

#### 方式 A: 监听展开状态加载 (推荐)

```javascript
'use client';
import { useState, useEffect, useMemo } from 'react';
import SmartCrudPage from '@/components/admin/smart-crud-page';

export default function UsersPage() {
	const [roleOptions, setRoleOptions] = useState([]);
	const [searchExpanded, setSearchExpanded] = useState(false);
	
	// ✅ 只在搜索表单展开时加载数据
	useEffect(() => {
		if (searchExpanded) {
			loadRoleOptions();
		}
	}, [searchExpanded]);
	
	const loadRoleOptions = async () => {
		const result = await getRolesForSelectAction();
		if (result.success) {
			setRoleOptions(result.data.map(r => ({
				label: r.name,
				value: r.id,
			})));
		}
	};
	
	const fieldsConfig = useMemo(() => [
		{
			key: 'role_ids',
			title: 'Role',
			type: 'select',
			options: roleOptions,
			search: {
				enabled: true,
				lazyLoad: true,
			}
		},
	], [roleOptions]);
	
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			// ✅ 接收展开状态回调
			onSearchExpandChange={setSearchExpanded}
		/>
	);
}
```

#### 方式 B: 条件加载 (自动检测)

SmartCrudPage 内部已经实现了展开状态管理,你也可以让字段在首次展开时自动加载:

```javascript
export default function UsersPage() {
	const [roleOptions, setRoleOptions] = useState([]);
	const [roleOptionsLoaded, setRoleOptionsLoaded] = useState(false);
	
	useEffect(() => {
		// 使用 IntersectionObserver 或其他方式检测字段是否可见
		// 这里简化处理,可以配合 lazyLoad 字段的 fieldProps
	}, []);
	
	const fieldsConfig = useMemo(() => [
		{
			key: 'role_ids',
			title: 'Role',
			type: 'select',
			options: roleOptions,
			search: {
				enabled: true,
				lazyLoad: true,
				fieldProps: {
					loading: !roleOptionsLoaded,
					onDropdownVisibleChange: (open) => {
						if (open && !roleOptionsLoaded) {
							loadRoleOptions();
						}
					},
				},
			}
		},
	], [roleOptions, roleOptionsLoaded]);
}
```

## 完整示例

### 优化前 (性能问题)

```javascript
'use client';
import { useState, useEffect, useMemo } from 'react';

export default function UsersPage() {
	const [roleOptions, setRoleOptions] = useState([]);
	const [deptOptions, setDeptOptions] = useState([]);
	const [categoryOptions, setCategoryOptions] = useState([]);
	
	// ❌ 页面加载时发起 3 个请求,很慢
	useEffect(() => {
		loadRoleOptions();
		loadDeptOptions();
		loadCategoryOptions();
	}, []);
	
	const fieldsConfig = useMemo(() => [
		{
			key: 'username',
			type: 'text',
			search: { enabled: true }
		},
		{
			key: 'role_ids',
			type: 'select',
			options: roleOptions,
			search: { enabled: true }
		},
		{
			key: 'department_id',
			type: 'select',
			options: deptOptions,
			search: { enabled: true }
		},
		{
			key: 'category',
			type: 'select',
			options: categoryOptions,
			search: { enabled: true }
		},
	], [roleOptions, deptOptions, categoryOptions]);
	
	// ...
}
```

### 优化后 (延迟加载)

```javascript
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';

export default function UsersPage() {
	const [roleOptions, setRoleOptions] = useState([]);
	const [deptOptions, setDeptOptions] = useState([]);
	const [categoryOptions, setCategoryOptions] = useState([]);
	const [searchExpanded, setSearchExpanded] = useState(false);
	const [dataLoaded, setDataLoaded] = useState(false);
	
	// ✅ 只在搜索表单展开时加载数据,且只加载一次
	useEffect(() => {
		if (searchExpanded && !dataLoaded) {
			Promise.all([
				loadRoleOptions(),
				loadDeptOptions(),
				loadCategoryOptions(),
			]).then(() => {
				setDataLoaded(true);
			});
		}
	}, [searchExpanded, dataLoaded]);
	
	const loadRoleOptions = async () => {
		const result = await getRolesForSelectAction();
		if (result.success) {
			setRoleOptions(result.data.map(r => ({
				label: r.name,
				value: r.id,
			})));
		}
	};
	
	const loadDeptOptions = async () => {
		const result = await getDepartmentsForSelectAction();
		if (result.success) {
			setDeptOptions(result.data.map(d => ({
				label: d.name,
				value: d.id,
			})));
		}
	};
	
	const loadCategoryOptions = async () => {
		const result = await getCategoriesForSelectAction();
		if (result.success) {
			setCategoryOptions(result.data.map(c => ({
				label: c.name,
				value: c.id,
			})));
		}
	};
	
	const fieldsConfig = useMemo(() => [
		// ✅ 常用字段：默认显示,无需远程数据
		{
			key: 'username',
			title: 'Username',
			type: 'text',
			search: {
				enabled: true,
				mode: 'like',
			}
		},
		
		// ✅ 不常用字段：延迟加载,需要远程数据
		{
			key: 'role_ids',
			title: 'Role',
			type: 'select',
			options: roleOptions,
			search: {
				enabled: true,
				mode: 'exact',
				lazyLoad: true, // 🔑 关键配置
				fieldProps: {
					loading: searchExpanded && !dataLoaded,
					placeholder: 'Select role',
				},
			}
		},
		{
			key: 'department_id',
			title: 'Department',
			type: 'select',
			options: deptOptions,
			search: {
				enabled: true,
				mode: 'exact',
				lazyLoad: true, // 🔑 关键配置
				fieldProps: {
					loading: searchExpanded && !dataLoaded,
					placeholder: 'Select department',
				},
			}
		},
		{
			key: 'category',
			title: 'Category',
			type: 'select',
			options: categoryOptions,
			search: {
				enabled: true,
				mode: 'exact',
				lazyLoad: true, // 🔑 关键配置
				fieldProps: {
					loading: searchExpanded && !dataLoaded,
					placeholder: 'Select category',
				},
			}
		},
	], [roleOptions, deptOptions, categoryOptions, searchExpanded, dataLoaded]);
	
	return (
		<SmartCrudPage
			fieldsConfig={fieldsConfig}
			actions={actions}
			onSearchExpandChange={setSearchExpanded}
		/>
	);
}
```

## 性能对比

### 优化前
- **初始加载**: 发起 3 个远程请求,耗时 ~1500ms
- **用户体验**: 页面加载慢,白屏时间长

### 优化后
- **初始加载**: 不发起额外请求,耗时 ~300ms
- **展开搜索**: 首次展开时才发起 3 个请求,耗时 ~1500ms
- **用户体验**: 页面快速加载,需要高级搜索时才等待

## 最佳实践

### 1. 哪些字段应该使用 lazyLoad?

✅ **适合使用 lazyLoad 的字段**:
- 需要远程获取选项数据的下拉框
- 不常用的高级筛选字段
- 数据量大的下拉选项 (如用户列表、分类树等)
- 依赖其他字段的联动字段

❌ **不适合使用 lazyLoad 的字段**:
- 静态选项的下拉框 (如状态: Active/Inactive)
- 文本输入框
- 日期选择器
- 常用的核心搜索字段

### 2. 缓存已加载的数据

```javascript
const [dataLoaded, setDataLoaded] = useState(false);

useEffect(() => {
	// ✅ 只加载一次,后续收起/展开不会重复加载
	if (searchExpanded && !dataLoaded) {
		loadRemoteData().then(() => setDataLoaded(true));
	}
}, [searchExpanded, dataLoaded]);
```

### 3. 显示加载状态

```javascript
{
	key: 'role_ids',
	type: 'select',
	options: roleOptions,
	search: {
		enabled: true,
		lazyLoad: true,
		fieldProps: {
			loading: searchExpanded && !dataLoaded, // ✅ 显示 loading spinner
			placeholder: 'Select role',
		},
	}
}
```

### 4. 合并多个请求

```javascript
useEffect(() => {
	if (searchExpanded && !dataLoaded) {
		// ✅ 并行加载多个选项数据
		Promise.all([
			loadRoleOptions(),
			loadDeptOptions(),
			loadCategoryOptions(),
		]).then(() => {
			setDataLoaded(true);
		}).catch(error => {
			console.error('Failed to load options:', error);
		});
	}
}, [searchExpanded, dataLoaded]);
```

## 常见问题

### Q1: 用户每次展开都会重新加载数据吗?

**A**: 不会。使用 `dataLoaded` 标志位,确保数据只加载一次:

```javascript
const [dataLoaded, setDataLoaded] = useState(false);

useEffect(() => {
	if (searchExpanded && !dataLoaded) { // ✅ 只加载一次
		loadData().then(() => setDataLoaded(true));
	}
}, [searchExpanded, dataLoaded]);
```

### Q2: 如何强制刷新延迟加载的数据?

**A**: 重置 `dataLoaded` 标志:

```javascript
const handleRefresh = () => {
	setDataLoaded(false);
	setSearchExpanded(true); // 触发重新加载
};
```

### Q3: 能否让某些字段在下拉框打开时才加载?

**A**: 可以,使用 `onDropdownVisibleChange`:

```javascript
{
	key: 'users',
	type: 'select',
	options: userOptions,
	search: {
		enabled: true,
		lazyLoad: true,
		fieldProps: {
			onDropdownVisibleChange: (open) => {
				if (open && userOptions.length === 0) {
					loadUserOptions(); // 打开下拉框时才加载
				}
			},
		},
	}
}
```

### Q4: lazyLoad 会影响表格列吗?

**A**: 不会。`lazyLoad` 只影响搜索表单,不影响表格列的显示。

### Q5: 如何调试延迟加载?

**A**: 可以在控制台监听状态变化:

```javascript
useEffect(() => {
	console.log('Search expanded:', searchExpanded);
}, [searchExpanded]);

useEffect(() => {
	console.log('Data loaded:', dataLoaded);
}, [dataLoaded]);
```

## 总结

延迟加载功能通过以下方式优化性能:

1. ✅ **减少初始请求**: 页面加载时不发起不必要的远程请求
2. ✅ **按需加载**: 只在用户需要高级搜索时才加载数据
3. ✅ **缓存数据**: 加载一次后缓存,不会重复请求
4. ✅ **改善体验**: 页面快速加载,减少白屏时间

**使用建议**: 对于有 3+ 个需要远程数据的搜索字段的页面,强烈推荐使用延迟加载功能。

