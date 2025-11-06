'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/auth-client';

export default function RegisterPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		const formData = new FormData(e.target);
		const email = formData.get('email');
		const password = formData.get('password');
		const name = formData.get('name');

		try {
			// 使用 Better Auth 的注册 API
			const result = await authClient.signUp.email({
				email,
				password,
				name,
			});

			if (result.error) {
				setError(result.error.message || 'Registration failed');
			} else {
				setSuccess(true);
				setTimeout(() => {
					router.push('/dashboard');
				}, 1500);
			}
		} catch (err) {
			console.error('Registration error:', err);
			setError(err.message || 'Registration failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
			<Card className="w-full max-w-md">
				<CardContent className="pt-6">
					<div className="mb-6 text-center">
						<h1 className="text-2xl font-bold">Create Account</h1>
						<p className="mt-2 text-sm text-gray-600">
							Test Better Auth Registration
						</p>
					</div>

					{success ? (
						<div className="rounded-md bg-green-50 p-4 text-center">
							<p className="text-sm font-medium text-green-800">
								✅ Registration successful! Redirecting...
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<div className="rounded-md bg-red-50 p-4">
									<p className="text-sm text-red-800">{error}</p>
								</div>
							)}

							<Field>
								<FieldLabel>Name</FieldLabel>
								<Input
									type="text"
									name="name"
									placeholder="John Doe"
									required
									disabled={loading}
								/>
							</Field>

							<Field>
								<FieldLabel>Email</FieldLabel>
								<Input
									type="email"
									name="email"
									placeholder="you@example.com"
									required
									disabled={loading}
								/>
							</Field>

							<Field>
								<FieldLabel>Password</FieldLabel>
								<Input
									type="password"
									name="password"
									placeholder="••••••••"
									minLength={8}
									required
									disabled={loading}
								/>
								<p className="mt-1 text-xs text-gray-500">
									At least 8 characters
								</p>
							</Field>

							<Button
								type="submit"
								className="w-full"
								disabled={loading}
							>
								{loading ? 'Creating account...' : 'Create Account'}
							</Button>

							<div className="text-center text-sm text-gray-600">
								Already have an account?{' '}
								<a
									href="/login"
									className="font-medium text-blue-600 hover:text-blue-500"
								>
									Sign in
								</a>
							</div>
						</form>
					)}

					<div className="mt-6 border-t pt-6">
						<div className="text-xs text-gray-500">
							<p className="font-semibold mb-2">🔍 Debug Info:</p>
							<p>• Email verification: Disabled</p>
							<p>• Better Auth will handle password hashing</p>
							<p>• This tests the complete Better Auth flow</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

