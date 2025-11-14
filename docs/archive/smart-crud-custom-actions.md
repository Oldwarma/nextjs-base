# Smart CRUD Page - 自定义行操作配置指南

## 概述

`SmartCrudPage` 组件支持通过 `customRowActions` 配置自定义行操作按钮，包括带确认提示的操作。本文档说明如何配置各种类型的自定义操作。

## 基础配置

### 配置结构

```javascript
const customRowActions = [
	{
		key: 'action-key',           // 唯一标识
		text: 'Action Text',         // 按钮文本（支持函数）
		icon: <IconComponent />,     // 图标组件
		danger: false,               // 是否为危险操作（支持函数）
		disabled: (record) => false, // 是否禁用（函数）
		show: (record) => true,      // 是否显示（函数）
		inMore: false,               // 是否放入"更多"菜单
		showText: false,             // 是否显示文本（平铺按钮时）
		confirm: null,               // 确认配置（对象或函数）
		onClick: (record) => {},     // 点击处理函数
	}
];
```

## 配置属性详解

### 1. `key` (必填)
- **类型**: `string`
- **说明**: 操作的唯一标识符
- **示例**: `'ban-user'`, `'export-data'`

### 2. `text` (必填)
- **类型**: `string | (record) => string`
- **说明**: 按钮显示的文本，支持函数动态计算
- **示例**:
  ```javascript
  // 静态文本
  text: 'Delete User'
  
  // 动态文本
  text: (record) => record.banned ? 'Unban User' : 'Ban User'
  ```

### 3. `icon` (可选)
- **类型**: `ReactNode`
- **说明**: 按钮的图标组件
- **示例**:
  ```javascript
  import { DeleteOutlined, BanOutlined } from '@ant-design/icons';
  
  icon: <DeleteOutlined />
  icon: <BanOutlined />
  ```

### 4. `danger` (可选)
- **类型**: `boolean | (record) => boolean`
- **说明**: 是否为危险操作（红色高亮），支持函数动态计算
- **默认值**: `false`
- **示例**:
  ```javascript
  // 静态值
  danger: true
  
  // 动态值
  danger: (record) => !record.banned  // 未封禁时显示为危险操作
  ```

### 5. `disabled` (可选)
- **类型**: `(record) => boolean`
- **说明**: 按钮是否禁用的判断函数
- **示例**:
  ```javascript
  disabled: (record) => record.status === 'deleted'
  disabled: (record) => !record.canEdit
  ```

### 6. `show` (可选)
- **类型**: `(record) => boolean`
- **说明**: 按钮是否显示的判断函数
- **示例**:
  ```javascript
  show: (record) => record.role !== 'admin'  // 非管理员显示
  show: (record) => record.permissions.includes('delete')
  ```

### 7. `inMore` (可选)
- **类型**: `boolean`
- **说明**: 是否放入"更多"下拉菜单
- **默认值**: `false`
- **示例**:
  ```javascript
  inMore: true   // 放入"更多"菜单
  inMore: false  // 平铺显示
  ```

### 8. `showText` (可选)
- **类型**: `boolean`
- **说明**: 平铺显示时是否显示文本（仅在 `inMore: false` 时有效）
- **默认值**: `false`
- **示例**:
  ```javascript
  showText: true   // 显示图标 + 文本
  showText: false  // 仅显示图标
  ```

### 9. `confirm` (可选) - **核心功能**
- **类型**: `object | (record) => object`
- **说明**: 确认对话框配置，支持静态对象或函数返回动态配置
- **在 `inMore: false` 时使用 `Popconfirm`（气泡确认）**
- **在 `inMore: true` 时使用 `Modal.confirm`（模态确认）**

#### 确认配置对象结构

```javascript
{
	title: 'Confirmation Title',              // 对话框标题
	description: 'Confirmation description',  // 详细说明
	okText: 'OK',                             // 确认按钮文本
	okType: 'primary',                        // 确认按钮类型: 'primary' | 'danger'
	cancelText: 'Cancel',                     // 取消按钮文本
	placement: 'topRight',                    // 弹出位置
}
```

#### 示例：静态确认配置

```javascript
{
	key: 'delete',
	text: 'Delete',
	icon: <DeleteOutlined />,
	danger: true,
	confirm: {
		title: 'Delete Confirmation',
		description: 'Are you sure you want to delete this record? This action cannot be undone.',
		okText: 'Delete',
		okType: 'danger',
		cancelText: 'Cancel',
		placement: 'topRight',
	},
	onClick: handleDelete,
}
```

#### 示例：动态确认配置

