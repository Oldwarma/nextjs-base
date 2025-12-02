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
	tableName: 'action_logs', // 数据库表名，selects 连表查询需要
	primaryKey: 'id',

	fields: {
		readable: ['user_id', 'action', 'resource_type', 'resource_id', 'params', 'result', 'success', 'duration', 'createdAt', 'ip', 'user_agent'],
		creatable: [],
		updatable: [],
		searchable: ['user_id', 'action', 'resource_type', 'resource_id'],
	},

	query: {
		defaultSort: { createdAt: 'desc' },
		defaultPageSize: 20,
		baseFilter: {},
		// 默认连表配置：查询用户信息
		// 注意：使用数据库的实际表名和列名！
		foreignDB: [
			{
				dbName: 'users',          // 数据库表名
				localKey: 'user_id',      // action_logs 表的列名
				foreignKey: 'id',         // users 表的列名
				as: 'userInfo',
				type: 'one',
				fieldJson: { id: true, name: true, email: true },
			},
		],
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
 * 注意：不能调用 getList()，只能导出函数本身
 */
export const getActionLogListAction = crudActions.getList;
export const getActionLogDetailAction = crudActions.getDetail;
