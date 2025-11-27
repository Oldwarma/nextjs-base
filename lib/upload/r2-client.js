/**
 * Cloudflare R2 客户端
 *
 * 使用 AWS S3 SDK 与 R2 兼容 API 进行交互
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// R2 配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

/**
 * 检查 R2 配置是否完整
 */
export function checkR2Config() {
	const missing = [];
	if (!R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
	if (!R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
	if (!R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
	if (!R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');
	if (!R2_PUBLIC_URL) missing.push('R2_PUBLIC_URL');

	if (missing.length > 0) {
		return {
			configured: false,
			missing,
			error: `Missing R2 configuration: ${missing.join(', ')}`,
		};
	}

	return { configured: true };
}

/**
 * 创建 S3 客户端（用于 R2）
 */
function createR2Client() {
	const config = checkR2Config();
	if (!config.configured) {
		throw new Error(config.error);
	}

	return new S3Client({
		region: 'auto',
		endpoint: R2_ENDPOINT,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		},
	});
}

// 单例模式
let r2Client = null;

/**
 * 获取 R2 客户端实例
 */
export function getR2Client() {
	if (!r2Client) {
		r2Client = createR2Client();
	}
	return r2Client;
}

/**
 * 生成唯一的文件名
 * @param {string} originalName - 原始文件名
 * @param {string} directory - 目录路径
 * @returns {string} 生成的文件路径
 */
export function generateFileKey(originalName, directory = '') {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 10);
	const ext = originalName.split('.').pop()?.toLowerCase() || '';
	const fileName = `${timestamp}-${random}${ext ? `.${ext}` : ''}`;

	// 清理目录路径
	const cleanDir = directory
		.replace(/^\/+|\/+$/g, '') // 移除首尾斜杠
		.replace(/\/+/g, '/'); // 合并多个斜杠

	return cleanDir ? `${cleanDir}/${fileName}` : fileName;
}

/**
 * 获取文件的公开 URL
 * @param {string} key - 文件在 R2 中的路径
 * @returns {string} 公开访问 URL
 */
export function getPublicUrl(key) {
	const baseUrl = R2_PUBLIC_URL.replace(/\/+$/, ''); // 移除尾部斜杠
	return `${baseUrl}/${key}`;
}

/**
 * 上传文件到 R2
 * @param {Object} options - 上传选项
 * @param {Buffer|Uint8Array} options.body - 文件内容
 * @param {string} options.key - 文件路径
 * @param {string} options.contentType - MIME 类型
 * @param {Object} options.metadata - 元数据（可选）
 * @returns {Promise<{success: boolean, key: string, url: string}>}
 */
export async function uploadToR2({ body, key, contentType, metadata = {} }) {
	const client = getR2Client();

	// 对 metadata 中的值进行 URL 编码，避免非 ASCII 字符导致的错误
	const safeMetadata = {};
	for (const [k, v] of Object.entries(metadata)) {
		if (v !== undefined && v !== null) {
			// 将值转换为 ASCII 安全的格式
			safeMetadata[k] = encodeURIComponent(String(v));
		}
	}

	const command = new PutObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
		Body: body,
		ContentType: contentType,
		Metadata: safeMetadata,
	});

	try {
		await client.send(command);
		return {
			success: true,
			key,
			url: getPublicUrl(key),
		};
	} catch (error) {
		console.error('R2 upload error:', error);
		console.error('R2 upload details:', {
			bucket: R2_BUCKET_NAME,
			key,
			endpoint: R2_ENDPOINT,
			errorCode: error.Code || error.code,
		});

		// 提供更友好的错误信息
		if (error.Code === 'AccessDenied' || error.code === 'AccessDenied') {
			throw new Error(
				'R2 Access Denied: Please check your API token permissions and bucket configuration. Make sure the token has "Object Read & Write" permission for this bucket.'
			);
		}

		throw new Error(`Failed to upload file: ${error.message}`);
	}
}

/**
 * 从 R2 删除文件
 * @param {string} key - 文件路径
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteFromR2(key) {
	const client = getR2Client();

	const command = new DeleteObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
	});

	try {
		await client.send(command);
		return { success: true };
	} catch (error) {
		console.error('R2 delete error:', error);
		throw new Error(`Failed to delete file: ${error.message}`);
	}
}

/**
 * 从 R2 获取文件
 * @param {string} key - 文件路径
 * @returns {Promise<{success: boolean, body: ReadableStream, contentType: string}>}
 */
export async function getFromR2(key) {
	const client = getR2Client();

	const command = new GetObjectCommand({
		Bucket: R2_BUCKET_NAME,
		Key: key,
	});

	try {
		const response = await client.send(command);
		return {
			success: true,
			body: response.Body,
			contentType: response.ContentType,
		};
	} catch (error) {
		console.error('R2 get error:', error);
		throw new Error(`Failed to get file: ${error.message}`);
	}
}

/**
 * 获取 R2 配置信息（用于调试）
 */
export function getR2Config() {
	return {
		accountId: R2_ACCOUNT_ID ? '***' + R2_ACCOUNT_ID.slice(-4) : null,
		bucketName: R2_BUCKET_NAME,
		publicUrl: R2_PUBLIC_URL,
		endpoint: R2_ENDPOINT,
		configured: checkR2Config().configured,
	};
}
