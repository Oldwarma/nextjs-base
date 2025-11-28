/**
 * 文件上传服务
 *
 * 统一处理文件上传逻辑，支持：
 * - image: 单图上传
 * - images: 多图上传
 * - file: 文件上传
 * - avatar: 头像上传
 */

import { uploadToR2, generateFileKey, deleteFromR2 } from './r2-client';
import { add, del, getOne, selects } from '@/lib/database/db-api';

// 集合名称
const COLLECTION_NAME = 'uploads';

// 上传类型配置
const UPLOAD_TYPE_CONFIG = {
	image: {
		defaultDirectory: 'images',
		allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
		maxSize: 10 * 1024 * 1024, // 10MB
	},
	images: {
		defaultDirectory: 'images',
		allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
		maxSize: 10 * 1024 * 1024, // 10MB
	},
	avatar: {
		defaultDirectory: 'avatars',
		allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
		maxSize: 2 * 1024 * 1024, // 2MB
	},
	file: {
		defaultDirectory: 'files',
		allowedMimeTypes: null, // 允许所有类型
		maxSize: 50 * 1024 * 1024, // 50MB
	},
};

/**
 * 验证文件
 * @param {File} file - 文件对象
 * @param {string} type - 上传类型
 * @param {Object} options - 额外选项
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFile(file, type, options = {}) {
	const config = UPLOAD_TYPE_CONFIG[type];
	if (!config) {
		return { valid: false, error: `Invalid upload type: ${type}` };
	}

	// 检查文件大小
	const maxSize = options.maxSize || config.maxSize;
	if (file.size > maxSize) {
		const maxSizeMB = Math.round(maxSize / 1024 / 1024);
		return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
	}

	// 检查 MIME 类型
	const allowedTypes = options.allowedMimeTypes || config.allowedMimeTypes;
	if (allowedTypes && !allowedTypes.includes(file.type)) {
		return { valid: false, error: `File type ${file.type} is not allowed` };
	}

	return { valid: true };
}

/**
 * 上传单个文件
 * @param {Object} params - 上传参数
 * @param {File|Blob} params.file - 文件对象
 * @param {string} params.type - 上传类型 (image|images|file|avatar)
 * @param {string} params.directory - 自定义目录（可选）
 * @param {string} params.userId - 用户 ID
 * @param {Object} params.options - 额外选项
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function uploadFile({ file, type, directory, userId, options = {} }) {
	try {
		// 验证上传类型
		const config = UPLOAD_TYPE_CONFIG[type];
		if (!config) {
			return { success: false, error: `Invalid upload type: ${type}` };
		}

		// 获取文件信息
		const buffer = Buffer.from(await file.arrayBuffer());
		const originalName = file.name || 'unknown';
		const mimeType = file.type || 'application/octet-stream';
		const size = file.size;

		// 验证文件
		const validation = validateFile(file, type, options);
		if (!validation.valid) {
			return { success: false, error: validation.error };
		}

		// 确定上传目录
		const uploadDirectory = directory || config.defaultDirectory;

		// 生成文件路径
		const key = generateFileKey(originalName, uploadDirectory);

		// 上传到 R2
		const uploadResult = await uploadToR2({
			body: buffer,
			key,
			contentType: mimeType,
			metadata: {
				originalName,
				uploadType: type,
				userId: userId || 'anonymous',
			},
		});

		// 保存上传记录到数据库（使用 db-api 的 add 方法）
		// 按照项目规范生成 UUID 作为 id
		const uploadRecord = {
			id: crypto.randomUUID(),
			key,
			url: uploadResult.url,
			originalName,
			mimeType,
			size,
			type,
			directory: uploadDirectory,
			userId,
		};

		await add({
			dbName: COLLECTION_NAME,
			dataJson: uploadRecord,
		});

		return {
			success: true,
			data: {
				key,
				url: uploadResult.url,
				originalName,
				mimeType,
				size,
			},
		};
	} catch (error) {
		console.error('Upload error:', error);
		return { success: false, error: error.message };
	}
}

/**
 * 上传多个文件
 * @param {Object} params - 上传参数
 * @param {File[]} params.files - 文件数组
 * @param {string} params.type - 上传类型
 * @param {string} params.directory - 自定义目录（可选）
 * @param {string} params.userId - 用户 ID
 * @param {Object} params.options - 额外选项
 * @returns {Promise<{success: boolean, data?: Object[], errors?: string[]}>}
 */
export async function uploadFiles({ files, type, directory, userId, options = {} }) {
	const results = [];
	const errors = [];

	for (const file of files) {
		const result = await uploadFile({ file, type, directory, userId, options });
		if (result.success) {
			results.push(result.data);
		} else {
			errors.push(`${file.name}: ${result.error}`);
		}
	}

	return {
		success: errors.length === 0,
		data: results,
		errors: errors.length > 0 ? errors : undefined,
	};
}

/**
 * 删除文件
 * @param {string} keyOrUrl - 文件 key 或 URL
 * @param {string} userId - 用户 ID（用于权限验证）
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(keyOrUrl, userId) {
	try {
		// 从 URL 中提取 key
		let key = keyOrUrl;
		if (keyOrUrl.startsWith('http')) {
			const url = new URL(keyOrUrl);
			key = url.pathname.replace(/^\//, '');
		}

		// 查找上传记录（使用 db-api 的 getOne 方法）
		const record = await getOne({
			dbName: COLLECTION_NAME,
			whereJson: { key },
		});

		if (!record) {
			return { success: false, error: 'File not found' };
		}

		// 验证权限（只有上传者或管理员可以删除）
		// 这里简化处理，实际可能需要更复杂的权限逻辑
		if (record.userId && record.userId !== userId) {
			return { success: false, error: 'Permission denied' };
		}

		// 从 R2 删除
		await deleteFromR2(key);

		// 删除数据库记录（使用 db-api 的 del 方法）
		await del({
			dbName: COLLECTION_NAME,
			whereJson: { key },
		});

		return { success: true };
	} catch (error) {
		console.error('Delete error:', error);
		return { success: false, error: error.message };
	}
}

/**
 * 获取用户的上传记录
 * @param {string} userId - 用户 ID
 * @param {Object} options - 查询选项
 * @returns {Promise<{success: boolean, data?: Object[]}>}
 */
export async function getUserUploads(userId, options = {}) {
	try {
		// 构建查询条件
		const whereJson = { userId };
		if (options.type) {
			whereJson.type = options.type;
		}

		// 使用 db-api 的 selects 方法
		const result = await selects({
			dbName: COLLECTION_NAME,
			whereJson,
			sortJson: { createdAt: -1 },
			pageSize: options.limit || 100,
			pageIndex: 1,
			getCount: false,
			getMain: true, // 只返回数据数组
		});

		return { success: true, data: result };
	} catch (error) {
		console.error('Get uploads error:', error);
		return { success: false, error: error.message };
	}
}

/**
 * 获取上传类型配置
 */
export function getUploadTypeConfig(type) {
	return UPLOAD_TYPE_CONFIG[type] || null;
}
