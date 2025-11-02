import { LoginForm } from './login-form';
import Prism from '@/components/motion/prism-bg';

/**
 * 登录页面
 * 支持通过 callbackUrl 查询参数指定登录后的重定向地址
 * 例如：/login?callbackUrl=/generate/image
 */
export default async function LoginPage({ searchParams }) {
	// 从查询参数中获取回调地址，用于登录成功后重定向
	// Next.js 16+ 中 searchParams 可能是 Promise，需要 await
	const resolvedSearchParams = await searchParams;
	const callbackUrl = resolvedSearchParams?.callbackUrl || null;

	return (
		<div className='flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
			<div className='w-full max-w-sm md:max-w-lg z-10'>
				<LoginForm callbackUrl={callbackUrl} />
			</div>
			<div className='absolute top-0 left-0 w-full h-full bg-[#0f0f12]'>
				<Prism
					animationType='3drotate'
					timeScale={0.5}
					height={3.5}
					baseWidth={5.5}
					scale={3.6}
					hueShift={0}
					colorFrequency={1}
					noise={0}
					glow={1}
				/>
			</div>
		</div>
	);
}
