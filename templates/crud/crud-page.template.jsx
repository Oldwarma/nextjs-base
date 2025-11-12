/**
 * CRUD Page Template
 * 
 * 使用方法：
 * 1. 复制此文件到你的 admin 页面目录
 * 2. 替换所有 {RESOURCE_NAME} 为你的资源名（小写）
 * 3. 替换所有 {RESOURCE_LABEL} 为资源标签
 * 4. 引入对应的 config 和 actions
 * 5. 按需自定义页面选项
 */

'use client';

import SmartCrudPage from '@/components/admin/smart-crud-page';
import { {RESOURCE_NAME}CrudConfig } from '@/app/(admin)/actions/{RESOURCE_NAME}/configs/{RESOURCE_NAME}-crud.config';
import * as actions from '@/app/(admin)/actions/{RESOURCE_NAME}/admin-{RESOURCE_NAME}';

/**
 * {RESOURCE_LABEL} Management Page
 */
export default function {RESOURCE_LABEL}ManagementPage() {
	return (
		<SmartCrudPage
			title="{RESOURCE_LABEL} Management"
			fieldsConfig={{RESOURCE_NAME}CrudConfig.fieldsConfig}
			actions={{
				getList: actions.get{RESOURCE_LABEL}ListAction,
				// getDetail: actions.get{RESOURCE_LABEL}DetailAction, // 可选：如果需要查询完整数据或关联数据，取消注释
				create: actions.create{RESOURCE_LABEL}Action,
				update: actions.update{RESOURCE_LABEL}Action,
				delete: actions.delete{RESOURCE_LABEL}Action, // 注意：属性名是 delete 不是 deleteItem
				// batchUpdate: actions.batchUpdate{RESOURCE_LABEL}sAction, // 可选，需要同时在page中进行配置后方可显示复选框
				// batchDelete: actions.batchDelete{RESOURCE_LABEL}sAction, // 可选，需要同时在page中进行配置后方可显示复选框
			}}
			// 功能开关
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
			enableIndexColumn={true} // 显示序号列（可选）
			// 批量操作（可选，配置后会显示多选框）
			// batchActions={[
			// 	{
			// 		key: 'batchActivate',
			// 		label: 'Batch Activate',
			// 		action: async (selectedKeys) => {
			// 			// 后端期望格式：{ ids, data }
			// 			const result = await actions.batchUpdate{RESOURCE_LABEL}sAction({
			// 				ids: selectedKeys,
			// 				data: { status: 'active' }
			// 			});
			// 			return result;
			// 		},
			// 	},
			// 	{
			// 		key: 'batchDelete',
			// 		label: 'Batch Delete',
			// 		action: async (selectedKeys) => {
			// 			// 后端期望格式：{ ids }
			// 			const result = await actions.batchDelete{RESOURCE_LABEL}sAction({
			// 				ids: selectedKeys
			// 			});
			// 			return result;
			// 		},
			// 	},
			// ]}
			// 表格配置
			tableProps={{
				pagination: {
					defaultPageSize: 20, // 使用 defaultPageSize 而不是 pageSize
					showSizeChanger: true,
					pageSizeOptions: [10, 20, 50, 100], // 可选的页面大小
				},
				scroll: { x: 1200 },
			}}
		/>
	);
}

