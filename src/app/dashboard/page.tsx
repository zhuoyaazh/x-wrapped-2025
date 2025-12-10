'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { WrappedData } from '@/types';

export default function Dashboard() {
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
      return;
    }

    axios.post('/api/analyze', { accessToken: token })
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to analyze: ' + err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="bg-zinc-950 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Analyzing your X journey in 2025...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="bg-zinc-950 min-h-screen text-white p-10">Failed to load data</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6 md:p-16 font-sans">
      {/* Header */}
      <header className="mb-12 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-zinc-500 tracking-wider">X WRAPPED 2025</h2>
        <h1 className="text-4xl md:text-6xl font-black mt-3 bg-gradient-to-r from-blue-400 to-pink-500 bg-clip-text text-transparent">
          @{data.user.username}
        </h1>
        <p className="text-zinc-400 mt-2">{data.accountVibes.description}</p>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-pink-900/30 to-pink-600/10 p-6 rounded-3xl border border-pink-800/30">
          <p className="text-pink-400 text-sm font-bold uppercase mb-2">Total Tweets 2025</p>
          <p className="text-5xl font-black text-pink-300">{data.stats.totalTweets2025}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-600/10 p-6 rounded-3xl border border-blue-800/30">
          <p className="text-blue-400 text-sm font-bold uppercase mb-2">Total Likes</p>
          <p className="text-5xl font-black text-blue-300">{data.stats.totalLikesReceived.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-green-600/10 p-6 rounded-3xl border border-green-800/30">
          <p className="text-green-400 text-sm font-bold uppercase mb-2">Total Retweets</p>
          <p className="text-5xl font-black text-green-300">{data.stats.totalRetweetsReceived.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-600/10 p-6 rounded-3xl border border-purple-800/30">
          <p className="text-purple-400 text-sm font-bold uppercase mb-2">Total Engagement</p>
          <p className="text-5xl font-black text-purple-300">{data.stats.totalEngagement.toLocaleString()}</p>
        </div>
      </div>

      {/* Account Vibes & Signature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur">
          <p className="text-zinc-400 text-sm font-bold uppercase mb-3">✨ Your Vibes in 2025</p>
          <h3 className="text-3xl font-black text-yellow-400 mb-2">{data.accountVibes.primary}</h3>
          <p className="text-zinc-300">{data.accountVibes.description}</p>
        </div>

        <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur">
          <p className="text-zinc-400 text-sm font-bold uppercase mb-3">🎯 Your Signature</p>
          <h3 className="text-3xl font-black text-orange-400 mb-2">{data.accountSignature.trait}</h3>
          <p className="text-zinc-300">{data.accountSignature.proof}</p>
        </div>
      </div>

      {/* Topics & Emotion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur">
          <p className="text-zinc-400 text-sm font-bold uppercase mb-3">📊 Dominant Topics</p>
          <div className="flex flex-wrap gap-3">
            {data.stats.dominantTopics.map((topic, idx) => (
              <span key={idx} className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full font-semibold">
                #{topic}
              </span>
            ))}
          </div>
          <p className="text-zinc-500 text-sm mt-4">Most active hour: {data.stats.mostActiveHour}</p>
        </div>

        <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur">
          <p className="text-zinc-400 text-sm font-bold uppercase mb-3">😊 Top Emotion</p>
          <h3 className="text-4xl font-black text-pink-400 mb-2">{data.topEmotion.emotion}</h3>
          <div className="bg-zinc-800 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-full transition-all duration-1000"
              style={{ width: `${data.topEmotion.percentage}%` }}
            ></div>
          </div>
          <p className="text-zinc-400 text-sm mt-2">{data.topEmotion.percentage}% of your content</p>
        </div>
      </div>

      {/* Top 3 Tweets */}
      <div className="mb-8">
        <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
          <span className="text-4xl">👑</span> Your Top 3 Tweets
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data.topTweets.map((tweet, idx) => (
            <div key={tweet.id} className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 backdrop-blur hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-black text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text">
                  #{idx + 1}
                </span>
              </div>
              <p className="text-zinc-200 leading-relaxed mb-4 line-clamp-4">{tweet.text}</p>
              <div className="flex gap-4 text-sm text-zinc-400 font-mono">
                <span>❤️ {tweet.public_metrics?.like_count?.toLocaleString()}</span>
                <span>🔁 {tweet.public_metrics?.retweet_count?.toLocaleString()}</span>
                <span>💬 {tweet.public_metrics?.reply_count?.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Viral Tweets */}
      {data.viralTweets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
            <span className="text-4xl">🔥</span> Your Viral Hits ({data.viralTweets.length} tweets with 250+ likes)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.viralTweets.slice(0, 6).map((tweet) => (
              <div key={tweet.id} className="bg-gradient-to-br from-orange-900/20 to-red-900/20 p-6 rounded-3xl border border-orange-600/30 backdrop-blur">
                <p className="text-zinc-200 leading-relaxed mb-4 line-clamp-3">{tweet.text}</p>
                <div className="flex gap-4 text-sm font-mono">
                  <span className="text-pink-400">❤️ {tweet.public_metrics?.like_count?.toLocaleString()}</span>
                  <span className="text-green-400">🔁 {tweet.public_metrics?.retweet_count?.toLocaleString()}</span>
                  <span className="text-blue-400">💬 {tweet.public_metrics?.reply_count?.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-blue-900/30 p-12 rounded-3xl border border-purple-500/30 text-center backdrop-blur">
        <p className="text-zinc-400 text-sm font-bold uppercase mb-4">Message for you</p>
        <p className="text-2xl md:text-3xl font-semibold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text leading-relaxed">
          {data.motivationalQuote}
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-zinc-600 text-sm">
        <p>X Wrapped 2025 • Generated on {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}
