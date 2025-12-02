/**
 * 文件上传服务
 *
 * 使用 Prisma 直接操作 PostgreSQL
 */

import { uploadToR2, generateFileKey, deleteFromR2 } from './r2-client';
import { prisma } from '@/lib/database/prisma';
import nb from '@/lib/function';

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
 */
export function validateFile(file, type, options = {}) {
	const config = UPLOAD_TYPE_CONFIG[type];
	if (!config) {
		return { valid: false, error: `Invalid upload type: ${type}` };
	}

	const maxSize = options.maxSize || config.maxSize;
	if (file.size > maxSize) {
		const maxSizeMB = Math.round(maxSize / 1024 / 1024);
		return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
	}

	const allowedTypes = options.allowedMimeTypes || config.allowedMimeTypes;
	if (allowedTypes && !allowedTypes.includes(file.type)) {
		return { valid: false, error: `File type ${file.type} is not allowed` };
	}

	return { valid: true };
}

/**
 * 上传单个文件
 */
export async function uploadFile({ file, type, directory, userId, options = {} }) {
	try {
		const config = UPLOAD_TYPE_CONFIG[type];
		if (!config) {
			return { success: false, error: `Invalid upload type: ${type}` };
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const originalName = file.name || 'unknown';
		const mimeType = file.type || 'application/octet-stream';
		const size = file.size;

		const validation = validateFile(file, type, options);
		if (!validation.valid) {
			return { success: false, error: validation.error };
		}

		const uploadDirectory = directory || config.defaultDirectory;
		const key = generateFileKey(originalName, uploadDirectory);

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

		// 保存上传记录到数据库
		await prisma.asset.create({
			data: {
				id: nb.pubfn.uuid(),
				key,
				url: uploadResult.url,
				originalName,
				filename: key.split('/').pop(),
				mimeType,
				size,
				type,
				userId: userId || null,
			},
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
 */
export async function deleteFile(keyOrUrl, userId, options = {}) {
	const { isAdmin = false, skipPermissionCheck = false } = options;

	try {
		let key = keyOrUrl;
		if (keyOrUrl.startsWith('http')) {
			const url = new URL(keyOrUrl);
			key = url.pathname.replace(/^\//, '');
		}

		const record = await prisma.asset.findUnique({
			where: { key },
		});

		if (!record) {
			return { success: false, error: 'File not found' };
		}

		if (!skipPermissionCheck && !isAdmin) {
			if (record.userId && record.userId !== userId) {
				return { success: false, error: 'Permission denied' };
			}
		}

		await deleteFromR2(key);

		await prisma.asset.delete({
			where: { key },
		});

		return { success: true };
	} catch (error) {
		console.error('Delete error:', error);
		return { success: false, error: error.message };
	}
}

/**
 * 获取用户的上传记录
 */
export async function getUserUploads(userId, options = {}) {
	try {
		const where = { userId };
		if (options.type) {
			where.type = options.type;
		}

		const assets = await prisma.asset.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: options.limit || 100,
		});

		return { success: true, data: assets };
	} catch (error) {
		console.error('Get assets error:', error);
		return { success: false, error: error.message };
	}
}

/**
 * 获取上传类型配置
 */
export function getUploadTypeConfig(type) {
	return UPLOAD_TYPE_CONFIG[type] || null;
}
