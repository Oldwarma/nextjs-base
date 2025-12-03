'use server';

/**
 * 登录日志 Server Actions（基于 Session 表）
 * 使用 createReadOnlyActions 只读查询
 */

import { createReadOnlyActions } from '@/lib/core/crud-helper';

const loginLogsCrudConfig = {
	modelName: 'session',
	tableName: 'sessions',
	primaryKey: 'id',
	fields: {
		readable: ['userId', 'token', 'expiresAt', 'ipAddress', 'userAgent', 'createdAt', 'updatedAt'],
		creatable: [],
		updatable: [],
		searchable: ['userId', 'ipAddress'],
	},
	query: {
		defaultSort: { createdAt: 'desc' },
		defaultPageSize: 20,
		baseFilter: {},
		foreignDB: [
			{
				dbName: 'users',
				localKey: 'userId',
				foreignKey: 'id',
				as: 'userInfo',
				type: 'one',
				fieldJson: { id: true, name: true, email: true, role: true, lastLoginAt: true },
			},
		],
	},
	softDelete: false,
};

const crudActions = createReadOnlyActions(loginLogsCrudConfig);

export const getLoginLogListAction = crudActions.getList;
export const getLoginLogDetailAction = crudActions.getDetail;
