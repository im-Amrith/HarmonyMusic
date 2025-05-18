import React, { useState, useEffect, useMemo, useRef, useContext, useCallback } from 'react';
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
  Slider,
  Chip,
  Badge,
  Snackbar,
  Alert,
  useMediaQuery,
  Backdrop,
  LinearProgress,
  SwipeableDrawer,
  Switch,
  FormControlLabel,
  List,
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListSubheader,
  ListItemButton
} from '@mui/material';
import { styled, alpha, useTheme } from '@mui/material/styles';
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
  Favorite,
  FavoriteBorder,
  Share,
  SkipNext,
  SkipPrevious,
  VolumeUp,
  Search,
  Repeat,
  RepeatOne,
  Explore,
  Notifications,
  MusicNote,
  Headphones,
  Equalizer,
  CastConnected,
  HistoryToggleOff,
  Add,
  MoreVert,
  Refresh,
  Home,
  LibraryMusic,
  Radio
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import SpotifyLogin from '../components/SpotifyLogin';
import './EnhancedHomes.css';
import { getToken, isLoggedIn, logout } from '../services/spotifyAuth';
import ReactPlayer from 'react-player';
import { YTMusicPlayerContext } from '../context/YTMusicPlayerContext';
import { useSpring, animated } from 'react-spring';
import Lottie from 'react-lottie';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow } from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';



// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

// Motion variants for animations
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const hoverScale = {
  scale: 1.05,
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
  transition: { duration: 0.3 }
};

// Styled components
const GlassCard = styled(Card)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0 15px 45px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-5px)',
  }
}));

const GradientTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(90deg, #1DB954 0%, #1ED760 100%)',
  backgroundClip: 'text',
  textFillColor: 'transparent',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
}));

const PulsatingPlayButton = styled(IconButton)(({ theme, isplaying }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.9),
  },
  animation: isplaying === 'true' ? 'pulse 2s infinite' : 'none',
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(29, 185, 84, 0.7)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(29, 185, 84, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(29, 185, 84, 0)',
    },
  },
}));

const BouncingLikeButton = styled(IconButton)(({ theme, liked }) => ({
  transition: 'transform 0.3s ease',
  ...(liked === 'true' && {
    animation: 'bounce 0.3s ease',
    color: '#FF3366',
  }),
  '@keyframes bounce': {
    '0%, 100%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(1.3)',
    },
  },
}));

const ScrollingMarquee = styled(Box)(({ theme }) => ({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  '& .content': {
    display: 'inline-block',
    animation: 'marquee 15s linear infinite',
    paddingRight: '50px',
  },
  '@keyframes marquee': {
    '0%': {
      transform: 'translateX(0)',
    },
    '100%': {
      transform: 'translateX(-100%)',
    },
  },
}));

// Custom hook for animations
const useTrackHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  
  const springProps = useSpring({
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isHovered 
      ? '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)' 
      : '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    config: { tension: 300, friction: 20 }
  });
  
  const bind = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
  
  return [springProps, bind];
};

// Audio visualizer component
const AudioVisualizer = ({ isPlaying }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      
      const barCount = 30;
      const barWidth = width / barCount - 2;
      
      for (let i = 0; i < barCount; i++) {
        const barHeight = Math.random() * (height - 20) + 20;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#1DB954');
        gradient.addColorStop(1, '#1ED760');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(i * (barWidth + 2), height - barHeight, barWidth, barHeight);
      }
      
      animationRef.current = requestAnimationFrame(renderFrame);
    };
    
    renderFrame();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);
  
  if (!isPlaying) return null;
  
  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={50} 
      style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 0.7,
        pointerEvents: 'none'
      }} 
    />
  );
};

// Loading animation
const loadingAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: {
    // Simple loading animation data
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 60,
    w: 400,
    h: 400,
    nm: "Loading Animation",
    ddd: 0,
    assets: [],
    layers: [{
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100, ix: 11 },
        r: { 
          a: 1, 
          k: [
            { i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] },
            { t: 60, s: [360] }
          ], 
          ix: 10 
        },
        p: { a: 0, k: [200, 200, 0], ix: 2, l: 2 },
        a: { a: 0, k: [0, 0, 0], ix: 1, l: 2 },
        s: { a: 0, k: [100, 100, 100], ix: 6, l: 2 }
      },
      ao: 0,
      shapes: [{
        ty: "gr",
        it: [
          {
            d: 1,
            ty: "el",
            s: { a: 0, k: [150, 150], ix: 2 },
            p: { a: 0, k: [0, 0], ix: 3 },
            nm: "Ellipse Path 1",
            mn: "ADBE Vector Shape - Ellipse",
            hd: false
          },
          {
            ty: "st",
            c: { a: 0, k: [0.12, 0.85, 0.33, 1], ix: 3 },
            o: { a: 0, k: 100, ix: 4 },
            w: { a: 0, k: 15, ix: 5 },
            lc: 2,
            lj: 1,
            ml: 4,
            bm: 0,
            d: [
              { n: "d", nm: "dash", v: { a: 0, k: 200, ix: 1 } },
              { n: "g", nm: "gap", v: { a: 0, k: 200, ix: 2 } }
            ],
            nm: "Stroke 1",
            mn: "ADBE Vector Graphic - Stroke",
            hd: false
          },
          {
            ty: "tr",
            p: { a: 0, k: [0, 0], ix: 2 },
            a: { a: 0, k: [0, 0], ix: 1 },
            s: { a: 0, k: [100, 100], ix: 3 },
            r: { a: 0, k: 0, ix: 6 },
            o: { a: 0, k: 100, ix: 7 },
            sk: { a: 0, k: 0, ix: 4 },
            sa: { a: 0, k: 0, ix: 5 },
            nm: "Transform"
          }
        ],
        nm: "Ellipse 1",
        np: 2,
        cix: 2,
        bm: 0,
        ix: 1,
        mn: "ADBE Vector Group",
        hd: false
      }],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }]
  },
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice"
  }
};

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

