/**
 * Example CRUD Actions
 *
 * 完整示例：展示 SmartCrudPage 的所有功能
 * 包括：权限验证、字段联动、showRule、各种字段类型等
 */

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';

/**
 * Example CRUD 配置
 */
const exampleConfig = {
	/**
	 * 基础配置
	 * 注意：这是示例配置，需要在 schema.prisma 中创建对应的 ExampleData 模型才能使用
	 */
	modelName: 'exampleData',
	primaryKey: 'id',
	softDelete: false,

	/**
	 * BaseDAO 字段配置
	 */
	fields: {
		creatable: [
			// 基础信息
			'title', 'description', 'category', 'subCategory', 'status',
			// 联系信息
			'contactType', 'email', 'phone', 'wechat', 'address',
			// 数值信息
			'price', 'discount', 'quantity', 'rating',
			// 选择信息
			'priority', 'features', 'tags', 'department', 'location',
			// 日期时间
			'publishDate', 'eventTime', 'validPeriod',
			// 开关状态
			'isActive', 'isPublic', 'isVip', 'enableNotification',
			// 媒体文件
			'coverImage', 'gallery', 'avatar', 'documents', 'attachments',
			// 高级字段
			'richContent', 'metadata', 'keywords', 'color', 'icon',
		],
		updatable: [
			'title', 'description', 'category', 'subCategory', 'status',
			'contactType', 'email', 'phone', 'wechat', 'address',
			'price', 'discount', 'quantity', 'rating',
			'priority', 'features', 'tags', 'department', 'location',
			'publishDate', 'eventTime', 'validPeriod',
			'isActive', 'isPublic', 'isVip', 'enableNotification',
			'coverImage', 'gallery', 'avatar', 'documents', 'attachments',
			'richContent', 'metadata', 'keywords', 'color', 'icon',
		],
		searchable: ['title', 'description', 'email'],
	},

	/**
	 * 查询配置
	 */
	query: {
		defaultSort: { createdAt: 'desc' },
		defaultPageSize: 10,
	},

	/**
	 * 字段验证规则
	 */
	validation: {
		title: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 100,
			message: 'Title must be 2-100 characters',
		},
		description: {
			required: false,
			type: 'string',
			maxLength: 500,
		},
		category: {
			required: true,
			type: 'string',
			enum: ['electronics', 'clothing', 'food', 'books', 'sports', 'other'],
		},
		subCategory: {
			required: false,
			type: 'string',
		},
		status: {
			required: true,
			type: 'string',
			enum: ['draft', 'pending', 'published', 'archived'],
			default: 'draft',
		},
		contactType: {
			required: false,
			type: 'string',
			enum: ['email', 'phone', 'wechat', 'none'],
		},
		email: {
			required: false,
			type: 'email',
		},
		phone: {
			required: false,
			type: 'string',
		},
		wechat: {
			required: false,
			type: 'string',
		},
		address: {
			required: false,
			type: 'string',
			maxLength: 200,
		},
		price: {
			required: false,
			type: 'number',
			min: 0,
		},
		discount: {
			required: false,
			type: 'number',
			min: 0,
			max: 100,
		},
		quantity: {
			required: false,
			type: 'number',
			min: 0,
		},
		rating: {
			required: false,
			type: 'number',
			min: 0,
			max: 5,
		},
		priority: {
			required: false,
			type: 'string',
			enum: ['low', 'medium', 'high', 'urgent'],
		},
		features: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
		tags: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
		department: {
			required: false,
			type: 'string',
		},
		location: {
			required: false,
			type: 'array',
		},
		publishDate: {
			required: false,
			type: 'date',
		},
		eventTime: {
			required: false,
			type: 'date',
		},
		validPeriod: {
			required: false,
			type: 'array',
		},
		isActive: {
			required: false,
			type: 'boolean',
			default: true,
		},
		isPublic: {
			required: false,
			type: 'boolean',
			default: false,
		},
		isVip: {
			required: false,
			type: 'boolean',
			default: false,
		},
		enableNotification: {
			required: false,
			type: 'boolean',
			default: false,
		},
		coverImage: {
			required: false,
			type: 'string',
		},
		gallery: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
		avatar: {
			required: false,
			type: 'string',
		},
		attachment: {
			required: false,
			type: 'string',
		},
		richContent: {
			required: false,
			type: 'string',
		},
		metadata: {
			required: false,
			type: 'string', // JSON string
		},
		keywords: {
			required: false,
			type: 'array',
			itemType: 'string',
		},
		color: {
			required: false,
			type: 'string',
		},
		icon: {
			required: false,
			type: 'string',
		},
	},
};

// 创建标准 CRUD Actions
const crudActions = createCrudActions(exampleConfig);

// 导出所有 Actions（必须是 async 函数）
export async function getListAction(params) {
	return await crudActions.getList(params);
}

export async function getDetailAction(id) {
	return await crudActions.getDetail(id);
}

export async function createAction(data) {
	return await crudActions.create(data);
}

export async function updateAction(id, data) {
	return await crudActions.update(id, data);
}

export async function deleteAction(id) {
	return await crudActions.delete(id);
}
