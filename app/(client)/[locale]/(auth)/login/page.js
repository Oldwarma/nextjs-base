import { LoginForm } from './login-form';
import Prism from '@/components/motion/prism-bg';

export default function LoginPage() {
	return (
		<div className='flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
			<div className='w-full max-w-sm md:max-w-lg z-10'>
				<LoginForm />
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
