'use server';

/**
 * 操作日志管理 Server Actions
 * 使用核心库（BaseDAO + action-wrapper）自动处理权限验证和日志记录
 */

import { createReadOnlyActions } from '@/lib/core/crud-helper';

/**
 * Action Logs CRUD 配置
 */
const actionLogsCrudConfig = {
	modelName: 'actionLog',
	primaryKey: 'id',

	fields: {
		readable: ['userId', 'action', 'resourceType', 'resourceId', 'params', 'result', 'success', 'duration', 'createdAt', 'ip', 'userAgent'],
		creatable: [],
		updatable: [],
		searchable: ['userId', 'action', 'resourceType', 'resourceId'],
	},

	query: {
		defaultSort: { createdAt: 'desc' },
		defaultPageSize: 20,
		baseFilter: {},
	},

	softDelete: false,
};

/**
 * 创建只读 CRUD Actions（操作日志只能查看）
 * BaseDAO 已支持 SmartCrudPage 的 whereJson 参数
 */
const crudActions = createReadOnlyActions(actionLogsCrudConfig);

/**
 * 导出标准查询 Actions
 */
export const getActionLogListAction = crudActions.getList;
export const getActionLogDetailAction = crudActions.getDetail;