// Player hook - enhanced with more features
const usePlayer = (setSpotifyError) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const togglePlay = (track) => {
    // Initialize audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Add event listeners
      audioRef.current.addEventListener('ended', handleTrackEnd);
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration * 1000);
      });
    }

    if (currentTrack && track && currentTrack.id === track.id) {
      // Toggle play/pause for current track
      if (isPlaying) {
        audioRef.current.pause();
        clearProgressInterval();
      } else {
        audioRef.current.play().catch(e => console.error('Playback failed:', e));
        startProgressInterval();
      }
      setIsPlaying(!isPlaying);
    } else if (track) {
      // Stop current track if playing
      if (currentTrack && isPlaying) {
        audioRef.current.pause();
        clearProgressInterval();
      }
      
      // Set new track source
      if (track.preview_url) {
        audioRef.current.src = track.preview_url;
        audioRef.current.volume = volume / 100;
        
        audioRef.current.play()
          .then(() => {
            setCurrentTrack(track);
            setIsPlaying(true);
            setProgress(0);
            startProgressInterval();
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
  
  const handleTrackEnd = () => {
    if (repeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error('Repeat playback failed:', e));
    } else {
      setIsPlaying(false);
      clearProgressInterval();
    }
  };
  
  const startProgressInterval = () => {
    clearProgressInterval();
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime * 1000);
      }
    }, 100);
  };
  
  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };
  
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };
  
  const handleProgressChange = (newProgress) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress / 1000;
      setProgress(newProgress);
    }
  };
  
  const toggleRepeat = () => {
    setRepeat(!repeat);
  };

  useEffect(() => {
    // Clean up audio on unmount
    return () => {
      clearProgressInterval();
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  return { 
    currentTrack, 
    isPlaying, 
    volume,
    progress,
    duration,
    repeat,
    togglePlay,
    handleVolumeChange,
    handleProgressChange,
    toggleRepeat
  };
};

// Socket hook (enhanced with reconnection)
const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  
  // Simulated socket with reconnection logic
  const socket = useMemo(() => ({
    emit: (event, data) => {
      console.log(`Socket event from Home page: ${event}`, data);
      setIsConnected(true);
    },
    connect: () => {
      console.log('Socket connected');
      setIsConnected(true);
    },
    disconnect: () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    }
  }), []);
  
  useEffect(() => {
    // Simulate socket connection
    socket.connect();
    
    return () => {
      socket.disconnect();
    };
  }, [socket]);
  
  return { socket, isConnected };
};

// Enhanced PlayButton: full-card overlay, centered, always clickable, with animation
function PlayButton({ track, onPlay, isPlaying, loading }) {
  const theme = useTheme();
  const [springProps, api] = useSpring(() => ({
    scale: 1,
    opacity: 0.8,
    config: { mass: 1, tension: 180, friction: 12 }
  }));
  
  const handleMouseEnter = useCallback(() => {
    api.start({
      scale: 1.2,
      opacity: 1
    });
  }, [api]);
  
  const handleMouseLeave = useCallback(() => {
    api.start({
      scale: 1,
      opacity: 0.8
    });
  }, [api]);
  
  const handlePlay = async (e) => {
    e.stopPropagation();
    const q = `${track.name || track.title} ${track.artists ? track.artists.map(a => a.name).join(' ') : (track.artist?.name || '')}`;
    console.log('PlayButton clicked, query:', q);
    onPlay(q, track.id);
  };

  return (
    <Box
      className={`play-overlay${isPlaying ? ' playing' : ''}`}
      onClick={handlePlay}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
        opacity: 0,
        transition: 'opacity 0.3s',
        cursor: 'pointer',
        zIndex: 2,
        '&:hover': { opacity: 1 },
      }}
    >
      <animated.div style={springProps}>
        {loading ? (
          <CircularProgress sx={{ color: '#fff' }} />
        ) : (
          <PlayArrowIcon sx={{ fontSize: 70, color: '#fff', filter: 'drop-shadow(0 0 10px rgba(29, 185, 84, 0.8))' }} />
        )}
      </animated.div>
    </Box>
  );
}

// Now Playing Mini Player component
const MiniPlayer = ({ track, isPlaying, onTogglePlay, onNext, onPrev, progress, duration }) => {
  if (!track) return null;
  
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '10px 20px',
        background: 'rgba(18, 18, 18, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}
    >
      <img 
        src={track.coverImage || track.album?.images[0]?.url || '/default-album-cover.jpg'} 
        alt={track.title || track.name}
        style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }}
      />
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Typography variant="body1" noWrap sx={{ color: '#fff', fontWeight: 600 }}>
          {track.title || track.name}
        </Typography>
        <Typography variant="body2" noWrap sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {track.artist?.name || (track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown')}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progressPercent} 
          sx={{ 
            mt: 1, 
            height: 4, 
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#1DB954',
            }
          }} 
        />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={onPrev} sx={{ color: '#fff' }}>
          <SkipPrevious />
        </IconButton>
        
        <IconButton 
          onClick={onTogglePlay} 
          sx={{ 
            color: '#fff', 
            bgcolor: 'rgba(29, 185, 84, 0.8)', 
            '&:hover': { bgcolor: '#1DB954' } 
          }}
        >
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        
        <IconButton onClick={onNext} sx={{ color: '#fff' }}>
          <SkipNext />
        </IconButton>
      </Box>
    </motion.div>
  );
};

