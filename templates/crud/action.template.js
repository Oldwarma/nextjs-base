/**
 * {RESOURCE_LABEL} CRUD Actions Template
 * 
 * 使用说明：
 * 1. 替换 {RESOURCE_NAME} → 资源名(小写单数), 如: permission
 * 2. 替换 {RESOURCE_LABEL} → 资源标签(首字母大写), 如: Permission  
 * 3. 替换 {COLLECTION_NAME} → MongoDB 集合名(小写复数), 如: permissions
 * 4. 根据需要配置 validation 验证规则
 */

'use server';

import { createCrudActions } from '@/lib/core/crud-helper';

// ============================================
// 配置对象
// ============================================
const {RESOURCE_NAME}Config = {
	// 集合名称
	collectionName: '{COLLECTION_NAME}',
	
	// 主键字段（使用 'id' 或 '_id'）
	primaryKey: 'id',
	
	// 字段配置
	fields: {
		// 可创建的字段
		creatable: ['name', 'enable', 'remark'],
		
		// 可更新的字段
		updatable: ['name', 'enable', 'remark'],
		
		// 可搜索的字段
		searchable: ['name', 'remark'],
	},
	
	// 查询配置
	query: {
		// 默认排序
		defaultSort: { createdAt: -1 },
		
		// 默认分页大小
		defaultPageSize: 20,
		
		// 基础过滤条件（始终应用）
		baseFilter: {
			deletedAt: { $exists: false },
		},
	},
	
	/**
	 * 数据验证规则
	 * 
	 * 支持的配置项：
	 * - required: 是否必填（create 时生效）
	 * - type: 类型（string, number, boolean, array, date, email, url）
	 * - minLength/maxLength: 长度限制（字符串/数组）
	 * - min/max: 数值范围
	 * - pattern: 正则表达式
	 * - enum: 枚举值数组
	 * - itemType: 数组元素类型（string, number）
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
			maxLength: 500,
		},
	},
	
	// 唯一性验证字段（数据库级别）
	// uniqueFields: ['code'],
	
	// 生命周期钩子
	hooks: {
		/**
		 * 创建前钩子
		 */
		beforeCreate: async (data) => {
			// 示例：生成唯一编码
			if (!data.code) {
				data.code = `{RESOURCE_NAME}_${Date.now()}`;
			}
			return data;
		},
		
		/**
		 * 更新前钩子
		 */
		beforeUpdate: async (id, data, existing) => {
			// 示例：记录修改时间
			data.updatedAt = new Date();
			return data;
		},
		
		/**
		 * 删除前钩子
		 */
		beforeDelete: async (id, existing) => {
			// 示例：检查是否可以删除
			// if (existing.hasChildren) {
			//   throw new Error('Cannot delete {RESOURCE_NAME} with children');
			// }
			return true;
		},
	},
	
	// 数据转换
	transforms: {
		/**
		 * 输入转换 - 处理写入数据库前的数据
		 */
		input: (data) => {
			// 示例：转换数据格式
			if (data.name) {
				data.name = data.name.trim();
			}
			return data;
		},
		
		/**
		 * 输出转换 - 处理从数据库读取后的数据
		 */
		output: (data) => {
			// 示例：添加计算字段
			// data.displayName = `${data.name} (${data.code})`;
			return data;
		},
	},
};

// ============================================
// 创建标准 CRUD Actions
// ============================================
const crudActions = createCrudActions({RESOURCE_NAME}Config);

// 导出标准 CRUD Actions
export const get{RESOURCE_LABEL}ListAction = crudActions.getList;
export const get{RESOURCE_LABEL}DetailAction = crudActions.getDetail;
export const create{RESOURCE_LABEL}Action = crudActions.create;
export const update{RESOURCE_LABEL}Action = crudActions.update;
export const delete{RESOURCE_LABEL}Action = crudActions.delete;
export const batchUpdate{RESOURCE_LABEL}sAction = crudActions.batchUpdate;
export const batchDelete{RESOURCE_LABEL}sAction = crudActions.batchDelete;

// ============================================
// 自定义 Actions（可选）
// ============================================

/**
 * 示例：获取启用的{RESOURCE_LABEL}列表
 */
export async function getEnabled{RESOURCE_LABEL}sAction() {
	const result = await crudActions._dao.getList({
		pageIndex: 1,
		pageSize: 1000,
		whereJson: { enable: true },
		sortJson: { sort: 1, name: 1 },
	});
	
	return {
		success: true,
		data: result.rows || [],
	};
}
