import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Skeleton, 
  Paper, 
  IconButton,
  CircularProgress,
  Tooltip,
  Avatar,
  Drawer,
  Collapse,
  Menu,
  MenuItem,
  Divider,
  Fade,
  Zoom,
  Grow,
  Chip,
  Badge,
  Fab,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Shuffle as ShuffleIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  QueueMusic as QueueMusicIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountCircle as AccountCircleIcon,
  PersonOutline,
  Settings,
  ExitToApp,
  ChevronRight,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  Add,
  MoreHoriz,
  Favorite,
  FavoriteBorder,
  Equalizer,
  ArrowForward,
} from '@mui/icons-material';
import SpotifyLogin from '../components/SpotifyLogin';
import './EnhancedHomes.css';
import { getToken, isLoggedIn, logout } from '../services/spotifyAuth';
import { YTMusicPlayerContext } from '../context/YTMusicPlayerContext';

// Spotify API service functions
const fetchSpotifyData = async (endpoint, token) => {
  try {
    const apiEndpoint = endpoint;
    const response = await fetch(`https://api.spotify.com/v1/${apiEndpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Token might be expired - try refreshing
      throw new Error('Token expired or invalid');
    }  

    if (response.status === 403) {
      console.warn(`Missing scope for ${apiEndpoint}`);
      return null;
    }

    if (response.status === 404) {
      console.warn(`Endpoint not found: ${apiEndpoint}`);
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Spotify API Error:', errorData);
      throw new Error(errorData.error?.message || 'Spotify API request failed');
    }

    const data = await response.json();
    if (apiEndpoint === 'featured-playlists?limit=4') {
      if (!data || !data.playlists) {
        return { playlists: { items: [] } }; // Return empty structure
      }
    }
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return null;
  }
};

// Player hook (to be enhanced later)
// Update your usePlayer hook
const usePlayer = (setSpotifyError) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = (track) => {
    // Initialize audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    if (currentTrack && track && currentTrack.id === track.id) {
      // Toggle play/pause for current track
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error('Playback failed:', e));
      }
      setIsPlaying(!isPlaying);
    } else if (track) {
      // Stop current track if playing
      if (currentTrack && isPlaying) {
        audioRef.current.pause();
      }
      
      // Set new track source
      if (track.preview_url) {
        audioRef.current.src = track.preview_url;
        audioRef.current.play()
          .then(() => {
            setCurrentTrack(track);
            setIsPlaying(true);
          })
          .catch(e => {
            console.error('Playback error:', e);
            if (setSpotifyError) setSpotifyError('Preview not available for this track');
          });
      } else {
        if (setSpotifyError) setSpotifyError('No preview available for this track');
      }
    }
  };

  useEffect(() => {
    // Clean up audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  return { currentTrack, isPlaying, togglePlay };
};

// Socket hook (simplified)
const useSocket = () => ({
  socket: {
    emit: (event, data) => console.log(`Socket event from Home page: ${event}`, data),
  },
});

// Enhanced PlayButton: full-card overlay, centered, always clickable
function PlayButton({ track, onPlay, isPlaying }) {
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handlePlay = async (e) => {
    e.stopPropagation();
    setLoading(true);
    const q = `${track.name || track.title} ${track.artists ? track.artists.map(a => a.name).join(' ') : (track.artist?.name || '')}`;
    console.log('PlayButton clicked, query:', q);
    const res = await fetch(`http://localhost:8000/ytmusic/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setLoading(false);
    console.log('ytmusicapi response:', data);
    if (data.videoId) {
      onPlay(data.videoId, track.id);
    } else {
      alert('No playable version found on YouTube Music.');
    }
  };

  return (
    <Box
      className={`play-overlay${isPlaying ? ' playing' : ''}`}
      onClick={handlePlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isPlaying ? 'rgba(30,215,96,0.7)' : 'rgba(0,0,0,0.4)',
        opacity: hovered || isPlaying ? 1 : 0,
        transition: 'opacity 0.3s ease, background-color 0.3s ease',
        cursor: 'pointer',
        zIndex: 2,
        borderRadius: 'inherit',
        '&:hover': { 
          opacity: 1,
          bgcolor: isPlaying ? 'rgba(30,215,96,0.8)' : 'rgba(0,0,0,0.6)',
        },
      }}
    >
      {loading ? (
        <CircularProgress size={40} sx={{ color: '#fff' }} />
      ) : (
        <Zoom in={hovered || isPlaying}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'rgba(30,215,96,0.9)',
              boxShadow: '0 0 20px rgba(30,215,96,0.5)',
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <PlayArrowIcon sx={{ fontSize: 40, color: '#fff' }} />
          </Box>
        </Zoom>
      )}
    </Box>
  );
}