const EnhancedHome = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { socket, isConnected } = useSocket();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedMood, setSelectedMood] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationCount, setNotificationCount] = useState(3);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [spotifyData, setSpotifyData] = useState({
    recommendedTracks: [],
    newReleases: [],
    recentlyPlayed: [],
    trendingPlaylists: [],
    radioStations: [],
    userProfile: null,
    playlists: [],
    likedTracks: []
  });
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [spotifyError, setSpotifyError] = useState(null);
  const [expandFilters, setExpandFilters] = useState(!isMobile);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [audioLoading, setAudioLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [activeSection, setActiveSection] = useState('home');
  const [showIntroAnimation, setShowIntroAnimation] = useState(true);
  const [trackHistory, setTrackHistory] = useState([]);
  const [recommendationsReady, setRecommendationsReady] = useState(false);
  
  const { 
    ytVideoId, 
    setYtVideoId, 
    setYtTrack, 
    isPlaying: ytIsPlaying, 
    setIsPlaying: setYtIsPlaying, 
    ytPlayingId, 
    setYtPlayingId,
    ytTrack
  } = useContext(YTMusicPlayerContext);
  
  const { 
    currentTrack, 
    isPlaying, 
    volume,
    progress,
    duration,
    repeat,
    togglePlay,
    handleVolumeChange,
    handleProgressChange,
    toggleRepeat
  } = usePlayer(setSpotifyError);

  // New featured genres with animation state
  const featuredGenres = [
    { id: 'pop', name: 'Pop', color: '#FF4081', icon: '🎵' },
    { id: 'rock', name: 'Rock', color: '#651FFF', icon: '🤘' },
    { id: 'hiphop', name: 'Hip Hop', color: '#FF9100', icon: '🎤' },
    { id: 'electronic', name: 'Electronic', color: '#00BFA5', icon: '🎛️' },
    { id: 'jazz', name: 'Jazz', color: '#2962FF', icon: '🎷' },
    { id: 'indie', name: 'Indie', color: '#FF6D00', icon: '🎸' },
    { id: 'classical', name: 'Classical', color: '#C51162', icon: '🎻' },
    { id: 'rnb', name: 'R&B', color: '#304FFE', icon: '🎹' }
  ];
  
  const moods = [
    { id: 'happy', name: 'Happy', color: '#FFEB3B', icon: '😊' },
    { id: 'energetic', name: 'Energetic', color: '#FF5722', icon: '⚡' },
    { id: 'chill', name: 'Chill', color: '#4FC3F7', icon: '😌' },
    { id: 'focus', name: 'Focus', color: '#7C4DFF', icon: '🧠' },
    { id: 'sad', name: 'Sad', color: '#78909C', icon: '😢' },
    { id: 'romantic', name: 'Romantic', color: '#EC407A', icon: '💖' }
  ];

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
      radioStations: [],
      userProfile: null,
      playlists: [],
      likedTracks: []
    });
    showSnackbar('Successfully logged out');
    handleProfileMenuClose();
  };
  
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    showSnackbar(`Switched to ${!isDarkMode ? 'dark' : 'light'} mode`);
    // In a real app, you would update your theme context or CSS variables here
    // In a real app, you would update your theme context or CSS variables here
  };

  // Handle search related functions
  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Debounced search would be implemented here in a real app
    if (e.target.value.length > 2) {
      performSearch(e.target.value);
    } else {
      setSearchResults([]);
    }
  };

  const performSearch = async (query) => {
    if (!isLoggedIn()) return;
    
    try {
      const token = getToken();
      const data = await fetchSpotifyData(`search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist&limit=5`, token);
      
      if (data) {
        setSearchResults({
          tracks: data.tracks?.items || [],
          artists: data.artists?.items || [],
          albums: data.albums?.items || [],
          playlists: data.playlists?.items || []
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setSpotifyError('Failed to perform search');
    }
  };

  // Snackbar notification handling
  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Play track handling with YouTube fallback
  const handlePlayTrack = async (track) => {
    if (!track) return;
    
    // If the track has a preview_url, play with Spotify
    if (track.preview_url) {
      togglePlay(track);
      addToHistory(track);
      return;
    }
    
    // Otherwise, search and play with YouTube
    try {
      setAudioLoading(true);
      
      // Construct search query from track information
      const query = `${track.name || track.title} ${track.artists ? track.artists.map(a => a.name).join(' ') : (track.artist?.name || '')}`;
      
      // Simulate YouTube search and playback
      console.log(`Searching YouTube for: ${query}`);
      
      // In a real implementation, you would call your YouTube API service here
      // For now, we'll simulate a successful search with a delay
      setTimeout(() => {
        // Mock video ID - in a real app, this would come from the YouTube API
        const mockVideoId = `youtube-${track.id}-${Date.now()}`;
        
        // Set the YouTube track and video ID in context
        setYtTrack({
          id: track.id,
          title: track.name || track.title,
          artists: track.artists || [{ name: track.artist?.name || 'Unknown Artist' }],
          coverImage: track.album?.images[0]?.url || '/default-album-cover.jpg'
        });
        setYtVideoId(mockVideoId);
        setYtPlayingId(track.id);
        setYtIsPlaying(true);
        
        addToHistory(track);
        showSnackbar(`Now playing ${track.name || track.title}`);
        setAudioLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('YouTube playback error:', error);
      setAudioLoading(false);
      showSnackbar('Failed to play track');
    }
  };
  
  // Track history management
  const addToHistory = (track) => {
    setTrackHistory(prev => {
      // Remove duplicates of this track
      const filtered = prev.filter(t => t.id !== track.id);
      // Add to beginning, limit to 20 tracks
      return [track, ...filtered].slice(0, 20);
    });
  };

  // Like/unlike track handling
  const handleToggleLike = (trackId) => {
    setLikedTracks(prevLiked => {
      const newLiked = new Set(prevLiked);
      if (newLiked.has(trackId)) {
        newLiked.delete(trackId);
        showSnackbar('Removed from your Liked Songs');
      } else {
        newLiked.add(trackId);
        showSnackbar('Added to your Liked Songs');
      }
      return newLiked;
    });
  };

  // Handle navigation between sections
  const handleSectionChange = (section) => {
    setActiveSection(section);
    
    // Simulate analytics event
    console.log(`Navigation: ${section}`);
    
    // For mobile, close sidebar after selection
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  // Fetch Spotify data on component mount or when user logs in
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn()) return;
      
      setLoadingSpotify(true);
      setSpotifyError(null);
      
      try {
        const token = getToken();
        
        // Fetch multiple endpoints in parallel
        const [
          recommendationsData,
          newReleasesData,
          recentlyPlayedData,
          featuredPlaylistsData,
          userProfileData,
          userPlaylistsData
        ] = await Promise.all([
          fetchSpotifyData('recommendations?seed_genres=pop,rock,hip-hop&limit=10', token),
          fetchSpotifyData('browse/new-releases?limit=8', token),
          fetchSpotifyData('me/player/recently-played?limit=10', token),
          fetchSpotifyData('browse/featured-playlists?limit=4', token),
          fetchSpotifyData('me', token),
          fetchSpotifyData('me/playlists?limit=10', token)
        ]);

        // Process and update state with the results
        setSpotifyData({
          recommendedTracks: recommendationsData?.tracks || [],
          newReleases: newReleasesData?.albums?.items || [],
          recentlyPlayed: recentlyPlayedData?.items?.map(item => item.track) || [],
          trendingPlaylists: featuredPlaylistsData?.playlists?.items || [],
          radioStations: generateMockRadioStations(), // Mock data for radio stations
          userProfile: userProfileData,
          playlists: userPlaylistsData?.items || [],
          likedTracks: [] // Would fetch from 'me/tracks' in a real implementation
        });
        
        setRecommendationsReady(true);
      } catch (error) {
        console.error('Failed to fetch Spotify data:', error);
        setSpotifyError('Failed to fetch data from Spotify');
      } finally {
        setLoadingSpotify(false);
        // Hide intro animation after data is loaded
        setTimeout(() => {
          setShowIntroAnimation(false);
        }, 1500);
      }
    };
    
    fetchData();
  }, []);

  // Mock radio stations for demo purposes
  const generateMockRadioStations = () => {
    return [
      {
        id: 'radio-1',
        name: 'Today\'s Top Hits Radio',
        description: 'The biggest hits right now',
        image: 'https://i.scdn.co/image/ab67706f000000036a43bf84617a7372f8d00c3f',
        color: '#1DB954'
      },
      {
        id: 'radio-2',
        name: '80s Classics Radio',
        description: 'The best hits from the 1980s',
        image: 'https://i.scdn.co/image/ab67706f00000003e8e28219724c2423afa4d320',
        color: '#FF4081'
      },
      {
        id: 'radio-3',
        name: 'Chill Lofi Beats',
        description: 'Relaxing beats for study and focus',
        image: 'https://i.scdn.co/image/ab67706f000000035ec8c003898b36c6f73dfac7',
        color: '#00BFA5'
      },
      {
        id: 'radio-4',
        name: 'Workout Motivation',
        description: 'High energy tracks to keep you moving',
        image: 'https://i.scdn.co/image/ab67706f00000003bd0a0731efb82f6cafad0a25',
        color: '#FF9100'
      }
    ];
  };

  // Effect for handling intro animation
  useEffect(() => {
    // Hide intro animation after 3 seconds
    const timer = setTimeout(() => {
      setShowIntroAnimation(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // Mini player navigation handlers
  const handleNextTrack = () => {
    // In a real implementation, this would get the next track from a queue
    // For now, we'll just show a notification
    showSnackbar('Next track feature coming soon');
  };

  const handlePrevTrack = () => {
    // Similar to next track, this would get the previous track
    showSnackbar('Previous track feature coming soon');
  };

  // Render loading/error states
  if (loadingSpotify && !spotifyData.recommendedTracks.length) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          bgcolor: isDarkMode ? '#121212' : '#f5f5f5'
        }}
      >
        <Lottie 
          options={loadingAnimationOptions} 
          height={200} 
          width={200} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            mt: 2, 
            color: isDarkMode ? '#fff' : '#121212',
            fontWeight: 600 
          }}
        >
          Loading your personalized music...
        </Typography>
      </Box>
    );
  }

  // Render intro animation if enabled
  if (showIntroAnimation) {
    return (
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#121212',
          zIndex: 9999
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Box sx={{ position: 'relative' }}>
            <MusicNote sx={{ 
              fontSize: 120, 
              color: '#1DB954',
              filter: 'drop-shadow(0 0 20px rgba(29, 185, 84, 0.8))'
            }} />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  position: 'absolute',
                  bottom: -60,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: '#fff',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                Enhanced Music
              </Typography>
            </motion.div>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // Main render
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        bgcolor: isDarkMode ? '#121212' : '#f5f5f5',
        color: isDarkMode ? '#fff' : '#121212',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease'
      }}
    >
      {/* Navigation Sidebar */}
      <SwipeableDrawer
        sx={{
          width: sidebarCollapsed ? 0 : 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: isDarkMode ? '#040404' : '#fff',
            color: isDarkMode ? '#fff' : '#121212',
            borderRight: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          },
        }}
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={!sidebarCollapsed}
        onClose={() => setSidebarCollapsed(true)}
        onOpen={() => setSidebarCollapsed(false)}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Headphones sx={{ color: '#1DB954', mr: 1 }} />
            <Typography variant="h6" fontWeight={700}>Enhanced Music</Typography>
          </Box>
          <IconButton onClick={() => setSidebarCollapsed(true)}>
            {theme.direction === 'ltr' ? <ChevronLeft /> : <ChevronRight />}
          </IconButton>
        </Box>

        {isLoggedIn() && spotifyData.userProfile ? (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={spotifyData.userProfile.images?.[0]?.url}
              alt={spotifyData.userProfile.display_name}
              sx={{ width: 40, height: 40, mr: 1.5 }}
            />
            <Box>
              <Typography variant="body1" fontWeight={600}>
                {spotifyData.userProfile.display_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Premium User
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <SpotifyLogin />
          </Box>
        )}

        <List>
          <ListItem button selected={activeSection === 'home'} onClick={() => handleSectionChange('home')}>
            <ListItemIcon>
              <Home sx={{ color: activeSection === 'home' ? '#1DB954' : 'inherit' }} />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          
          <ListItem button selected={activeSection === 'search'} onClick={() => { handleSectionChange('search'); handleSearchOpen(); }}>
            <ListItemIcon>
              <Search sx={{ color: activeSection === 'search' ? '#1DB954' : 'inherit' }} />
            </ListItemIcon>
            <ListItemText primary="Search" />
          </ListItem>
          
          <ListItem button selected={activeSection === 'library'} onClick={() => handleSectionChange('library')}>
            <ListItemIcon>
              <LibraryMusic sx={{ color: activeSection === 'library' ? '#1DB954' : 'inherit' }} />
            </ListItemIcon>
            <ListItemText primary="Your Library" />
          </ListItem>
          
          <ListItem button selected={activeSection === 'radio'} onClick={() => handleSectionChange('radio')}>
            <ListItemIcon>
              <Radio sx={{ color: activeSection === 'radio' ? '#1DB954' : 'inherit' }} />
            </ListItemIcon>
            <ListItemText primary="Radio" />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }} />
        
        <List subheader={
          <ListSubheader 
            component="div" 
            sx={{ 
              bgcolor: 'transparent', 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              fontWeight: 600
            }}
          >
            YOUR PLAYLISTS
          </ListSubheader>
        }>
          {isLoggedIn() && spotifyData.playlists.length > 0 ? (
            spotifyData.playlists.map((playlist) => (
              <ListItem button key={playlist.id}>
                <ListItemIcon>
                  <QueueMusic sx={{ color: '#1DB954' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={playlist.name} 
                  primaryTypographyProps={{ noWrap: true }} 
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText 
                primary="No playlists found" 
                sx={{ color: 'text.secondary', fontStyle: 'italic' }} 
              />
            </ListItem>
          )}
        </List>
      </SwipeableDrawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 3 },
          transition: 'margin 0.3s ease',
          ml: { sm: sidebarCollapsed ? 0 : '240px' },
          mt: '64px' // Adjust for header
        }}
      >
        {/* Header Bar */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: isDarkMode ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            color: isDarkMode ? '#fff' : '#121212',
            boxShadow: 'none',
            borderBottom: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              sx={{ mr: 2, display: { sm: sidebarCollapsed ? 'block' : 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              {activeSection === 'home' && (
                <GradientTypography variant="h6" component="div">
                  Home
                </GradientTypography>
              )}
              {activeSection === 'search' && (
                <GradientTypography variant="h6" component="div">
                  Search
                </GradientTypography>
              )}
              {activeSection === 'library' && (
                <GradientTypography variant="h6" component="div">
                  Your Library
                </GradientTypography>
              )}
              {activeSection === 'radio' && (
                <GradientTypography variant="h6" component="div">
                  Radio
                </GradientTypography>
              )}
            </Box>
            
            <Box sx={{ display: 'flex' }}>
              <Tooltip title="Search">
                <IconButton color="inherit" onClick={handleSearchOpen}>
                  <Search />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Notifications">
                <IconButton color="inherit">
                  <Badge badgeContent={notificationCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton color="inherit" onClick={handleThemeToggle}>
                  {isDarkMode ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>
              
              <IconButton
                onClick={handleProfileMenuOpen}
                color="inherit"
                edge="end"
              >
                {isLoggedIn() && spotifyData.userProfile?.images?.[0]?.url ? (
                  <Avatar 
                    src={spotifyData.userProfile.images[0].url} 
                    alt={spotifyData.userProfile.display_name}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircleIcon />
                )}
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={handleProfileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              bgcolor: isDarkMode ? '#282828' : '#fff',
              color: isDarkMode ? '#fff' : '#121212',
              mt: 1,
              borderRadius: 2
            }
          }}
        >
          {isLoggedIn() ? (
            <>
              <MenuItem onClick={handleProfileMenuClose}>
                <ListItemIcon>
                  <Person sx={{ color: isDarkMode ? '#fff' : '#121212' }} />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose}>
                <ListItemIcon>
                  <Settings sx={{ color: isDarkMode ? '#fff' : '#121212' }} />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToApp sx={{ color: isDarkMode ? '#fff' : '#121212' }} />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </>
          ) : (
            <MenuItem>
              <SpotifyLogin />
            </MenuItem>
          )}
        </Menu>

        {/* Search Drawer */}
        <Drawer
          anchor="top"
          open={searchOpen}
          onClose={handleSearchClose}
          PaperProps={{
            sx: {
              mt: '64px',
              p: 2,
              bgcolor: isDarkMode ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 3,
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: 2,
              px: 2,
              py: 1
            }}>
              <Search sx={{ mr: 1, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }} />
              <InputBase
                placeholder="Search for songs, artists, albums..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
                fullWidth
                sx={{ 
                  color: isDarkMode ? '#fff' : '#121212',
                  '& input::placeholder': {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    opacity: 1
                  }
                }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <Clear sx={{ fontSize: 20, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }} />
                </IconButton>
              )}
            </Box>
            
            {searchQuery.length > 2 && searchResults && (
              <Box>
                {/* Tracks */}
                {searchResults.tracks?.length > 0 && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Songs
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {searchResults.tracks.slice(0, 4).map(track => (
                        <Grid item xs={12} sm={6} key={track.id}>
                          <motion.div whileHover={{ y: -5 }}>
                            <GlassCard 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                height: 80
                              }}
                              onClick={() => handlePlayTrack(track)}
                            >
                              <CardMedia
                                component="img"
                                sx={{ width: 80, height: 80 }}
                                image={track.album.images[0]?.url || '/default-album-cover.jpg'}
                                alt={track.name}
                              />
                              <Box sx={{ display: 'flex', flexDirection: 'column', pl: 2, flex: 1, overflow: 'hidden' }}>
                                <Typography noWrap variant="subtitle1" component="div" fontWeight={600}>
                                  {track.name}
                                </Typography>
                                <Typography noWrap variant="body2" color="text.secondary">
                                  {track.artists.map(a => a.name).join(', ')}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', pr: 1 }}>
                                <IconButton onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleLike(track.id);
                                }}>
                                  {likedTracks.has(track.id) ? (
                                    <Favorite sx={{ color: '#FF3366' }} />
                                  ) : (
                                    <FavoriteBorder />
                                  )}
                                </IconButton>
                              </Box>
                            </GlassCard>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
                
                {/* Artists */}
                {searchResults.artists?.length > 0 && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Artists
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {searchResults.artists.slice(0, 4).map(artist => (
                        <Grid item xs={6} sm={3} key={artist.id}>
                          <motion.div whileHover={{ y: -5 }}>
                            <GlassCard 
                              sx={{ 
                                textAlign: 'center', 
                                p: 2, 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center' 
                              }}
                            >
                              <Avatar 
                                src={artist.images?.[0]?.url} 
                                alt={artist.name}
                                sx={{ 
                                  width: 90, 
                                  height: 90, 
                                  mb: 2,
                                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
                                }} 
                              />
                              <Typography noWrap variant="subtitle1" component="div" fontWeight={600}>
                                {artist.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Artist
                              </Typography>
                            </GlassCard>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Box>
            )}
            
            {searchQuery.length > 2 && (!searchResults || 
              ((!searchResults.tracks || searchResults.tracks.length === 0) && 
               (!searchResults.artists || searchResults.artists.length === 0))) && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">No results found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try different keywords or check your spelling
                </Typography>
              </Box>
            )}
            
            {searchQuery.length <= 2 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1">
                  Type at least 3 characters to search
                </Typography>
              </Box>
            )}
          </Box>
        </Drawer>

        {/* Main Content Sections */}
        <AnimatePresence mode="wait">
          {activeSection === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Genre/Mood Filters */}
<Paper 
  elevation={0} 
  sx={{ 
    mb: 4, 
    p: 2, 
    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 2,
    backdropFilter: 'blur(10px)',
    border: '1px solid',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }}
>
  <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, overflowX: 'auto', pb: 1 }}>
    {['All', 'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Folk', 'Country', 'Latin'].map((genre, index) => (
      <Chip
        key={genre}
        label={genre}
        clickable
        variant={activeGenre === genre ? 'filled' : 'outlined'}
        color={activeGenre === genre ? 'primary' : 'default'}
        onClick={() => setActiveGenre(genre)}
        sx={{
          borderRadius: 8,
          px: 1,
          fontWeight: activeGenre === genre ? 600 : 400,
          background: activeGenre === genre ? 
            'linear-gradient(45deg, #1DB954, #1ED760)' : 
            isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            background: activeGenre === genre ? 
              'linear-gradient(45deg, #1DB954, #1ED760)' : 
              isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }
        }}
      />
    ))}
  </Box>

  <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 1, overflowX: 'auto', pt: 1 }}>
    {['Happy', 'Chill', 'Focus', 'Workout', 'Party', 'Relaxing', 'Energetic', 'Sad', 'Romantic'].map((mood) => (
      <Chip
        key={mood}
        label={mood}
        clickable
        variant={activeMood === mood ? 'filled' : 'outlined'}
        color={activeMood === mood ? 'secondary' : 'default'}
        onClick={() => setActiveMood(mood)}
        sx={{
          borderRadius: 8,
          px: 1,
          fontWeight: activeMood === mood ? 600 : 400,
          background: activeMood === mood ? 
            'linear-gradient(45deg, #FF6B6B, #FF8E8E)' : 
            isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            background: activeMood === mood ? 
              'linear-gradient(45deg, #FF6B6B, #FF8E8E)' : 
              isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }
        }}
      />
    ))}
  </Box>
</Paper>

{/* Featured Content Carousel */}
<Box sx={{ mb: 6, position: 'relative' }}>
  <Swiper
    spaceBetween={20}
    slidesPerView={1}
    autoplay={{
      delay: 5000,
      disableOnInteraction: false,
    }}
    pagination={{
      clickable: true,
      renderBullet: function (index, className) {
        return `<span class="${className}" style="background: ${isDarkMode ? '#fff' : '#000'}; opacity: 0.7;"></span>`;
      },
    }}
    modules={[Autoplay, Pagination]}
    style={{ borderRadius: 16, overflow: 'hidden' }}
  >
    {/* Featured Content Slides */}
    <SwiperSlide>
      <Paper
        sx={{
          position: 'relative',
          height: { xs: 280, sm: 340, md: 380 },
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #1DB954, #191414)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1,
          }}
        />
        <CardMedia
          component="img"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.7)',
          }}
          image="https://i.scdn.co/image/ab67706f00000003e8e28219724c2423afa4d320"
          alt="New Albums"
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            p: { xs: 3, md: 4 },
            zIndex: 2,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: '#1DB954',
              fontWeight: 600,
              letterSpacing: 1,
              mb: 1,
              display: 'block',
            }}
          >
            FEATURED PLAYLIST
          </Typography>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              color: '#fff',
              fontWeight: 800,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              mb: 1,
            }}
          >
            80s Classics Collection
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 2,
              maxWidth: 600,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Rediscover the iconic hits that defined a generation with our curated collection of 80s classics.
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#1DB954',
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#0DA943',
              },
              borderRadius: 6,
              px: 3,
              py: 1,
            }}
            startIcon={<PlayArrow />}
          >
            Listen Now
          </Button>
        </Box>
      </Paper>
    </SwiperSlide>

    <SwiperSlide>
      <Paper
        sx={{
          position: 'relative',
          height: { xs: 280, sm: 340, md: 380 },
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FF6B6B, #833AB4)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1,
          }}
        />
        <CardMedia
          component="img"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.7)',
          }}
          image="https://i.scdn.co/image/ab67706f000000036a43bf84617a7372f8d00c3f"
          alt="Today's Top Hits"
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            p: { xs: 3, md: 4 },
            zIndex: 2,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: '#FF6B6B',
              fontWeight: 600,
              letterSpacing: 1,
              mb: 1,
              display: 'block',
            }}
          >
            NEW RELEASE
          </Typography>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              color: '#fff',
              fontWeight: 800,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              mb: 1,
            }}
          >
            Today's Top Hits
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 2,
              maxWidth: 600,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Stay updated with the biggest hits dominating the charts right now. Updated weekly with fresh tracks.
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#FF6B6B',
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#F05A5A',
              },
              borderRadius: 6,
              px: 3,
              py: 1,
            }}
            startIcon={<PlayArrow />}
          >
            Listen Now
          </Button>
        </Box>
      </Paper>
    </SwiperSlide>

    <SwiperSlide>
      <Paper
        sx={{
          position: 'relative',
          height: { xs: 280, sm: 340, md: 380 },
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #00BFA5, #2962FF)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1,
          }}
        />
        <CardMedia
          component="img"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.7)',
          }}
          image="https://i.scdn.co/image/ab67706f000000035ec8c003898b36c6f73dfac7"
          alt="Lofi Beats"
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            p: { xs: 3, md: 4 },
            zIndex: 2,
          }}
        >
          <Typography
            variant="overline"
            sx={{
              color: '#00BFA5',
              fontWeight: 600,
              letterSpacing: 1,
              mb: 1,
              display: 'block',
            }}
          >
            FOCUS PLAYLIST
          </Typography>
          <Typography
            variant="h4"
            component="h2"
            sx={{
              color: '#fff',
              fontWeight: 800,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              mb: 1,
            }}
          >
            Chill Lofi Beats
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 2,
              maxWidth: 600,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Relaxing beats for study, work, and focus. The perfect background music for productivity.
          </Typography>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#00BFA5',
              color: '#fff',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#00A896',
              },
              borderRadius: 6,
              px: 3,
              py: 1,
            }}
            startIcon={<PlayArrow />}
          >
            Listen Now
          </Button>
        </Box>
      </Paper>
    </SwiperSlide>
  </Swiper>
