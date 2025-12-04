/**
 * 通用文件上传 API
 * 
 * 支持上传类型：image, images, file, avatar
 * 
 * POST /api/upload
 * - 需要登录认证
 * - 支持单文件和多文件上传
 * - 自动记录上传者信息
 * 
 * 请求参数（FormData）：
 * - file/files: 文件（必填）
 * - type: 上传类型 image|images|file|avatar（必填）
 * - directory: 自定义目录（可选）
 * 
 * 响应：
 * - 单文件: { success: true, url: '...', key: '...' }
 * - 多文件: { success: true, files: [{ url, key }, ...] }
 * 
 * GET /api/upload
 * - 公开接口，获取上传配置信息
 * 
 * DELETE /api/upload
 * - 需要登录认证
 * - 只能删除自己上传的文件（管理员可删除任何文件）
 */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { uploadFile, uploadFiles, deleteFile, checkR2Config } from '@/lib/upload';
import { checkUploadRateLimit } from '@/lib/upload/upload-guard';

// ========== 日志配置 ==========

/**
 * 上传日志开关
 * 设置为 1 开启日志输出，0 关闭
 */
const UPLOAD_LOG_ENABLED = process.env.UPLOAD_LOG_ENABLED === 1 || process.env.NODE_ENV !== 'production';

// ========== 日志工具函数 ==========

/**
 * 格式化时间前缀
 */
function formatTimePrefix(date) {
	const h = String(date.getHours()).padStart(2, '0');
	const m = String(date.getMinutes()).padStart(2, '0');
	const s = String(date.getSeconds()).padStart(2, '0');
	const ms = String(date.getMilliseconds()).padStart(3, '0');
	return `[${h}:${m}:${s}.${ms}]`;
}

/**
 * 检查是否应该输出日志
 */
function shouldLog() {
	return UPLOAD_LOG_ENABLED;
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function getClientIp(request) {
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		const parts = forwardedFor.split(',').map(p => p.trim()).filter(Boolean);
		if (parts.length > 0) return parts[0];
	}

	const realIp = request.headers.get('x-real-ip');
	if (realIp) return realIp;

	return request.ip || '';
}

/**
 * 打印上传日志开始
 */
function logUploadStart(action, params) {
	if (!shouldLog()) return;
	
	const time = formatTimePrefix(new Date());
	console.log(`\x1b[36m\x1b[1m--------【开始】【API】【upload】【${action}】--------\x1b[0m`);
	console.log(`${time} 【请求参数】:`, params);
}

/**
 * 打印上传日志结束
 */
function logUploadEnd(action, result, duration, isError = false) {
	if (!shouldLog()) return;
	
	const time = formatTimePrefix(new Date());
	
	if (isError) {
		console.log(`${time} \x1b[31m\x1b[1m【Error】:\x1b[0m`, result.error || result);
	} else {
		console.log(`${time} 【返回数据】:`, result);
	}
	
	console.log(`${time} \x1b[${isError ? '33' : '32'}m\x1b[1m【总体耗时】: ${duration} 毫秒\x1b[0m`);
	console.log(`\x1b[36m\x1b[1m--------【结束】【API】【upload】【${action}】--------\x1b[0m\n`);
}

// ========== API 处理函数 ==========

/**
 * 处理文件上传
 */
