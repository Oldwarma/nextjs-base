/**
 * 上传模块统一导出
 */

// 服务端模块（R2 客户端）
export {
	checkR2Config,
	getR2Client,
	generateFileKey,
	getPublicUrl,
	uploadToR2,
	deleteFromR2,
	getFromR2,
	getR2Config,
} from './r2-client';

// 服务端模块（上传服务）
export {
	validateFile,
	uploadFile,
	uploadFiles,
	deleteFile,
	getUserUploads,
	getUploadTypeConfig,
} from './upload-service';

// 客户端模块（上传 Hook）
export {
	uploadSingleFile,
	uploadMultipleFiles,
	createCustomRequest,
	checkUploadService,
} from './use-upload';

