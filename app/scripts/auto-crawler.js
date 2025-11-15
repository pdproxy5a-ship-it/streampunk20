const { UniversalMusicCrawler } = require('../app/lib/universal-crawler');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/music-catalog.json');

class AutoUpdatingCrawler {
  constructor() {
    this.crawler = new UniversalMusicCrawler();
    this.updateInterval = 10 * 60 * 1000; // 10 minutes
  }

  async start() {
    console.log('🤖 Starting auto-updating music crawler...');
    
    // Initial crawl
    await this.performCrawl();
    
    // Schedule periodic crawls
    setInterval(() => {
      this.performCrawl();
    }, this.updateInterval);
    
    console.log(`🔄 Auto-crawler scheduled to run every ${this.updateInterval / 60000} minutes`);
  }

  async performCrawl() {
    try {
      console.log('\n🕐 Scheduled crawl started at:', new Date().toLocaleString());
      
      const newTracks = await this.crawler.crawlInternet();
      const catalog = await this.loadCatalog();
      
      // Merge tracks
      const allTracks = [...catalog.tracks, ...newTracks];
      const uniqueTracks = this.removeDuplicates(allTracks);
      
      // Update catalog
      catalog.tracks = uniqueTracks;
      catalog.lastCrawl = new Date().toISOString();
      catalog.totalTracks = uniqueTracks.length;
      catalog.crawlCount = (catalog.crawlCount || 0) + 1;
      
      await this.saveCatalog(catalog);
      
      console.log(`✅ Scheduled crawl completed! Total tracks: ${uniqueTracks.length}`);
      console.log(`📊 New tracks found: ${newTracks.length}`);
      
    } catch (error) {
      console.error('❌ Scheduled crawl failed:', error.message);
    }
  }

  async loadCatalog() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('No existing catalog found, creating new one...');
    }
    
    return {
      tracks: [],
      lastCrawl: null,
      totalTracks: 0,
      crawlCount: 0,
      createdAt: new Date().toISOString()
    };
  }

  async saveCatalog(catalog) {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(catalog, null, 2));
  }

  removeDuplicates(tracks) {
    const seen = new Set();
    return tracks.filter(track => {
      const key = track.verified ? track.url : `${track.title}-${track.artist}-${track.source}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

// Start the auto-crawler if this script is run directly
if (require.main === module) {
  const autoCrawler = new AutoUpdatingCrawler();
  autoCrawler.start();
}

module.exports = AutoUpdatingCrawler;