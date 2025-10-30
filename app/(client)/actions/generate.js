'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { createUsageLog, updateUsageLog, checkUserCanUseFeature } from '@/lib/usage-logs';

/**
 * 文生图 - 从文本生成图片
 * @param {Object} params - 生成参数
 * @param {string} params.prompt - 提示词
 * @param {string} params.size - 图片尺寸
 * @param {string} params.model - 模型类型
 * @returns {Promise<Object>} 生成结果
 */
export async function textToImageAction({ prompt, size = '1024x1024', model = 'standard' }) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	if (!prompt || prompt.trim().length === 0) {
		return {
			success: false,
			error: 'Prompt is required',
		};
	}

	try {
		// 检查用户是否有足够积分
		const canUse = await checkUserCanUseFeature(session.user.id, 'text_to_image', {
			size,
			model,
		});

		if (!canUse.canUse) {
			return {
				success: false,
				error: 'Insufficient credits',
				details: {
					required: canUse.creditsNeeded,
					current: canUse.currentCredits,
					shortage: canUse.shortage,
				},
			};
		}

		// 创建使用记录并扣除积分
		const usageResult = await createUsageLog(session.user.id, {
			action: 'text_to_image',
			parameters: { prompt, size, model },
			status: 'pending',
		});

		try {
			// TODO: 在这里调用实际的 AI 服务
			// 示例：const imageUrl = await aiService.generateImage(prompt, size, model);

			// 临时模拟成功
			const imageUrl = `https://placeholder.example.com/image-${Date.now()}.jpg`;

			// 更新使用记录为成功
			await updateUsageLog(usageResult.usageId, {
				status: 'success',
				result: {
					imageUrl,
					prompt,
					size,
					model,
					generatedAt: new Date(),
				},
			});

			return {
				success: true,
				data: {
					imageUrl,
					usageId: usageResult.usageId,
					creditsUsed: usageResult.creditsUsed,
					remainingCredits: usageResult.remainingCredits,
				},
				message: 'Image generated successfully',
			};
		} catch (error) {
			// 如果生成失败，更新使用记录
			await updateUsageLog(usageResult.usageId, {
				status: 'failed',
				error: error.message,
			});

			throw error;
		}
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 图生图 - 从图片生成新图片
 * @param {Object} params - 生成参数
 * @param {string} params.imageUrl - 原始图片URL
 * @param {string} params.prompt - 提示词
 * @param {string} params.size - 图片尺寸
 * @param {string} params.model - 模型类型
 * @returns {Promise<Object>} 生成结果
 */
export async function imageToImageAction({ imageUrl, prompt, size = '1024x1024', model = 'standard' }) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	if (!imageUrl || !prompt || prompt.trim().length === 0) {
		return {
			success: false,
			error: 'Image URL and prompt are required',
		};
	}

	try {
		// 检查用户是否有足够积分
		const canUse = await checkUserCanUseFeature(session.user.id, 'image_to_image', {
			size,
			model,
		});

		if (!canUse.canUse) {
			return {
				success: false,
				error: 'Insufficient credits',
				details: {
					required: canUse.creditsNeeded,
					current: canUse.currentCredits,
					shortage: canUse.shortage,
				},
			};
		}

		// 创建使用记录并扣除积分
		const usageResult = await createUsageLog(session.user.id, {
			action: 'image_to_image',
			parameters: { imageUrl, prompt, size, model },
			status: 'pending',
		});

		try {
			// TODO: 在这里调用实际的 AI 服务

			// 临时模拟成功
			const newImageUrl = `https://placeholder.example.com/image-${Date.now()}.jpg`;

			// 更新使用记录为成功
			await updateUsageLog(usageResult.usageId, {
				status: 'success',
				result: {
					imageUrl: newImageUrl,
					originalImageUrl: imageUrl,
					prompt,
					size,
					model,
					generatedAt: new Date(),
				},
			});

			return {
				success: true,
				data: {
					imageUrl: newImageUrl,
					usageId: usageResult.usageId,
					creditsUsed: usageResult.creditsUsed,
					remainingCredits: usageResult.remainingCredits,
				},
				message: 'Image generated successfully',
			};
		} catch (error) {
			// 如果生成失败，更新使用记录
			await updateUsageLog(usageResult.usageId, {
				status: 'failed',
				error: error.message,
			});

			throw error;
		}
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 图片放大
 * @param {Object} params - 放大参数
 * @param {string} params.imageUrl - 原始图片URL
 * @param {string} params.scale - 放大倍数 ('2x' | '4x')
 * @returns {Promise<Object>} 放大结果
 */
export async function upscaleImageAction({ imageUrl, scale = '2x' }) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	if (!imageUrl) {
		return {
			success: false,
			error: 'Image URL is required',
		};
	}

	try {
		// 检查用户是否有足够积分
		const canUse = await checkUserCanUseFeature(session.user.id, 'upscale', {
			scale,
		});

		if (!canUse.canUse) {
			return {
				success: false,
				error: 'Insufficient credits',
				details: {
					required: canUse.creditsNeeded,
					current: canUse.currentCredits,
					shortage: canUse.shortage,
				},
			};
		}

		// 创建使用记录并扣除积分
		const usageResult = await createUsageLog(session.user.id, {
			action: 'upscale',
			parameters: { imageUrl, scale },
			status: 'pending',
		});

		try {
			// TODO: 在这里调用实际的 AI 服务

			// 临时模拟成功
			const upscaledImageUrl = `https://placeholder.example.com/upscaled-${Date.now()}.jpg`;

			// 更新使用记录为成功
			await updateUsageLog(usageResult.usageId, {
				status: 'success',
				result: {
					imageUrl: upscaledImageUrl,
					originalImageUrl: imageUrl,
					scale,
					generatedAt: new Date(),
				},
			});

			return {
				success: true,
				data: {
					imageUrl: upscaledImageUrl,
					usageId: usageResult.usageId,
					creditsUsed: usageResult.creditsUsed,
					remainingCredits: usageResult.remainingCredits,
				},
				message: 'Image upscaled successfully',
			};
		} catch (error) {
			// 如果处理失败，更新使用记录
			await updateUsageLog(usageResult.usageId, {
				status: 'failed',
				error: error.message,
			});

			throw error;
		}
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * 移除背景
 * @param {Object} params - 参数
 * @param {string} params.imageUrl - 原始图片URL
 * @returns {Promise<Object>} 处理结果
 */
export async function removeBackgroundAction({ imageUrl }) {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		return {
			success: false,
			error: 'Unauthorized',
		};
	}

	if (!imageUrl) {
		return {
			success: false,
			error: 'Image URL is required',
		};
	}

	try {
		// 检查用户是否有足够积分
		const canUse = await checkUserCanUseFeature(session.user.id, 'remove_background', {});

		if (!canUse.canUse) {
			return {
				success: false,
				error: 'Insufficient credits',
				details: {
					required: canUse.creditsNeeded,
					current: canUse.currentCredits,
					shortage: canUse.shortage,
				},
			};
		}

		// 创建使用记录并扣除积分
		const usageResult = await createUsageLog(session.user.id, {
			action: 'remove_background',
			parameters: { imageUrl },
			status: 'pending',
		});

		try {
			// TODO: 在这里调用实际的 AI 服务

			// 临时模拟成功
			const processedImageUrl = `https://placeholder.example.com/nobg-${Date.now()}.png`;

			// 更新使用记录为成功
			await updateUsageLog(usageResult.usageId, {
				status: 'success',
				result: {
					imageUrl: processedImageUrl,
					originalImageUrl: imageUrl,
					generatedAt: new Date(),
				},
			});

			return {
				success: true,
				data: {
					imageUrl: processedImageUrl,
					usageId: usageResult.usageId,
					creditsUsed: usageResult.creditsUsed,
					remainingCredits: usageResult.remainingCredits,
				},
				message: 'Background removed successfully',
			};
		} catch (error) {
			// 如果处理失败，更新使用记录
			await updateUsageLog(usageResult.usageId, {
				status: 'failed',
				error: error.message,
			});

			throw error;
		}
	} catch (error) {
		return {
			success: false,
			error: error.message,
		};
	}
}

