/**
 * CreateUserModal - 创建用户 Modal 组件
 * 
 * 用途：
 * - 管理员创建新用户（包含密码设置）
 * 
 * 特性：
 * - 完整的用户信息表单
 * - 密码强度验证
 * - 邮箱验证
 * - 角色选择
 * - 后台访问权限设置
 * - 初始积分设置
 * 
 * 使用示例：
 * ```jsx
 * <CreateUserModal
 *   visible={visible}
 *   onSave={handleCreateUser}
 *   onCancel={() => setVisible(false)}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * CreateUserModal Props
 * 
 * @param {Boolean} visible - 是否显示 Modal
 * @param {Function} onSave - 保存回调 (userData) => Promise<void>
 * @param {Function} onCancel - 取消回调
 * @param {Number} width - Modal 宽度（默认 600）
 * @param {String} okText - 确认按钮文本
 * @param {String} cancelText - 取消按钮文本
 * @param {Object} defaultValues - 默认值
 * @param {Boolean} showCredits - 是否显示积分设置（默认 true）
 * @param {Boolean} showBackendAccess - 是否显示后台访问设置（默认 true）
 */
export default function CreateUserModal({
	visible,
	onSave,
	onCancel,
	width = 600,
	okText = 'Create User',
	cancelText = 'Cancel',
	defaultValues = {},
	showCredits = true,
	showBackendAccess = true,
}) {
	const [form] = Form.useForm();
	const [confirmLoading, setConfirmLoading] = useState(false);

	// 重置表单
	useEffect(() => {
		if (visible) {
			form.resetFields();
			// 设置默认值
			form.setFieldsValue({
				role: 'user',
				isBackendAllowed: false,
				credits: 0,
				emailVerified: false,
				...defaultValues,
			});
		}
	}, [visible, form, defaultValues]);

	// 提交
	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			setConfirmLoading(true);

			// 调用保存回调
			await onSave(values);

			// 成功后关闭
			form.resetFields();
			if (onCancel) {
				onCancel();
			}
		} catch (error) {
			console.error('[CreateUserModal] Validation or save failed:', error);
			// 验证失败不关闭弹窗
		} finally {
			setConfirmLoading(false);
		}
	};

	// 取消
	const handleCancel = () => {
		form.resetFields();
		if (onCancel) {
			onCancel();
		}
	};

	return (
		<Modal
			title="Create New User"
			open={visible}
			onOk={handleSubmit}
			onCancel={handleCancel}
			confirmLoading={confirmLoading}
			okText={okText}
			cancelText={cancelText}
			destroyOnClose
			width={width}
		>
			<Form
				form={form}
				layout="vertical"
				autoComplete="off"
			>
				{/* 邮箱 */}
				<Form.Item
					name="email"
					label="Email"
					rules={[
						{ required: true, message: 'Please enter email' },
						{ type: 'email', message: 'Invalid email format' },
					]}
					tooltip="User's email address (used for login)"
				>
					<Input
						prefix={<MailOutlined />}
						placeholder="user@example.com"
						autoComplete="off"
					/>
				</Form.Item>

				{/* 密码 */}
				<Form.Item
					name="password"
					label="Password"
					rules={[
						{ required: true, message: 'Please enter password' },
						{ min: 8, message: 'Password must be at least 8 characters' },
						{
							pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
							message: 'Password must contain uppercase, lowercase, and numbers',
						},
					]}
					tooltip="Initial password for the user"
				>
					<Input.Password
						prefix={<LockOutlined />}
						placeholder="Enter password (min 8 characters)"
						autoComplete="new-password"
					/>
				</Form.Item>

				{/* 姓名 */}
				<Form.Item
					name="name"
					label="Full Name"
					rules={[
						{ required: true, message: 'Please enter name' },
						{ min: 2, message: 'Name must be at least 2 characters' },
					]}
				>
					<Input
						prefix={<UserOutlined />}
						placeholder="John Doe"
						autoComplete="off"
					/>
				</Form.Item>

				{/* 用户名 */}
				<Form.Item
					name="username"
					label="Username"
					rules={[
						{ pattern: /^[a-zA-Z0-9_]{3,20}$/, message: 'Username: 3-20 characters (letters, numbers, underscores)' },
					]}
					tooltip="Optional unique username"
				>
					<Input
						placeholder="johndoe"
						autoComplete="off"
					/>
				</Form.Item>

				{/* 系统角色 */}
				<Form.Item
					name="role"
					label="System Role"
					rules={[{ required: true, message: 'Please select role' }]}
					tooltip="User's system role (affects authentication)"
				>
					<Select placeholder="Select role">
						<Option value="user">User (Regular user)</Option>
						<Option value="admin">Admin (Administrator)</Option>
					</Select>
				</Form.Item>

				{/* 后台访问权限 */}
				{showBackendAccess && (
					<Form.Item
						name="isBackendAllowed"
						label="Backend Access"
						valuePropName="checked"
						tooltip="Allow user to access admin backend"
					>
						<Switch
							checkedChildren="Allowed"
							unCheckedChildren="Denied"
						/>
					</Form.Item>
				)}

				{/* 邮箱验证状态 */}
				<Form.Item
					name="emailVerified"
					label="Email Verified"
					valuePropName="checked"
					tooltip="Mark email as verified (skip verification step)"
				>
					<Switch
						checkedChildren="Verified"
						unCheckedChildren="Unverified"
					/>
				</Form.Item>

				{/* 初始积分 */}
				{showCredits && (
					<Form.Item
						name="credits"
						label="Initial Credits"
						rules={[
							{ type: 'number', min: 0, message: 'Credits must be >= 0' },
						]}
						tooltip="Initial credit balance for the user"
					>
						<InputNumber
							min={0}
							step={10}
							style={{ width: '100%' }}
							placeholder="0"
						/>
					</Form.Item>
				)}
			</Form>

			{/* 提示信息 */}
			<div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4, fontSize: 12, color: '#666' }}>
				<strong>Note:</strong>
				<ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
					<li>User will receive a welcome email if email verification is enabled</li>
					<li>Password must be communicated to the user securely</li>
					<li>RBAC roles can be assigned after user creation</li>
				</ul>
			</div>
		</Modal>
	);
}

