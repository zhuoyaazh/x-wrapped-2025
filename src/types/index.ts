import { TweetV2, UserV2 } from 'twitter-api-v2';

// Enhanced Wrapped Data dengan analytics lengkap
export interface WrappedData {
  user: UserV2;
  stats: {
    totalTweets2025: number;
    totalLikesReceived: number;
    totalRetweetsReceived: number;
    totalRepliesReceived: number;
    totalEngagement: number;
    mostActiveHour: string;
    dominantTopics: string[];
  };
  topTweets: TweetV2[]; // Top 3 tweets
  viralTweets: TweetV2[]; // Tweets dengan 250+ likes
  accountVibes: {
    primary: string; // e.g., "Inspirational", "Humorous", "Educational"
    description: string;
  };
  accountSignature: {
    trait: string; // Ciri khas
    proof: string; // Bukti/contoh
  };
  topEmotion: {
    emotion: string; // e.g., "Joy", "Anger", "Excitement"
    percentage: number;
  };
  motivationalQuote: string;
  warnings?: string[]; // e.g., rate limit -> data partial
}
