import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, List, ListItem, ListItemText, ListItemIcon, IconButton, CircularProgress, useTheme, Skeleton, CardMedia, Tooltip, Menu, MenuItem
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder,
  PlayArrow as PlayArrowIcon,
  MoreVert as MoreVertIcon,
  QueueMusic as QueueMusicIcon,
  Equalizer
} from '@mui/icons-material';
import { useInfiniteQuery } from 'react-query';
import { getToken } from '../services/spotifyAuth';
import { usePlayer } from '../hooks/usePlayer';

const LikedSongs = () => {
  const theme = useTheme();
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const fetchLikedTracks = async ({ pageParam = 0 }) => {
    const token = getToken();
    if (!token) throw new Error('Spotify token not available.');
    const limit = 50; // Number of tracks per request
    const offset = pageParam * limit;
    const res = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch liked tracks');
    return res.json();
  };

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: loadingLikedTracks,
    error,
  } = useInfiniteQuery(
    'likedTracks',
    fetchLikedTracks,
    {
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.next) {
          return pages.length; // Return the next page index
        } else {
          return undefined;
        }
      },
    }
  );

  // Flatten the data structure
  const likedTracks = data?.pages.flatMap(page => page.items.map(item => item.track));

  // Intersection Observer for infinite scrolling
  const observerTarget = useRef(null);

  useEffect(() => {
    if (!observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '20px',
        threshold: 0.1,
      }
    );

    observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasNextPage, isFetchingNextPage, fetchNextPage]);


  const handleLikeToggle = async (track) => {
    const token = getToken();
    if (!token) return;

    const isCurrentlyLiked = likedTracks?.some(t => t.id === track.id);

    const method = isCurrentlyLiked ? 'DELETE' : 'PUT';
    const url = `https://api.spotify.com/v1/me/tracks?ids=${track.id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update liked status');
      // Invalidate query to refetch liked tracks
      // queryClient.invalidateQueries('likedTracks'); // Need access to queryClient
      window.location.reload(); // Simple reload for now

    } catch (e) {
      console.error('Error toggling like status:', e);
    }
  };

  const handlePlay = (track) => {
    togglePlay(track);
  };

  const addToQueue = (track) => {
    // Implement add to queue logic
    console.log('Add to queue:', track);
  };

   // Context menu
  const openMenu = (event, track) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrack(track);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedTrack(null);
  };


  return (
    <Box sx={{ p: { xs: 1, md: 4 } }}>
      <Typography variant="h3" sx={{ mb: 4, fontWeight: 700, letterSpacing: 1, textShadow: '0 2px 16px #0008' }}>
        Liked Songs
      </Typography>

      {loadingLikedTracks && !likedTracks ? (
        <List>
          {Array.from({ length: 10 }).map((_, i) => (
            <ListItem key={i} sx={{ bgcolor: 'rgba(24,24,24,0.7)', borderRadius: 2, mb: 1 }}>
              <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 1 }} />
              <Box sx={{ ml: 2, flexGrow: 1 }}>
                <Skeleton height={20} width="70%" />
                <Skeleton height={16} width="50%" />
              </Box>
              <Skeleton height={24} width={60} />
            </ListItem>
          ))}
        </List>
      ) : error ? (
        <Typography color="error">{error.message}</Typography>
      ) : likedTracks?.length > 0 ? (
        <List>
          {likedTracks.map((track) => {
             const isNowPlaying = currentTrack && currentTrack.id === track.id && isPlaying;
            return (
              <ListItem
                key={track.id}
                 sx={{
                    bgcolor: isNowPlaying ? 'rgba(29,185,84,0.1)' : 'rgba(24,24,24,0.7)',
                    borderRadius: 2,
                    mb: 1,
                    transition: 'all 0.2s cubic-bezier(.47,1.64,.41,.8)',
                    '&:hover': {
                      bgcolor: isNowPlaying ? 'rgba(29,185,84,0.15)' : 'rgba(24,24,24,0.9)',
                      transform: 'scale(1.01)',
                    },
                  }}
              >
                 <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    <CardMedia
                      component="img"
                      image={track.album?.images?.[0]?.url || '/default-album-cover.jpg'}
                      alt={track.name}
                      sx={{ width: 60, height: 60, borderRadius: 1 }}
                    />
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="subtitle1" noWrap>{track.name}</Typography>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {track.artists?.map(a => a.name).join(', ')}
                      </Typography>
                    </Box>
                  </Box>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mr: 2 }}>
                      {Math.floor(track.duration_ms / 60000)}:{(track.duration_ms % 60000 / 1000).toFixed(0).padStart(2, '0')}
                    </Typography>
                    <Tooltip title={isNowPlaying ? 'Now Playing' : 'Play'}>
                      <IconButton onClick={() => handlePlay(track)}>
                        {isNowPlaying ? <Equalizer color="primary" /> : <PlayArrowIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Unlike">
                      <IconButton onClick={() => handleLikeToggle(track)}>
                        <FavoriteIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More">
                      <IconButton onClick={(e) => { e.stopPropagation(); openMenu(e, track); }}>
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
              </ListItem>
            );
          })}
           <Box ref={observerTarget} sx={{ height: 20 }} /> {/* Observer target */}
             {isFetchingNextPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
            </Box>
             )}
        </List>
      ) : (
        <Typography sx={{ color: 'text.secondary' }}>No liked songs found.</Typography>
      )}
       {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => { handleLikeToggle(selectedTrack); closeMenu(); }}>
          <FavoriteBorder sx={{ mr: 1 }} /> Unlike
        </MenuItem>
         <MenuItem onClick={() => { addToQueue(selectedTrack); closeMenu(); }}>
          <QueueMusicIcon sx={{ mr: 1 }} /> Add to Queue
        </MenuItem>
         <MenuItem onClick={() => { handlePlay(selectedTrack); closeMenu(); }}>
          <PlayArrowIcon sx={{ mr: 1 }} /> Play
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LikedSongs; 