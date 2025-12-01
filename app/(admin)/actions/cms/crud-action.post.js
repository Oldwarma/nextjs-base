/**
 * Post CRUD Actions
 * 
 * 使用 createCrudActions 生成标准 CRUD Actions
 */

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { wrapAction } from '@/lib/core/action-wrapper';

// ============================================
// 配置对象
// ============================================
const postConfig = {
	// 集合名称
	collectionName: 'post',
	
	// 主键字段
	primaryKey: '_id',
	
	// 字段配置
	fields: {
		// 可创建的字段
		creatable: ['name', 'status', 'order', 'expiresAt', 'description', 'content'],
		
		// 可更新的字段
		updatable: ['name', 'status', 'order', 'expiresAt', 'description', 'content'],
		
		// 可搜索的字段
		searchable: ['name', 'status'],
	},
	
	// 查询配置
	query: {
		// 默认排序
		defaultSort: { createdAt: -1 },
		
		// 默认分页大小
		defaultPageSize: 10,
	},
	
	// 数据验证规则
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			message: 'Name must be between 2 and 50 characters',
		},
		status: {
			required: true,
			type: 'string',
			enum: ['active', 'inactive', 'draft'],
			message: 'Status is required',
		},
		order: {
			type: 'number',
			min: 0,
			default: 0,
			message: 'Order must be >= 0',
		},
		description: {
			type: 'string',
			maxLength: 500,
			message: 'Description max length: 500',
		},
		content: {
			type: 'string',
			maxLength: 5000,
			message: 'Content max length: 5000',
		},
	},
	
	// 生命周期钩子
	hooks: {
		/**
		 * 创建前钩子
		 */
		beforeCreate: async (data) => {
			// 设置默认值
			if (data.order === undefined) {
				data.order = 0;
			}
			if (data.status === undefined) {
				data.status = 'active';
			}
			return data;
		},
		
		/**
		 * 更新前钩子
		 */
		beforeUpdate: async (id, data, existing) => {
			// 更新时间
			data.updatedAt = new Date();
			return data;
		},
	},
	
	// 数据转换
	transforms: {
		/**
		 * 输入转换 - 处理写入数据库前的数据
		 */
		input: (data) => {
			// 去除首尾空格
			if (data.name) {
				data.name = data.name.trim();
			}
			if (data.description) {
				data.description = data.description.trim();
			}
			return data;
		},
		
		/**
		 * 输出转换 - 处理从数据库读取后的数据
		 */
		output: (data) => {
			return data;
		},
	},
	
	// 软删除配置
	softDelete: true,
};

// ============================================
// 创建标准 CRUD Actions
// ============================================
const crudActions = createCrudActions(postConfig);

// 导出标准 CRUD Actions
export const getPostListAction = crudActions.getList;
export const getPostDetailAction = crudActions.getDetail;
export const createPostAction = crudActions.create;
export const updatePostAction = crudActions.update;
export const deletePostAction = crudActions.delete;
export const batchUpdatePostsAction = crudActions.batchUpdate;
export const batchDeletePostsAction = crudActions.batchDelete;

// ============================================
// 自定义 Actions（可选）
// ============================================

/**
 * 激活 Post
 */
export const activatePostAction = wrapAction('sysActivatePost', async ({ id }, ctx) => {
	const dao = crudActions._dao;
	const result = await dao.update({
		id,
		data: { status: 'active' },
		userId: ctx.userId,
	});
	return result;
});

/**
 * 停用 Post
 */
export const deactivatePostAction = wrapAction('sysDeactivatePost', async ({ id }, ctx) => {
	const dao = crudActions._dao;
	const result = await dao.update({
		id,
		data: { status: 'inactive' },
		userId: ctx.userId,
	});
	return result;
});
