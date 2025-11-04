/**
 * Usage Logs CRUD 配置
 */

export const usageCrudConfig = {
	collectionName: 'usage_logs',
	logCategory: 'admin/usage',
	primaryKey: '_id',

	// 字段配置
	fields: {
		// 所有字段都可读
		readable: ['userId', 'action', 'creditsUsed', 'parameters', 'result', 'status', 'completedAt', 'createdAt', 'updatedAt'],

		// 不允许通过 CRUD 创建/更新 usage_logs（只能通过业务逻辑创建）
		creatable: [],
		updatable: ['status', 'result', 'error', 'completedAt'],

		// 搜索字段
		searchable: {
			fields: ['action', 'userId'],
			mode: 'like',
		},
	},

	// 查询配置
	query: {
		defaultSort: { createdAt: -1 },
		defaultPageSize: 20,
		baseFilter: {},
	},

	// 软删除：禁用（usage logs 不应该被删除）
	softDelete: false,
};

