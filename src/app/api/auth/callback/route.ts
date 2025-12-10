import { TwitterApi } from 'twitter-api-v2';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const { code, codeVerifier } = await request.json();

  if (!code || !codeVerifier) {
    return NextResponse.json({ error: 'Missing code or verifier' }, { status: 400 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/callback`;
  console.log('OAuth Callback Debug:', {
    hasCode: !!code,
    hasVerifier: !!codeVerifier,
    redirectUri,
    clientId: process.env.TWITTER_CLIENT_ID,
  });

  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    });

    const { accessToken } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri,
    });

    return NextResponse.json({ accessToken });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('OAuth callback error:', errorMsg, error);
    return NextResponse.json({ error: `OAuth failed: ${errorMsg}` }, { status: 500 });
  }
}