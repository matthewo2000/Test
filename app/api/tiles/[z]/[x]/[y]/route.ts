import { NextResponse } from 'next/server';

const INTEGER = /^\d+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  const tileY = y.replace(/\.png$/, '');

  if (!INTEGER.test(z) || !INTEGER.test(x) || !INTEGER.test(tileY)) {
    return NextResponse.json({ error: 'Invalid tile coordinates' }, { status: 400 });
  }

  const url = new URL(`https://basemaps.cartocdn.com/rastertiles/dark_all/${z}/${x}/${tileY}.png`);
  const apiKey = process.env.API_KEY;
  if (apiKey) url.searchParams.set('key', apiKey);

  const upstream = await fetch(url, { next: { revalidate: 86400 } });
  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}
