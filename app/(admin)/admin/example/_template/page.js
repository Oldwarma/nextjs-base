/**
 * 智能 CRUD 页面模板
 * 
 * 基于 vk-unicloud 万能表格/表单思想
 * 通过统一的字段配置自动生成表格、表单、搜索
 * 
 * 使用步骤:
 * 1. 复制此文件到目标目录
 * 2. 配置 fieldsConfig (统一字段配置)
 * 3. 配置 actions (Server Actions)
 * 4. 调整其他选项 (可选)
 * 
 * 优势:
 * - 只需维护一份字段配置
 * - 表格、表单、搜索自动同步
 * - 减少 80% 代码量
 * - 类型安全、易于扩展
 */

'use client';

// 引入智能 CRUD 页面组件
import SmartCrudPage from '@/components/admin/smart-crud-page';

// ============================================
// 1. 导入 Server Actions
// ============================================
import {
	// TODO: 修改为实际的 Action 名称和导入路径
	getDataListAction as getList,
	updateDataAction as update,
	deleteDataAction as deleteItem,
	createDataAction as create, // 可选
} from '@/app/(admin)/actions/admin-xxx'; // ← 修改为实际的 action 文件

export default function SmartDataManagementPage() {
	// ============================================
	// 2. 定义统一的字段配置 (核心)
	// ============================================
	const fieldsConfig = [
		// 字段 1: ID
		{
			key: '_id',
			title: 'ID',
			type: 'text',
			
			// 表格配置
			table: {
				width: 100,
				copyable: true,
				ellipsis: true,
			},
			
			// 不在表单中显示
			form: false,
			
			// 不可搜索
			search: false,
		},
		
		// 字段 2: 名称
		{
			key: 'name',
			title: 'Name',
			type: 'text',
			
			// 表格配置
			table: {
				width: 150,
				ellipsis: true,
				sorter: true,
			},
			
			// 表单配置
			form: {
				required: true,
				placeholder: 'Enter name',
				minLength: 2,
				maxLength: 50,
			},
			
			// 搜索配置
			search: {
				enabled: true,
				mode: 'like', // 模糊搜索
			},
		},
		
		// 字段 3: 状态
		{
			key: 'status',
			title: 'Status',
			type: 'select',
			
			// 选项配置
			options: [
				{ label: 'Active', value: 'active', color: 'green' },
				{ label: 'Inactive', value: 'inactive', color: 'default' },
			],
			
			// 表格配置
			table: {
				width: 120,
			},
			
			// 表单配置
			form: {
				required: true,
			},
			
			// 搜索配置
			search: {
				enabled: true,
				mode: 'exact', // 精确搜索
			},
		},
		
		// 字段 4: 数量
		{
			key: 'count',
			title: 'Count',
			type: 'number',
			
			// 表格配置
			table: {
				width: 100,
			},
			
			// 表单配置
			form: {
				precision: 0,
				min: 0,
			},
			
			// 搜索配置
			search: {
				enabled: true,
				mode: 'exact',
			},
		},
		
		// 字段 5: 价格
		{
			key: 'price',
			title: 'Price',
			type: 'money',
			
			// 表格配置
			table: {
				width: 120,
				precision: 2,
				symbol: '$',
			},
			
			// 表单配置
			form: {
				precision: 2,
				min: 0,
				prefix: '$',
			},
			
			// 不可搜索
			search: false,
		},
		
		// 字段 6: 描述
		{
			key: 'description',
			title: 'Description',
			type: 'textarea',
			
			// 不在表格中显示
			table: false,
			
			// 表单配置
			form: {
				placeholder: 'Enter description',
				maxLength: 500,
			},
		},
		
		// 字段 7: 启用开关
		{
			key: 'enabled',
			title: 'Enabled',
			type: 'switch',
			
			// 表格配置
			table: {
				width: 100,
				trueText: 'Yes',
				falseText: 'No',
			},
			
			// 表单配置
			form: {},
			
			// 搜索配置
			search: {
				enabled: true,
				mode: 'exact',
				trueText: 'Enabled',
				falseText: 'Disabled',
			},
		},
		
		// 字段 8: 日期
		{
			key: 'date',
			title: 'Date',
			type: 'date',
			
			// 表格配置
			table: {
				width: 120,
				format: 'YYYY-MM-DD',
			},
			
			// 表单配置
			form: {
				format: 'YYYY-MM-DD',
			},
		},
		
		// 字段 9: 创建时间
		{
			key: 'createdAt',
			title: 'Created At',
			type: 'datetime',
			
			// 表格配置
			table: {
				width: 180,
				sorter: true,
				defaultSort: 'desc', // 默认降序
			},
			
			// 不在表单中显示
			form: false,
			
			// 不可搜索 (使用日期范围搜索)
			search: false,
		},
		
		// 字段 10: 创建时间范围搜索
		{
			key: 'createdAt',
			title: 'Created Date Range',
			type: 'datetimerange',
			
			// 不在表格中显示
			table: false,
			
			// 不在表单中显示
			form: false,
			
			// 仅用于搜索
			search: {
				enabled: true,
				mode: 'range',
			},
		},
		
		// TODO: 添加更多字段...
	];
	
	// ============================================
	// 3. 定义 Actions (必需)
	// ============================================
	const actions = {
		getList,              // 必需
		update,               // 必需 (如果 enableEdit=true)
		delete: deleteItem,   // 必需 (如果 enableDelete=true)
		// create,            // 可选: 取消注释以启用创建
	};
	
	// ============================================
	// 4. 配置批量操作 (可选)
	// ============================================
	const batchActions = [
		// 示例: 批量激活
		// {
		// 	key: 'activate',
		// 	label: 'Activate',
		// 	action: batchUpdate,
		// 	params: { status: 'active' },
		// },
	];
	
	// ============================================
	// 5. 钩子函数 (可选)
	// ============================================
	
	const beforeEdit = async (record) => {
		// 编辑前处理
		return record;
	};
	
	const beforeDelete = async (id) => {
		// 删除前验证
		return true;
	};
	
	const beforeCreate = async (values) => {
		// 创建前处理
		return values;
	};
	
	// ============================================
	// 6. 返回 SmartCrudPage 组件
	// ============================================
	return (
		<SmartCrudPage
			// 核心配置
			fieldsConfig={fieldsConfig}  // 统一的字段配置
			actions={actions}            // Server Actions
			
			// 基础配置
			title='Data Management'      // TODO: 修改页面标题
			rowKey='_id'                 // MongoDB 主键
			
			// 批量操作
			batchActions={batchActions}
			
			// 钩子函数
			beforeEdit={beforeEdit}
			beforeDelete={beforeDelete}
			beforeCreate={beforeCreate}
			
			// 功能开关
			enableCreate={false}         // TODO: 是否启用创建
			enableDetail={true}          // 是否启用查看详情
			enableEdit={true}            // 是否启用编辑
			enableDelete={true}          // 是否启用删除
			
			// 额外配置 (可选)
			tableProps={{
				scroll: { x: 1400 },
			}}
			formProps={{
				width: 600,
			}}
		/>
	);
}

