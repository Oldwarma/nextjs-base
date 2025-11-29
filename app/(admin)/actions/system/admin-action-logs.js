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
	collectionName: 'action_logs',
	logCategory: 'admin/action_logs',
	primaryKey: '_id',

	// 字段配置
	fields: {
		// 所有字段都可读
		readable: ['userId', 'action', 'resourceType', 'resourceId', 'params', 'result', 'success', 'duration', 'createdAt', 'ip', 'userAgent'],

		// 不允许通过 CRUD 创建/更新 action_logs（只能由系统自动创建）
		creatable: [],
		updatable: [],

		// 搜索字段
		searchable: {
			fields: ['userId', 'action', 'resourceType', 'resourceId'],
			mode: 'like',
		},
	},

	// 查询配置
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		baseFilter: {},

		// 连表查询：关联 users 表
		// ⚠️ 注意：action_logs.userId 存储的是 ObjectId 字符串，需要转换为 ObjectId 才能匹配 users._id
		foreignDB: [
			{
				dbName: 'users',
				localKey: 'userId', // action_logs.userId (ObjectId 字符串)
				foreignKey: '_id', // users._id (ObjectId 类型)
				as: 'userInfo',
				limit: 1,
				fieldJson: { id: 1, name: 1, email: 1, _id: 1 },
				convertToObjectId: true, // 标记需要类型转换
			},
		],
	},

	// 软删除：禁用（action logs 不应该被删除）
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
