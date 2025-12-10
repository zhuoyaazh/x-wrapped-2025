'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = localStorage.getItem('state');
    const codeVerifier = localStorage.getItem('codeVerifier');

    if (code && state === storedState && codeVerifier) {
      axios.post('/api/auth/callback', { code, codeVerifier })
        .then((res) => {
          localStorage.setItem('accessToken', res.data.accessToken);
          router.push('/dashboard');
        })
        .catch(() => alert('Login failed'));
    } else {
       // Handle error state mismatch
    }
  }, [searchParams, router]);

  return <div className="min-h-screen bg-black text-white flex justify-center items-center">Authenticating...</div>;
}