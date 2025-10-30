'use client';

import { createAuthClient } from 'better-auth/react';
import { adminClient, usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
	plugins: [adminClient(), usernameClient()],
});

// 导出常用的方法，但完整的 authClient 也可以直接使用
export const { useSession, signIn, signOut, signUp, changePassword, changeEmail, updateUser, deleteUser } = authClient;