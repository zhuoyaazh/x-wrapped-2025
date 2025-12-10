import { TweetV2, UserV2 } from 'twitter-api-v2';

// Bentuk data yang bakal dikirim Backend ke Frontend
export interface WrappedData {
  user: UserV2;
  stats: {
    totalTweetsScanned: number;
    totalLikesReceived: number;
    totalRetweetsReceived: number;
    mostActiveHour: string; // misal: "20:00"
  };
  topTweet: TweetV2 | null;
}