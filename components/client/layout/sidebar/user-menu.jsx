/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Sparkles, UserCircle, CreditCard, Bell, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/(client)/actions';

export function UserMenu({ user }) {
	const router = useRouter();

	const handleLogout = async () => {
		const result = await signOutAction();
		if (result.success) {
			router.push('/login');
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className='flex items-center justify-center w-full group outline-none'>
					<div className='size-8 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-transparent group-hover:ring-zinc-600 transition-all'>
						{user?.image ? (
							<img
								src={user.image}
								alt={user.name || 'User avatar'}
								className='size-8 object-cover'
							/>
						) : (
							<div className='w-full h-full flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors'>
								<UserCircle className='size-5' />
							</div>
						)}
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				side='right'
				align='center'
				sideOffset={24}
				className='bg-[#1a1a1d] border-zinc-800 min-w-[240px] p-0'
			>
				{/* 用户信息头部 */}
				<div className='px-4 py-3 border-b border-zinc-800'>
					<div className='flex items-center gap-3'>
						<div className='size-10 rounded-full overflow-hidden bg-zinc-800'>
							{user?.image ? (
								<img
									src={user.image}
									alt={user.name || 'User avatar'}
									className='size-10 object-cover'
								/>
							) : (
								<div className='w-full h-full flex items-center justify-center text-zinc-400'>
									<UserCircle className='size-6' />
								</div>
							)}
						</div>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-medium text-white truncate'>
								{user?.name || 'User'}
							</p>
							<p className='text-xs text-zinc-500 truncate'>{user?.email}</p>
						</div>
					</div>
				</div>

				{/* 菜单项 */}
				<div className='py-1'>
					<DropdownMenuItem
						onClick={() => router.push('/dashboard')}
						className='flex items-center gap-3 px-4 py-2.5 cursor-pointer text-zinc-300 hover:bg-zinc-800/30 hover:text-white focus:bg-zinc-800/30 focus:text-white'
					>
						<Sparkles className='size-4' />
						<span className='text-sm'>Upgrade to Pro</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => router.push('/account')}
						className='flex items-center gap-3 px-4 py-2.5 cursor-pointer text-zinc-300 hover:bg-zinc-800/30 hover:text-white focus:bg-zinc-800/30 focus:text-white'
					>
						<UserCircle className='size-4' />
						<span className='text-sm'>Account</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => router.push('/billing')}
						className='flex items-center gap-3 px-4 py-2.5 cursor-pointer text-zinc-300 hover:bg-zinc-800/30 hover:text-white focus:bg-zinc-800/30 focus:text-white'
					>
						<CreditCard className='size-4' />
						<span className='text-sm'>Billing</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						onClick={() => router.push('/notifications')}
						className='flex items-center gap-3 px-4 py-2.5 cursor-pointer text-zinc-300 hover:bg-zinc-800/30 hover:text-white focus:bg-zinc-800/30 focus:text-white'
					>
						<Bell className='size-4' />
						<span className='text-sm'>Notifications</span>
					</DropdownMenuItem>
				</div>

				<DropdownMenuSeparator className='bg-zinc-800' />

				{/* 退出登录 */}
				<div className='py-1'>
					<DropdownMenuItem
						onClick={handleLogout}
						className='flex items-center gap-3 px-4 py-2.5 cursor-pointer text-zinc-300 hover:bg-zinc-800/30 hover:text-white focus:bg-zinc-800/30 focus:text-white'
					>
						<LogOut className='size-4' />
						<span className='text-sm'>Log out</span>
					</DropdownMenuItem>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

