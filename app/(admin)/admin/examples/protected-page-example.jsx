'use client';

/**
 * Protected Page Example
 * 
 * 这个页面展示了如何在前端使用 RBAC 权限
 * 
 * 功能：
 * 1. 根据权限显示/隐藏按钮
 * 2. 根据权限禁用功能
 * 3. 根据角色显示不同内容
 */

import { useState } from 'react';
import { Card, Button, Space, Alert, Spin, Tag, Divider } from 'antd';
import { 
	PlusOutlined, 
	EditOutlined, 
	DeleteOutlined, 
	EyeOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined 
} from '@ant-design/icons';
import { usePermission, usePageAccess } from '@/hooks/use-permission';

export default function ProtectedPageExample() {
	const { permissions, isAdmin, loading, hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();
	const pageAccess = usePageAccess('/admin/examples/protected-page-example');
	const [actionResult, setActionResult] = useState(null);

	// 示例：定义一些权限 ID（实际项目中应该从权限管理系统获取）
	const PERMISSIONS = {
		CREATE: 'example-create-permission',
		READ: 'example-read-permission',
		UPDATE: 'example-update-permission',
		DELETE: 'example-delete-permission',
		ADMIN: 'example-admin-permission',
	};

	if (loading) {
		return (
			<div style={{ padding: 24, textAlign: 'center' }}>
				<Spin size="large" />
			</div>
		);
	}

	// 示例 Action 处理函数
	const handleAction = async (actionName) => {
		setActionResult({
			type: 'success',
			message: `${actionName} action executed successfully!`,
		});

		setTimeout(() => setActionResult(null), 3000);
	};

	return (
		<div style={{ padding: 24 }}>
			<h1>Protected Page Example - RBAC 权限示例</h1>
			
			{/* 用户权限状态 */}
			<Card title="User Permission Status" style={{ marginBottom: 24 }}>
				<Space direction="vertical" size="middle" style={{ width: '100%' }}>
					<div>
						<strong>Role:</strong> {isAdmin ? <Tag color="red">Admin</Tag> : <Tag color="blue">User</Tag>}
					</div>
					<div>
						<strong>Permissions:</strong>
						{permissions.length > 0 ? (
							<div style={{ marginTop: 8 }}>
								{permissions.includes('*') ? (
									<Tag color="gold">All Permissions (Admin)</Tag>
								) : (
									permissions.map((perm) => (
										<Tag key={perm} color="green" style={{ marginBottom: 4 }}>
											{perm}
										</Tag>
									))
								)}
							</div>
						) : (
							<Tag color="red">No Permissions</Tag>
						)}
					</div>
					<div>
						<strong>Page Access:</strong>
						{pageAccess.loading ? (
							<Tag>Checking...</Tag>
						) : pageAccess.hasAccess ? (
							<Tag color="green" icon={<CheckCircleOutlined />}>
								Granted
							</Tag>
						) : (
							<Tag color="red" icon={<CloseCircleOutlined />}>
								Denied
							</Tag>
						)}
					</div>
				</Space>
			</Card>

			{/* 操作结果提示 */}
			{actionResult && (
				<Alert
					message={actionResult.message}
					type={actionResult.type}
					showIcon
					closable
					style={{ marginBottom: 24 }}
					onClose={() => setActionResult(null)}
				/>
			)}

			{/* 示例 1: 基于单个权限的按钮显示 */}
			<Card title="Example 1: 基于单个权限的按钮" style={{ marginBottom: 24 }}>
				<Space wrap>
					{/* 只有拥有创建权限的用户才能看到此按钮 */}
					{hasPermission(PERMISSIONS.CREATE) && (
						<Button 
							type="primary" 
							icon={<PlusOutlined />}
							onClick={() => handleAction('Create')}
						>
							Create (需要 {PERMISSIONS.CREATE})
						</Button>
					)}

					{/* 只有拥有编辑权限的用户才能看到此按钮 */}
					{hasPermission(PERMISSIONS.UPDATE) && (
						<Button 
							icon={<EditOutlined />}
							onClick={() => handleAction('Edit')}
						>
							Edit (需要 {PERMISSIONS.UPDATE})
						</Button>
					)}

					{/* 只有拥有删除权限的用户才能看到此按钮 */}
					{hasPermission(PERMISSIONS.DELETE) && (
						<Button 
							danger 
							icon={<DeleteOutlined />}
							onClick={() => handleAction('Delete')}
						>
							Delete (需要 {PERMISSIONS.DELETE})
						</Button>
					)}

					{/* 所有用户都能看到查看按钮 */}
					<Button 
						icon={<EyeOutlined />}
						onClick={() => handleAction('View')}
					>
						View (无需权限)
					</Button>
				</Space>

				<Divider />

				<Alert
					message="说明"
					description="上面的按钮根据你的权限动态显示。如果你看不到某些按钮，说明你没有对应的权限。"
					type="info"
					showIcon
				/>
			</Card>

			{/* 示例 2: 基于多个权限的条件渲染（OR 逻辑）*/}
			<Card title="Example 2: 拥有任一权限即可访问 (OR Logic)" style={{ marginBottom: 24 }}>
				{hasAnyPermission([PERMISSIONS.CREATE, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]) ? (
					<div>
						<Alert
							message="✅ 你拥有编辑权限"
							description={`你拥有以下权限之一：${PERMISSIONS.CREATE}, ${PERMISSIONS.UPDATE}, ${PERMISSIONS.DELETE}`}
							type="success"
							showIcon
							style={{ marginBottom: 16 }}
						/>
						<Space>
							<Button type="primary">执行编辑操作</Button>
							<Button>查看编辑历史</Button>
						</Space>
					</div>
				) : (
					<Alert
						message="❌ 你没有编辑权限"
						description="你需要拥有创建、更新或删除权限中的至少一个才能访问编辑功能"
						type="error"
						showIcon
					/>
				)}
			</Card>

			{/* 示例 3: 需要所有权限（AND 逻辑）*/}
			<Card title="Example 3: 需要所有权限才能访问 (AND Logic)" style={{ marginBottom: 24 }}>
				{hasAllPermissions([PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]) ? (
					<div>
						<Alert
							message="✅ 你拥有完整的管理权限"
							description={`你拥有读取、更新和删除的所有权限`}
							type="success"
							showIcon
							style={{ marginBottom: 16 }}
						/>
						<Button type="primary" danger>
							执行高级管理操作
						</Button>
					</div>
				) : (
					<Alert
						message="❌ 权限不足"
						description="你需要同时拥有读取、更新和删除权限才能执行高级管理操作"
						type="error"
						showIcon
					/>
				)}
			</Card>

			{/* 示例 4: Admin 专属内容 */}
			<Card title="Example 4: Admin 专属功能" style={{ marginBottom: 24 }}>
				{isAdmin ? (
					<div>
						<Alert
							message="🔑 Admin 专属功能区"
							description="只有管理员才能看到此区域"
							type="warning"
							showIcon
							style={{ marginBottom: 16 }}
						/>
						<Space>
							<Button type="primary" danger>
								系统配置
							</Button>
							<Button danger>
								用户管理
							</Button>
							<Button>
								查看日志
							</Button>
						</Space>
					</div>
				) : (
					<Alert
						message="此功能仅限管理员使用"
						type="info"
						showIcon
					/>
				)}
			</Card>

			{/* 示例 5: 禁用按钮而不是隐藏 */}
			<Card title="Example 5: 禁用按钮（而不是隐藏）" style={{ marginBottom: 24 }}>
				<Alert
					message="说明"
					description="有时候我们希望显示按钮但禁用它，让用户知道这个功能存在但需要权限"
					type="info"
					showIcon
					style={{ marginBottom: 16 }}
				/>
				<Space wrap>
					<Button 
						type="primary"
						icon={<PlusOutlined />}
						disabled={!hasPermission(PERMISSIONS.CREATE)}
						onClick={() => handleAction('Create')}
					>
						创建 {!hasPermission(PERMISSIONS.CREATE) && '(需要权限)'}
					</Button>
					<Button 
						icon={<EditOutlined />}
						disabled={!hasPermission(PERMISSIONS.UPDATE)}
						onClick={() => handleAction('Edit')}
					>
						编辑 {!hasPermission(PERMISSIONS.UPDATE) && '(需要权限)'}
					</Button>
					<Button 
						danger
						icon={<DeleteOutlined />}
						disabled={!hasPermission(PERMISSIONS.DELETE)}
						onClick={() => handleAction('Delete')}
					>
						删除 {!hasPermission(PERMISSIONS.DELETE) && '(需要权限)'}
					</Button>
				</Space>
			</Card>

			{/* 代码示例 */}
			<Card title="Code Examples">
				<pre style={{ 
					background: '#f5f5f5', 
					padding: 16, 
					borderRadius: 4,
					overflow: 'auto' 
				}}>
{`// 1. 使用 usePermission Hook
import { usePermission } from '@/hooks/use-permission';

const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin } = usePermission();

// 2. 根据单个权限显示按钮
{hasPermission('permission-id') && (
  <Button>需要权限的按钮</Button>
)}

// 3. 根据多个权限之一显示内容（OR）
{hasAnyPermission(['perm-1', 'perm-2']) && (
  <div>至少需要一个权限</div>
)}

// 4. 需要所有权限（AND）
{hasAllPermissions(['perm-1', 'perm-2']) && (
  <div>需要所有权限</div>
)}

// 5. Admin 专属
{isAdmin && (
  <Button>Admin Only</Button>
)}

// 6. 禁用而不是隐藏
<Button disabled={!hasPermission('perm-id')}>
  操作按钮
</Button>`}
				</pre>
			</Card>
		</div>
	);
}

