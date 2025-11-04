/**
 * Credit Transaction CRUD 配置
 * 积分交易记录的查询配置
 * 
 * 注意：积分交易记录是只读的，不支持创建、更新、删除
 * 积分的增减通过专门的 Server Actions 处理
 */

export const creditTransactionCrudConfig = {
	collectionName: 'credit_transactions',
	primaryKey: '_id',
	logCategory: 'admin/credits',

	// 字段配置
	fields: {
		// 积分交易记录不允许直接创建
		creatable: [],
		// 积分交易记录不允许更新
		updatable: [],
		// 可搜索的字段
		searchable: ['userId', 'reason', 'relatedId'],
	},

	// 无验证规则（不支持创建/更新）
	validation: {},

	// 查询配置
	query: {
		defaultSort: { createdAt: -1 }, // 按创建时间倒序
		defaultPageSize: 20,
		baseFilter: {}, // 管理员可以看到所有交易记录

		// 连表配置（可选）- 在 getList 时自动连表查询用户信息
		foreignDB: [
			{
				dbName: 'users',
				localKey: 'userId',            // credit_transactions.userId
				foreignKey: 'id',              // users.id (Better Auth 主键)
				as: 'userInfo',                // 连表结果存放在 userInfo 字段
				limit: 1,                      // 一对一关系
				fieldJson: { id: 1, name: 1, email: 1, image: 1 }, // 返回用户基本信息
			},
		],
	},

	// 生命周期钩子
	hooks: {
		beforeCreate: async (data) => {
			throw new Error('Credit transactions cannot be created directly. Use credit management actions instead.');
		},
		beforeUpdate: async (id, data, existing) => {
			throw new Error('Credit transactions cannot be updated');
		},
		beforeDelete: async (id, existing) => {
			throw new Error('Credit transactions cannot be deleted');
		},
	},

	// 数据转换
	transforms: {
		output: (data) => {
			// 格式化输出
			return {
				...data,
				// 确保 type 有可读的显示
				typeLabel:
					data.type === 'earn'
						? 'Earned'
						: data.type === 'spend'
							? 'Spent'
							: data.type === 'refund'
								? 'Refunded'
								: data.type === 'expire'
									? 'Expired'
									: data.type === 'admin_adjust'
										? 'Admin Adjusted'
										: data.type,
			};
		},
	},

	// 不使用软删除
	softDelete: false,
};

