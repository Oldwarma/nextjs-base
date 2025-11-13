/**
 * 动态表单字段组件
 * 
 * 支持 showRule 和 disabled 条件渲染
 * 支持 watch 字段监听
 * 支持 action 自动加载数据（vk-unicloud 风格）
 * 
 * 参考 vk-unicloud: https://vkdoc.fsq.pub/admin/components/0%E3%80%81public.html
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Form } from 'antd';
import { evaluateRule } from '@/lib/crud/rule-evaluator';
import { FIELD_TYPE_REGISTRY } from '@/lib/crud/field-types';

/**
 * 动态表单字段渲染器
 * 
 * @param {Object} props
 * @param {Array} props.fieldsConfig - 字段配置
 * @param {Object} props.formInstance - antd Form 实例
 * @param {Boolean} props.isCreate - 是否是创建表单
 * @param {Object} props.actions - Server Actions（用于 action 字符串加载数据）
 */
export default function DynamicFormFields({ fieldsConfig, formInstance, isCreate = false, actions = {} }) {
	// 监听表单值变化
	const [formData, setFormData] = useState({});
	
	// 使用 Form.useWatch 监听所有字段变化
	// 如果 formInstance 为 null，传入 undefined 让 useWatch 使用最近的 Form context
	let watchedValues = {};
	try {
		watchedValues = Form.useWatch([], formInstance || undefined) || {};
	} catch (error) {
		// 如果 useWatch 失败（比如没有 Form context），使用空对象
		watchedValues = {};
	}
	
	useEffect(() => {
		setFormData(watchedValues);
	}, [watchedValues]);
	
	// ✅ 处理 action 自动加载数据（vk-unicloud 风格）
	const [actionData, setActionData] = useState({});
	const [loadingActions, setLoadingActions] = useState({});

	// 收集所有需要通过 action 加载数据的字段
	useEffect(() => {
		const fieldsWithAction = fieldsConfig.filter(
			field => field.form?.action && typeof field.form.action === 'string'
		);

		if (fieldsWithAction.length === 0) return;

		// 加载所有 action 数据
		fieldsWithAction.forEach(async (field) => {
			const actionName = field.form.action;
			const action = actions[actionName];

			if (!action || typeof action !== 'function') {
				console.warn(`Action "${actionName}" not found for field "${field.key}"`);
				return;
			}

			// 标记加载中
			setLoadingActions(prev => ({ ...prev, [field.key]: true }));

			try {
				const result = await action();
				if (result.success && result.data) {
					setActionData(prev => ({ ...prev, [field.key]: result.data }));
				}
			} catch (error) {
				console.error(`Failed to load action "${actionName}" for field "${field.key}":`, error);
			} finally {
				setLoadingActions(prev => ({ ...prev, [field.key]: false }));
			}
		});
	}, [fieldsConfig, actions]);
	
	// 渲染单个字段
	const renderField = (field, index) => {
		const typeConfig = FIELD_TYPE_REGISTRY[field.type];
		
		// 检查是否应该显示
		if (field.form === false || field.hideInForm) return null;
		
		// 创建表单排除不可创建的字段
		if (isCreate && field.createOnly === false) return null;
		
		// 编辑表单排除不可编辑的字段
		if (!isCreate && field.editOnly === false) return null;
		
		// 评估 showRule
		if (field.showRule) {
			const shouldShow = evaluateRule(field.showRule, formData, field);
			if (!shouldShow) return null;
		}
		
		// 评估 disabled 规则
		let isDisabled = false;
		if (field.disabled) {
			isDisabled = evaluateRule(field.disabled, formData, field);
		}

		// ✅ 如果字段配置了 action，注入加载的数据
		let processedField = field;
		if (field.form?.action && actionData[field.key]) {
			processedField = {
				...field,
				form: {
					...field.form,
					treeData: actionData[field.key], // 为 tree-select 提供数据
					options: actionData[field.key],  // 为 select 提供数据
					data: actionData[field.key],     // 通用数据字段
				},
				data: actionData[field.key], // 也注入到顶层
			};
		}
		
		// 获取字段组件
		let fieldComponent = null;
		
		// 自定义表单组件
		if (processedField.form?.render) {
			fieldComponent = processedField.form.render(processedField);
		}
		// 使用类型对应的表单组件
		else if (typeConfig?.form) {
			fieldComponent = typeConfig.form(processedField);
		}
		
		if (!fieldComponent) return null;
		
		// 如果有 disabled 规则，包装组件并传递 disabled 属性
		if (isDisabled) {
			// 克隆组件并添加 disabled 属性
			fieldComponent = React.cloneElement(fieldComponent, {
				disabled: true,
			});
		}
		
		// 如果有 watch，添加监听逻辑
		if (field.watch && typeof field.watch === 'function') {
			// 包装在 Form.Item 中以便访问 form 实例
			return (
				<FieldWithWatch
					key={field.key || `form-field-${index}`}
					field={field}
					fieldComponent={fieldComponent}
					formInstance={formInstance}
					formData={formData}
					index={index}
				/>
			);
		}
		
		return (
			<React.Fragment key={field.key || `form-field-${index}`}>
				{fieldComponent}
			</React.Fragment>
		);
	};
	
	return (
		<>
			{fieldsConfig.map((field, index) => renderField(field, index))}
		</>
	);
}

/**
 * 带 watch 功能的字段组件
 */
function FieldWithWatch({ field, fieldComponent, formInstance, formData, index }) {
	const [prevValue, setPrevValue] = useState(undefined);
	
	// 监听当前字段的值
	const currentValue = formData[field.key];
	
	useEffect(() => {
		// 只有值真正改变时才触发 watch
		if (currentValue !== prevValue && prevValue !== undefined) {
			if (field.watch && typeof field.watch === 'function') {
				try {
					// 获取当前选项数据（如果有）
					const option = field.data?.find(item => item.value === currentValue);
					
					// 调用 watch 回调
					field.watch({
						value: currentValue,
						formData: formData,
						column: field,
						index: index,
						option: option,
						$set: (key, value) => {
							// 使用 form 实例设置字段值
							formInstance?.setFieldsValue({ [key]: value });
						},
					});
				} catch (error) {
					console.error(`Watch error for field ${field.key}:`, error);
				}
			}
		}
		setPrevValue(currentValue);
	}, [currentValue, prevValue, field, formData, formInstance, index]);
	
	return (
		<React.Fragment key={field.key || `form-field-${index}`}>
			{fieldComponent}
		</React.Fragment>
	);
}

