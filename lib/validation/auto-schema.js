/**
 * 自动 Schema 转换器
 * 
 * 将简单的 validation 配置对象自动转换为 Zod Schema
 * 用户无需手动编写 Zod Schema，只需使用熟悉的配置格式
 */

import { z } from 'zod';

/**
 * 将单个字段的验证规则转换为 Zod Schema
 * @param {string} fieldName - 字段名
 * @param {Object} rule - 验证规则
 * @param {string} action - 操作类型：create, update
 * @returns {z.ZodType} Zod Schema
 */
function fieldRuleToZod(fieldName, rule, action) {
	let schema;

	// 根据类型创建基础 Schema
	const type = rule.type || 'string';
	
	switch (type) {
		case 'number':
			schema = z.number();
			if (rule.min !== undefined) schema = schema.min(rule.min, rule.message || `${fieldName} must be at least ${rule.min}`);
			if (rule.max !== undefined) schema = schema.max(rule.max, rule.message || `${fieldName} must be at most ${rule.max}`);
			if (rule.int) schema = schema.int(rule.message || `${fieldName} must be an integer`);
			break;
			
		case 'boolean':
			schema = z.boolean();
			break;
			
		case 'array':
			let itemSchema = z.unknown();
			if (rule.itemType === 'string') itemSchema = z.string();
			else if (rule.itemType === 'number') itemSchema = z.number();
			
			schema = z.array(itemSchema);
			if (rule.minLength !== undefined) schema = schema.min(rule.minLength, rule.message || `${fieldName} must have at least ${rule.minLength} items`);
			if (rule.maxLength !== undefined) schema = schema.max(rule.maxLength, rule.message || `${fieldName} must have at most ${rule.maxLength} items`);
			break;
			
		case 'date':
			schema = z.date();
			break;
			
		case 'email':
			schema = z.string().email(rule.message || 'Invalid email format');
			break;
			
		case 'url':
			schema = z.string().url(rule.message || 'Invalid URL format');
			break;
			
		default: // string
			schema = z.string();
			if (rule.minLength !== undefined) schema = schema.min(rule.minLength, rule.message || `${fieldName} must be at least ${rule.minLength} characters`);
			if (rule.maxLength !== undefined) schema = schema.max(rule.maxLength, rule.message || `${fieldName} must be at most ${rule.maxLength} characters`);
			if (rule.pattern) schema = schema.regex(rule.pattern, rule.message || `${fieldName} format is invalid`);
			break;
	}

	// 处理枚举
	if (rule.enum && Array.isArray(rule.enum)) {
		schema = z.enum(rule.enum);
	}

	// 处理默认值
	if (rule.default !== undefined) {
		schema = schema.default(rule.default);
	}

	// 处理可选性
	// create 时：required 为 true 则必填
	// update 时：所有字段都是可选的
	if (action === 'update') {
		schema = schema.optional();
	} else if (!rule.required) {
		schema = schema.optional().nullable();
	}

	return schema;
}

/**
 * 将 validation 配置对象转换为 Zod Schema
 * @param {Object} validation - 验证配置对象
 * @param {string} action - 操作类型：create, update
 * @returns {z.ZodObject} Zod Object Schema
 * 
 * @example
 * const validation = {
 *   name: { required: true, minLength: 2, maxLength: 50 },
 *   age: { type: 'number', min: 0, max: 150 },
 *   email: { type: 'email', required: true },
 *   tags: { type: 'array', itemType: 'string', maxLength: 10 },
 * };
 * 
 * const createSchema = validationToZod(validation, 'create');
 * const updateSchema = validationToZod(validation, 'update');
 */
export function validationToZod(validation, action = 'create') {
	if (!validation || typeof validation !== 'object') {
		return z.object({}).passthrough(); // 允许任意字段
	}

	const shape = {};
	
	for (const [fieldName, rule] of Object.entries(validation)) {
		if (rule && typeof rule === 'object') {
			shape[fieldName] = fieldRuleToZod(fieldName, rule, action);
		}
	}

	// passthrough() 允许未定义的字段通过（不会被 Zod 过滤掉）
	return z.object(shape).passthrough();
}

/**
 * Schema 缓存，避免重复转换
 */
const schemaCache = new WeakMap();

/**
 * 获取或创建 Zod Schema（带缓存）
 * @param {Object} config - DAO 配置对象
 * @param {string} action - 操作类型：create, update
 * @returns {z.ZodSchema|null} Zod Schema 或 null
 */
export function getOrCreateSchema(config, action) {
	// 1. 优先使用用户直接传入的 Zod Schema
	if (config.schemas?.[action]) {
		return config.schemas[action];
	}

	// 2. 如果有 validation 配置，自动转换为 Zod Schema
	if (config.validation && Object.keys(config.validation).length > 0) {
		// 检查缓存
		let cached = schemaCache.get(config);
		if (!cached) {
			cached = {};
			schemaCache.set(config, cached);
		}
		
		if (!cached[action]) {
			cached[action] = validationToZod(config.validation, action);
		}
		
		return cached[action];
	}

	// 3. 没有验证配置
	return null;
}

/**
 * 验证数据
 * @param {Object} config - DAO 配置对象
 * @param {Object} data - 待验证数据
 * @param {string} action - 操作类型：create, update
 * @returns {{ success: boolean, data?: Object, error?: string, errors?: Array }}
 */
export function validateWithConfig(config, data, action) {
	const schema = getOrCreateSchema(config, action);
	
	if (!schema) {
		// 没有验证配置，直接返回原数据
		return { success: true, data };
	}

	const result = schema.safeParse(data);
	
	if (result.success) {
		return { success: true, data: result.data };
	}

	// 格式化错误信息
	const errors = result.error.errors.map(err => ({
		field: err.path.join('.'),
		message: err.message,
	}));

	return {
		success: false,
		error: errors[0]?.message || 'Validation failed',
		errors,
	};
}

/**
 * 执行自定义验证器
 * 用于处理 Zod 无法表达的复杂验证逻辑（如异步验证、跨字段验证）
 * 
 * @param {Object} validation - 验证配置对象
 * @param {Object} data - 待验证数据
 * @param {string} action - 操作类型：create, update
 * @param {Object} context - 上下文（如 recordId）
 */
export async function runCustomValidators(validation, data, action, context = {}) {
	if (!validation || typeof validation !== 'object') {
		return;
	}

	for (const [fieldName, rule] of Object.entries(validation)) {
		if (!rule) continue;
		
		const value = data[fieldName];
		
		// 跳过未提供的可选字段
		if (value === undefined || value === null || value === '') {
			// 但如果是 required 且是 create，前面的 Zod 验证已经处理了
			continue;
		}

		// 执行自定义验证器
		const validator = rule.validator || rule.custom;
		if (typeof validator === 'function') {
			try {
				const isValid = await validator(value, { ...context, data, action });
				if (isValid === false) {
					throw new Error(rule.message || `${fieldName} validation failed`);
				}
			} catch (err) {
				// 如果验证器抛出错误，直接使用该错误
				if (err.message) {
					throw err;
				}
				throw new Error(rule.message || `${fieldName} validation failed`);
			}
		}
	}
}

