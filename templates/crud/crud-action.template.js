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
import { {RESOURCE_NAME}CrudConfig } from './configs/{RESOURCE_NAME}-crud.config';

/**
 * 创建基础 CRUD Actions
 * 自动包含：getList, getDetail, create, update, delete, batchUpdate, batchDelete
 */
const crudActions = createCrudActions({RESOURCE_NAME}CrudConfig);

/**
 * 导出标准 CRUD Actions
 */
export const get{RESOURCE_LABEL}ListAction = crudActions.getList;
export const get{RESOURCE_LABEL}DetailAction = crudActions.getDetail;
export const create{RESOURCE_LABEL}Action = crudActions.create;
export const update{RESOURCE_LABEL}Action = crudActions.update;
export const delete{RESOURCE_LABEL}Action = crudActions.delete;
export const batchUpdate{RESOURCE_LABEL}sAction = crudActions.batchUpdate;
export const batchDelete{RESOURCE_LABEL}sAction = crudActions.batchDelete;

/**
 * 自定义 Actions（可选）
 * 
 * 示例：添加激活/停用功能
 */
/*
import { wrapAdminAction } from '@/lib/core/action-wrapper';

export const activate{RESOURCE_LABEL}Action = wrapAdminAction(
    'activate',
    '{RESOURCE_NAME}',
    async ({ id }, context) => {
        const dao = crudActions._dao;
        const result = await dao.update({
            id,
            data: { status: 'active' },
            userId: context.userId,
        });
        return result;
    }
);

export const deactivate{RESOURCE_LABEL}Action = wrapAdminAction(
    'deactivate',
    '{RESOURCE_NAME}',
    async ({ id }, context) => {
        const dao = crudActions._dao;
        const result = await dao.update({
            id,
            data: { status: 'inactive' },
            userId: context.userId,
        });
        return result;
    }
);
*/