</Box>

{/* Recommendations Section */}
<Box sx={{ mb: 6 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h5" component="h2" fontWeight={700}>
      Recommended for You
    </Typography>
    <Button
      endIcon={<ChevronRight />}
      sx={{
        color: isDarkMode ? '#1DB954' : '#1DB954',
        '&:hover': {
          bgcolor: isDarkMode ? 'rgba(29, 185, 84, 0.1)' : 'rgba(29, 185, 84, 0.1)',
        },
      }}
    >
      See All
    </Button>
  </Box>

  {loadingSpotify ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={40} sx={{ color: '#1DB954' }} />
    </Box>
  ) : (
    <Swiper
      spaceBetween={16}
      slidesPerView={1.2}
      breakpoints={{
        600: {
          slidesPerView: 2.2,
        },
        900: {
          slidesPerView: 3.2,
        },
        1200: {
          slidesPerView: 4.2,
        },
      }}
      modules={[FreeMode]}
      freeMode={{
        enabled: true,
        momentum: true,
        momentumRatio: 0.5,
      }}
    >
      {spotifyData.recommendedTracks.map((track) => (
        <SwiperSlide key={track.id}>
          <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
            <GlassCard
              sx={{
                p: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => handlePlayTrack(track)}
            >
              <Box sx={{ position: 'relative', mb: 2 }}>
                <CardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    aspectRatio: '1/1',
                    borderRadius: 2,
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                  }}
                  image={track.album?.images[0]?.url || '/default-album-cover.jpg'}
                  alt={track.name}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: '#1DB954',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    opacity: 0.9,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      opacity: 1,
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <PlayArrow sx={{ color: '#fff' }} />
                </Box>
              </Box>
              <Typography
                variant="subtitle1"
                component="div"
                fontWeight={600}
                sx={{ mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {track.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {track.artists?.map((a) => a.name).join(', ')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 2 }}>
                <Chip 
                  label={track.explicit ? "Explicit" : "Track"} 
                  size="small" 
                  sx={{ 
                    bgcolor: track.explicit ? 'rgba(255, 99, 71, 0.1)' : 'rgba(29, 185, 84, 0.1)',
                    color: track.explicit ? '#FF6347' : '#1DB954',
                    fontWeight: 500,
                    borderRadius: 1
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike(track.id);
                  }}
                >
                  {likedTracks.has(track.id) ? (
                    <Favorite sx={{ color: '#FF3366', fontSize: 20 }} />
                  ) : (
                    <FavoriteBorder sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Box>
            </GlassCard>
          </motion.div>
        </SwiperSlide>
      ))}
    </Swiper>
  )}
</Box>

{/* New Releases Section */}
<Box sx={{ mb: 6 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h5" component="h2" fontWeight={700}>
      New Releases
    </Typography>
    <Button
      endIcon={<ChevronRight />}
      sx={{
        color: isDarkMode ? '#1DB954' : '#1DB954',
        '&:hover': {
          bgcolor: isDarkMode ? 'rgba(29, 185, 84, 0.1)' : 'rgba(29, 185, 84, 0.1)',
        },
      }}
    >
      See All
    </Button>
  </Box>

  <Grid container spacing={2}>
    {spotifyData.newReleases.slice(0, 4).map((album) => (
      <Grid item xs={6} sm={3} key={album.id}>
        <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
          <GlassCard
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
            }}
          >
            <Box sx={{ position: 'relative', mb: 2 }}>
              <CardMedia
                component="img"
                sx={{
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: 2,
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                }}
                image={album.images[0]?.url || '/default-album-cover.jpg'}
                alt={album.name}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: '#FF3366',
                  borderRadius: 4,
                  px: 1,
                  py: 0.5,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                  NEW
                </Typography>
              </Box>
            </Box>
            <Typography
              variant="subtitle1"
              component="div"
              fontWeight={600}
              sx={{ 
                mb: 0.5, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.2
              }}
            >
              {album.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {album.artists?.map((a) => a.name).join(', ')}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)} • {new Date(album.release_date).getFullYear()}
              </Typography>
            </Box>
          </GlassCard>
        </motion.div>
      </Grid>
    ))}
  </Grid>
</Box>

{/* Recently Played Section */}
<Box sx={{ mb: 6 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h5" component="h2" fontWeight={700}>
      Recently Played
    </Typography>
    <Button
      endIcon={<History />}
      sx={{
        color: isDarkMode ? '#1DB954' : '#1DB954',
        '&:hover': {
          bgcolor: isDarkMode ? 'rgba(29, 185, 84, 0.1)' : 'rgba(29, 185, 84, 0.1)',
        },
      }}
    >
      View History
    </Button>
  </Box>

  <TableContainer 
    component={Paper} 
    elevation={0}
    sx={{ 
      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 2,
      backdropFilter: 'blur(10px)',
      border: '1px solid',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    }}
  >
    <Table sx={{ minWidth: 650 }} aria-label="recently played tracks">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>#</TableCell>
          <TableCell sx={{ fontWeight: 600, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>Title</TableCell>
          <TableCell sx={{ fontWeight: 600, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>Album</TableCell>
          <TableCell sx={{ fontWeight: 600, color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>Duration</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {spotifyData.recentlyPlayed.slice(0, 5).map((track, index) => (
          <TableRow 
            key={`${track.id}-${index}`}
            hover
            onClick={() => handlePlayTrack(track)}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              }
            }}
          >
            <TableCell component="th" scope="row" sx={{ width: 50 }}>
              {index + 1}
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CardMedia
                  component="img"
                  sx={{ width: 40, height: 40, borderRadius: 1, mr: 2 }}
                  image={track.album?.images[0]?.url || '/default-album-cover.jpg'}
                  alt={track.name}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {track.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {track.artists?.map(a => a.name).join(', ')}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell>{track.album?.name}</TableCell>
            <TableCell>
              {Math.floor(track.duration_ms / 60000)}:
              {(Math.floor((track.duration_ms % 60000) / 1000) < 10 ? '0' : '') + 
                Math.floor((track.duration_ms % 60000) / 1000)}
            </TableCell>
            <TableCell align="right">
              <Box sx={{ display: 'flex' }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLike(track.id);
                  }}
                >
                  {likedTracks.has(track.id) ? (
                    <Favorite sx={{ color: '#FF3366' }} />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</Box>

{/* Featured Playlists */}
<Box sx={{ mb: 6 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h5" component="h2" fontWeight={700}>
      Featured Playlists
    </Typography>
    <Button
      endIcon={<ChevronRight />}
      sx={{
        color: isDarkMode ? '#1DB954' : '#1DB954',
        '&:hover': {
          bgcolor: isDarkMode ? 'rgba(29, 185, 84, 0.1)' : 'rgba(29, 185, 84, 0.1)',
        },
      }}
    >
      Browse All
    </Button>
  </Box>

  <Grid container spacing={3}>
    {spotifyData.trendingPlaylists.map((playlist) => (
      <Grid item xs={12} sm={6} key={playlist.id}>
        <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
          <GlassCard sx={{ display: 'flex', height: '100%' }}>
            <CardMedia
              component="img"
              sx={{ width: 140, height: 140 }}
              image={playlist.images[0]?.url || '/default-playlist-cover.jpg'}
              alt={playlist.name}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', p: 2, flexGrow: 1 }}>
              <Typography variant="subtitle1" component="div" fontWeight={600}>
                {playlist.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                By {playlist.owner?.display_name || 'Spotify'}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                {playlist.description || 'Enjoy this curated playlist with the best tracks selected just for you.'}
              </Typography>
              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip
                  label={`${playlist.tracks?.total || '—'} tracks`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(29, 185, 84, 0.1)',
                    color: '#1DB954',
                    borderRadius: 1,
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayArrow />}
                  sx={{
                    borderColor: '#1DB954',
                    color: '#1DB954',
                    '&:hover': {
                      borderColor: '#0DA943',
                      bgcolor: 'rgba(29, 185, 84, 0.1)',
                    },
                  }}
                >
                  Play
                </Button>
              </Box>
            </Box>
          </GlassCard>
        </motion.div>
      </Grid>
    ))}
  </Grid>
</Box>
            </motion.div>
          )}

          {activeSection === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 700 }}>
                Search
              </Typography>
              
              {/* Search functionality */}
              <Box 
                sx={{ 
                  mb: 4,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2 
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Search for notes, projects, or tasks..."
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  sx={{ 
                    height: { md: 56 },
                    minWidth: { xs: '100%', md: 120 }
                  }}
                >
                  Search
                </Button>
              </Box>

              {/* Filter options */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Filter by:
                </Typography>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  flexWrap="wrap"
                  useFlexGap
                >
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="type-filter-label">Content Type</InputLabel>
                    <Select
                      labelId="type-filter-label"
                      id="type-filter"
                      value={contentTypeFilter}
                      label="Content Type"
                      onChange={(e) => setContentTypeFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      <MenuItem value="notes">Notes</MenuItem>
                      <MenuItem value="tasks">Tasks</MenuItem>
                      <MenuItem value="projects">Projects</MenuItem>
                      <MenuItem value="files">Files</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="date-filter-label">Date Range</InputLabel>
                    <Select
                      labelId="date-filter-label"
                      id="date-filter"
                      value={dateFilter}
                      label="Date Range"
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="custom">Custom Range</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="tag-filter-label">Tags</InputLabel>
                    <Select
                      labelId="tag-filter-label"
                      id="tag-filter"
                      value={tagFilter}
                      label="Tags"
                      onChange={(e) => setTagFilter(e.target.value)}
                      multiple
                      renderValue={(selected) => selected.join(', ')}
                    >
                      {availableTags.map((tag) => (
                        <MenuItem key={tag} value={tag}>
                          <Checkbox checked={tagFilter.indexOf(tag) > -1} />
                          <ListItemText primary={tag} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={applyFilters}
                    startIcon={<FilterListIcon />}
                  >
                    Apply Filters
                  </Button>
                  
                  <Button 
                    variant="text" 
                    color="inherit" 
                    onClick={resetFilters}
                    startIcon={<RestartAltIcon />}
                  >
                    Reset
                  </Button>
                </Stack>
              </Box>

              {/* Custom date range picker - shows only when "Custom Range" is selected */}
              {dateFilter === 'custom' && (
                <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <DatePicker
                    label="From"
                    value={dateRangeStart}
                    onChange={(newValue) => setDateRangeStart(newValue)}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                  <DatePicker
                    label="To"
                    value={dateRangeEnd}
                    onChange={(newValue) => setDateRangeEnd(newValue)}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                </Box>
              )}

              {/* Search result metrics */}
              {searchPerformed && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Found {searchResults.length} results for "{searchQuery}"
                    {contentTypeFilter !== 'all' && ` in ${contentTypeFilter}`}
                  </Typography>
                  <FormControl variant="standard" sx={{ minWidth: 120 }}>
                    <InputLabel id="sort-label">Sort by</InputLabel>
                    <Select
                      labelId="sort-label"
                      id="sort-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <MenuItem value="relevance">Relevance</MenuItem>
                      <MenuItem value="newest">Newest First</MenuItem>
                      <MenuItem value="oldest">Oldest First</MenuItem>
                      <MenuItem value="az">A-Z</MenuItem>
                      <MenuItem value="za">Z-A</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Search results display */}
              {searchPerformed && (
                <>
                  {searchResults.length > 0 ? (
                    <List>
                      {searchResults.map((result) => (
                        <Paper 
                          key={result.id} 
                          elevation={1} 
                          sx={{ 
                            mb: 2, 
                            p: 2,
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: 3
                            }
                          }}
                        >
                          <ListItem 
                            disablePadding
                            secondaryAction={
                              <IconButton edge="end" onClick={() => handleBookmark(result.id)}>
                                {result.isBookmarked ? 
                                  <BookmarkIcon color="primary" /> : 
                                  <BookmarkBorderIcon />
                                }
                              </IconButton>
                            }
                          >
                            <ListItemButton onClick={() => handleResultClick(result)}>
                              <ListItemIcon>
                                {result.type === 'note' && <DescriptionIcon color="primary" />}
                                {result.type === 'task' && <AssignmentIcon color="secondary" />}
                                {result.type === 'project' && <FolderIcon color="success" />}
                                {result.type === 'file' && <InsertDriveFileIcon color="info" />}
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Typography variant="subtitle1" fontWeight={500}>
                                    {result.title}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{ 
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        mb: 1
                                      }}
                                    >
                                      {result.preview}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                      <Chip 
                                        size="small" 
                                        label={result.type} 
                                        color={
                                          result.type === 'note' ? 'primary' :
                                          result.type === 'task' ? 'secondary' :
                                          result.type === 'project' ? 'success' : 'info'
                                        }
                                        variant="outlined"
                                      />
                                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalendarTodayIcon fontSize="inherit" />
                                        {new Date(result.date).toLocaleDateString()}
                                      </Typography>
                                      {result.tags && result.tags.length > 0 && (
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                          {result.tags.slice(0, 3).map(tag => (
                                            <Chip 
                                              key={tag} 
                                              label={tag} 
                                              size="small" 
                                              variant="outlined"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleTagClick(tag);
                                              }}
                                            />
                                          ))}
                                          {result.tags.length > 3 && (
                                            <Chip 
                                              label={`+${result.tags.length - 3}`} 
                                              size="small" 
                                              variant="outlined" 
                                            />
                                          )}
                                        </Box>
                                      )}
                                    </Box>
                                  </>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        </Paper>
                      ))}
                    </List>
                  ) : (
                    <Box 
                      sx={{ 
                        py: 6, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <SearchOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>No results found</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        We couldn't find any matches for "{searchQuery}".
                      </Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<RestartAltIcon />}
                        onClick={resetSearch}
                      >
                        Clear Search
                      </Button>
                    </Box>
                  )}

                  {/* Pagination */}
                  {searchResults.length > itemsPerPage && (
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                      <Pagination
                        count={Math.ceil(searchResults.length / itemsPerPage)}
                        page={currentPage}
                        onChange={(e, page) => setCurrentPage(page)}
                        color="primary"
                        shape="rounded"
                      />
                    </Box>
                  )}
                </>
              )}

              {/* Initial state when no search has been performed */}
              {!searchPerformed && !searchOpen && (
                <Box 
                  sx={{ 
                    py: 8, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <SearchIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.7, mb: 3 }} />
                  <Typography variant="h5" gutterBottom>Find what you're looking for</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
                    Search through all your notes, tasks, projects and files. Use the filters to narrow down your results.
                  </Typography>
                  
                  <Paper sx={{ p: 3, mb: 4, width: '100%', maxWidth: 600 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Search Tips
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <QuoteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary='Use quotes for exact phrases: "project meeting notes"' />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <TagIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Search by tag: #important or #project-alpha" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CalendarTodayIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Find by date: date:today or date:last-week" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <FilterListIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Filter by type: type:note or type:task" />
                      </ListItem>
                    </List>
                  </Paper>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Recent Searches
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ justifyContent: 'center' }}>
                    {recentSearches.map((search, index) => (
                      <Chip 
                        key={index} 
                        label={search} 
                        onClick={() => {
                          setSearchQuery(search);
                          handleSearch();
                        }}
                        icon={<HistoryIcon />}
                      />
                    ))}
                    {recentSearches.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No recent searches
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

export default EnhancedHome;