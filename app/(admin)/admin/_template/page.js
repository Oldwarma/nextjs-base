'use client';

import { ProFormText, ProFormSelect, ProFormDigit, ProFormDatePicker } from '@ant-design/pro-components';
import { Tag } from 'antd';

// 引入通用 CRUD 页面组件
import CrudPage from '@/components/admin/crud-page';

/**
 * CRUD 页面模板
 * 
 * 使用步骤：
 * 1. 复制此文件到目标目录（如 app/(admin)/admin/products/page.js）
 * 2. 修改 Actions 导入路径
 * 3. 配置 columns（表格列）
 * 4. 配置 formFields（表单字段）
 * 5. 配置其他选项（可选）
 * 6. 删除不需要的部分
 */

// ============================================
// 1. 导入 Server Actions
// ============================================
import {
	// TODO: 修改为实际的 Action 名称
	getDataListAction as getList,        // 必需：获取列表
	updateDataAction as update,          // 必需（如果启用编辑）
	deleteDataAction as deleteItem,      // 必需（如果启用删除）
	createDataAction as create,          // 可选（如果启用创建）
	batchUpdateDataAction as batchUpdate, // 可选（如果需要批量操作）
} from '@/app/(admin)/actions';

export default function DataManagementPage() {
	// ============================================
	// 2. 定义表格列（必需）
	// ============================================
	const columns = [
		{
			title: 'ID',
			dataIndex: '_id',
			search: false,
			width: 100,
			ellipsis: true,
			copyable: true,
		},
		{
			title: 'Name',
			dataIndex: 'name',
			width: 150,
			ellipsis: true,
			// 可搜索
		},
		{
			title: 'Status',
			dataIndex: 'status',
			valueType: 'select',
			width: 120,
			valueEnum: {
				active: { text: 'Active', status: 'Success' },
				inactive: { text: 'Inactive', status: 'Default' },
			},
			render: (_, record) => (
				<Tag color={record.status === 'active' ? 'green' : 'default'}>
					{record.status === 'active' ? 'Active' : 'Inactive'}
				</Tag>
			),
		},
		{
			title: 'Created At',
			dataIndex: 'createdAt',
			valueType: 'dateTime',
			search: false,
			width: 180,
			sorter: true,
		},
		{
			title: 'Updated At',
			dataIndex: 'updatedAt',
			valueType: 'dateTime',
			search: false,
			hideInTable: true, // 只在详情中显示
		},
		// TODO: 添加更多列...
	];

	// ============================================
	// 3. 定义表单字段（必需）
	// ============================================
	const formFields = (
		<>
			<ProFormText
				name='name'
				label='Name'
				placeholder='Enter name'
				rules={[{ required: true, message: 'Please enter name' }]}
			/>

			<ProFormSelect
				name='status'
				label='Status'
				valueEnum={{
					active: 'Active',
					inactive: 'Inactive',
				}}
				rules={[{ required: true, message: 'Please select status' }]}
			/>

			<ProFormDigit
				name='count'
				label='Count'
				placeholder='Enter count'
				fieldProps={{ precision: 0 }}
			/>

			<ProFormDatePicker
				name='date'
				label='Date'
			/>

			{/* TODO: 添加更多字段... */}
		</>
	);

	// ============================================
	// 4. 定义 Actions（必需）
	// ============================================
	const actions = {
		getList,                    // 必需
		update,                     // 必需（如果 enableEdit=true）
		delete: deleteItem,         // 必需（如果 enableDelete=true）
		// create,                  // 可选：取消注释以启用创建
		// batchUpdate,             // 可选：取消注释以启用批量更新
	};

	// ============================================
	// 5. 配置搜索（可选）
	// ============================================
	const searchConfig = {
		// 转换 ProTable 的搜索参数为 getList 参数
		transform: (params) => ({
			// 示例：将多个搜索字段合并为一个 search 参数
			search: params.name,
			status: params.status,
			// TODO: 根据实际需求调整
		}),
	};

	// ============================================
	// 6. 配置批量操作（可选）
	// ============================================
	const batchActions = [
		// 示例：批量激活
		// {
		// 	key: 'activate',
		// 	label: 'Activate',
		// 	action: batchUpdate,
		// 	params: { status: 'active' },
		// },
		// 示例：批量停用
		// {
		// 	key: 'deactivate',
		// 	label: 'Deactivate',
		// 	action: batchUpdate,
		// 	params: { status: 'inactive' },
		// },
		// TODO: 添加更多批量操作...
	];

	// ============================================
	// 7. 钩子函数（可选）
	// ============================================
	
	// 编辑前回调
	const beforeEdit = async (record) => {
		// 示例：检查权限
		// if (record.locked) {
		// 	toast.error('This record is locked');
		// 	return false;
		// }
		
		// 示例：数据转换
		// return {
		// 	...record,
		// 	date: record.date ? moment(record.date) : null,
		// };
		
		return record;
	};

	// 删除前回调
	const beforeDelete = async (id) => {
		// 示例：检查关联数据
		// const hasRelated = await checkRelated(id);
		// if (hasRelated) {
		// 	toast.error('Cannot delete, has related data');
		// 	return false;
		// }
		
		return true;
	};

	// ============================================
	// 8. 自定义详情头部（可选）
	// ============================================
	const renderDetailHeader = (record) => {
		// 示例：显示标题和描述
		// return (
		// 	<div style={{ marginBottom: 24 }}>
		// 		<h2>{record.name}</h2>
		// 		<p style={{ color: '#999' }}>{record.description}</p>
		// 	</div>
		// );
		
		return null; // 不显示自定义头部
	};

	// ============================================
	// 9. 返回 CrudPage 组件
	// ============================================
	return (
		<CrudPage
			// 必需配置
			columns={columns}
			formFields={formFields}
			actions={actions}
			
			// 基础配置
			rowKey='_id'                    // MongoDB 默认主键
			title='Data Management'         // TODO: 修改页面标题
			
			// 搜索配置
			searchConfig={searchConfig}
			
			// 批量操作
			batchActions={batchActions}
			
			// 钩子函数
			beforeEdit={beforeEdit}
			beforeDelete={beforeDelete}
			
			// 自定义渲染
			renderDetailHeader={renderDetailHeader}
			
			// 功能开关
			enableCreate={false}            // TODO: 是否启用创建
			enableDetail={true}             // 是否启用查看详情
			enableEdit={true}               // 是否启用编辑
			enableDelete={true}             // 是否启用删除
			
			// 额外配置（可选）
			tableProps={{
				scroll: { x: 1400 },        // 表格横向滚动
				// size: 'small',           // 表格大小
			}}
			formProps={{
				width: 600,                 // 表单宽度
				// grid: true,              // 启用栅格布局
			}}
		/>
	);
}

