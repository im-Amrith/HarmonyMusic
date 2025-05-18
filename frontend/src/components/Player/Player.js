import React, { useState, useRef, useContext, useEffect } from 'react';
import ReactPlayer from 'react-player';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  useTheme,
  Paper,
  Avatar,
  Tooltip,
  Grid,
  Fade,
  Zoom,
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  Badge,
  Fab,
  useMediaQuery,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  VolumeUp,
  VolumeOff,
  Shuffle,
  Repeat,
  RepeatOne,
  QueueMusic,
  Favorite,
  FavoriteBorder,
  MoreHoriz,
  Equalizer,
  Fullscreen,
  FullscreenExit,
  Share,
  PlaylistAdd,
  Close,
  DragIndicator,
  Lyrics,
  Keyboard,
  ExpandMore,
  ExpandLess,
  Save,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { YTMusicPlayerContext } from '../../context/YTMusicPlayerContext';

const Player = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const {
    ytVideoId,
    setYtVideoId,
    ytTrack,
    setYtTrack,
    isPlaying,
    setIsPlaying,
    ytPlayingId,
    setYtPlayingId,
  } = useContext(YTMusicPlayerContext);

  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: no repeat, 1: repeat all, 2: repeat one
  const [isShuffled, setIsShuffled] = useState(false);
  const [queue, setQueue] = useState([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [lyrics, setLyrics] = useState("Loading lyrics...");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [visualizerData, setVisualizerData] = useState([0.2, 0.5, 0.8, 0.3, 0.7, 0.4, 0.6, 0.9]);
  
  const playerRef = useRef();
  const playerContainerRef = useRef();
  const visualizerRef = useRef();

  // Handle play/pause
  useEffect(() => {
    if (!ytVideoId) setPlayed(0);
  }, [ytVideoId]);

  // Add track to queue when a new track is played
  useEffect(() => {
    if (ytVideoId && ytTrack) {
      const exists = queue.find(item => item.videoId === ytVideoId);
      if (!exists) {
        setQueue(prev => [...prev, { videoId: ytVideoId, ...ytTrack }]);
        setCurrentQueueIndex(queue.length);
      } else {
        setCurrentQueueIndex(queue.findIndex(item => item.videoId === ytVideoId));
      }
    }
  }, [ytVideoId, ytTrack]);

  // Simulate visualizer animation
  useEffect(() => {
    if (showVisualizer && isPlaying) {
      const interval = setInterval(() => {
        setVisualizerData(prev => 
          prev.map(() => Math.random() * 0.8 + 0.1)
        );
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showVisualizer, isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleNext();
          } else {
            e.preventDefault();
            playerRef.current.seekTo(Math.min(played + 0.05, 1), 'fraction');
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePrev();
          } else {
            e.preventDefault();
            playerRef.current.seekTo(Math.max(played - 0.05, 0), 'fraction');
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(prev + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(prev - 0.1, 0));
          break;
        case 'KeyM':
          e.preventDefault();
          setMuted(prev => !prev);
          break;
        case 'KeyL':
          e.preventDefault();
          setLiked(prev => !prev);
          break;
        case 'KeyQ':
          e.preventDefault();
          setShowQueue(prev => !prev);
          break;
        case 'KeyV':
          e.preventDefault();
          setShowVisualizer(prev => !prev);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [played, isPlaying]);

  // Format time helper
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Progress bar handlers
  const handleSeek = (e, newValue) => {
    setPlayed(newValue);
    setSeeking(true);
  };
  const handleSeekCommitted = (e, newValue) => {
    playerRef.current.seekTo(newValue, 'fraction');
    setSeeking(false);
  };

  // Volume handlers
  const handleVolume = (e, newValue) => {
    setVolume(newValue);
    setMuted(newValue === 0);
  };

  // Like button
  const handleLike = () => {
    setLiked(prev => !prev);
    setSnackbar({
      open: true,
      message: liked ? "Removed from favorites" : "Added to favorites",
      severity: "success"
    });
  };

  // Queue handlers
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setQueue(items);
    setCurrentQueueIndex(items.findIndex(item => item.videoId === ytVideoId));
  };

  const playFromQueue = (index) => {
    const track = queue[index];
    setYtVideoId(track.videoId);
    setYtTrack({ title: track.title, artist: track.artist, coverImage: track.coverImage });
    setIsPlaying(true);
    setCurrentQueueIndex(index);
  };

  // Next/Prev
  const handleNext = () => {
    if (queue.length > 0) {
      let nextIndex = currentQueueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 1) nextIndex = 0;
        else return;
      }
      playFromQueue(nextIndex);
    } else {
      setIsPlaying(false);
      setYtVideoId(null);
      setYtTrack(null);
      setYtPlayingId(null);
    }
  };
  
  const handlePrev = () => {
    if (queue.length > 0) {
      let prevIndex = currentQueueIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 1) prevIndex = queue.length - 1;
        else return;
      }
      playFromQueue(prevIndex);
    } else {
      setIsPlaying(false);
      setYtVideoId(null);
      setYtTrack(null);
      setYtPlayingId(null);
    }
  };

  // Repeat mode
  const handleRepeat = () => {
    setRepeatMode(prev => (prev + 1) % 3);
  };

  // Shuffle
  const handleShuffle = () => {
    setIsShuffled(prev => !prev);
    if (queue.length > 1) {
      const shuffled = [...queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setQueue(shuffled);
      setCurrentQueueIndex(shuffled.findIndex(item => item.videoId === ytVideoId));
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Save to playlist
  const handleSaveToPlaylist = () => {
    setShowSaveDialog(true);
    setMoreMenuAnchor(null);
  };

  const saveToPlaylist = () => {
    // In a real app, this would save to a backend
    setSnackbar({
      open: true,
      message: `Saved "${ytTrack.title}" to playlist "${playlistName}"`,
      severity: "success"
    });
    setShowSaveDialog(false);
    setPlaylistName("");
  };

  // Share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ytTrack.title,
        text: `Check out "${ytTrack.title}" by ${ytTrack.artist}`,
        url: `https://www.youtube.com/watch?v=${ytVideoId}`
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${ytVideoId}`);
      setSnackbar({
        open: true,
        message: "Link copied to clipboard!",
        severity: "success"
      });
    }
    setMoreMenuAnchor(null);
  };

  // More menu
  const handleMoreMenuOpen = (event) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  // Hide player if nothing to play
  if (!ytVideoId || !ytTrack) return null;

  return (
    <>
      <Paper
        ref={playerContainerRef}
        elevation={8}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3000,
          bgcolor: 'rgba(24,24,24,0.95)',
          borderRadius: isMinimized ? '12px 12px 0 0' : 0,
          px: { xs: 1, sm: 4 },
          py: { xs: 1, sm: 2 },
          boxShadow: '0 0 32px 0 rgba(30,215,96,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 3 },
          minHeight: isMinimized ? 64 : { xs: 64, sm: 88 },
          maxWidth: '100vw',
          transition: 'all 0.3s ease',
          transform: isMinimized ? 'translateY(calc(100% - 64px))' : 'translateY(0)',
          '&:hover': {
            transform: isMinimized ? 'translateY(calc(100% - 88px))' : 'translateY(0)',
          },
        }}
      >
        {/* Hidden ReactPlayer for audio only */}
        <Box sx={{ display: 'none' }}>
          <ReactPlayer
            ref={playerRef}
            url={`https://www.youtube.com/watch?v=${ytVideoId}`}
            playing={isPlaying}
            volume={volume}
            muted={muted}
            onProgress={({ played }) => !seeking && setPlayed(played)}
            onDuration={setDuration}
            onEnded={() => {
              if (repeatMode === 2) {
                // Repeat one
                playerRef.current.seekTo(0, 'fraction');
                setIsPlaying(true);
              } else {
                handleNext();
              }
            }}
            width={0}
            height={0}
            config={{ youtube: { playerVars: { autoplay: 1 } } }}
          />
        </Box>

        {/* Minimize/Maximize Button */}
        <IconButton 
          onClick={() => setIsMinimized(prev => !prev)} 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            color: '#fff',
            transition: 'transform 0.3s ease',
            transform: isMinimized ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          {isMinimized ? <ExpandLess /> : <ExpandMore />}
        </IconButton>

        {/* Album Art with Visualizer */}
        <Box sx={{ position: 'relative', mr: 2, flexShrink: 0 }}>
          <Avatar
            src={ytTrack.coverImage}
            alt={ytTrack.title}
            variant="rounded"
            sx={{ 
              width: 56, 
              height: 56, 
              boxShadow: 2,
              transition: 'all 0.3s ease',
              transform: isPlaying ? 'scale(1.05)' : 'scale(1)',
              animation: isPlaying ? 'pulse 2s infinite' : 'none',
            }}
          />
          {showVisualizer && (
            <Box 
              ref={visualizerRef}
              sx={{ 
                position: 'absolute', 
                bottom: -20, 
                left: 0, 
                right: 0, 
                height: 20, 
                display: 'flex', 
                alignItems: 'flex-end', 
                justifyContent: 'space-between',
                px: 0.5,
              }}
            >
              {visualizerData.map((height, i) => (
                <Box 
                  key={i} 
                  sx={{ 
                    width: 2, 
                    height: `${height * 100}%`, 
                    bgcolor: '#1DB954',
                    borderRadius: '1px',
                    transition: 'height 0.1s ease',
                  }} 
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Track Info */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" noWrap sx={{ color: '#fff', fontWeight: 600 }}>
            {ytTrack.title}
          </Typography>
          <Typography variant="body2" noWrap sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {ytTrack.artist}
          </Typography>
          {/* Now playing indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Zoom in={isPlaying}>
              <Equalizer sx={{ color: '#1DB954', fontSize: 18, mr: 1, animation: isPlaying ? 'bounce 1s infinite' : 'none' }} />
            </Zoom>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              {isPlaying ? 'Now Playing' : 'Paused'}
            </Typography>
          </Box>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Shuffle">
            <IconButton 
              onClick={handleShuffle} 
              size="large" 
              sx={{ color: isShuffled ? '#1DB954' : '#fff' }}
            >
              <Shuffle fontSize="large" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Previous">
            <IconButton onClick={handlePrev} size="large" sx={{ color: '#fff' }}>
              <SkipPrevious fontSize="large" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
            <IconButton 
              onClick={() => setIsPlaying(p => !p)} 
              size="large" 
              sx={{ 
                color: '#fff',
                bgcolor: 'rgba(29, 185, 84, 0.2)',
                '&:hover': { bgcolor: 'rgba(29, 185, 84, 0.3)' },
                transition: 'all 0.2s ease',
                transform: isPlaying ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {isPlaying ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Next">
            <IconButton onClick={handleNext} size="large" sx={{ color: '#fff' }}>
              <SkipNext fontSize="large" />
            </IconButton>
          </Tooltip>
          <Tooltip title={
            repeatMode === 0 ? "Repeat Off" : 
            repeatMode === 1 ? "Repeat All" : "Repeat One"
          }>
            <IconButton 
              onClick={handleRepeat} 
              size="large" 
              sx={{ color: repeatMode > 0 ? '#1DB954' : '#fff' }}
            >
              {repeatMode === 0 ? <Repeat /> : repeatMode === 1 ? <Repeat /> : <RepeatOne />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ flex: 2, minWidth: 120, mx: 2, display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#fff', minWidth: 36 }}>
            {formatTime(played * duration)}
          </Typography>
          <Slider
            value={played}
            min={0}
            max={1}
            step={0.001}
            onChange={handleSeek}
            onChangeCommitted={handleSeekCommitted}
            sx={{ 
              mx: 1, 
              color: '#1DB954',
              '& .MuiSlider-thumb': {
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.2)',
                },
              },
            }}
          />
          <Typography variant="caption" sx={{ color: '#fff', minWidth: 36 }}>
            {formatTime(duration)}
          </Typography>
        </Box>

        {/* Volume */}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
          <IconButton onClick={() => setMuted(m => !m)} sx={{ color: '#fff' }}>
            {muted || volume === 0 ? <VolumeOff /> : <VolumeUp />}
          </IconButton>
          <Slider
            value={muted ? 0 : volume}
            min={0}
            max={1}
            step={0.01}
            onChange={handleVolume}
            sx={{ 
              width: 60, 
              color: '#1DB954',
              '& .MuiSlider-thumb': {
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.2)',
                },
              },
            }}
          />
        </Box>

        {/* Right-side buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={liked ? 'Unlike' : 'Like'}>
            <IconButton onClick={handleLike} size="large" sx={{ color: liked ? '#1DB954' : '#fff' }}>
              {liked ? <Favorite /> : <FavoriteBorder />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Lyrics">
            <IconButton onClick={() => setShowLyrics(true)} sx={{ color: '#fff' }}>
              <Lyrics />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Visualizer">
            <IconButton onClick={() => setShowVisualizer(v => !v)} sx={{ color: showVisualizer ? '#1DB954' : '#fff' }}>
              <Equalizer />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Queue">
            <Badge badgeContent={queue.length} color="primary">
              <IconButton onClick={() => setShowQueue(true)} sx={{ color: '#fff' }}>
                <QueueMusic />
              </IconButton>
            </Badge>
          </Tooltip>
          
          <Tooltip title="Keyboard Shortcuts">
            <IconButton onClick={() => setShowKeyboardShortcuts(true)} sx={{ color: '#fff' }}>
              <Keyboard />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={toggleFullscreen} sx={{ color: '#fff' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="More">
            <IconButton onClick={handleMoreMenuOpen} sx={{ color: '#fff' }}>
              <MoreHoriz />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Queue Drawer */}
      <Drawer
        anchor="right"
        open={showQueue}
        onClose={() => setShowQueue(false)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(24,24,24,0.95)',
            color: '#fff',
            width: { xs: '100%', sm: 400 },
            p: 2,
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Queue</Typography>
          <IconButton onClick={() => setShowQueue(false)} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </Box>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="queue">
            {(provided) => (
              <List
                {...provided.droppableProps}
                ref={provided.innerRef}
                sx={{ width: '100%' }}
              >
                {queue.map((item, index) => (
                  <Draggable key={item.videoId} draggableId={item.videoId} index={index}>
                    {(provided) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          bgcolor: index === currentQueueIndex ? 'rgba(29, 185, 84, 0.2)' : 'transparent',
                          borderRadius: 1,
                          mb: 1,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <div {...provided.dragHandleProps} style={{ marginRight: 8 }}>
                          <DragIndicator sx={{ color: 'rgba(255,255,255,0.5)' }} />
                        </div>
                        <ListItemAvatar>
                          <Avatar src={item.coverImage} alt={item.title} variant="rounded" />
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.title}
                          secondary={item.artist}
                          primaryTypographyProps={{ noWrap: true }}
                          secondaryTypographyProps={{ noWrap: true }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => playFromQueue(index)}
                            sx={{ color: '#fff' }}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </Drawer>

      {/* Lyrics Dialog */}
      <Dialog
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(24,24,24,0.95)',
            color: '#fff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Lyrics</Typography>
            <IconButton onClick={() => setShowLyrics(false)} sx={{ color: '#fff' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>{ytTrack.title}</Typography>
            <Typography variant="subtitle1" gutterBottom>{ytTrack.artist}</Typography>
            <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {lyrics}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(24,24,24,0.95)',
            color: '#fff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Keyboard Shortcuts</Typography>
            <IconButton onClick={() => setShowKeyboardShortcuts(false)} sx={{ color: '#fff' }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemText primary="Space" secondary="Play/Pause" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Left Arrow" secondary="Seek Backward" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Right Arrow" secondary="Seek Forward" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Ctrl/Cmd + Left Arrow" secondary="Previous Track" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Ctrl/Cmd + Right Arrow" secondary="Next Track" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Up Arrow" secondary="Volume Up" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Down Arrow" secondary="Volume Down" />
            </ListItem>
            <ListItem>
              <ListItemText primary="M" secondary="Mute/Unmute" />
            </ListItem>
            <ListItem>
              <ListItemText primary="L" secondary="Like/Unlike" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Q" secondary="Show Queue" />
            </ListItem>
            <ListItem>
              <ListItemText primary="V" secondary="Toggle Visualizer" />
            </ListItem>
            <ListItem>
              <ListItemText primary="F" secondary="Fullscreen" />
            </ListItem>
          </List>
        </DialogContent>
      </Dialog>

      {/* Save to Playlist Dialog */}
      <Dialog
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(24,24,24,0.95)',
            color: '#fff',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle>Save to Playlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Playlist Name"
            fullWidth
            variant="outlined"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)} sx={{ color: '#fff' }}>
            Cancel
          </Button>
          <Button 
            onClick={saveToPlaylist} 
            variant="contained" 
            sx={{ bgcolor: '#1DB954', '&:hover': { bgcolor: '#1ed760' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* More Menu */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={handleMoreMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(24,24,24,0.95)',
            color: '#fff',
          }
        }}
      >
        <MenuItem onClick={handleSaveToPlaylist}>
          <PlaylistAdd sx={{ mr: 1 }} /> Save to Playlist
        </MenuItem>
        <MenuItem onClick={handleShare}>
          <Share sx={{ mr: 1 }} /> Share
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%', bgcolor: 'rgba(24,24,24,0.95)', color: '#fff' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(29, 185, 84, 0); }
          100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
        }
      `}</style>
    </>
  );
};

export default Player;