```javascript
{
	key: 'toggle-ban',
	text: (record) => record.banned ? 'Unban User' : 'Ban User',
	icon: <BanOutlined />,
	danger: (record) => !record.banned,
	showText: true,
	confirm: (record) => ({
		title: record.banned ? 'Unban User' : 'Ban User',
		description: record.banned 
			? `Are you sure you want to unban "${record.name}"? They will be able to sign in again.`
			: `Are you sure you want to ban "${record.name}"? This will revoke all active sessions.`,
		okText: record.banned ? 'Unban' : 'Ban',
		okType: record.banned ? 'primary' : 'danger',
		cancelText: 'Cancel',
		placement: 'topRight',
	}),
	onClick: handleToggleBan,
}
```

### 10. `onClick` (必填)
- **类型**: `(record) => void | Promise<void>`
- **说明**: 点击按钮时的处理函数，接收当前行数据
- **示例**:
  ```javascript
  onClick: async (record) => {
  	const result = await deleteUserAction(record.id);
  	if (result.success) {
  		message.success('Deleted successfully');
  	}
  }
  ```

## 完整示例

### 用户管理页面示例

```javascript
import { TeamOutlined, KeyOutlined, BanOutlined } from '@ant-design/icons';

const customRowActions = [
	// 1. 分配角色 - 无确认提示，放入"更多"菜单
	{
		key: 'assign-roles',
		text: 'Assign Roles',
		icon: <TeamOutlined />,
		inMore: true,
		onClick: (record) => {
			setSelectedUser(record);
			setRoleModalVisible(true);
		},
	},
	
	// 2. 重置密码 - 无确认提示，放入"更多"菜单
	{
		key: 'reset-password',
		text: 'Reset Password',
		icon: <KeyOutlined />,
		inMore: true,
		onClick: (record) => {
			setSelectedUserId(record.id);
			setPasswordModalVisible(true);
		},
	},
	
	// 3. 封禁/解封用户 - 带确认提示，平铺显示
	{
		key: 'toggle-ban',
		text: (record) => record.banned ? 'Unban User' : 'Ban User',
		icon: <BanOutlined />,
		danger: (record) => !record.banned,
		showText: true,
		confirm: (record) => ({
			title: record.banned ? 'Unban User' : 'Ban User',
			description: record.banned 
				? `Are you sure you want to unban "${record.name || record.email}"? They will be able to sign in again.`
				: `Are you sure you want to ban "${record.name || record.email}"? This will revoke all active sessions and prevent sign-in.`,
			okText: record.banned ? 'Unban' : 'Ban',
			okType: record.banned ? 'primary' : 'danger',
			cancelText: 'Cancel',
			placement: 'topRight',
		}),
		onClick: async (record) => {
			const result = record.banned 
				? await unbanUserAction(record.id)
				: await banUserAction(record.id, 'Banned by administrator');
			
			if (result.success) {
				message.success(record.banned ? 'User unbanned' : 'User banned');
				setRefreshTrigger(prev => prev + 1);
			}
		},
	},
];
```

## 使用场景对比

### 场景 1: 无需确认的快速操作

**适用**: 打开弹窗、跳转页面、查看详情等非破坏性操作

```javascript
{
	key: 'view-details',
	text: 'View Details',
	icon: <EyeOutlined />,
	inMore: true,
	onClick: (record) => router.push(`/users/${record.id}`),
}
```

### 场景 2: 需要确认的破坏性操作

**适用**: 删除、封禁、清空数据等不可逆操作

```javascript
{
	key: 'delete',
	text: 'Delete',
	icon: <DeleteOutlined />,
	danger: true,
	confirm: {
		title: 'Delete Confirmation',
		description: 'This action cannot be undone.',
		okText: 'Delete',
		okType: 'danger',
	},
	onClick: handleDelete,
}
```

### 场景 3: 状态切换操作（带动态确认）

**适用**: 启用/禁用、上线/下线、封禁/解封等状态切换

```javascript
{
	key: 'toggle-status',
	text: (record) => record.enabled ? 'Disable' : 'Enable',
	icon: <PoweroffOutlined />,
	danger: (record) => record.enabled,
	showText: true,
	confirm: (record) => ({
		title: record.enabled ? 'Disable Item' : 'Enable Item',
		description: `Are you sure you want to ${record.enabled ? 'disable' : 'enable'} this item?`,
		okText: record.enabled ? 'Disable' : 'Enable',
		okType: record.enabled ? 'danger' : 'primary',
	}),
	onClick: handleToggleStatus,
}
```

## 最佳实践

### 1. 确认提示的使用原则

