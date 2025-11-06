/**
 * CRUD Config Template
 * 
 * 使用方法：
 * 1. 复制此文件到你的 configs 目录
 * 2. 替换所有 {RESOURCE_NAME} 为你的资源名（复数，如 coupons）
 * 3. 配置 fieldsConfig（字段定义）
 * 4. 配置其他选项（可选）
 */

/**
 * {RESOURCE_NAME} CRUD 配置
 */
export const {RESOURCE_NAME}CrudConfig = {
	/**
	 * 数据库集合名称
	 */
	collectionName: '{RESOURCE_NAME}',

	/**
	 * 字段配置（核心配置）
	 * 
	 * 每个字段支持的属性：
	 * - type: 字段类型（text/number/select/date/textarea等）
	 * - label: 显示标签
	 * - required: 是否必填
	 * - rules: 验证规则数组
	 * - tableShow: 是否在表格显示（默认 true）
	 * - formShow: 是否在表单显示（默认 true）
	 * - searchShow: 是否在搜索显示（默认 false）
	 * - disabled: 是否禁用
	 * - defaultValue: 默认值
	 * - options: 选项列表（select/radio/checkbox）
	 * - showRule: 显示条件（条件渲染）
	 */
	fieldsConfig: {
		// 示例字段 1：文本输入
		name: {
			type: 'text',
			label: 'Name',
			required: true,
			tableShow: true,
			formShow: true,
			searchShow: true,
			rules: [
				{ required: true, message: 'Name is required' },
				{ min: 2, max: 50, message: 'Name length: 2-50 characters' },
			],
		},

		// 示例字段 2：下拉选择
		status: {
			type: 'select',
			label: 'Status',
			required: true,
			tableShow: true,
			formShow: true,
			searchShow: true,
			defaultValue: 'active',
			options: [
				{ label: 'Active', value: 'active' },
				{ label: 'Inactive', value: 'inactive' },
			],
			rules: [{ required: true, message: 'Status is required' }],
		},

		// 示例字段 3：数字输入
		order: {
			type: 'number',
			label: 'Display Order',
			required: false,
			tableShow: true,
			formShow: true,
			defaultValue: 0,
			rules: [{ type: 'number', min: 0, message: 'Order must >= 0' }],
		},

		// 示例字段 4：日期选择
		expiresAt: {
			type: 'date',
			label: 'Expires At',
			required: false,
			tableShow: true,
			formShow: true,
		},

		// 示例字段 5：多行文本
		description: {
			type: 'textarea',
			label: 'Description',
			required: false,
			tableShow: false,
			formShow: true,
			rules: [{ max: 500, message: 'Description max length: 500' }],
		},
	},

	/**
	 * 权限配置（可选）
	 * 如果不配置，默认要求管理员权限
	 */
	permissions: {
		create: 'admin', // 或具体权限 ID
		update: 'admin',
		delete: 'admin',
		read: 'admin',
	},

	/**
	 * 软删除配置（可选）
	 * 启用后，删除操作只是标记为已删除，不会物理删除
	 */
	enableSoftDelete: true,

	/**
	 * 搜索配置（可选）
	 * 定义哪些字段支持搜索
	 */
	searchFields: ['name', 'status'],

	/**
	 * 默认排序（可选）
	 */
	defaultSort: { createdAt: -1 },

	/**
	 * 连表配置（可选）
	 * 用于连表查询，如关联角色、用户等
	 */
	/*
	foreignDB: [
		{
			dbName: 'users',           // 目标表
			localKey: 'userId',        // 本表字段
			foreignKey: 'id',          // 目标表字段
			as: 'user',                // 结果字段名
			fieldJson: { id: 1, name: 1 }, // 返回字段
		},
	],
	*/
};

