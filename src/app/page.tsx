'use client';
import axios from 'axios';

export default function Home() {
  const handleLogin = async () => {
    try {
      const { data } = await axios.get('/api/auth/login');
      // Simpan verifier & state buat security check nanti
      localStorage.setItem('codeVerifier', data.codeVerifier);
      localStorage.setItem('state', data.state);
      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Gagal connect ke Server");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-24">
      <h1 className="text-6xl font-black mb-4 tracking-tighter">WRAPPED <span className="text-blue-500">2025</span></h1>
      <p className="text-zinc-400 mb-8">Reveal your true X personality.</p>
      <button 
        onClick={handleLogin}
        className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition"
      >
        Sign in with X
      </button>
    </main>
  );
}