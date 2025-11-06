import { AppSidebar } from '@/components/client/layout/sidebar/app-sidebar';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export default async function GenerateLayout({ children }) {
	// 获取用户 session
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	return (
		<div className="flex min-h-screen w-full">
			<AppSidebar user={session?.user} />
			<main className="flex-1 bg-[#0f0f12] p-10 text-zinc-50">{children}</main>
		</div>
	);
}

