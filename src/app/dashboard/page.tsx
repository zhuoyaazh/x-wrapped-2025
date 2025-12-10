'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { WrappedData } from '@/types'; // Import tipe!

export default function Dashboard() {
  // State otomatis tau kalau isinya harus sesuai format WrappedData
  const [data, setData] = useState<WrappedData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
      return;
    }

    axios.post('/api/analyze', { accessToken: token })
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, [router]);

  if (!data) return <div className="bg-zinc-950 min-h-screen text-white p-10">Generating Report...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 md:p-16 font-sans">
      <header className="mb-12">
        <h2 className="text-2xl font-bold text-zinc-500">X WRAPPED 2025</h2>
        <h1 className="text-5xl font-black mt-2">@{data.user.username}</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Cards */}
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <p className="text-zinc-500 text-sm font-bold uppercase">Total Likes</p>
          <p className="text-6xl font-black text-pink-500 mt-2">{data.stats.totalLikesReceived}</p>
        </div>
        
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <p className="text-zinc-500 text-sm font-bold uppercase">Tweets Analyzed</p>
          <p className="text-6xl font-black text-blue-500 mt-2">{data.stats.totalTweetsScanned}</p>
        </div>

        {/* Top Tweet Card */}
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 md:col-span-2 md:row-span-2">
          <p className="text-zinc-500 text-sm font-bold uppercase mb-4">👑 Your Best Tweet</p>
          {data.topTweet ? (
            <div>
              <p className="text-2xl font-medium leading-relaxed">&ldquo;{data.topTweet.text}&rdquo;</p>
              <div className="flex gap-6 mt-6 text-zinc-400 font-mono">
                <span>❤️ {data.topTweet.public_metrics?.like_count}</span>
                <span>🔁 {data.topTweet.public_metrics?.retweet_count}</span>
              </div>
            </div>
          ) : (
            <p>No tweets found.</p>
          )}
        </div>
      </div>
    </div>
  );
}