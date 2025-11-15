'use client'
import { useState, useRef, useEffect } from 'react'

export default function UniversalMusicApp() {
  const [tracks, setTracks] = useState([])
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlStatus, setCrawlStatus] = useState('')
  const [crawlStats, setCrawlStats] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')
  const audioRef = useRef(null)

  const genres = ['all', 'electronic', 'lofi', 'ambient', 'rock', 'jazz', 'classical', 'funk']

  useEffect(() => {
    loadTracks()
    // Auto-crawl every 5 minutes
    const interval = setInterval(() => {
      if (!isCrawling) {
        startUniversalCrawl()
      }
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const loadTracks = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/crawl/universal')
      const tracksData = await response.json()
      setTracks(tracksData)
      updateLastUpdated()
      loadCrawlStats()
    } catch (err) {
      setError('Failed to load music library')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCrawlStats = async () => {
    try {
      const response = await fetch('/api/crawl/universal?action=status')
      const stats = await response.json()
      setCrawlStats(stats)
    } catch (err) {
      console.log('Failed to load crawl stats')
    }
  }

  const startUniversalCrawl = async () => {
    try {
      setIsCrawling(true)
      setCrawlStatus('🌐 Scanning music sources across the web...')
      
      const response = await fetch('/api/crawl/universal?action=crawl')
      const result = await response.json()
      
      if (result.success) {
        setTracks(result.tracks || [])
        setCrawlStatus(`✅ Found ${result.newTracks} new tracks! Total: ${result.totalTracks}`)
        updateLastUpdated()
        loadCrawlStats()
      } else {
        setCrawlStatus(`⚠️ ${result.message}`)
      }
      
      setTimeout(() => setCrawlStatus(''), 5000)
      
    } catch (err) {
      setCrawlStatus('❌ Crawl failed: ' + err.message)
    } finally {
      setIsCrawling(false)
    }
  }

  const updateLastUpdated = () => {
    setLastUpdated(new Date().toLocaleTimeString())
  }

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre
    return matchesSearch && matchesGenre
  })

  const playTrack = (track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          setError('Failed to play track. Please try another one.')
        })
      }
    }, 100)
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(err => {
          setError('Failed to play track')
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime
      const duration = audioRef.current.duration
      setProgress((currentTime / duration) * 100)
    }
  }

  const handleAudioEnd = () => {
    setIsPlaying(false)
    setProgress(0)
  }

  const getGenreColor = (genre) => {
    const colors = {
      electronic: '#ff00ff',
      lofi: '#00ffff',
      ambient: '#00ff00',
      rock: '#ff6600',
      jazz: '#ff00cc',
      classical: '#ffff00',
      funk: '#ff4444',
      all: '#ffffff'
    }
    return colors[genre] || '#ffffff'
  }

  return (
    <div className="cyber-container">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="cyber-text" style={{ 
          fontSize: '3.5rem', 
          background: 'linear-gradient(135deg, #ff00ff, #00ffff, #ffff00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '900',
          marginBottom: '20px'
        }}>
          STREAMPUNK
        </h1>
        
        <div className="marquee-cyber">
          <marquee behavior="scroll" direction="left" scrollamount="6">
            🚀 UNIVERSAL MUSIC CRAWLER • {tracks.length} TRACKS • AUTO-UPDATING • {lastUpdated ? `SYNCED: ${lastUpdated}` : 'LOADING...'} 🚀
          </marquee>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar-cyber">
        <div className="crawl-stats">
          <div className="stat-card">
            <div className="stat-number">{tracks.length}</div>
            <div className="stat-label">TRACKS</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{new Set(tracks.map(t => t.source)).size}</div>
            <div className="stat-label">SOURCES</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{crawlStats?.crawlCount || 0}</div>
            <div className="stat-label">CRAWLS</div>
          </div>
        </div>
        
        <button 
          className="cyber-button"
          onClick={startUniversalCrawl}
          disabled={isCrawling}
          style={{
            background: isCrawling 
              ? 'linear-gradient(135deg, #666, #999)' 
              : 'linear-gradient(135deg, #00ff00, #00cc00)'
          }}
        >
          {isCrawling ? '🔄 CRAWLING...' : '🌐 CRAWL MUSIC'}
        </button>
      </div>

      {crawlStatus && (
        <div className="crawl-status">
          <strong>{crawlStatus}</strong>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <input
          type="text"
          className="cyber-input"
          placeholder="🔍 SEARCH TRACKS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
        
        <div className="genre-tags-cyber">
          {genres.map(genre => (
            <div
              key={genre}
              className={`genre-tag-cyber ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => setSelectedGenre(genre)}
              style={{
                borderColor: getGenreColor(genre),
                background: selectedGenre === genre ? getGenreColor(genre) : 'transparent',
                color: selectedGenre === genre ? '#000' : getGenreColor(genre)
              }}
            >
              {genre.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-cyber">
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '10px' }}>✕</button>
        </div>
      )}

      {/* Music Player */}
      {currentTrack && (
        <div className="music-player-cyber">
          <h3 style={{ color: '#ffff00', marginBottom: '20px', textAlign: 'center' }}>
            🎧 NOW PLAYING: <span style={{ color: '#ff00ff' }}>{currentTrack.title}</span> - <span style={{ color: '#00ffff' }}>{currentTrack.artist}</span>
          </h3>
          <div className="progress-bar-cyber">
            <div className="progress-fill-cyber" style={{ width: `${progress}%` }}></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button className="cyber-button" onClick={togglePlay}>
              {isPlaying ? '⏸️ PAUSE' : '▶️ PLAY'}
            </button>
            <span style={{ marginLeft: '15px', color: '#00ff00' }}>
              ⏱️ {currentTrack.duration} • 📁 {currentTrack.source}
            </span>
          </div>
          <audio
            ref={audioRef}
            src={currentTrack.url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleAudioEnd}
            onError={() => setError('Failed to load audio')}
          />
        </div>
      )}

      {/* Track List */}
      <div>
        <h2 style={{ fontSize: '2rem', color: '#00ffff', marginBottom: '30px', textAlign: 'center' }}>
          MUSIC LIBRARY ({filteredTracks.length} TRACKS)
        </h2>
        
        {isLoading ? (
          <div className="loading-cyber">
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🌀</div>
            LOADING UNIVERSAL CRAWLER...
          </div>
        ) : (
          <ul className="track-list-cyber">
            {filteredTracks.map(track => (
              <li
                key={track.id}
                className={`track-item-cyber ${currentTrack?.id === track.id ? 'playing' : ''}`}
                onClick={() => playTrack(track)}
              >
                <div className="track-artwork-cyber">🎵</div>
                <div className="track-info-cyber">
                  <div className="track-title-cyber">{track.title}</div>
                  <div className="track-artist-cyber">🎤 {track.artist}</div>
                  <div className="track-meta-cyber">
                    <span>⏱️ {track.duration}</span>
                    <span>📁 {track.source}</span>
                    <span style={{ color: getGenreColor(track.genre) }}>🎵 {track.genre}</span>
                    <span>⭐ {track.popularity}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}