/**
 * ============================================
 * 字段类型参考
 * ============================================
 * 
 * 支持的字段类型:
 * - text: 单行文本
 * - textarea: 多行文本
 * - number: 数字
 * - money: 金额
 * - percentage: 百分比
 * - date: 日期
 * - datetime: 日期时间
 * - daterange: 日期范围 (仅搜索)
 * - datetimerange: 日期时间范围 (仅搜索)
 * - select: 下拉选择
 * - radio: 单选
 * - checkbox: 多选
 * - switch: 开关
 * - image: 图片
 * - file: 文件
 * - json: JSON
 */

/**
 * ============================================
 * 搜索模式参考
 * ============================================
 * 
 * 支持的搜索模式:
 * - like / %%: 模糊搜索 (包含)
 * - likeLeft / %=: 左模糊搜索 (以...结尾)
 * - likeRight / =%: 右模糊搜索 (以...开头)
 * - exact / ==: 精确搜索
 * - range / []: 范围搜索
 * - in: 包含 (用于多选)
 * - gt / >: 大于
 * - gte / >=: 大于等于
 * - lt / <: 小于
 * - lte / <=: 小于等于
 * - ne / !=: 不等于
 */

/**
 * ============================================
 * 完整字段配置示例
 * ============================================
 */

// 示例 1: 标签字段
// {
// 	key: 'tags',
// 	title: 'Tags',
// 	type: 'checkbox',
// 	options: [
// 		{ label: 'Tag 1', value: 'tag1' },
// 		{ label: 'Tag 2', value: 'tag2' },
// 		{ label: 'Tag 3', value: 'tag3' },
// 	],
// 	table: {
// 		width: 200,
// 	},
// 	form: {},
// 	search: {
// 		enabled: true,
// 		mode: 'in',
// 	},
// }

// 示例 2: 图片字段
// {
// 	key: 'image',
// 	title: 'Image',
// 	type: 'image',
// 	table: {
// 		width: 100,
// 		height: 80,
// 	},
// 	form: {
// 		max: 1,
// 	},
// 	search: false,
// }

// 示例 3: 自定义渲染
// {
// 	key: 'custom',
// 	title: 'Custom Field',
// 	type: 'text',
// 	table: {
// 		width: 150,
// 		render: (value, record) => {
// 			return <Tag color='blue'>{value}</Tag>;
// 		},
// 	},
// 	form: {
// 		render: (field) => {
// 			return (
// 				<ProFormText
// 					name={field.key}
// 					label={field.title}
// 					// 自定义逻辑
// 				/>
// 			);
// 		},
// 	},
// }

// 示例 4: 百分比字段
// {
// 	key: 'discount',
// 	title: 'Discount',
// 	type: 'percentage',
// 	table: {
// 		width: 100,
// 		precision: 1,
// 	},
// 	form: {
// 		precision: 1,
// 	},
// }

