'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { addCredits, deductCredits, adminAdjustCredits, getCreditTransactions } from '@/lib/credits';

async function checkAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { isAdmin: false, error: 'Unauthorized' };
	if (session.user.role !== 'admin') return { isAdmin: false, error: 'Forbidden: Admin access required' };
	return { isAdmin: true, userId: session.user.id };
}

export async function adminAddCreditsAction(userId, amount, reason = 'admin_adjustment') {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		await adminAdjustCredits(userId, amount, reason, adminCheck.userId);
		return { success: true, message: 'Credits added successfully' };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function adminDeductCreditsAction(userId, amount, reason = 'admin_adjustment') {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		await deductCredits(userId, amount, reason);
		return { success: true, message: 'Credits deducted successfully' };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function getAdminCreditTransactionsAction(userId, { page = 1, limit = 20 } = {}) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const result = await getCreditTransactions(userId, { page, limit });
		return { success: true, data: result };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
