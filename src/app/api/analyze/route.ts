import { TwitterApi } from 'twitter-api-v2';
import { NextResponse, NextRequest } from 'next/server';
import { WrappedData } from '@/types'; // Import tipe kita!

export async function POST(request: NextRequest) {
  const { accessToken } = await request.json();

  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const client = new TwitterApi(accessToken);
    const userClient = client.readOnly;

    // 1. Get User Info
    const me = await userClient.v2.me({
      'user.fields': ['profile_image_url', 'public_metrics']
    });

    // 2. Fetch Tweets (Contoh ambil 100 terakhir)
    const timeline = await userClient.v2.userTimeline(me.data.id, {
      start_time: '2025-01-01T00:00:00Z',
      'tweet.fields': ['public_metrics', 'created_at', 'text'],
      max_results: 100, 
    });

    const tweets = timeline.data.data || [];

    // --- LOGIC ANALYSIS ---
    
    // Sort Top Tweet
    const sortedTweets = [...tweets].sort((a, b) => {
      const engA = (a.public_metrics?.like_count || 0) + (a.public_metrics?.retweet_count || 0);
      const engB = (b.public_metrics?.like_count || 0) + (b.public_metrics?.retweet_count || 0);
      return engB - engA;
    });

    // Calculate Totals
    let totalLikes = 0;
    let totalRTs = 0;
    
    tweets.forEach(t => {
      totalLikes += t.public_metrics?.like_count || 0;
      totalRTs += t.public_metrics?.retweet_count || 0;
    });

    // Response Data Sesuai Interface WrappedData
    const result: WrappedData = {
      user: me.data,
      stats: {
        totalTweetsScanned: tweets.length,
        totalLikesReceived: totalLikes,
        totalRetweetsReceived: totalRTs,
        mostActiveHour: "20:00" // Logic jam bisa ditambah nanti
      },
      topTweet: sortedTweets[0] || null
    };

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}