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
import { postCrudConfig } from '@/app/(admin)/actions/cms/configs/crud-config.post';
import * as actions from '@/app/(admin)/actions/cms/crud-action.post';

/**
 * Post Management Page
 */
export default function PostManagementPage() {
	return (
		<SmartCrudPage
			title="Post Management"
			fieldsConfig={postCrudConfig.fieldsConfig}
			actions={{
				getList: actions.getPostListAction,
				// getDetail: actions.getPostDetailAction, // 注释掉，直接使用表格数据展示详情
				create: actions.createPostAction,
				update: actions.updatePostAction,
				delete: actions.deletePostAction, // 注意：属性名是 delete 不是 deleteItem
				batchUpdate: actions.batchUpdatePostsAction,
				batchDelete: actions.batchDeletePostsAction,
			}}
			// 功能开关
			enableCreate={true}
			enableEdit={true}
			enableDelete={true}
			enableDetail={true}
			enableIndexColumn={true} // 显示序号列
			// 批量操作（启用后会显示多选框）
			batchActions={[
				{
					key: 'batchActivate',
					label: 'Batch Activate',
					action: async (selectedKeys) => {
						// 调用批量更新 API
						// 注意：后端期望的参数格式是 { ids, data }
						const result = await actions.batchUpdatePostsAction({
							ids: selectedKeys,
							data: { status: 'active' }
						});
						return result;
					},
				},
                {
					key: 'batchUnactivate',
					label: 'Batch Unactivate',
					action: async (selectedKeys) => {
						// 调用批量更新 API
						// 注意：后端期望的参数格式是 { ids, data }
						const result = await actions.batchUpdatePostsAction({
							ids: selectedKeys,
							data: { status: 'inactive' }
						});
						return result;
					},
				},
				{
					key: 'batchDelete',
					label: 'Batch Delete',
					action: async (selectedKeys) => {
						// 调用批量删除 API
						// 注意：后端期望的参数格式是 { ids }
						const result = await actions.batchDeletePostsAction({
							ids: selectedKeys
						});
						return result;
					},
				},
			]}
			// 表格配置
			tableProps={{
				pagination: {
					defaultPageSize: 10, // 使用 defaultPageSize 而不是 pageSize
					showSizeChanger: true,
					pageSizeOptions: [10, 20, 50, 100], // 可选的页面大小
				},
				scroll: { x: 1200 },
			}}
		/>
	);
}