- ✅ **使用确认提示**: 删除、封禁、清空、批量操作等不可逆或高风险操作
- ❌ **不使用确认提示**: 打开弹窗、查看详情、跳转页面等安全操作

### 2. 按钮布局建议

- **平铺显示** (`inMore: false`): 
  - 常用操作（编辑、删除）
  - 状态切换操作（启用/禁用）
  - 最多 3-4 个按钮
  
- **更多菜单** (`inMore: true`):
  - 次要操作（分配角色、重置密码）
  - 低频操作（导出、归档）
  - 避免表格行操作区域过宽

### 3. 动态属性使用场景

```javascript
// 根据状态动态显示文本
text: (record) => record.status === 'active' ? 'Deactivate' : 'Activate'

// 根据权限动态禁用
disabled: (record) => !record.permissions.includes('edit')

// 根据角色动态显示
show: (record) => record.role !== 'admin'

// 根据状态动态设置危险样式
danger: (record) => record.status === 'active'
```

### 4. 错误处理

```javascript
onClick: async (record) => {
	try {
		const result = await someAction(record.id);
		if (result.success) {
			message.success('Operation successful');
			setRefreshTrigger(prev => prev + 1);  // 刷新列表
		} else {
			message.error(result.error || 'Operation failed');
		}
	} catch (error) {
		console.error('Operation error:', error);
		message.error('Operation failed');
	}
}
```

## 常见问题

### Q1: 平铺按钮和"更多"菜单的确认提示有什么区别？

**A**: 
- **平铺按钮** (`inMore: false`): 使用 `Popconfirm` 组件，显示为气泡确认框
- **"更多"菜单** (`inMore: true`): 使用 `Modal.confirm`，显示为模态对话框

两种方式都支持 `confirm` 配置，可以根据 UI 需求选择。

### Q2: 为什么我的确认提示不显示？

**A**: 检查以下几点：
1. 确保 `confirm` 配置正确（对象或函数）
2. 如果使用函数形式，确保返回了完整的配置对象
3. 检查控制台是否有错误信息

### Q3: "更多"菜单中的确认对话框和平铺按钮的有什么视觉区别？

**A**: 
- **平铺按钮** (`inMore: false`): 使用 `Popconfirm`，显示为轻量级的气泡确认框，适合快速确认
- **"更多"菜单** (`inMore: true`): 使用 `Modal.confirm`，显示为居中的模态对话框，更醒目，适合重要操作

示例：
```javascript
// 平铺按钮 - 气泡确认
{
	key: 'delete',
	text: 'Delete',
	inMore: false,  // 平铺显示
	confirm: { title: 'Delete?', description: 'Are you sure?' },
}

// 更多菜单 - 模态确认
{
	key: 'ban',
	text: 'Ban User',
	inMore: true,  // 放入菜单
	confirm: { title: 'Ban User', description: 'This will revoke all sessions.' },
}
```

### Q4: 动态文本不更新？

**A**: 确保 `text` 使用函数形式 `text: (record) => ...`，而不是静态字符串。

### Q5: 如何根据权限显示/隐藏按钮？

**A**: 使用 `show` 属性：
```javascript
show: (record) => {
	// 检查用户权限
	return checkPermission('user.ban');
}
```

## 技术实现说明

### Smart CRUD Page 内部逻辑

1. **动态属性计算**: 在渲染时计算 `text` 和 `danger` 函数
2. **条件渲染**: 根据 `show` 函数过滤操作
3. **确认提示**: 
   - 平铺按钮 (`inMore: false`): 使用 Ant Design 的 `Popconfirm` 组件包裹按钮
   - 更多菜单 (`inMore: true`): 在 `onClick` 中调用 `Modal.confirm`
4. **事件处理**: 自动处理 `stopPropagation` 防止触发行点击

### 扩展性

如需更复杂的交互（如多步骤确认、自定义弹窗），可以：

1. 不使用 `confirm` 配置
2. 在 `onClick` 中手动调用 `Modal.confirm()` 或自定义 Modal

```javascript
onClick: (record) => {
	Modal.confirm({
		title: 'Complex Confirmation',
		content: (
			<div>
				<p>Custom content</p>
				<Input placeholder="Enter reason" />
			</div>
		),
		onOk: async () => {
			// 执行操作
		},
	});
}
```

## 更新日志

- **2025-11-06**: 新增 `confirm` 配置支持，实现可配置的确认提示
- **2025-11-06**: 支持 `text` 和 `danger` 属性的函数形式
- **2025-11-06**: 完善文档，添加完整示例和最佳实践

