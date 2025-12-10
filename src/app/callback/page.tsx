'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const codeVerifier = localStorage.getItem('codeVerifier');

    if (!code) {
      alert('No authorization code received');
      router.push('/');
      return;
    }

    if (!codeVerifier) {
      alert('Code verifier missing. Please try logging in again.');
      router.push('/');
      return;
    }

    // Proceed with OAuth callback
    axios.post('/api/auth/callback', { code, codeVerifier })
      .then((res) => {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.removeItem('codeVerifier');
        localStorage.removeItem('state');
        router.push('/dashboard');
      })
      .catch((error) => {
        console.error('OAuth callback error:', error);
        alert('Login failed: ' + (error.response?.data?.error || error.message));
        router.push('/');
      });
  }, [searchParams, router]);

  return <div className="min-h-screen bg-black text-white flex justify-center items-center">Authenticating...</div>;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex justify-center items-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}