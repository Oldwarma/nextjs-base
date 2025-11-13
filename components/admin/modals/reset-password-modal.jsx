/**
 * ResetPasswordModal - 重置密码 Modal 组件
 * 
 * 用途：
 * - 管理员重置用户密码
 * 
 * 特性：
 * - 密码强度验证
 * - 确认密码输入
 * - 密码显示/隐藏切换
 * - 可选的密码生成建议
 * 
 * 使用示例：
 * ```jsx
 * <ResetPasswordModal
 *   visible={visible}
 *   user={selectedUser}
 *   onSave={handleResetPassword}
 *   onCancel={() => setVisible(false)}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, message, Space, Button } from 'antd';
import { LockOutlined, ReloadOutlined } from '@ant-design/icons';

/**
 * ResetPasswordModal Props
 * 
 * @param {Boolean} visible - 是否显示 Modal
 * @param {Object} user - 用户对象 { id, name, email }
 * @param {Function} onSave - 保存回调 (userId, password) => Promise<void>
 * @param {Function} onCancel - 取消回调
 * @param {Number} minLength - 最小密码长度（默认 8）
 * @param {Boolean} requireConfirm - 是否需要确认密码（默认 true）
 * @param {Boolean} showGenerator - 是否显示密码生成器（默认 true）
 * @param {String} okText - 确认按钮文本
 * @param {String} cancelText - 取消按钮文本
 */
export default function ResetPasswordModal({
	visible,
	user,
	onSave,
	onCancel,
	minLength = 8,
	requireConfirm = true,
	showGenerator = true,
	okText = 'Reset Password',
	cancelText = 'Cancel',
}) {
	const [form] = Form.useForm();
	const [confirmLoading, setConfirmLoading] = useState(false);

	// 重置表单
	useEffect(() => {
		if (visible) {
			form.resetFields();
		}
	}, [visible, form]);

	// 生成随机密码
	const generatePassword = () => {
		const length = Math.max(minLength, 12);
		const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
		let password = '';

		// 确保包含至少一个大写、小写、数字和特殊字符
		password += 'A' + 'a' + '0' + '!';

		// 填充剩余长度
		for (let i = 4; i < length; i++) {
			password += charset.charAt(Math.floor(Math.random() * charset.length));
		}

		// 打乱顺序
		password = password
			.split('')
			.sort(() => Math.random() - 0.5)
			.join('');

		// 设置到表单
		form.setFieldsValue({
			password,
			confirmPassword: password,
		});

		message.success('Password generated! Please save it.');
	};

	// 提交
	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();

			if (!user || !user.id) {
				message.error('User ID is missing');
				return;
			}

			setConfirmLoading(true);

			// 调用保存回调
			await onSave(user.id, values.password);

			// 成功后关闭
			form.resetFields();
			if (onCancel) {
				onCancel();
			}
		} catch (error) {
			console.error('[ResetPasswordModal] Validation or save failed:', error);
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
			title="Reset Password"
			open={visible}
			onOk={handleSubmit}
			onCancel={handleCancel}
			confirmLoading={confirmLoading}
			okText={okText}
			cancelText={cancelText}
			destroyOnClose
			width={500}
		>
			{/* 用户信息 */}
			{user && (
				<div style={{ marginBottom: 24, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
					<div style={{ fontWeight: 500, marginBottom: 4 }}>
						Resetting password for:
					</div>
					<div style={{ fontSize: 14 }}>
						<strong>{user.name || 'N/A'}</strong>
						{user.email && (
							<span style={{ marginLeft: 8, color: '#666' }}>
								({user.email})
							</span>
						)}
					</div>
				</div>
			)}

			<Form
				form={form}
				layout="vertical"
				autoComplete="off"
			>
				{/* 新密码 */}
				<Form.Item
					name="password"
					label="New Password"
					rules={[
						{ required: true, message: 'Please enter new password' },
						{ min: minLength, message: `Password must be at least ${minLength} characters` },
						{
							pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
							message: 'Password must contain uppercase, lowercase, and numbers',
						},
					]}
					extra={showGenerator ? (
						<Button
							type="link"
							size="small"
							icon={<ReloadOutlined />}
							onClick={generatePassword}
							style={{ padding: 0, marginTop: 4 }}
						>
							Generate Random Password
						</Button>
					) : null}
				>
					<Input.Password
						prefix={<LockOutlined />}
						placeholder={`Enter password (min ${minLength} characters)`}
						autoComplete="new-password"
					/>
				</Form.Item>

				{/* 确认密码 */}
				{requireConfirm && (
					<Form.Item
						name="confirmPassword"
						label="Confirm Password"
						dependencies={['password']}
						rules={[
							{ required: true, message: 'Please confirm password' },
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue('password') === value) {
										return Promise.resolve();
									}
									return Promise.reject(new Error('Passwords do not match'));
								},
							}),
						]}
					>
						<Input.Password
							prefix={<LockOutlined />}
							placeholder="Confirm password"
							autoComplete="new-password"
						/>
					</Form.Item>
				)}
			</Form>

			{/* 提示信息 */}
			<div style={{ marginTop: 16, padding: 12, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4, fontSize: 12, color: '#666' }}>
				<strong>Security Tips:</strong>
				<ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
					<li>Use at least {minLength} characters</li>
					<li>Include uppercase, lowercase, numbers, and symbols</li>
					<li>Avoid common words or patterns</li>
					<li>Don't reuse passwords from other sites</li>
				</ul>
			</div>
		</Modal>
	);
}

