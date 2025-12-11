import { TwitterApi, TweetV2 } from 'twitter-api-v2';
import { NextResponse, NextRequest } from 'next/server';
import { WrappedData } from '@/types';

export async function POST(request: NextRequest) {
  const { accessToken, useCache } = await request.json();

  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // If useCache is true and we have cached wrapped data, return it immediately
  if (useCache) {
    console.log('Using cache requested — returning cached data from frontend');
    // Frontend should handle this; backend just signals it's ok to use cache
    return NextResponse.json({ cached: true }, { status: 200 });
  }

  try {
    const client = new TwitterApi(accessToken);
    const userClient = client.readOnly;

    // 1. Get User Info
    const me = await userClient.v2.me({
      'user.fields': ['profile_image_url', 'public_metrics']
    });

    // 2. Fetch Tweets 2025 with minimal pagination (1 page = 100 tweets, stop if <2025)
    const tweets: TweetV2[] = [];
    const warnings: string[] = [];
    let paginationToken: string | undefined;
    const maxPages = 1; // ONE page only to minimize rate limit
    let page = 0;
    const delayMs = 500;

    try {
      while (page < maxPages) {
        const timeline = await userClient.v2.userTimeline(me.data.id, {
          'tweet.fields': ['public_metrics', 'created_at', 'text'],
          max_results: 20, // Back to 100, but only 1 page
          pagination_token: paginationToken,
        });

        const rawTweets = timeline.data.data || [];
        const filtered2025 = rawTweets.filter(t => {
          if (!t.created_at) return false;
          const year = new Date(t.created_at).getUTCFullYear();
          return year === 2025;
        });
        tweets.push(...filtered2025);

        paginationToken = timeline.data.meta.next_token;
        page += 1;

        // Stop if no more pages
        if (!paginationToken) break;

        // Stop early if oldest tweet in this page is before 2025
        const oldest = rawTweets[rawTweets.length - 1];
        if (oldest?.created_at) {
          const oldestYear = new Date(oldest.created_at).getUTCFullYear();
          if (oldestYear < 2025) break;
        }

        // Small delay to reduce rate-limit risk
        await new Promise(res => setTimeout(res, delayMs));
      }
    } catch (error: unknown) {
      const err = error as { code?: number; data?: { title?: string }; rateLimit?: { reset?: number; resetMs?: number } };
      if (err?.code === 429 || err?.data?.title === 'Too Many Requests') {
        const waitSec = err.rateLimit?.reset ? Math.max(0, Math.ceil(err.rateLimit.reset - Date.now() / 1000)) : undefined;
        const msg = waitSec ? `Rate limited by Twitter API; please retry after ~${waitSec}s.` : 'Rate limited by Twitter API; please retry in a few minutes.';
        warnings.push(msg);
      } else {
        throw error;
      }
    }

    console.log(`Fetched ${tweets.length} tweets from 2025 (pages fetched: ${page})`);

    // If still empty, return early with warning so UI shows clear message
    if (tweets.length === 0) {
      const emptyResult: WrappedData = {
        user: me.data,
        stats: {
          totalTweets2025: 0,
          totalLikesReceived: 0,
          totalRetweetsReceived: 0,
          totalRepliesReceived: 0,
          totalEngagement: 0,
          mostActiveHour: 'N/A',
          dominantTopics: [],
        },
        topTweets: [],
        viralTweets: [],
        accountVibes: { primary: 'Unknown', description: 'No data available for 2025' },
        accountSignature: { trait: 'No Data', proof: 'No original tweets detected in 2025' },
        topEmotion: { emotion: 'N/A', percentage: 0 },
        motivationalQuote: 'No data yet — try again later.',
        warnings: warnings.length ? warnings : ['No tweets found for 2025 (rate limit or no original tweets).'],
      };

      return NextResponse.json(emptyResult, { status: 200 });
    }

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
      words.forEach((word: string) => {
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
    const err = error as { code?: number; data?: { title?: string } };
    if (err?.code === 429 || err?.data?.title === 'Too Many Requests') {
      return NextResponse.json({ error: 'Rate limited by Twitter API. Please retry in a few minutes.' }, { status: 429 });
    }
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}