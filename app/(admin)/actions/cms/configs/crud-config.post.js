
/**
 * Post CRUD Config
 * 
 * 使用方法：
 * 1. 复制此文件到你的 configs 目录
 * 3. 配置 fieldsConfig（字段定义）
 * 4. 配置其他选项（可选）
 */

/**
 * Post CRUD 配置
 */
export const postCrudConfig = {
	/**
	 * 数据库集合名称
	 */
	collectionName: 'post',

	/**
	 * 主键字段名称
	 * MongoDB 默认使用 '_id'，如果使用自定义主键（如 'id'），需要修改此配置
	 */
	primaryKey: '_id',

	/**
	 * 字段配置（核心配置）
	 * 
	 * 每个字段支持的属性：
	 * - key: 字段唯一标识（必需）
	 * - type: 字段类型（text/number/select/date/textarea等）
	 * - title: 显示标签
	 * - required: 是否必填
	 * - rules: 验证规则数组
	 * - table: 表格显示配置 { width, fixed, ellipsis, sorter, render, etc }
	 * - form: 表单显示配置 { render, props, etc }
	 * - search: 搜索配置 { mode, lazyLoad, etc } 或 false（不可搜索）
	 * - detail: 详情显示配置 { render, hide, etc }
	 * - hideInTable: 是否在表格隐藏（默认 false）
	 * - hideInForm: 是否在表单隐藏（默认 false）
	 * - disabled: 是否禁用
	 * - defaultValue: 默认值
	 * - options: 选项列表（select/radio/checkbox）
	 */
	fieldsConfig: [
		// 示例字段 1：文本输入
		{
			key: 'name',
			type: 'text',
			title: 'Name',
			required: true,
			table: {
				width: 200,
				sorter: true,
			},
			search: {
				mode: 'like', // 模糊搜索
			},
			rules: [
				{ required: true, message: 'Name is required' },
				{ min: 2, max: 50, message: 'Name length: 2-50 characters' },
			],
		},

		// 示例字段 2：下拉选择
		{
			key: 'status',
			type: 'select',
			title: 'Status',
			required: true,
			defaultValue: 'active',
			options: [
				{ label: 'Active', value: 'active' },
				{ label: 'Inactive', value: 'inactive' },
			],
			table: {
				width: 120,
			},
			search: {
				mode: 'exact', // 精确搜索
			},
			rules: [{ required: true, message: 'Status is required' }],
		},

		// 示例字段 3：数字输入
		{
			key: 'order',
			type: 'number',
			title: 'Display Order',
			required: false,
			defaultValue: 0,
			table: {
				width: 120,
				sorter: true,
			},
			search: false, // 不可搜索
			rules: [{ type: 'number', min: 0, message: 'Order must >= 0' }],
		},

		// 示例字段 4：日期选择
		{
			key: 'expiresAt',
			type: 'date',
			title: 'Expires At',
			required: false,
			table: {
				width: 180,
			},
			search: false,
		},

		// 示例字段 5：多行文本
		{
			key: 'description',
			type: 'textarea',
			title: 'Description',
			required: false,
			hideInTable: true, // 不在表格显示
			search: false,
			rules: [{ max: 500, message: 'Description max length: 500' }],
		},

		// 富文本正文
		{
			key: 'content',
			type: 'markdown',
			title: 'Content',
			required: false,
			hideInTable: true, // 不在表格显示
			search: false,
			rules: [{ max: 500, message: 'Content max length: 500' }],
		},
	],

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
	softDelete: true,

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

