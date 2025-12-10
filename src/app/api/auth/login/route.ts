import { TwitterApi } from 'twitter-api-v2';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  });

  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    `${process.env.NEXT_PUBLIC_BASE_URL}/callback`,
    { scope: ['tweet.read', 'users.read'] }
  );

  return NextResponse.json({ url, codeVerifier, state });
}