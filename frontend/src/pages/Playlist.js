import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  Skeleton,
  Paper,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Badge,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Alert,
  CardMedia
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Shuffle as ShuffleIcon,
  Repeat as RepeatIcon,
  RepeatOne as RepeatOneIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  QueueMusic as QueueMusicIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  Equalizer,
  LibraryAdd as LibraryAddIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { usePlayer } from '../hooks/usePlayer';
import { getToken } from '../services/spotifyAuth';
import { useSocket } from '../hooks/useSocket';
import { YTMusicPlayerContext } from '../context/YTMusicPlayerContext';

const Playlist = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHearted, setIsHearted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [queue, setQueue] = useState([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { socket } = useSocket();
  const { setYtVideoId, setYtTrack, setIsPlaying, ytPlayingId, setYtPlayingId } = useContext(YTMusicPlayerContext);

  // Fetch playlist data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = getToken();
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setCurrentUserId(data.id);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const token = getToken();
        const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch playlist');
        }
        
        const data = await response.json();
        // Filter out null tracks if they exist
        if (data.tracks?.items) {
          data.tracks.items = data.tracks.items.filter(item => item.track !== null);
        }
        setPlaylist(data);
        
        // Only check follow status if playlist is not owned by current user
        if (currentUserId && data.owner.id !== currentUserId) {
          try {
            const likedResponse = await fetch(
              `https://api.spotify.com/v1/playlists/${id}/followers/contains?ids=${currentUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            if (likedResponse.ok) {
              const [isLiked] = await likedResponse.json();
              setIsHearted(isLiked);
            }
          } catch (err) {
            console.error("Error checking follow status:", err);
          }
        } else {
          // Playlist is owned by current user
          setIsHearted(true);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCurrentUser().then(fetchPlaylist);
  }, [id, currentUserId]);

  // Handle playing a track using YouTube Music API
  const handlePlay = async (track) => {
    if (!track) return;
    
    try {
      // Check if this track is already playing
      const isCurrentlyPlaying = ytPlayingId === track.id && isPlaying;
      
      if (isCurrentlyPlaying) {
        // If it's already playing, pause it
        setIsPlaying(false);
      } else {
        // Construct search query for YouTube Music
        const q = `${track.name} ${track.artists?.map(a => a.name).join(' ')}`;
        
        // Show loading state
        setSnackbar({ 
          open: true, 
          message: `Loading ${track.name}...`, 
          severity: 'info' 
        });
        
        // Fetch from YouTube Music API
        const res = await fetch(`http://localhost:8000/ytmusic/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        if (data.videoId) {
          // Set the video ID in the context
          setYtVideoId(data.videoId);
          
          // Set track info
          setYtTrack({
            title: track.name,
            artist: track.artists?.map(a => a.name).join(', '),
            coverImage: track.album?.images?.[0]?.url || '/default-album-cover.jpg'
          });
          
          // Start playing
          setIsPlaying(true);
          
          // Set the currently playing track ID
          setYtPlayingId(track.id);
          
          // Success message
          setSnackbar({ 
            open: true, 
            message: `Now playing: ${track.name}`, 
            severity: 'success' 
          });
        } else {
          setSnackbar({ 
            open: true, 
            message: 'No playable version found on YouTube Music', 
            severity: 'error' 
          });
        }
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to play track', 
        severity: 'error' 
      });
    }
  };

  // Handle play playlist - plays the first track and queues the rest
  const handlePlayPlaylist = () => {
    if (!playlist?.tracks?.items?.length) return;
    
    const firstTrack = playlist.tracks.items[0].track;
    const isCurrentlyPlaying = ytPlayingId === firstTrack.id && isPlaying;
    
    if (isCurrentlyPlaying) {
      // If it's already playing, pause it
      setIsPlaying(false);
    } else {
      // Play the first track
      handlePlay(firstTrack);
      
      // Set the queue with the remaining tracks
      setQueue(playlist.tracks.items.slice(1).map(item => item.track));
    }
  };

  // Handle shuffle playlist
  const handleShufflePlaylist = () => {
    if (!playlist?.tracks?.items?.length) return;
    
    // Create a shuffled copy of the tracks
    const shuffled = [...playlist.tracks.items]
      .sort(() => Math.random() - 0.5)
      .map(item => item.track);
    
    // Play the first shuffled track
    handlePlay(shuffled[0]);
    
    // Set the queue with the remaining shuffled tracks
    setQueue(shuffled.slice(1));
    setIsShuffling(!isShuffling);
  };

  // Handle repeat playlist
  const handleRepeatPlaylist = () => {
    setIsRepeating(!isRepeating);
  };

  // Handle track click
  const handleTrackClick = (track) => {
    handlePlay(track);
  };

  // Handle add to queue
  const handleAddToQueue = (track) => {
    setQueue(prev => [...prev, track]);
    setSnackbar({ 
      open: true, 
      message: `Added ${track.name} to queue`, 
      severity: 'success' 
    });
  };

  // Handle like playlist
  const handleLikePlaylist = async () => {
    try {
      const token = getToken();
      const method = isHearted ? 'DELETE' : 'PUT';
      
      await fetch(`https://api.spotify.com/v1/playlists/${id}/followers`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsHearted(!isHearted);
      setSnackbar({ 
        open: true, 
        message: isHearted ? 'Removed from your library' : 'Added to your library', 
        severity: 'success' 
      });
      
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: 'Failed to update playlist', 
        severity: 'error' 
      });
    }
  };

  // Handle track menu
  const handleTrackMenuClick = (event, track) => {
    event.stopPropagation();
    setSelectedTrack(track);
    setAnchorEl(event.currentTarget);
  };

  // Format duration
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: { xs: 1, md: 4 } }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Skeleton variant="rounded" width={120} height={40} />
          <Skeleton variant="rounded" width={120} height={40} />
          <Skeleton variant="rounded" width={120} height={40} />
        </Box>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton 
            key={i}
            variant="rectangular" 
            height={60} 
            sx={{ mb: 1, borderRadius: 2 }}
          />
        ))}
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load playlist
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 8 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Queue Button */}
      <Tooltip title="Queue">
        <IconButton 
          onClick={() => setIsQueueOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: theme.palette.primary.main,
            color: 'white',
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          <Badge badgeContent={queue.length} color="secondary">
            <QueueMusicIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Queue Dialog */}
      <Dialog
        open={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Queue
          <IconButton
            aria-label="close"
            onClick={() => setIsQueueOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {queue.length > 0 ? (
            <List>
              {queue.map((track, index) => (
                <ListItem
                  button
                  key={`${track.id}-${index}`}
                  onClick={() => handlePlay(track)}
                  sx={{
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <Avatar
                    src={track.album?.images?.[0]?.url || '/default-album-cover.jpg'}
                    alt={track.album?.name}
                    sx={{ width: 40, height: 40, mr: 2 }}
                  />
                  <ListItemText
                    primary={track.name}
                    secondary={track.artists?.map(a => a.name).join(', ')}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {formatDuration(track.duration_ms)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="body1" color="textSecondary">
                Your queue is empty
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <Box sx={{ p: { xs: 1, md: 4 } }}>
        {/* Playlist Header */}
        <Paper 
          elevation={3} 
          sx={{ 
            display: 'flex', 
            mb: 4, 
            p: 3, 
            borderRadius: 2,
            background: `linear-gradient(to bottom, ${theme.palette.primary.dark}22, ${theme.palette.background.paper})`,
            position: 'relative',
            [theme.breakpoints.down('sm')]: {
              flexDirection: 'column',
            },
          }}
        >
          {/* Playlist Cover */}
          <CardMedia
            component="img"
            sx={{ 
              width: 200, 
              height: 200, 
              borderRadius: 1,
              [theme.breakpoints.down('sm')]: {
                width: '100%',
                height: 'auto',
                mb: 2,
              },
            }}
            image={playlist?.images?.[0]?.url || '/default-playlist.jpg'}
            alt={playlist?.name}
          />

          {/* Playlist Info */}
          <Box sx={{ 
            ml: 3, 
            flex: 1,
            [theme.breakpoints.down('sm')]: {
              ml: 0,
            },
          }}>
            <Typography variant="h4" gutterBottom>
              {playlist?.name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              By {playlist?.owner?.display_name}
            </Typography>
            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
              {playlist?.tracks?.items?.length || 0} songs • {playlist?.followers?.total || 0} followers
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              {playlist?.description || 'No description'}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            display: 'flex', 
            gap: 1 
          }}>
            <Tooltip title={isHearted ? 'Remove from library' : 'Add to library'}>
              <IconButton
                onClick={handleLikePlaylist}
                sx={{
                  color: isHearted ? theme.palette.error.main : 'inherit',
                }}
              >
                {isHearted ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Share">
              <IconButton
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setSnackbar({ open: true, message: 'Share link copied to clipboard', severity: 'success' });
                }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Playlist Actions */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          gap: 2,
          [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
          },
        }}>
          <Button
            variant="contained"
            size="large"
            startIcon={
              ytPlayingId === playlist?.tracks?.items[0]?.track?.id && isPlaying ?  
                <PauseIcon /> : 
                <PlayArrowIcon />
            }
            onClick={handlePlayPlaylist}
            sx={{ flex: 1 }}
          >
            {ytPlayingId === playlist?.tracks?.items[0]?.track?.id && isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ShuffleIcon />}
            onClick={handleShufflePlaylist}
            color={isShuffling ? 'primary' : 'inherit'}
            sx={{ flex: 1 }}
          >
            Shuffle
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={isRepeating ? <RepeatOneIcon /> : <RepeatIcon />}
            onClick={handleRepeatPlaylist}
            color={isRepeating ? 'primary' : 'inherit'}
            sx={{ flex: 1 }}
          >
            Repeat
          </Button>
        </Box>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label="Songs" />
          <Tab label="About" />
        </Tabs>

        {/* Tab Content */}
        {selectedTab === 0 ? (
          <List>
            {playlist?.tracks?.items?.length > 0 ? (
              playlist.tracks.items.filter(item => item.track !== null).map((item, index) => {
                const track = item.track;
                if (!track) return null; // Skip if track is null
                const isNowPlaying = ytPlayingId === track.id && isPlaying;
                
                return (
                  <React.Fragment key={track.id}>
                    <ListItem
                      button
                      onClick={() => handleTrackClick(track)}
                      sx={{
                        bgcolor: isNowPlaying ? theme.palette.action.selected : 'inherit',
                        '&:hover': {
                          bgcolor: isNowPlaying 
                            ? theme.palette.action.selected 
                            : theme.palette.action.hover,
                        },
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        sx={{ width: 24, textAlign: 'right', mr: 2 }}
                      >
                        {index + 1}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        flex: 1,
                        overflow: 'hidden',
                      }}>
                        <Avatar
                          src={track.album?.images?.[0]?.url || '/default-album-cover.jpg'}
                          alt={track.album?.name}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography 
                            variant="body1" 
                            noWrap 
                            color={isNowPlaying ? 'primary' : 'inherit'}
                          >
                            {track.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" noWrap>
                            {track.artists?.map(a => a.name).join(', ')}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mx: 2 }}>
                        {formatDuration(track.duration_ms)}
                      </Typography>
                      <Box sx={{ display: 'flex' }}>
                        {isNowPlaying ? (
                          <IconButton>
                            <Equalizer color="primary" />
                          </IconButton>
                        ) : (
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            handlePlay(track);
                          }}>
                            <PlayArrowIcon />
                          </IconButton>
                        )}
                        <Tooltip title="Add to queue">
                          <IconButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToQueue(track);
                            }}
                          >
                            <QueueMusicIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More options">
                          <IconButton 
                            onClick={(e) => handleTrackMenuClick(e, track)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })
            ) : (
              <Typography sx={{ color: 'text.secondary', mt: 4, ml: 2 }}>
                No songs in this playlist.
              </Typography>
            )}
          </List>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>About this playlist</Typography>
            <Typography variant="body1" paragraph>
              {playlist?.description || 'No description available.'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Created by {playlist?.owner?.display_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {playlist?.followers?.total || 0} followers
            </Typography>
          </Box>
        )}
      </Box>

      {/* Track Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl && selectedTrack)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          if (selectedTrack) handlePlay(selectedTrack);
          setAnchorEl(null);
        }}>
          <PlayArrowIcon sx={{ mr: 1 }} /> Play
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedTrack) handleAddToQueue(selectedTrack);
          setAnchorEl(null);
        }}>
          <QueueMusicIcon sx={{ mr: 1 }} /> Add to Queue
        </MenuItem>
        <MenuItem onClick={() => {
          setSnackbar({ open: true, message: 'Added to your library', severity: 'success' });
          setAnchorEl(null);
        }}>
          <LibraryAddIcon sx={{ mr: 1 }} /> Save to Library
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)}>
          <CloseIcon sx={{ mr: 1 }} /> Cancel
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Playlist;