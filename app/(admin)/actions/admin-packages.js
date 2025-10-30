'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getAllPackages, createPackage, updatePackage, deletePackage, getUserPackages } from '@/lib/packages';

async function checkAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) return { isAdmin: false, error: 'Unauthorized' };
	if (session.user.role !== 'admin') return { isAdmin: false, error: 'Forbidden: Admin access required' };
	return { isAdmin: true, userId: session.user.id };
}

export async function getAllPackagesAdminAction() {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const packages = await getAllPackages();
		return { success: true, data: packages };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function createPackageAction(packageData) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const packageId = await createPackage(packageData);
		return { success: true, data: { packageId } };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function updatePackageAction(packageId, updates) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		await updatePackage(packageId, updates);
		return { success: true, message: 'Package updated successfully' };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function deletePackageAction(packageId) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		await deletePackage(packageId);
		return { success: true, message: 'Package deleted successfully' };
	} catch (error) {
		return { success: false, error: error.message };
	}
}

export async function getUserPackagesAdminAction(userId) {
	const adminCheck = await checkAdmin();
	if (!adminCheck.isAdmin) {
		return { success: false, error: adminCheck.error };
	}

	try {
		const packages = await getUserPackages(userId);
		return { success: true, data: packages };
	} catch (error) {
		return { success: false, error: error.message };
	}
}