export async function POST(request) {
	const startTime = Date.now();
	let action = 'upload';
	let logParams = {};
	
	try {
		// 1. 验证用户登录
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		
		if (!session?.user) {
			logParams = { error: 'Unauthorized' };
			logUploadStart(action, logParams);
			logUploadEnd(action, { error: 'Unauthorized. Please login first.' }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: 'Unauthorized. Please login first.' },
				{ status: 401 }
			);
		}
		
		const userId = session.user.id;
		const clientIp = getClientIp(request);
		
		// 2. 限流与封禁检查
		const rateLimit = await checkUploadRateLimit({ userId, ip: clientIp });
		if (!rateLimit.allowed) {
			logParams = { userId, clientIp, error: rateLimit.message };
			logUploadStart(action, logParams);
			logUploadEnd(action, { error: rateLimit.message }, Date.now() - startTime, true);
			return NextResponse.json(
				{
					success: false,
					error: rateLimit.message,
					bannedUntil: rateLimit.bannedUntil ? rateLimit.bannedUntil.toISOString() : undefined,
					scope: rateLimit.scope,
				},
				{ status: rateLimit.status || 429 }
			);
		}
		
		// 3. 检查 R2 配置
		const r2Config = checkR2Config();
		if (!r2Config.configured) {
			logParams = { userId, error: 'R2 not configured' };
			logUploadStart(action, logParams);
			logUploadEnd(action, { error: r2Config.error }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: 'Upload service not configured. ' + r2Config.error },
				{ status: 500 }
			);
		}
		
		// 4. 解析 FormData
		let formData;
		try {
			formData = await request.formData();
		} catch (parseError) {
			logUploadStart(action, { userId, clientIp, error: 'formData parse failed', contentType: request.headers.get('content-type') });
			console.error('[Upload] formData parse failed', {
				message: parseError.message,
				stack: parseError.stack,
				contentType: request.headers.get('content-type'),
				contentLength: request.headers.get('content-length'),
				userAgent: request.headers.get('user-agent'),
			});
			logUploadEnd(action, { error: 'Failed to parse body as FormData' }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: 'Failed to parse body as FormData' },
				{ status: 400 }
			);
		}
		const type = formData.get('type');
		const directory = formData.get('directory');
		
		// 验证上传类型
		const validTypes = ['image', 'images', 'file', 'avatar'];
		if (!type || !validTypes.includes(type)) {
			logParams = { userId, type, error: 'Invalid type' };
			logUploadStart(action, logParams);
			logUploadEnd(action, { error: `Invalid upload type: ${type}` }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: `Invalid upload type. Must be one of: ${validTypes.join(', ')}` },
				{ status: 400 }
			);
		}
		
		// 5. 获取文件
		const files = formData.getAll('file');
		const filesFromMultiple = formData.getAll('files');
		const allFiles = [...files, ...filesFromMultiple].filter(f => f instanceof File);
		
		if (allFiles.length === 0) {
			logParams = { userId, type, error: 'No file provided' };
			logUploadStart(action, logParams);
			logUploadEnd(action, { error: 'No file provided' }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: 'No file provided' },
				{ status: 400 }
			);
		}
		
		// 设置日志参数
		action = `upload_${type}`;
		logParams = {
			userId,
			clientIp,
			type,
			directory: directory || '(default)',
			files: allFiles.map(f => ({ name: f.name, size: formatFileSize(f.size) })),
		};
		logUploadStart(action, logParams);
		
		// 5. 根据类型处理上传
		// 单文件上传（image, avatar, 或只有一个文件的 images/file）
		if (type === 'image' || type === 'avatar' || allFiles.length === 1) {
			const file = allFiles[0];
			const result = await uploadFile({
				file,
				type,
				directory: directory || undefined,
				userId,
			});
			
			if (!result.success) {
				logUploadEnd(action, { error: result.error }, Date.now() - startTime, true);
				return NextResponse.json(
					{ success: false, error: result.error },
					{ status: 400 }
				);
			}
			
			const response = {
				success: true,
				url: result.data.url,
				key: result.data.key,
				originalName: result.data.originalName,
				size: formatFileSize(result.data.size),
			};
			
			logUploadEnd(action, response, Date.now() - startTime);
			return NextResponse.json({
				success: true,
				url: result.data.url,
				key: result.data.key,
				originalName: result.data.originalName,
				mimeType: result.data.mimeType,
				size: result.data.size,
			});
		} else {
			// 批量多文件上传（images, file 且有多个文件）
			const result = await uploadFiles({
				files: allFiles,
				type,
				directory: directory || undefined,
				userId,
			});
			
			if (!result.success && result.data.length === 0) {
				logUploadEnd(action, { error: result.errors?.join('; ') }, Date.now() - startTime, true);
				return NextResponse.json(
					{ success: false, error: result.errors?.join('; ') || 'Upload failed' },
					{ status: 400 }
				);
			}
			
			const response = {
				success: true,
				filesCount: result.data.length,
				files: result.data.map(f => ({ url: f.url, name: f.originalName })),
				errors: result.errors,
			};
			
			logUploadEnd(action, response, Date.now() - startTime);
			return NextResponse.json({
				success: true,
				files: result.data.map(f => ({
					url: f.url,
					key: f.key,
					originalName: f.originalName,
					mimeType: f.mimeType,
					size: f.size,
				})),
				errors: result.errors,
			});
		}
	} catch (error) {
		logUploadEnd(action, { error: error.message }, Date.now() - startTime, true);
		return NextResponse.json(
			{ success: false, error: 'Internal server error: ' + error.message },
			{ status: 500 }
		);
	}
}

/**
 * 获取上传配置信息（公开接口）
 */
export async function GET() {
	const r2Config = checkR2Config();
	
	return NextResponse.json({
		configured: r2Config.configured,
		types: {
			image: {
				description: 'Single image upload',
				maxSize: '10MB',
				allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
			},
			images: {
				description: 'Multiple images upload',
				maxSize: '10MB per file',
				allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
			},
			avatar: {
				description: 'Avatar image upload',
				maxSize: '2MB',
				allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
			},
			file: {
				description: 'General file upload',
				maxSize: '50MB',
				allowedTypes: 'All file types',
			},
		},
	});
}

/**
 * 删除已上传的文件
 */
export async function DELETE(request) {
	const startTime = Date.now();
	const action = 'delete';
	let logParams = {};
	
	try {
		// 1. 验证用户登录
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		
		if (!session?.user) {
			logParams = { error: 'Unauthorized' };
			logUploadStart(action, logParams);
			logUploadEnd(action, { error: 'Unauthorized. Please login first.' }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: 'Unauthorized. Please login first.' },
				{ status: 401 }
			);
		}
		
		const userId = session.user.id;
		const isAdmin = session.user.role === 'admin';
		
		// 2. 获取要删除的文件 URL
		const body = await request.json();
		const { url } = body;
		
		if (!url) {
			logParams = { userId, error: 'URL required' };
			logUploadStart(action, logParams);
			logUploadEnd(action, { error: 'File URL is required' }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: 'File URL is required' },
				{ status: 400 }
			);
		}
		
		// 提取文件名用于日志
		const fileName = url.split('/').pop();
		logParams = { userId, fileName, isAdmin };
		logUploadStart(action, logParams);
		
		// 3. 删除文件（管理员可以删除任何文件）
		const result = await deleteFile(url, userId, { isAdmin });
		
		if (!result.success) {
			logUploadEnd(action, { error: result.error }, Date.now() - startTime, true);
			return NextResponse.json(
				{ success: false, error: result.error },
				{ status: 400 }
			);
		}
		
		logUploadEnd(action, { success: true, deleted: fileName }, Date.now() - startTime);
		return NextResponse.json({ success: true });
	} catch (error) {
		logUploadEnd(action, { error: error.message }, Date.now() - startTime, true);
		return NextResponse.json(
			{ success: false, error: 'Internal server error: ' + error.message },
			{ status: 500 }
		);
	}
}
