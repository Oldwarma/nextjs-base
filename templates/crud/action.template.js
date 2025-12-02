/**
 * {RESOURCE_LABEL} CRUD Actions
 * 
 * 使用说明：
 * 1. 替换 {RESOURCE_NAME} → 资源名(小写单数), 如: permission
 * 2. 替换 {RESOURCE_LABEL} → 资源标签(首字母大写), 如: Permission  
 * 3. 替换 {MODEL_NAME} → Prisma 模型名(小写单数), 如: permission
 * 4. 根据需要配置 validation 验证规则和 hooks 钩子
 */

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';

/**
 * {RESOURCE_LABEL} CRUD 配置
 */
const {RESOURCE_NAME}Config = {
	/**
	 * 基础配置
	 */
	modelName: '{MODEL_NAME}',
	primaryKey: 'id',
	softDelete: true,

	/**
	 * 字段配置
	 */
	fields: {
		creatable: ['name', 'enable', 'remark'],
		updatable: ['name', 'enable', 'remark'],
		searchable: ['name', 'remark'],
	},

	/**
	 * 查询配置
	 */
	query: {
		defaultSort: { createdAt: 'desc' },
		defaultPageSize: 20,
	},

	/**
	 * 字段验证规则
	 * 
	 * 支持的配置项：
	 * - required: 是否必填
	 * - type: 类型（string, number, boolean, array, date, email, url）
	 * - minLength/maxLength: 长度限制
	 * - min/max: 数值范围
	 * - pattern: 正则表达式
	 * - enum: 枚举值数组
	 * - default: 默认值
	 * - message: 自定义错误消息
	 */
	validation: {
		name: {
			required: true,
			type: 'string',
			minLength: 2,
			maxLength: 50,
			message: 'Name must be between 2 and 50 characters',
		},
		enable: {
			type: 'boolean',
			default: true,
		},
		remark: {
			type: 'string',
			maxLength: 200,
		},
	},

	/**
	 * 生命周期钩子
	 */
	hooks: {
		beforeCreate: async (data) => {
			// 设置默认值
			if (data.enable === undefined) {
				data.enable = true;
			}
			return data;
		},

		beforeUpdate: async (id, data) => {
			return data;
		},

		beforeDelete: async (id) => {
			// 删除前检查
			return true;
		},
	},

	/**
	 * 数据转换
	 */
	transforms: {
		input: (data) => {
			// 去除字符串首尾空格
			if (data.name) {
				data.name = data.name.trim();
			}
			if (data.remark) {
				data.remark = data.remark.trim();
			}
			// 处理空字符串为 null
			if (data.remark === '') {
				data.remark = null;
			}
			return data;
		},

		output: (data) => {
			// 确保默认值
			if (data.enable === undefined) {
				data.enable = true;
			}
			return data;
		},
	},
};

/**
 * 创建标准 CRUD Actions
 */
const crudActions = createCrudActions({RESOURCE_NAME}Config);

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
 * 示例：获取启用的列表
 */
// export async function getEnabled{RESOURCE_LABEL}sAction() {
// 	const result = await crudActions._dao.getList({
// 		pageIndex: 1,
// 		pageSize: 1000,
// 		whereJson: { enable: true },
// 		sortJson: { name: 1 },
// 	});
// 	
// 	return {
// 		success: true,
// 		data: result.rows || [],
// 	};
// }
