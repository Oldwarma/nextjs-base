/**
 * Admin Server Actions 入口文件
 * 管理员专用的服务端操作
 */

// 用户管理
export {
	getUserListAction,
	updateUserRoleAction,
	updateUserInfoAction,
	deleteUserAction,
	getUserDetailAction,
	getUserStatisticsAdminAction,
	batchUpdateUsersAction,
} from './admin-users';

// 积分管理
export {
	adminAddCreditsAction,
	adminDeductCreditsAction,
	getAdminCreditTransactionsAction,
} from './admin-credits';

// 套餐管理
export {
	getAllPackagesAdminAction,
	createPackageAction,
	updatePackageAction,
	deletePackageAction,
	getUserPackagesAdminAction,
} from './admin-packages';

// 使用记录管理
export { getAdminUsageLogsAction, getSystemStatisticsAction } from './admin-usage';
