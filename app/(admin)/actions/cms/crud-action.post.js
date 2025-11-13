/**
 * CRUD Actions Template
 *
 * 使用方法：
 * 1. 复制此文件到你的 actions 目录
 * 2. 替换所有 {RESOURCE_NAME} 为你的资源名（小写，如 coupon）
 * 3. 替换所有 {RESOURCE_LABEL} 为资源标签（如 Coupon）
 * 4. 引入对应的 config 文件
 * 5. 按需添加自定义 Actions
 */

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';
import { postCrudConfig } from './configs/crud-config.post';

/**
 * 创建基础 CRUD Actions
 * 自动包含：getList, getDetail, create, update, delete, batchUpdate, batchDelete
 */
const crudActions = createCrudActions(postCrudConfig);

/**
 * 导出标准 CRUD Actions
 */
export const getPostListAction = crudActions.getList;
export const getPostDetailAction = crudActions.getDetail;
export const createPostAction = crudActions.create;
export const updatePostAction = crudActions.update;
export const deletePostAction = crudActions.delete;
export const batchUpdatePostsAction = crudActions.batchUpdate;
export const batchDeletePostsAction = crudActions.batchDelete;

/**
 * 自定义 Actions（可选）
 *
 * 示例：添加激活/停用功能
 */

import { wrapAdminAction } from '@/lib/core/action-wrapper';

export const activatePostAction = wrapAdminAction('activate', 'post', async ({ id }, context) => {
	const dao = crudActions._dao;
	const result = await dao.update({
		id,
		data: { status: 'active' },
		userId: context.userId,
	});
	return result;
});

export const deactivatePostAction = wrapAdminAction('deactivate', 'post', async ({ id }, context) => {
	const dao = crudActions._dao;
	const result = await dao.update({
		id,
		data: { status: 'inactive' },
		userId: context.userId,
	});
	return result;
});
