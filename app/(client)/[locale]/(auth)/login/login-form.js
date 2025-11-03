'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { signInWithEmailAction, checkAndInitUserAction } from '@/app/(client)/actions/auth';
import { authClient } from '@/lib/auth-client';

export function LoginForm({ className, callbackUrl, ...props }) {
	const t = useTranslations();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const { data: session } = authClient.useSession();

	// 获取登录后的重定向地址，默认为 dashboard
	const getRedirectUrl = useCallback(() => {
		if (callbackUrl) {
			// 验证 callbackUrl 是否安全（同源检查）
			try {
				// 如果是相对路径，直接使用
				if (callbackUrl.startsWith('/')) {
					return callbackUrl;
				}
			} catch (err) {
				console.error('Invalid callbackUrl:', err);
			}
		}
		return '/dashboard';
	}, [callbackUrl]);

	// 检查是否有 session（三方登录回调后）并初始化用户
	useEffect(() => {
		if (session) {
			const initUser = async () => {
				// 有 session，初始化用户并跳转
				await checkAndInitUserAction();
				router.push(getRedirectUrl());
			};
			initUser();
		}
	}, [session, router, getRedirectUrl]);

	// 邮箱密码登录（仅用于已有账号）
	const handleEmailLogin = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		const formData = new FormData(e.target);
		const email = formData.get('email');
		const password = formData.get('password');

		// 验证输入
		if (!email) {
			setError(t('auth.emailRequired'));
			setIsLoading(false);
			return;
		}

		if (!password) {
			setError(t('auth.passwordRequired'));
			setIsLoading(false);
			return;
		}

		try {
			const result = await signInWithEmailAction({ email, password });

			if (result.success) {
				// 登录成功，跳转到 callbackUrl 或 dashboard
				router.push(getRedirectUrl());
			} else {
				setError(result.error || t('auth.loginFailed'));
			}
		} catch (err) {
			console.error('Login error:', err);
			setError(t('auth.loginFailed'));
		} finally {
			setIsLoading(false);
		}
	};

	// Google 登录（自动创建账号）
	const handleGoogleLogin = async () => {
		try {
			setIsLoading(true);
			setError('');
			
			// 使用 authClient 的方法进行 Google 登录
			// 注意：三方登录的回调URL需要包含完整的路径（包括 callbackUrl 参数）
			// 将 callbackUrl 编码后附加到登录页URL，这样回调后还能获取到
			const loginUrl = callbackUrl 
				? `${window.location.pathname}?callbackUrl=${encodeURIComponent(callbackUrl)}`
				: window.location.pathname;
			
			await authClient.signIn.social({
				provider: 'google',
				callbackURL: loginUrl,
			});
		} catch (err) {
			console.error('Google login error:', err);
			setError(t('auth.loginFailed'));
			setIsLoading(false);
		}
	};

	// GitHub 登录（自动创建账号）
	const handleGithubLogin = async () => {
		try {
			setIsLoading(true);
			setError('');
			
			// 使用 authClient 的方法进行 GitHub 登录
			// 注意：三方登录的回调URL需要包含完整的路径（包括 callbackUrl 参数）
			const loginUrl = callbackUrl 
				? `${window.location.pathname}?callbackUrl=${encodeURIComponent(callbackUrl)}`
				: window.location.pathname;
			
			await authClient.signIn.social({
				provider: 'github',
				callbackURL: loginUrl,
			});
		} catch (err) {
			console.error('GitHub login error:', err);
			setError(t('auth.loginFailed'));
			setIsLoading(false);
		}
	};

	return (
		<div className={cn('flex flex-col gap-6 z-10', className)} {...props}>
			{/* 毛玻璃背景 */}
			<div className='p-2 rounded-xl bg-white/30 backdrop-blur-lg'>
				<Card className='overflow-hidden p-0'>
					<CardContent className='p-0'>
						<form onSubmit={handleEmailLogin} className='p-6 md:p-8'>
							<FieldGroup>
								<div className='flex flex-col items-center gap-2 text-center'>
									<h1 className='text-2xl font-bold'>{t('auth.welcomeBack')}</h1>
									<p className='text-muted-foreground text-balance'>{t('auth.welcomeBackSubtitle')}</p>
								</div>

								{/* 错误提示 */}
								{error && (
									<div className='text-sm text-red-500 text-center p-2 bg-red-50 rounded-md'>
										{error}
									</div>
								)}

								<Field>
									<FieldLabel htmlFor='email'>{t('auth.email')}</FieldLabel>
									<Input
										id='email'
										name='email'
										type='email'
										placeholder={t('auth.emailPlaceholder')}
										required
										disabled={isLoading}
									/>
								</Field>
								<Field>
									<div className='flex items-center'>
										<FieldLabel htmlFor='password'>{t('auth.password')}</FieldLabel>
										<a href='#' className='ml-auto text-sm underline-offset-2 hover:underline'>
											{t('auth.forgotPassword')}
										</a>
									</div>
									<Input
										id='password'
										name='password'
										type='password'
										placeholder={t('auth.passwordPlaceholder')}
										required
										disabled={isLoading}
									/>
								</Field>
								<Field>
									<Button type='submit' disabled={isLoading}>
										{isLoading ? t('common.loading') : t('auth.login')}
									</Button>
								</Field>
								<FieldSeparator className='*:data-[slot=field-separator-content]:bg-card'>
									{t('auth.orContinueWith')}
								</FieldSeparator>
								<Field className='grid grid-cols-2 gap-4'>
									<Button
										variant='outline'
										type='button'
										onClick={handleGoogleLogin}
										disabled={isLoading}
									>
										<FcGoogle />
										<span>{t('auth.continueWithGoogle')}</span>
									</Button>
									<Button
										variant='outline'
										type='button'
										onClick={handleGithubLogin}
										disabled={isLoading}
									>
										<FaGithub />
										<span>{t('auth.continueWithGithub')}</span>
									</Button>
								</Field>
								<FieldDescription className='text-center'>
									{/* 登录则自动创建账号提示 */}
									<span>{t('auth.autoCreateAccount')}</span>
								</FieldDescription>
							</FieldGroup>
						</form>
					</CardContent>
				</Card>
			</div>
			<FieldDescription className='px-6 text-center text-white/50'>
				{t('auth.termsAndPrivacy')}
			</FieldDescription>
		</div>
	);
}
