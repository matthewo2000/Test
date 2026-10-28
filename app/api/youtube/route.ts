import { NextRequest,NextResponse } from 'next/server';
import {roads} from '../../../lib/roads';
export const runtime='nodejs';
const cache=new Map<string,{until:number;data:unknown}>();
export async function GET(req:NextRequest){
 const id=req.nextUrl.searchParams.get('road'); const road=roads.find(r=>r.id===id);
 if(!road)return NextResponse.json({error:'Unknown road'},{status:400});
 const key=process.env.YOUTUBE_API_KEY;
 if(!key)return NextResponse.json({videos:[],demo:true,message:'Add YOUTUBE_API_KEY to .env.local to enable live YouTube search.'});
 const cached=cache.get(id!);if(cached&&cached.until>Date.now())return NextResponse.json(cached.data);
 const url=new URL('https://www.googleapis.com/youtube/v3/search');
 url.searchParams.set('part','snippet');url.searchParams.set('type','video');url.searchParams.set('maxResults','18');url.searchParams.set('q',road.search);url.searchParams.set('videoEmbeddable','true');url.searchParams.set('key',key);
 try{const resp=await fetch(url,{next:{revalidate:3600}});const json=await resp.json();if(!resp.ok)return NextResponse.json({error:'YouTube API error',details:json.error?.message||'Unknown error'},{status:502});
 const videos=(json.items||[]).map((v:any)=>({id:v.id.videoId,title:v.snippet.title,channel:v.snippet.channelTitle,thumbnail:v.snippet.thumbnails?.medium?.url||v.snippet.thumbnails?.default?.url,published:v.snippet.publishedAt,description:v.snippet.description}));
 const data={videos,demo:false};cache.set(id!,{until:Date.now()+3600000,data});return NextResponse.json(data);
 }catch{return NextResponse.json({error:'Unable to reach YouTube API'},{status:502})}
}
