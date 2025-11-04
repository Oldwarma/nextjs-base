import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function AdminNotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
			<div className="text-center space-y-6 max-w-md">
				{/* 404 标题 */}
				<div className="space-y-3">
					<h1 className="text-8xl font-bold text-gray-300">404</h1>
					<h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
					<p className="text-gray-600">
						The admin page you are looking for does not exist.
					</p>
				</div>

				{/* 返回按钮 */}
				<div className="pt-6">
					<Button asChild size="lg" className="gap-2">
						<Link href="/admin">
							<Home className="w-4 h-4" />
							Back to Dashboard
						</Link>
					</Button>
				</div>

				{/* 常用链接 */}
				<div className="pt-8 border-t border-gray-200">
					<p className="text-sm text-gray-500 mb-3">Quick Links:</p>
					<div className="flex flex-wrap gap-2 justify-center text-sm">
						<Link href="/admin/users" className="text-blue-600 hover:underline">
							Users
						</Link>
						<span className="text-gray-300">•</span>
						<Link href="/admin/packages" className="text-blue-600 hover:underline">
							Packages
						</Link>
						<span className="text-gray-300">•</span>
						<Link href="/admin/credits" className="text-blue-600 hover:underline">
							Credits
						</Link>
						<span className="text-gray-300">•</span>
						<Link href="/admin/menus" className="text-blue-600 hover:underline">
							Menus
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

