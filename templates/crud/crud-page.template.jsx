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

import { SmartCrudPage } from '@/components/admin/smart-crud-page';
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
				getDetail: actions.get{RESOURCE_LABEL}DetailAction,
				create: actions.create{RESOURCE_LABEL}Action,
				update: actions.update{RESOURCE_LABEL}Action,
				deleteItem: actions.delete{RESOURCE_LABEL}Action,
				batchUpdate: actions.batchUpdate{RESOURCE_LABEL}sAction,
				batchDelete: actions.batchDelete{RESOURCE_LABEL}sAction,
			}}
			// 可选配置
			options={{
				// 是否显示批量操作按钮
				enableBatchOperations: true,
				
				// 是否显示导出按钮
				enableExport: false,
				
				// 默认页面大小
				defaultPageSize: 20,
				
				// 是否显示详情抽屉
				enableDetail: true,
				
				// 表格滚动配置
				scroll: { x: 1200 },
			}}
		/>
	);
}

