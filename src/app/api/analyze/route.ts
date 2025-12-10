import { TwitterApi } from 'twitter-api-v2';
import { NextResponse, NextRequest } from 'next/server';
import { WrappedData } from '@/types';

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

    // 2. Fetch Tweets dari 2025 dengan pagination (max 800 tweets untuk avoid rate limit)
    const tweets = [];
    let paginationToken: string | undefined;
    const maxPages = 8; // 8 pages x 100 = 800 tweets
    let pageCount = 0;

    do {
      const timeline = await userClient.v2.userTimeline(me.data.id, {
        start_time: '2025-01-01T00:00:00Z',
        end_time: '2025-12-31T23:59:59Z',
        'tweet.fields': ['public_metrics', 'created_at', 'text'],
        max_results: 100,
        pagination_token: paginationToken,
        exclude: ['retweets', 'replies'], // Exclude retweets & replies untuk fokus ke original tweets
      });

      if (timeline.data.data) {
        tweets.push(...timeline.data.data);
      }

      paginationToken = timeline.data.meta.next_token;
      pageCount++;
      
      // Break jika sudah tidak ada tweet lagi
      if (!paginationToken) break;
      
    } while (pageCount < maxPages);

    console.log(`Fetched ${tweets.length} original tweets from 2025`);

    // --- ADVANCED ANALYTICS ---

    // Calculate totals
    let totalLikes = 0;
    let totalRTs = 0;
    let totalReplies = 0;
    const hourCounts: Record<number, number> = {};
    const topicKeywords: Record<string, number> = {};

    tweets.forEach(t => {
      totalLikes += t.public_metrics?.like_count || 0;
      totalRTs += t.public_metrics?.retweet_count || 0;
      totalReplies += t.public_metrics?.reply_count || 0;

      // Track posting hours
      if (t.created_at) {
        const hour = new Date(t.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      // Simple topic extraction (kata-kata penting)
      const words = t.text.toLowerCase().match(/\b\w{4,}\b/g) || [];
      words.forEach(word => {
        if (!['https', 'http', 'with', 'that', 'this', 'from', 'have', 'been', 'will', 'your', 'just', 'like', 'what', 'when', 'they'].includes(word)) {
          topicKeywords[word] = (topicKeywords[word] || 0) + 1;
        }
      });
    });

    // Most active hour
    const mostActiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '20';

    // Dominant topics (top 3)
    const dominantTopics = Object.entries(topicKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);

    // Sort by engagement (likes + RTs + replies)
    const sortedByEngagement = [...tweets].sort((a, b) => {
      const engA = (a.public_metrics?.like_count || 0) + 
                   (a.public_metrics?.retweet_count || 0) + 
                   (a.public_metrics?.reply_count || 0);
      const engB = (b.public_metrics?.like_count || 0) + 
                   (b.public_metrics?.retweet_count || 0) + 
                   (b.public_metrics?.reply_count || 0);
      return engB - engA;
    });

    // Top 3 tweets
    const topTweets = sortedByEngagement.slice(0, 3);

    // Viral tweets (250+ likes)
    const viralTweets = tweets.filter(t => (t.public_metrics?.like_count || 0) >= 250)
      .sort((a, b) => (b.public_metrics?.like_count || 0) - (a.public_metrics?.like_count || 0));

    console.log(`Found ${viralTweets.length} viral tweets (250+ likes)`);

    // Account vibes analysis
    const avgEngagement = tweets.length > 0 ? (totalLikes + totalRTs) / tweets.length : 0;
    let vibes = { primary: 'Casual', description: 'Sharing thoughts and updates' };
    
    if (viralTweets.length > 5) {
      vibes = { primary: 'Influential', description: 'Creating viral content that resonates with thousands' };
    } else if (avgEngagement > 50) {
      vibes = { primary: 'Engaging', description: 'Building meaningful connections with your audience' };
    } else if (tweets.length > 200) {
      vibes = { primary: 'Active', description: 'Consistently sharing your voice on X' };
    }

    // Account signature (ciri khas)
    const signature = viralTweets.length > 0
      ? { trait: 'Viral Content Creator', proof: `${viralTweets.length} tweets went viral with 250+ likes` }
      : tweets.length > 100
      ? { trait: 'Consistent Poster', proof: `Posted ${tweets.length} times in 2025` }
      : { trait: 'Thoughtful Contributor', proof: `Shared ${tweets.length} quality posts` };

    // Top emotion (simple sentiment based on engagement)
    const highEngagementRatio = viralTweets.length / Math.max(tweets.length, 1);
    const emotion = highEngagementRatio > 0.1
      ? { emotion: 'Excitement', percentage: Math.round(highEngagementRatio * 100) }
      : avgEngagement > 20
      ? { emotion: 'Joy', percentage: 70 }
      : { emotion: 'Calm', percentage: 60 };

    // Motivational quote based on vibes
    const quotes: Record<string, string> = {
      'Influential': '🌟 "Your voice matters. Keep creating, keep inspiring."',
      'Engaging': '💫 "Connection is the heart of community. You\'re doing it right."',
      'Active': '🔥 "Consistency is key. Your dedication shows."',
      'Casual': '✨ "Every tweet is a step in your journey. Keep going."',
    };
    const motivationalQuote = quotes[vibes.primary] || quotes['Casual'];

    const result: WrappedData = {
      user: me.data,
      stats: {
        totalTweets2025: tweets.length,
        totalLikesReceived: totalLikes,
        totalRetweetsReceived: totalRTs,
        totalRepliesReceived: totalReplies,
        totalEngagement: totalLikes + totalRTs + totalReplies,
        mostActiveHour: `${mostActiveHour}:00`,
        dominantTopics,
      },
      topTweets,
      viralTweets: viralTweets.slice(0, 10), // Max 10 viral tweets
      accountVibes: vibes,
      accountSignature: signature,
      topEmotion: emotion,
      motivationalQuote,
    };

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Analyze error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}