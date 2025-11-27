/**
 * 上传 Hook
 * 
 * 提供给前端组件使用的上传功能
 */

/**
 * 上传单个文件到服务器
 * @param {File} file - 文件对象
 * @param {Object} options - 上传选项
 * @param {string} options.type - 上传类型 (image|images|file|avatar)
 * @param {string} options.directory - 自定义目录
 * @param {Function} options.onProgress - 进度回调（暂不支持）
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadSingleFile(file, options = {}) {
	const { type = 'file', directory } = options;
	
	try {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', type);
		if (directory) {
			formData.append('directory', directory);
		}
		
		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		});
		
		const result = await response.json();
		
		if (!response.ok || !result.success) {
			return {
				success: false,
				error: result.error || 'Upload failed',
			};
		}
		
		return {
			success: true,
			url: result.url,
			key: result.key,
			originalName: result.originalName,
			mimeType: result.mimeType,
			size: result.size,
		};
	} catch (error) {
		console.error('Upload error:', error);
		return {
			success: false,
			error: error.message || 'Upload failed',
		};
	}
}

/**
 * 上传多个文件到服务器
 * @param {File[]} files - 文件数组
 * @param {Object} options - 上传选项
 * @returns {Promise<{success: boolean, files?: Array, errors?: Array}>}
 */
export async function uploadMultipleFiles(files, options = {}) {
	const { type = 'file', directory } = options;
	
	try {
		const formData = new FormData();
		files.forEach(file => {
			formData.append('files', file);
		});
		formData.append('type', type);
		if (directory) {
			formData.append('directory', directory);
		}
		
		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		});
		
		const result = await response.json();
		
		if (!response.ok) {
			return {
				success: false,
				error: result.error || 'Upload failed',
			};
		}
		
		return {
			success: result.success,
			files: result.files,
			errors: result.errors,
		};
	} catch (error) {
		console.error('Upload error:', error);
		return {
			success: false,
			error: error.message || 'Upload failed',
		};
	}
}

/**
 * 创建 Ant Design Upload 组件的 customRequest 处理器
 * @param {Object} options - 配置选项
 * @param {string} options.type - 上传类型
 * @param {string} options.directory - 上传目录
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 失败回调
 * @returns {Function} customRequest 处理函数
 */
export function createCustomRequest(options = {}) {
	const { type = 'file', directory, onUploadSuccess, onUploadError } = options;
	
	return async ({ file, onSuccess, onError, onProgress }) => {
		try {
			// 模拟进度
			onProgress?.({ percent: 30 });
			
			const result = await uploadSingleFile(file, { type, directory });
			
			onProgress?.({ percent: 100 });
			
			if (result.success) {
				// 调用 antd 的成功回调
				onSuccess?.(result, file);
				// 调用自定义成功回调
				onUploadSuccess?.(result, file);
			} else {
				const error = new Error(result.error);
				onError?.(error);
				onUploadError?.(error, file);
			}
		} catch (error) {
			onError?.(error);
			onUploadError?.(error, file);
		}
	};
}

/**
 * 检查上传服务是否可用
 * @returns {Promise<{configured: boolean, types: Object}>}
 */
export async function checkUploadService() {
	try {
		const response = await fetch('/api/upload');
		return await response.json();
	} catch (error) {
		return { configured: false, error: error.message };
	}
}

