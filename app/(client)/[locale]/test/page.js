'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/api/fetch-client';
import { callAction } from '@/lib/api/action-client';
import { pubGetServerTime, authGetUserInfo, sysGetSystemInfo } from '@/app/(client)/actions/test-actions';

export default function TestAuthPage() {
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(false);

	// ==================== API 测试 ====================

	const testPubApi = async () => {
		setLoading(true);
		const { data, error, status } = await fetchApi('/api/v1/pub/cms/getList');
		setResult({ type: 'API - pub', status, data: data || { error } });
		setLoading(false);
	};

	const testAuthApi = async () => {
		setLoading(true);
		const { data, error, status } = await fetchApi('/api/v1/auth/user/profile');
		if (status !== 401) {
			setResult({ type: 'API - auth', status, data: data || { error } });
		}
		setLoading(false);
	};

	const testSysApi = async () => {
		setLoading(true);
		const { data, error, status } = await fetchApi('/api/v1/sys/test');
		if (status !== 401) {
			setResult({ type: 'API - sys', status, data: data || { error } });
		}
		setLoading(false);
	};

	// ==================== Action 测试 ====================

	const testPubAction = async () => {
		setLoading(true);
		const { data, success } = await callAction(pubGetServerTime);
		setResult({ 
			type: 'Action - pub', 
			status: success ? 200 : 400, 
			data: data || { success } 
		});
		setLoading(false);
	};

	const testAuthAction = async () => {
		setLoading(true);
		const { data, error, success } = await callAction(authGetUserInfo);
		// 401 会自动跳转，这里只处理非跳转情况
		if (error !== 'Redirecting to login...') {
			setResult({ 
				type: 'Action - auth', 
				status: success ? 200 : 400, 
				data: data || { error } 
			});
		}
		setLoading(false);
	};

	const testSysAction = async () => {
		setLoading(true);
		const { data, error, success } = await callAction(sysGetSystemInfo);
		// 401 会自动跳转，这里只处理非跳转情况
		if (error !== 'Redirecting to login...') {
			setResult({ 
				type: 'Action - sys', 
				status: success ? 200 : 403, 
				data: data || { error } 
			});
		}
		setLoading(false);
	};

	return (
		<div className="p-8 max-w-2xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">权限测试</h1>
			
			<p className="text-gray-600 dark:text-gray-400 mb-6">
				测试 API Routes 和 Server Actions 的权限控制（带 Toast 提示）
			</p>
			
			{/* API 测试 */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">API Routes 测试</h2>
				<div className="space-y-3">
					<button
						onClick={testPubApi}
						disabled={loading}
						className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
					>
						pub - 公开 API (/api/v1/pub/cms/getList)
					</button>
					
					<button
						onClick={testAuthApi}
						disabled={loading}
						className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
					>
						auth - 需要登录 (/api/v1/auth/user/profile)
					</button>
					
					<button
						onClick={testSysApi}
						disabled={loading}
						className="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
					>
						sys - 后台权限 (/api/v1/sys/test)
					</button>
				</div>
			</div>

			{/* Action 测试 */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Server Actions 测试</h2>
				<div className="space-y-3">
					<button
						onClick={testPubAction}
						disabled={loading}
						className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
					>
						pub - 公开 Action (pubGetServerTime)
					</button>
					
					<button
						onClick={testAuthAction}
						disabled={loading}
						className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
					>
						auth - 需要登录 (authGetUserInfo)
					</button>
					
					<button
						onClick={testSysAction}
						disabled={loading}
						className="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
					>
						sys - 后台权限 (sysGetSystemInfo)
					</button>
				</div>
			</div>

			{/* 结果展示 */}
			{result && (
				<div className={`p-4 rounded ${
					result.status >= 200 && result.status < 300 
						? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
						: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
				}`}>
					<h2 className="font-bold mb-2">
						测试结果 ({result.type}) - Status: {result.status}
					</h2>
					<pre className="text-sm overflow-auto whitespace-pre-wrap">
						{JSON.stringify(result.data, null, 2)}
					</pre>
				</div>
			)}

			{/* 说明 */}
			<div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded text-sm text-gray-600 dark:text-gray-400">
				<h3 className="font-semibold mb-2">权限级别说明</h3>
				<ul className="space-y-1">
					<li><span className="text-green-600 font-medium">pub</span> - 公开，无需登录</li>
					<li><span className="text-blue-600 font-medium">auth</span> - 需要登录（401 自动跳转登录 + Toast）</li>
					<li><span className="text-red-600 font-medium">sys</span> - 需要后台权限 + RBAC（403 Toast 提示）</li>
				</ul>
			</div>
		</div>
	);
}
