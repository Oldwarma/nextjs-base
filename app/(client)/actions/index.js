/**
 * Client Actions Index
 * 导出所有客户端可用的 Server Actions
 */

// 认证相关
export {
	signInWithEmailAction,
	signUpWithEmailAction,
	getGoogleAuthUrlAction,
	getGithubAuthUrlAction,
	signOutAction,
	getSessionAction,
	checkAndInitUserAction,
} from './auth';

// 用户相关
export { getUserProfileAction, updateUserProfileAction, getUserStatisticsAction } from './user';

// 积分相关
export {
	getUserCreditsAction,
	getUserCreditsInfoAction,
	getCreditTransactionsAction,
	getUserCreditsWithTransactionsAction,
} from './credits';

// 套餐相关
export {
	getActivePackagesAction,
	purchasePackageAction,
	getUserPackagesAction,
	getUserCurrentPackageAction,
} from './packages';

// 使用记录相关
export {
	getUserUsageLogsAction,
	getUserUsageStatisticsAction,
	checkUserCanUseFeatureAction,
	getFeaturePricesAction,
} from './usage';

// 图片生成相关
export { textToImageAction, imageToImageAction, upscaleImageAction, removeBackgroundAction } from './generate';

