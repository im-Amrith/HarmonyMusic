import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, IconButton, Tooltip, CircularProgress, Tabs, Tab, InputAdornment, TextField, Menu, MenuItem, Fade, Button, Avatar, Skeleton
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder,
  QueueMusic as QueueMusicIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Album as AlbumIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getToken } from '../services/spotifyAuth';
import { usePlayer } from '../hooks/usePlayer';

const sections = [
  { label: 'Playlists', key: 'playlists' },
  { label: 'Liked Songs', key: 'liked' },
  { label: 'Albums', key: 'albums' },
  { label: 'Artists', key: 'artists' },
];

const Library = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const { togglePlay, currentTrack, isPlaying } = usePlayer();

  useEffect(() => {
    const fetchLibrary = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        // Fetch playlists
        const playlistsRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const playlistsData = await playlistsRes.json();
        setPlaylists(playlistsData.items || []);
        // Fetch liked songs
        const likedRes = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const likedData = await likedRes.json();
        setLikedTracks(likedData.items?.map(i => i.track) || []);
        // Fetch albums
        const albumsRes = await fetch('https://api.spotify.com/v1/me/albums?limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const albumsData = await albumsRes.json();
        setAlbums(albumsData.items?.map(i => i.album) || []);
        // Fetch followed artists
        const artistsRes = await fetch('https://api.spotify.com/v1/me/following?type=artist&limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const artistsData = await artistsRes.json();
        setArtists(artistsData.artists?.items || []);
      } catch (e) {
        setError('Failed to load your library. Please try again.');
      }
      setLoading(false);
    };
    fetchLibrary();
  }, []);

  // Search filter
  const filterItems = (items, key) => {
    if (!search) return items;
    if (key === 'playlists') return items.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (key === 'liked') return items.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    if (key === 'albums') return items.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    if (key === 'artists') return items.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  };

  // Context menu
  const openMenu = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  // Actions (play, like, remove, etc.)
  const handlePlay = (item, type) => {
    if (type === 'liked' || type === 'albums') {
      togglePlay(item); // Play the first track or preview
    } else if (type === 'playlists') {
      // Navigate to playlist page or play first track
      window.location.href = `/playlist/${item.id}`;
    } else if (type === 'artists') {
      window.location.href = `/profile/${item.id}`;
    }
  };

  // Remove from library (for albums, artists)
  const handleRemove = async (item, type) => {
    const token = getToken();
    if (type === 'albums') {
      await fetch(`https://api.spotify.com/v1/me/albums?ids=${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlbums(albums.filter(a => a.id !== item.id));
    } else if (type === 'artists') {
      await fetch(`https://api.spotify.com/v1/me/following?type=artist&ids=${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setArtists(artists.filter(a => a.id !== item.id));
    }
    closeMenu();
  };

  // Like/unlike a track
  const handleLike = async (track) => {
    const token = getToken();
    const isLiked = likedTracks.some(t => t.id === track.id);
    if (isLiked) {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${track.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setLikedTracks(likedTracks.filter(t => t.id !== track.id));
    } else {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${track.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      setLikedTracks([track, ...likedTracks]);
    }
    closeMenu();
  };

  // Section data
  const sectionData = {
    playlists,
    liked: likedTracks,
    albums,
    artists
  };

  return (
    <Box sx={{ p: { xs: 1, md: 4 }, position: 'relative' }}>
      <Typography variant="h3" sx={{ mb: 2, fontWeight: 700, letterSpacing: 1, textShadow: '0 2px 16px #0008' }}>
        Your Library
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        {sections.map((s, i) => <Tab key={s.key} label={s.label} />)}
      </Tabs>
      <TextField
        placeholder={`Search your ${sections[tab].label.toLowerCase()}...`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3, width: { xs: '100%', md: 400 } }}
      />
      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ bgcolor: 'rgba(24,24,24,0.7)', borderRadius: 4 }}>
                <Skeleton variant="rectangular" height={180} />
                <CardContent>
                  <Skeleton height={24} width="80%" />
                  <Skeleton height={18} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <Box sx={{ color: 'error.main', mt: 4 }}>{error}</Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', overflowX: 'auto', gap: 3, pb: 2 }}>
            {filterItems(sectionData[sections[tab].key], sections[tab].key).length === 0 ? (
              <Typography sx={{ color: 'text.secondary', mt: 4, ml: 2 }}>
                No {sections[tab].label.toLowerCase()} found.
              </Typography>
            ) : filterItems(sectionData[sections[tab].key], sections[tab].key).map((item, idx) => {
              let image = '';
              let title = '';
              let subtitle = '';
              let type = sections[tab].key;
              if (type === 'playlists') {
                image = item.images?.[0]?.url || '/default-album-cover.jpg';
                title = item.name;
                subtitle = `By ${item.owner?.display_name || 'You'}`;
              } else if (type === 'liked') {
                image = item.album?.images?.[0]?.url || '/default-album-cover.jpg';
                title = item.name;
                subtitle = item.artists?.map(a => a.name).join(', ');
              } else if (type === 'albums') {
                image = item.images?.[0]?.url || '/default-album-cover.jpg';
                title = item.name;
                subtitle = item.artists?.map(a => a.name).join(', ');
              } else if (type === 'artists') {
                image = item.images?.[0]?.url || '/default-artist.png';
                title = item.name;
                subtitle = 'Artist';
              }
              const isNowPlaying = type === 'liked' && currentTrack && currentTrack.id === item.id && isPlaying;
              const isLiked = type === 'liked' && likedTracks.some(t => t.id === item.id);
              return (
                <Fade in key={item.id || idx}>
                  <Card
                    sx={{
                      minWidth: 220,
                      maxWidth: 240,
                      bgcolor: 'rgba(24,24,24,0.7)',
                      borderRadius: 4,
                      boxShadow: isNowPlaying ? '0 0 16px 2px #1DB95455' : 6,
                      border: isNowPlaying ? '2px solid #1DB954' : '2px solid transparent',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'transform 0.2s cubic-bezier(.47,1.64,.41,.8), box-shadow 0.2s, border 0.2s',
                      '&:hover': { transform: 'scale(1.04)', boxShadow: 12 }
                    }}
                    onClick={() => handlePlay(item, type)}
                    onContextMenu={e => { e.preventDefault(); openMenu(e, { ...item, type }); }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="180"
                        image={image}
                        alt={title}
                        sx={{ borderRadius: 4, filter: isNowPlaying ? 'brightness(1.1) saturate(1.2)' : 'none' }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 1 }}>
                        {type === 'liked' && (
                          <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
                            <IconButton
                              aria-label={isLiked ? 'Unlike' : 'Like'}
                              onClick={e => { e.stopPropagation(); handleLike(item); }}
                              sx={{ color: isLiked ? '#1DB954' : '#fff', bgcolor: 'rgba(0,0,0,0.5)' }}
                            >
                              {isLiked ? <FavoriteIcon /> : <FavoriteBorder />}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="More">
                          <IconButton
                            aria-label="More"
                            onClick={e => { e.stopPropagation(); openMenu(e, { ...item, type }); }}
                            sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.5)' }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Fade in={isNowPlaying} unmountOnExit>
                        <Box sx={{ position: 'absolute', left: 8, top: 8, zIndex: 2 }}>
                          <PlayArrowIcon sx={{ color: '#1DB954', fontSize: 32, filter: 'drop-shadow(0 0 8px #1DB95488)' }} />
                        </Box>
                      </Fade>
                    </Box>
                    <CardContent>
                      <Typography variant="h6" gutterBottom noWrap>{title}</Typography>
                      <Typography variant="body2" color="textSecondary" noWrap>{subtitle}</Typography>
                    </CardContent>
                  </Card>
                </Fade>
              );
            })}
          </Box>
        </Box>
      )}
      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {selectedItem && selectedItem.type === 'albums' && (
          <MenuItem onClick={() => handleRemove(selectedItem, 'albums')}>
            <DeleteIcon sx={{ mr: 1 }} /> Remove from Library
          </MenuItem>
        )}
        {selectedItem && selectedItem.type === 'artists' && (
          <MenuItem onClick={() => handleRemove(selectedItem, 'artists')}>
            <DeleteIcon sx={{ mr: 1 }} /> Unfollow Artist
          </MenuItem>
        )}
        {selectedItem && selectedItem.type === 'liked' && (
          <MenuItem onClick={() => handleLike(selectedItem)}>
            {likedTracks.some(t => t.id === selectedItem.id) ? <FavoriteIcon sx={{ mr: 1 }} /> : <FavoriteBorder sx={{ mr: 1 }} />} {likedTracks.some(t => t.id === selectedItem.id) ? 'Unlike' : 'Like'}
          </MenuItem>
        )}
        <MenuItem onClick={closeMenu}>
          <QueueMusicIcon sx={{ mr: 1 }} /> Add to Queue
        </MenuItem>
        <MenuItem onClick={closeMenu}>
          <PlayArrowIcon sx={{ mr: 1 }} /> Play
        </MenuItem>
        <MenuItem onClick={closeMenu}>
          <AlbumIcon sx={{ mr: 1 }} /> View Details
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Library;
