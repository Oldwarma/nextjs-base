'use server';

import { prisma } from '@/lib/database/prisma';

const WINDOW_SECONDS = parseEnvInt(process.env.UPLOAD_RATE_WINDOW_SECONDS, 60);
const LIMIT_PER_WINDOW = parseEnvInt(
	process.env.UPLOAD_RATE_LIMIT_PER_MINUTE ?? process.env.UPLOAD_RATE_LIMIT,
	0
);
const BAN_DURATION_MINUTES = parseEnvInt(process.env.UPLOAD_RATE_BAN_DURATION, 0);

const PERMANENT_BAN_UNTIL = new Date('9999-12-31T23:59:59.999Z');

function parseEnvInt(value, defaultValue) {
	if (value === undefined || value === null || value === '') return defaultValue;
	const num = Number(value);
	return Number.isFinite(num) ? num : defaultValue;
}

function scopeLabel(scope) {
	return scope === 'ip' ? 'IP' : '用户';
}

function buildBlockedMessage({ scope, bannedUntil, limitReached }) {
	const label = scopeLabel(scope);

	if (bannedUntil) {
		if (bannedUntil.getTime() >= PERMANENT_BAN_UNTIL.getTime()) {
			return `Due to excessive frequency, this ${label} has been permanently banned from uploading.`;
		}
		return `Upload too frequent, this ${label} has been banned, please try again at ${bannedUntil.toLocaleString()}.`;
	}

	if (limitReached) {
		return `Upload too frequent, please try again later (rate limit window ${WINDOW_SECONDS} seconds).`;
	}

	return 'Upload is limited, please try again later (rate limit window ${WINDOW_SECONDS} seconds).';
}

async function applyGuard(type, value) {
	const now = new Date();

	let guard = await prisma.uploadGuard.findUnique({
		where: { type_value: { type, value } },
	});

	const windowMs = WINDOW_SECONDS * 1000;
	const hasGuard = !!guard;
	const windowStart = guard?.windowStart ? new Date(guard.windowStart) : now;
	const windowExpired = now.getTime() - windowStart.getTime() >= windowMs;
	const currentCount = windowExpired ? 0 : guard?.count || 0;
	const bannedUntil = guard?.bannedUntil ? new Date(guard.bannedUntil) : null;

	if (bannedUntil && bannedUntil.getTime() > now.getTime()) {
		return {
			blocked: true,
			scope: type,
			bannedUntil,
			message: buildBlockedMessage({ scope: type, bannedUntil }),
		};
	}

	// 未开启限流直接放行并重置窗口
	if (LIMIT_PER_WINDOW <= 0) {
		if (hasGuard) {
			await prisma.uploadGuard.update({
				where: { type_value: { type, value } },
				data: { windowStart: now, count: 0, bannedUntil: null },
			});
		}
		return { blocked: false };
	}

	const nextCount = currentCount + 1;
	const limitReached = currentCount >= LIMIT_PER_WINDOW;

	// 触发限流或封禁
	if (limitReached) {
		let nextBannedUntil = null;
		if (BAN_DURATION_MINUTES !== 0) {
			if (BAN_DURATION_MINUTES < 0) {
				nextBannedUntil = PERMANENT_BAN_UNTIL;
			} else {
				nextBannedUntil = new Date(now.getTime() + BAN_DURATION_MINUTES * 60 * 1000);
			}
		}

		await prisma.uploadGuard.upsert({
			where: { type_value: { type, value } },
			update: {
				windowStart: windowExpired ? now : windowStart,
				count: currentCount,
				bannedUntil: nextBannedUntil,
			},
			create: {
				type,
				value,
				windowStart: now,
				count: currentCount,
				bannedUntil: nextBannedUntil,
			},
		});

		return {
			blocked: true,
			scope: type,
			bannedUntil: nextBannedUntil,
			permanent: nextBannedUntil?.getTime() === PERMANENT_BAN_UNTIL.getTime(),
			message: buildBlockedMessage({
				scope: type,
				bannedUntil: nextBannedUntil,
				limitReached: true,
			}),
		};
	}

	// 允许上传，刷新计数
	await prisma.uploadGuard.upsert({
		where: { type_value: { type, value } },
		update: {
			windowStart: windowExpired ? now : windowStart,
			count: nextCount,
			bannedUntil: null,
		},
		create: {
			type,
			value,
			windowStart: now,
			count: 1,
			bannedUntil: null,
		},
	});

	return { blocked: false };
}

/**
 * 检查上传频率与封禁状态
 * @returns {Object} { allowed: boolean, message?, bannedUntil?, scope?, status? }
 */
export async function checkUploadRateLimit({ userId, ip }) {
	if (!userId && !ip) {
		return { allowed: true };
	}

	// 未配置限流直接放行
	if (LIMIT_PER_WINDOW <= 0) {
		return { allowed: true };
	}

	const identifiers = [];
	if (userId) identifiers.push({ type: 'user', value: userId });
	if (ip) identifiers.push({ type: 'ip', value: ip });

	for (const item of identifiers) {
		const result = await applyGuard(item.type, item.value);
		if (result.blocked) {
			const status =
				result.bannedUntil || BAN_DURATION_MINUTES !== 0
					? 403
					: 429;
			return {
				allowed: false,
				status,
				message: result.message,
				bannedUntil: result.bannedUntil,
				scope: result.scope,
				permanent: result.permanent,
			};
		}
	}

	return { allowed: true };
}