const EnhancedHome = () => {
  const { socket } = useSocket();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedMood, setSelectedMood] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [spotifyData, setSpotifyData] = useState({
    recommendedTracks: [],
    newReleases: [],
    recentlyPlayed: [],
    trendingPlaylists: [],
    userProfile: null
  });
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [spotifyError, setSpotifyError] = useState(null);
  const [expandFilters, setExpandFilters] = useState(true);
  const { ytVideoId, setYtVideoId, setYtTrack, setIsPlaying, ytPlayingId, setYtPlayingId } = useContext(YTMusicPlayerContext);
  const { currentTrack, isPlaying, togglePlay } = usePlayer(setSpotifyError);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [hoveredCard, setHoveredCard] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalTrack, setInfoModalTrack] = useState(null);
  const scrollRef = useRef({});

  // Profile menu handlers
  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    setSpotifyData({
      recommendedTracks: [],
      newReleases: [],
      recentlyPlayed: [],
      trendingPlaylists: [],
      userProfile: null
    });
    handleProfileMenuClose();
  };

  // Format duration from ms to minutes:seconds
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Fetch Spotify data when logged in
  useEffect(() => {
    const fetchData = async () => {
      if (isLoggedIn()) {
        setLoadingSpotify(true);
        setSpotifyError(null);
        try {
          const token = getToken();
          console.log('Spotify token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN FOUND');
          if (!token) throw new Error('No access token available');

          const fetchWithRetry = async (endpoint, retries = 2) => {
            try {
              console.log(`Calling Spotify API: ${endpoint}`);
              const data = await fetchSpotifyData(endpoint, token);
              
              // Handle empty responses
              if (!data) {
                if (endpoint.includes('featured-playlists')) {
                  return { playlists: { items: [] } };
                }
                if (endpoint.includes('recently-played')) {
                  return { items: [] };
                }
                if (endpoint.includes('top/tracks')) {
                  return { items: [] };
                }
                if (endpoint.includes('new-releases')) {
                  return { albums: { items: [] } };
                }
                return {};
              }
              return data;
            } catch (error) {
              if (retries > 0) {
                console.log(`Retrying ${endpoint}... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchWithRetry(endpoint, retries - 1);
              }
              throw error;
            }
          };

          const [
            profile, 
            topTracks, 
            recentTracks, 
            newReleases, 
            featuredPlaylists
          ] = await Promise.all([
            fetchWithRetry('me'),
            fetchWithRetry('me/top/tracks?limit=40'),
            fetchWithRetry('me/player/recently-played?limit=20'),
            fetchWithRetry('browse/new-releases?limit=16'),
            fetchWithRetry('me/playlists?limit=50'),
            fetchWithRetry('me/tracks?limit=50'),
          ]);

          setSpotifyData({
            recommendedTracks: topTracks?.items || [],
            newReleases: newReleases?.albums?.items || [],
            recentlyPlayed: recentTracks?.items?.map(item => item.track) || [],
            trendingPlaylists: featuredPlaylists?.playlists?.items || [],
            userProfile: profile,
            playlists: profile.playlists,
            likedTracks: profile.tracks,
          });
        } catch (error) {
          console.error('Error fetching Spotify data:', error);
          setSpotifyError(error.message);
        } finally {
          setLoadingSpotify(false);
        }
      }
    };

    fetchData();
  }, [isLoggedIn()]);

  const handleTrackClick = (track) => {
    if (isLoggedIn()) {
      togglePlay(track);
      socket.emit('playSpotifyTrack', { trackId: track.id });
    } else {
      togglePlay(track);
      socket.emit('playTrack', { trackId: track._id || track.id });
    }
  };

  const handleShufflePlay = () => {
    if (isLoggedIn() && spotifyData.recommendedTracks.length > 0) {
      const randomTrack = spotifyData.recommendedTracks[
        Math.floor(Math.random() * spotifyData.recommendedTracks.length)
      ];
      handleTrackClick(randomTrack);
    }
  };

  const scrollSection = (section, dir) => {
    const el = scrollRef.current[section];
    if (el) {
      const scrollAmount = el.offsetWidth * 0.7;
      el.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    }
  };

  const renderSkeletonCard = (key) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
      <Paper elevation={0} className="bento-item-content-card-wrapper">
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 'var(--border-radius-md)', mb: 1 }} />
        <Skeleton height={20} width="80%" sx={{ mb: 0.5 }} />
        <Skeleton height={20} width="60%" />
      </Paper>
    </Grid>
  );

  const renderTrackCard = (track, cardClassName = '', isAlbum = false) => {
    if (!track) {
      return (
        <Card className={`content-card ${cardClassName}`} elevation={0}>
          <Box sx={{ position: 'relative' }}>
            <Skeleton variant="rectangular" width={160} height={160} />
          </Box>
          <CardContent className="card-content-details">
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
          </CardContent>
        </Card>
      );
    }
    // Album or track
    const coverImage = isAlbum
      ? track.images?.[0]?.url || '/default-album-cover.jpg'
      : (track.album?.images?.[0]?.url || track.coverImage || '/default-album-cover.jpg');
    const title = isAlbum ? track.name : (track.name || track.title);
    const artist = isAlbum
      ? (track.artists && track.artists.map(a => a.name).join(', ')) || 'Unknown Artist'
      : (track.artists ? track.artists.map(a => a.name).join(', ') : (track.artist?.name || 'Unknown Artist'));
    const duration = isAlbum ? null : (track.duration_ms ? formatDuration(track.duration_ms) : track.duration);
    const isCurrentYtTrack = ytPlayingId === track.id;
    const isHovered = hoveredCard === track.id;

    return (
      <Grow in={true} timeout={500}>
        <Card
          className={`content-card ${cardClassName} ${isCurrentYtTrack ? 'playing' : ''}`}
          elevation={isHovered || isCurrentYtTrack ? 8 : 2}
          sx={{
            background: 'rgba(30,30,30,0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            boxShadow: isCurrentYtTrack 
              ? '0 8px 32px 0 rgba(30,215,96,0.25)' 
              : isHovered 
                ? '0 8px 24px 0 rgba(0,0,0,0.3)' 
                : '0 4px 16px 0 rgba(0,0,0,0.15)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(.47,1.64,.41,.8)',
            position: 'relative',
            transform: isHovered ? 'translateY(-5px) scale(1.04)' : 'translateY(0) scale(1)',
            '&:hover': {
              boxShadow: '0 12px 32px 0 rgba(30,215,96,0.2)',
            },
          }}
          onMouseEnter={() => setHoveredCard(track.id)}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={async (e) => {
            e.stopPropagation();
            setInfoModalTrack({ ...track, isAlbum });
            setInfoModalOpen(true);
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', height: 0, paddingTop: '100%' }}>
            <CardMedia
              component="img"
              image={coverImage}
              alt={title}
              className="card-media-image"
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                filter: isCurrentYtTrack ? 'brightness(0.7)' : 'none',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
            {/* Modern play overlay */}
            <PlayButton 
              track={track} 
              onPlay={(videoId, trackId) => {
                setYtVideoId(videoId);
                setYtTrack({ title, artist, coverImage });
                setIsPlaying(true);
                setYtPlayingId(trackId);
              }} 
              isPlaying={isCurrentYtTrack} 
            />
            
            {/* Now playing indicator */}
            {isCurrentYtTrack && (
              <Box 
                className="now-playing-indicator"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'rgba(29, 185, 84, 0.9)',
                  borderRadius: '16px',
                  px: 1,
                  py: 0.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                <Equalizer sx={{ color: '#fff', fontSize: 16, mr: 0.5, animation: 'bounce 1s infinite' }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 'bold' }}>
                  Now Playing
                </Typography>
              </Box>
            )}
            
            {/* Like button */}
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 3,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: '#fff',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.7)',
                },
                transition: 'all 0.2s ease',
                opacity: isHovered ? 1 : 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Handle like functionality
              }}
            >
              <FavoriteBorder fontSize="small" />
            </IconButton>
          </Box>
          <CardContent className="card-content-details" sx={{ p: 2 }}>
            <Typography variant="h6" className="card-title" noWrap sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="body2" className="card-subtitle" noWrap sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {artist}
            </Typography>
            {duration && (
              <Typography variant="caption" display="block" className="card-subtitle" noWrap sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {duration}
              </Typography>
            )}
          </CardContent>
          {/* Add quick action buttons */}
          <Box sx={{ position: 'absolute', bottom: 8, right: 8, zIndex: 4, display: 'flex', gap: 1 }}>
            <Tooltip title="Add to Playlist">
              <IconButton size="small" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: '#1DB954' } }}>
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton size="small" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: '#1DB954' } }} onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); }}>
                <MoreHoriz fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Card>
      </Grow>
    );
  };

  // Section header with view all button
  const SectionHeader = ({ title, onViewAll }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h2" className="section-title">{title}</Typography>
      <Button 
        endIcon={<ArrowForward />} 
        sx={{ 
          color: 'rgba(255,255,255,0.7)',
          '&:hover': { color: '#fff' },
          transition: 'color 0.2s ease',
        }}
        onClick={onViewAll}
      >
        View All
      </Button>
    </Box>
  );

  return (
    <Box className="enhanced-home-content-area">
      {/* Top Bar with Profile  */}
      <Box className="top-bar">
        <Box className="sidebar-toggle">
          <IconButton onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Box>
        
        <Box className="profile-section">
          {loadingSpotify && <CircularProgress size={24} sx={{ mr: 2 }} />}
          
          <Button 
            className="profile-button"
            onClick={handleProfileMenuOpen}
            startIcon={
              spotifyData.userProfile?.images?.[0]?.url ? (
                <Avatar 
                  src={spotifyData.userProfile.images[0].url} 
                  alt={spotifyData.userProfile.display_name}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircleIcon />
              )
            }
          >
            {spotifyData.userProfile ? spotifyData.userProfile.display_name || 'User' : 'Profile'}
          </Button>
          
          <Menu
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={handleProfileMenuClose}
            PaperProps={{
              sx: { 
                backgroundColor: 'var(--card-background)',
                color: 'var(--text-color)',
                minWidth: 200,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }
            }}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <PersonOutline sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <Settings sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
            {isLoggedIn() ? (
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} /> Logout
              </MenuItem>
            ) : (
              <MenuItem>
                <SpotifyLogin isMenuItem />
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Header Section - Welcome & Quick Actions */}
      <Paper 
        elevation={0} 
        className="bento-item welcome-banner" 
        sx={{ 
          mb: 3, 
          p: 3, 
          background: 'linear-gradient(135deg, rgba(30,30,30,0.8) 0%, rgba(20,20,20,0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      > 
        <Box className="welcome-section">
          {spotifyError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              Spotify Error: {spotifyError}
              {spotifyError.includes('401') && (
                <span> - Try logging out and back in</span>
              )}
              {spotifyError.includes('404') && (
                <span> - Endpoint may have changed</span>
              )}
            </Typography>
          )}
          <Typography variant="h2" className="welcome-title" sx={{ fontWeight: 700 }}>
            {spotifyData.userProfile ? `Welcome, ${spotifyData.userProfile.display_name || 'User'}!` : 'Welcome Back!'}
          </Typography>
          <Typography variant="subtitle1" className="welcome-subtitle" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            {spotifyData.userProfile ? 'Your personalized music experience' : 'Discover new music and connect with friends.'}
          </Typography>
          <Box className="welcome-buttons" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<ShuffleIcon />}
              className="shuffle-button"
              onClick={handleShufflePlay}
              sx={{ 
                bgcolor: '#1DB954', 
                '&:hover': { bgcolor: '#1ed760' },
                borderRadius: '24px',
                px: 3,
                py: 1,
                boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(29, 185, 84, 0.4)',
                },
              }}
            >
              Shuffle Play
            </Button>
            <Button
              variant="outlined"
              startIcon={<QueueMusicIcon />}
              className="party-button"
              sx={{ 
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff',
                borderRadius: '24px',
                px: 3,
                py: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Start Listening Party
            </Button>
            {!isLoggedIn() && <SpotifyLogin />}
          </Box>
        </Box>
      </Paper>

      {/* Filter Section with collapsible feature */}
      <Paper 
        elevation={0} 
        className="bento-item filter-section" 
        sx={{ 
          mb: 3, 
          p: 2.5,
          background: 'rgba(30,30,30,0.7)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h2" className="section-title">Filters</Typography>
          <IconButton onClick={() => setExpandFilters(!expandFilters)}>
            {expandFilters ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={expandFilters}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }} className="filter-button-group">
            {['All', 'Pop', 'Rock', 'Hip Hop', 'Electronic'].map(genre => (
              <Chip 
                key={genre} 
                label={genre}
                onClick={() => setSelectedGenre(genre.toLowerCase())} 
                color={selectedGenre === genre.toLowerCase() ? 'primary' : 'default'}
                sx={{ 
                  bgcolor: selectedGenre === genre.toLowerCase() ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: selectedGenre === genre.toLowerCase() ? '#1DB954' : '#fff',
                  '&:hover': {
                    bgcolor: selectedGenre === genre.toLowerCase() ? 'rgba(29, 185, 84, 0.3)' : 'rgba(255,255,255,0.15)',
                  },
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }} className="filter-button-group">
            {['Any Mood', 'Happy', 'Sad', 'Energetic', 'Chill'].map(mood => (
              <Chip 
                key={mood} 
                label={mood}
                onClick={() => setSelectedMood(mood.toLowerCase().replace(' ', ''))} 
                color={selectedMood === mood.toLowerCase().replace(' ', '') ? 'primary' : 'default'}
                sx={{ 
                  bgcolor: selectedMood === mood.toLowerCase().replace(' ', '') ? 'rgba(29, 185, 84, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: selectedMood === mood.toLowerCase().replace(' ', '') ? '#1DB954' : '#fff',
                  '&:hover': {
                    bgcolor: selectedMood === mood.toLowerCase().replace(' ', '') ? 'rgba(29, 185, 84, 0.3)' : 'rgba(255,255,255,0.15)',
                  },
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Box>
        </Collapse>
      </Paper>

      {/* After the filter section, add the following JSX: */}
      <Box sx={{ mb: 6 }}>
        {/* Jump back in */}
        <Fade in={true} timeout={700}>
          <Box sx={{ mb: 5, p: 3, borderRadius: 4, background: 'linear-gradient(90deg, #232526 0%, #414345 100%)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>Jump back in</Typography>
            <Box sx={{ display: 'flex', overflowX: 'auto', gap: 3 }}>
              {Array.isArray(spotifyData.recentlyPlayed) && spotifyData.recentlyPlayed.length > 0 ? (
                spotifyData.recentlyPlayed.slice(0, 12).map(track => (
                  <Box key={track.id} sx={{ minWidth: 180 }}>
                    {renderTrackCard(track)}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No songs found.</Typography>
              )}
            </Box>
          </Box>
        </Fade>
        {/* Made for {username} */}
        <Fade in={true} timeout={800}>
          <Box sx={{ mb: 5, p: 3, borderRadius: 4, background: 'rgba(30,30,30,0.7)', backdropFilter: 'blur(10px)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>Made for {spotifyData.userProfile?.display_name || 'You'}</Typography>
            <Box sx={{ display: 'flex', overflowX: 'auto', gap: 3 }}>
              {(spotifyData.recommendedTracks.slice(0, 12) || []).map(track => (
                <Box key={track.id} sx={{ minWidth: 180 }}>
                  {renderTrackCard(track)}
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
        {/* Recommended Stations */}
        <Fade in={true} timeout={900}>
          <Box sx={{ mb: 5, p: 3, borderRadius: 4, background: 'rgba(30,30,30,0.7)', backdropFilter: 'blur(10px)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>Recommended Stations</Typography>
            <Box sx={{ display: 'flex', overflowX: 'auto', gap: 3 }}>
              {(spotifyData.recommendedTracks.slice(12, 35) || []).map(track => (
                <Box key={track.id} sx={{ minWidth: 180 }}>
                  {renderTrackCard(track)}
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
        {/* India's Best */}
        <Fade in={true} timeout={1000}>
          <Box sx={{ mb: 5, p: 3, borderRadius: 4, background: 'rgba(30,30,30,0.7)', backdropFilter: 'blur(10px)' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>India's Best</Typography>
            <Box sx={{ display: 'flex', overflowX: 'auto', gap: 3 }}>
              {(spotifyData.newReleases.slice(0, 8) || []).map(album => (
                <Box key={album.id} sx={{ minWidth: 180 }}>
                  {renderTrackCard(album, '', true)}
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>
      </Box>

      {/* Content Bento Grid */}
      <Box className="bento-grid">
        {/* Recommended Tracks */}
        <Paper 
          elevation={0} 
          className="bento-item bento-item-large recommended-tracks" 
          sx={{ 
            gridColumn: { xs: 'span 1', md: 'span 2' },
            background: 'rgba(30,30,30,0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            p: 3,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        > 
          <SectionHeader title="Recommended for You" onViewAll={() => {}} />
          <Box sx={{ position: 'relative' }}>
            <IconButton onClick={() => scrollSection('recommended', -1)}>
              <ChevronLeft />
            </IconButton>
            <Box ref={el => scrollRef.current['recommended'] = el} style={{ overflowX: 'auto', display: 'flex', gap: 2 }}>
              {loadingSpotify ? (
                Array.from({ length: 4 }).map((_, index) => renderSkeletonCard(`rec-skl-${index}`))
              ) : (
                (isLoggedIn() && spotifyData.recommendedTracks.length > 0 
                  ? spotifyData.recommendedTracks 
                  : []
                ).map((track) => (
                  <Box key={track.id} sx={{ minWidth: 200, mr: 2 }}>
                    {renderTrackCard(track)}
                  </Box>
                ))
              )}
            </Box>
            <IconButton onClick={() => scrollSection('recommended', 1)}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Paper>

        {/* Recently Played */}
        <Paper 
          elevation={0} 
          className="bento-item recently-played"
          sx={{ 
            background: 'rgba(30,30,30,0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            p: 3,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <SectionHeader title="Recently Played" onViewAll={() => {}} />
          <Box sx={{ position: 'relative' }}>
            <IconButton onClick={() => scrollSection('recently-played', -1)}>
              <ChevronLeft />
            </IconButton>
            <Box ref={el => scrollRef.current['recently-played'] = el} className="horizontal-scroll-container" sx={{ overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 4 } }}>
              {loadingSpotify ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Box key={`rp-skl-${index}`} className="horizontal-scroll-item" sx={{ minWidth: 200, mr: 2 }}>
                    {renderSkeletonCard(`rp-skl-${index}`)}
                  </Box>
                ))
              ) : (
                (isLoggedIn() && spotifyData.recentlyPlayed.length > 0 
                  ? spotifyData.recentlyPlayed 
                  : []
                ).map((track) => (
                  <Box key={track.id} className="horizontal-scroll-item" sx={{ minWidth: 200, mr: 2 }}>
                    {renderTrackCard(track, 'horizontal-scroll-item')}
                  </Box>
                ))
              )}
            </Box>
            <IconButton onClick={() => scrollSection('recently-played', 1)}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Paper>

        {/* New Releases */}
        <Paper 
          elevation={0} 
          className="bento-item new-releases"
          sx={{ 
            background: 'rgba(30,30,30,0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            p: 3,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <SectionHeader title="New Releases" onViewAll={() => {}} />
          <Box sx={{ position: 'relative' }}>
            <IconButton onClick={() => scrollSection('new-releases', -1)}>
              <ChevronLeft />
            </IconButton>
            <Box ref={el => scrollRef.current['new-releases'] = el} style={{ overflowX: 'auto', display: 'flex', gap: 2 }}>
              {loadingSpotify ? (
                Array.from({ length: 4 }).map((_, index) => renderSkeletonCard(`nr-skl-${index}`))
              ) : (
                (isLoggedIn() && spotifyData.newReleases.length > 0 
                  ? spotifyData.newReleases 
                  : []
                ).map((album) => (
                  <Box key={album.id} sx={{ minWidth: 200, mr: 2 }}>
                    {renderTrackCard(album, '', true)}
                  </Box>
                ))
              )}
            </Box>
            <IconButton onClick={() => scrollSection('new-releases', 1)}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Paper>
      </Box>
      <Dialog open={infoModalOpen} onClose={() => setInfoModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{infoModalTrack?.name || infoModalTrack?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1">{infoModalTrack?.artist || (infoModalTrack?.artists && infoModalTrack.artists.map(a => a.name).join(', '))}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedHome;