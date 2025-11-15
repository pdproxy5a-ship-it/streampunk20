import { NextResponse } from 'next/server';
import { UniversalMusicCrawler } from '../../../lib/universal-crawler';

// Simple in-memory cache
let musicCache = {
  tracks: [],
  lastCrawl: null,
  totalTracks: 0,
  crawlCount: 0,
  createdAt: new Date().toISOString()
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'crawl') {
    return await handleUniversalCrawl();
  } else if (action === 'status') {
    return NextResponse.json(getCrawlStatus());
  } else if (action === 'reset') {
    return handleReset();
  }
  
  // Return current catalog
  return NextResponse.json(musicCache.tracks);
}

async function handleUniversalCrawl() {
  try {
    console.log('🚀 Starting universal crawl...');
    
    const crawler = new UniversalMusicCrawler();
    const newTracks = await crawler.crawlInternet();
    
    // Merge with existing tracks
    const allTracks = [...musicCache.tracks, ...newTracks];
    const uniqueTracks = removeDuplicates(allTracks);
    
    // Update cache
    musicCache.tracks = uniqueTracks;
    musicCache.lastCrawl = new Date().toISOString();
    musicCache.totalTracks = uniqueTracks.length;
    musicCache.crawlCount = (musicCache.crawlCount || 0) + 1;
    
    console.log(`✅ Crawl completed! Total tracks: ${uniqueTracks.length}`);
    
    return NextResponse.json({
      success: true,
      message: 'Universal crawl completed successfully',
      newTracks: newTracks.length,
      totalTracks: uniqueTracks.length,
      lastCrawl: musicCache.lastCrawl,
      crawlCount: musicCache.crawlCount,
      tracks: uniqueTracks
    });
    
  } catch (error) {
    console.error('❌ Universal crawl failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Crawl failed',
      message: error.message,
      tracks: musicCache.tracks
    }, { status: 500 });
  }
}

function handleReset() {
  musicCache.tracks = [];
  musicCache.lastCrawl = null;
  musicCache.totalTracks = 0;
  musicCache.crawlCount = 0;
  return NextResponse.json({ message: 'Cache reset successfully' });
}

function getCrawlStatus() {
  return {
    totalTracks: musicCache.tracks.length,
    lastCrawl: musicCache.lastCrawl,
    crawlCount: musicCache.crawlCount,
    createdAt: musicCache.createdAt,
    sources: [...new Set(musicCache.tracks.map(t => t.source))],
    genres: [...new Set(musicCache.tracks.map(t => t.genre))]
  };
}

function removeDuplicates(tracks) {
  const seen = new Set();
  return tracks.filter(track => {
    const key = track.url + track.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Initialize with core library
if (musicCache.tracks.length === 0) {
  const crawler = new UniversalMusicCrawler();
  const initialTracks = crawler.generateCoreLibrary();
  musicCache.tracks = initialTracks;
  musicCache.totalTracks = initialTracks.length;
  console.log('🎵 Initialized with', initialTracks.length, 'tracks');
}