/**
 * ============================================
 * 常用字段配置示例
 * ============================================
 */

// 文本字段
// {
// 	title: 'Description',
// 	dataIndex: 'description',
// 	ellipsis: true,
// 	width: 200,
// }

// 数字字段
// {
// 	title: 'Price',
// 	dataIndex: 'price',
// 	valueType: 'money',
// 	search: false,
// }

// 日期字段
// {
// 	title: 'Date',
// 	dataIndex: 'date',
// 	valueType: 'date',
// 	search: false,
// }

// 标签字段
// {
// 	title: 'Tags',
// 	dataIndex: 'tags',
// 	search: false,
// 	render: (tags) => (
// 		<>
// 			{tags?.map((tag) => (
// 				<Tag key={tag}>{tag}</Tag>
// 			))}
// 		</>
// 	),
// }

// 图片字段
// {
// 	title: 'Image',
// 	dataIndex: 'image',
// 	search: false,
// 	render: (image) => (
// 		<Image src={image} width={50} height={50} alt='image' />
// 	),
// }

// 布尔字段
// {
// 	title: 'Enabled',
// 	dataIndex: 'enabled',
// 	valueType: 'select',
// 	valueEnum: {
// 		true: { text: 'Yes', status: 'Success' },
// 		false: { text: 'No', status: 'Default' },
// 	},
// }

/**
 * ============================================
 * 常用表单字段示例
 * ============================================
 */

// 文本域
// <ProFormTextArea
// 	name='description'
// 	label='Description'
// 	placeholder='Enter description'
// />

// 数字（小数）
// <ProFormDigit
// 	name='price'
// 	label='Price'
// 	fieldProps={{ precision: 2, prefix: '$' }}
// />

// 开关
// <ProFormSwitch
// 	name='enabled'
// 	label='Enabled'
// />

// 日期范围
// <ProFormDateRangePicker
// 	name='dateRange'
// 	label='Date Range'
// />

// 单选
// <ProFormRadio.Group
// 	name='type'
// 	label='Type'
// 	options={[
// 		{ label: 'Type A', value: 'a' },
// 		{ label: 'Type B', value: 'b' },
// 	]}
// />

// 多选
// <ProFormCheckbox.Group
// 	name='features'
// 	label='Features'
// 	options={[
// 		{ label: 'Feature 1', value: 'f1' },
// 		{ label: 'Feature 2', value: 'f2' },
// 	]}
// />

// 文件上传
// <ProFormUpload
// 	name='file'
// 	label='File'
// 	action='/api/upload'
// 	fieldProps={{ listType: 'picture-card' }}
// />

