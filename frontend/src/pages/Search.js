import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Chip,
  IconButton,
  Avatar,
  Fade,
  Zoom,
  CircularProgress,
  Divider,
  Paper,
  Button,
  Tooltip,
  Skeleton,
  Autocomplete,
  Collapse,
  Menu,
  MenuItem,
} from '@mui/material';
import { 
  Search as SearchIcon,
  Tune as TuneIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder,
  PlayArrow as PlayArrowIcon,
  Person as PersonIcon,
  Album as AlbumIcon,
  QueueMusic as QueueMusicIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  Whatshot as WhatshotIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Equalizer,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { usePlayer } from '../hooks/usePlayer';
import { useSocket } from '../hooks/useSocket';
import { getToken } from '../services/spotifyAuth';
import { YTMusicPlayerContext } from '../context/YTMusicPlayerContext';

const Search = ({ playlists = [], likedTracks = [], onLikeToggle, onAddToPlaylist }) => {
  const theme = useTheme();
  const { socket } = useSocket();
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    genre: [],
    year: [],
    mood: [],
  });
  const [selectedTab, setSelectedTab] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches')) || [];
    } catch {
      return [];
    }
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistTracks, setArtistTracks] = useState([]);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const { setYtVideoId, setYtTrack, setIsPlaying, ytPlayingId, setYtPlayingId } = useContext(YTMusicPlayerContext);

  // Tabs
  const tabs = [
    { label: 'Songs', value: 'track' },
    { label: 'Artists', value: 'artist' },
    { label: 'Albums', value: 'album' },
    { label: 'Playlists', value: 'playlist' },
  ];

  // Fetch search results
  const { data: searchResultsData, isLoading: loadingSearchData } = useQuery(
    ['searchResults', searchQuery, tabs[tabValue].value],
    () => 
      fetch(`/api/music/search?q=${searchQuery}&type=${tabs[tabValue].value}`)
        .then(res => res.json()),
    {
      enabled: !!searchQuery,
    }
  );

  // Handle search input change with debounce
  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      setIsSearching(true);
      // Simulate API call for suggestions
      setTimeout(() => {
        setSuggestions([
          { id: 1, text: `${query} - song` },
          { id: 2, text: `${query} - artist` },
          { id: 3, text: `${query} - album` },
        ]);
        setIsSearching(false);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  // Handle search submission
  const handleSearch = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      setSuggestions([]);
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle filter change
  const handleFilterChange = (type, value) => {
    setFilters(prev => {
      const current = [...prev[type]];
      const index = current.indexOf(value);
      
      if (index === -1) {
        current.push(value);
      } else {
        current.splice(index, 1);
      }
      
      return { ...prev, [type]: current };
    });
  };

  // Handle track click
  const handleTrackClick = (trackId) => {
    socket.emit('playTrack', { trackId });
  };

  // Handle artist click - fetch top tracks and albums
  const handleArtistClick = async (artistId, artistName) => {
    setSelectedArtist({ id: artistId, name: artistName });
    setSelectedAlbum(null);
    setAlbumTracks([]);
    setArtistAlbums([]);
    
    try {
      const token = getToken();
      // Fetch top tracks
      const tracksRes = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tracksData = await tracksRes.json();
      setArtistTracks(tracksData.tracks || []);
      
      // Fetch artist albums
      const albumsRes = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&market=US&limit=8`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const albumsData = await albumsRes.json();
      setArtistAlbums(albumsData.items || []);
    } catch (error) {
      console.error('Error fetching artist data:', error);
      setArtistTracks([]);
      setArtistAlbums([]);
    }
  };

  // Handle album click - fetch album tracks
  const handleAlbumClick = async (albumId, albumName) => {
    setSelectedAlbum({ id: albumId, name: albumName });
    setSelectedArtist(null);
    setArtistTracks([]);
    setArtistAlbums([]);
    
    try {
      const token = getToken();
      const res = await fetch(
        `https://api.spotify.com/v1/albums/${albumId}/tracks?market=US`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setAlbumTracks(data.items || []);
    } catch (error) {
      console.error('Error fetching album tracks:', error);
      setAlbumTracks([]);
    }
  };

  // Handle playlist click
  const handlePlaylistClick = (playlistId) => {
    // Navigate to playlist page
  };

  // Fetch Spotify search results
  useEffect(() => {
    const fetchSpotifySearch = async () => {
      if (!searchQuery) return setSearchResults([]);
      setLoadingSearch(true);
      try {
        const token = getToken();
        const type = tabs[tabValue].value;
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=12`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        let results = [];
        if (type === 'track') results = data.tracks?.items || [];
        if (type === 'artist') results = data.artists?.items || [];
        if (type === 'album') results = data.albums?.items || [];
        if (type === 'playlist') results = data.playlists?.items || [];
        setSearchResults(results);
      } catch (e) {
        setSearchResults([]);
      }
      setLoadingSearch(false);
    };
    fetchSpotifySearch();
  }, [searchQuery, tabValue]);

  // Like/unlike a track
  const handleLike = async (track) => {
    const token = getToken();
    const isLiked = likedTracks.some(t => t.id === track.id);
    if (isLiked) {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${track.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } else {
      await fetch(`https://api.spotify.com/v1/me/tracks?ids=${track.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    if (onLikeToggle) onLikeToggle(track);
  };

  // Add to playlist
  const handleAddToPlaylist = async (playlistId, track) => {
    const token = getToken();
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [track.uri] })
    });
    if (onAddToPlaylist) onAddToPlaylist(playlistId, track);
    setAnchorEl(null);
    setSelectedTrack(null);
  };

  // Card actions menu
  const openMenu = (event, track) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrack(track);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedTrack(null);
  };

  const handlePlay = async (track) => {
    if (track.preview_url) {
      // Play with Spotify audio logic
      togglePlay(track);
    } else {
      // Fallback to YouTube Music
      const q = `${track.name} ${track.artists?.map(a => a.name).join(' ')}`;
      const res = await fetch(`http://localhost:8000/ytmusic/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.videoId) {
        setYtVideoId(data.videoId);
        setYtTrack({
          title: track.name,
          artist: track.artists?.map(a => a.name).join(', '),
          coverImage: track.album?.images?.[0]?.url || '/default-album-cover.jpg'
        });
        setIsPlaying(true);
        setYtPlayingId(track.id);
      } else {
        alert('No playable version found on YouTube Music.');
      }
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Search Bar */}
      <Paper 
        elevation={3} 
        sx={{ 
          mb: 4, 
          p: 2, 
          borderRadius: 2,
          transition: 'all 0.3s ease',
          '&:focus-within': {
            boxShadow: 6,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search for songs, artists, albums, or playlists"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearch}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
              endAdornment: isSearching && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Advanced Search">
            <IconButton onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}>
              <TuneIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Advanced Search Options */}
        <Collapse in={showAdvancedSearch}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Filters</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>Genre:</Typography>
              {['Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic'].map(genre => (
                <Chip 
                  key={genre} 
                  label={genre} 
                  onClick={() => handleFilterChange('genre', genre)}
                  color={filters.genre.includes(genre) ? 'primary' : 'default'}
                  variant={filters.genre.includes(genre) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>Year:</Typography>
              {['2023', '2022', '2010s', '2000s', '90s'].map(year => (
                <Chip 
                  key={year} 
                  label={year} 
                  onClick={() => handleFilterChange('year', year)}
                  color={filters.year.includes(year) ? 'primary' : 'default'}
                  variant={filters.year.includes(year) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>Mood:</Typography>
              {['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic'].map(mood => (
                <Chip 
                  key={mood} 
                  label={mood} 
                  onClick={() => handleFilterChange('mood', mood)}
                  color={filters.mood.includes(mood) ? 'primary' : 'default'}
                  variant={filters.mood.includes(mood) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        </Collapse>
        
        {/* Search Suggestions */}
        {suggestions.length > 0 && (
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'absolute', 
              left: 0, 
              right: 0, 
              mt: 1, 
              zIndex: 1000,
              maxHeight: 300,
              overflow: 'auto',
              borderRadius: 2,
            }}
          >
            <List>
              {suggestions.map(suggestion => (
                <ListItem 
                  button 
                  key={suggestion.id}
                  onClick={() => setSearchQuery(suggestion.text)}
                  sx={{
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <ListItemText primary={suggestion.text} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Paper>
      
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Recent Searches</Typography>
          <List>
            {recentSearches.map((query, idx) => (
              <ListItem button key={idx} onClick={() => setSearchQuery(query)}
                sx={{ borderRadius: 1, mb: 1, '&:hover': { bgcolor: theme.palette.action.hover } }}>
                <ListItemText primary={query} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      
      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ mb: 4 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {/* Results */}
      {loadingSearch ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton height={20} width="80%" />
                  <Skeleton height={20} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {searchResults?.map((item) => {
            const isTrack = tabs[tabValue].value === 'track';
            const isLiked = isTrack && likedTracks.some(t => t.id === item.id);
            const isNowPlaying = isTrack && currentTrack && currentTrack.id === item.id && isPlaying;
            return (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card
                  tabIndex={0}
                  aria-label={`Card for ${item.name}`}
                  sx={{
                    cursor: 'pointer',
                    border: isNowPlaying ? '2px solid #1DB954' : '2px solid transparent',
                    boxShadow: isNowPlaying ? '0 0 16px 2px #1DB95455' : 6,
                    transition: 'transform 0.2s cubic-bezier(.47,1.64,.41,.8), box-shadow 0.2s, border 0.2s',
                    '&:hover, &:focus': { transform: 'scale(1.03)', boxShadow: 12 }
                  }}
                  onClick={() => {
                    if (tabs[tabValue].value === 'artist') {
                      handleArtistClick(item.id, item.name);
                    } else if (tabs[tabValue].value === 'album') {
                      handleAlbumClick(item.id, item.name);
                    }
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={item.album?.images?.[0]?.url || item.images?.[0]?.url || item.icons?.[0]?.url || '/default-album-cover.jpg'}
                      alt={item.name}
                    />
                    {isTrack && (
                      <Fade in={true}>
                        <Box sx={{
                          position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 1
                        }}>
                          <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
                            <IconButton
                              aria-label={isLiked ? 'Unlike' : 'Like'}
                              onClick={e => { e.stopPropagation(); handleLike(item); }}
                              sx={{ color: isLiked ? '#1DB954' : '#fff', bgcolor: 'rgba(0,0,0,0.5)' }}
                            >
                              {isLiked ? <FavoriteIcon /> : <FavoriteBorder />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add to Playlist">
                            <IconButton
                              aria-label="Add to Playlist"
                              onClick={e => { e.stopPropagation(); openMenu(e, item); }}
                              sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.5)' }}
                            >
                              <AddIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isNowPlaying ? 'Now Playing' : 'Play'}>
                            <IconButton
                              aria-label={isNowPlaying ? 'Now Playing' : 'Play'}
                              onClick={e => { e.stopPropagation(); handlePlay(item); }}
                              sx={{
                                color: '#fff',
                                bgcolor: isNowPlaying ? '#1DB954' : 'rgba(29,185,84,0.8)',
                                '&:hover': { bgcolor: '#1ed760' },
                                animation: isNowPlaying ? 'bounce 1s infinite' : 'none'
                              }}
                            >
                              {isNowPlaying ? <Equalizer /> : <PlayArrowIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Fade>
                    )}
                  </Box>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {item.name}
                    </Typography>
                    {isTrack && (
                      <Typography variant="body2" color="textSecondary">
                        {item.artists?.map(a => a.name).join(', ')}
                      </Typography>
                    )}
                    {tabs[tabValue].value === 'playlist' && (
                      <Typography variant="body2" color="textSecondary">
                        By {item.owner?.display_name}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      {/* Add to Playlist Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {playlists.map(pl => (
          <MenuItem key={pl.id} onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(pl.id, selectedTrack); }}>
            <QueueMusicIcon sx={{ mr: 1 }} /> {pl.name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={(e) => { e.stopPropagation(); handleAddToPlaylist('liked', selectedTrack); }}>
          <FavoriteIcon sx={{ mr: 1 }} /> Liked Songs
        </MenuItem>
      </Menu>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
      {/* Artist Details View */}
      {selectedArtist && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            {selectedArtist.name}
          </Typography>
          
          {/* Top Tracks */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Top Tracks
          </Typography>
          <List>
            {artistTracks.map((track, index) => {
              const isLiked = likedTracks.some(t => t.id === track.id);
              const isNowPlaying = currentTrack && currentTrack.id === track.id && isPlaying;
              return (
                <ListItem 
                  key={track.id} 
                  sx={{ 
                    borderRadius: 1,
                    bgcolor: isNowPlaying ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                    '&:hover': { bgcolor: theme.palette.action.hover }
                  }}
                >
                  <ListItemText 
                    primary={`${index + 1}. ${track.name}`} 
                    secondary={track.artists.map(a => a.name).join(', ')} 
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
                      <IconButton onClick={() => handleLike(track)}>
                        {isLiked ? <FavoriteIcon color="error" /> : <FavoriteBorder />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Play">
                      <IconButton onClick={() => handlePlay(track)}>
                        {isNowPlaying ? <Equalizer color="primary" /> : <PlayArrowIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              );
            })}
          </List>
          
          {/* Albums */}
          {artistAlbums.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Albums
              </Typography>
              <Grid container spacing={2}>
                {artistAlbums.map(album => (
                  <Grid item xs={6} sm={4} md={3} key={album.id}>
                    <Card 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleAlbumClick(album.id, album.name)}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={album.images?.[0]?.url || '/default-album-cover.jpg'}
                        alt={album.name}
                      />
                      <CardContent>
                        <Typography variant="subtitle1">{album.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {album.release_date?.split('-')[0]} • {album.album_type}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => {
              setSelectedArtist(null);
              setArtistTracks([]);
              setArtistAlbums([]);
            }}
          >
            Back to Search Results
          </Button>
        </Box>
      )}

      {/* Album Details View */}
      {selectedAlbum && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            {selectedAlbum.name}
          </Typography>
          
          {/* Album Tracks */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Tracks
          </Typography>
          <List>
            {albumTracks.map((track, index) => {
              const isLiked = likedTracks.some(t => t.id === track.id);
              const isNowPlaying = currentTrack && currentTrack.id === track.id && isPlaying;
              return (
                <ListItem 
                  key={track.id} 
                  sx={{ 
                    borderRadius: 1,
                    bgcolor: isNowPlaying ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                    '&:hover': { bgcolor: theme.palette.action.hover }
                  }}
                >
                  <ListItemText 
                    primary={`${index + 1}. ${track.name}`} 
                    secondary={track.artists.map(a => a.name).join(', ')} 
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
                      <IconButton onClick={() => handleLike(track)}>
                        {isLiked ? <FavoriteIcon color="error" /> : <FavoriteBorder />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Play">
                      <IconButton onClick={() => handlePlay(track)}>
                        {isNowPlaying ? <Equalizer color="primary" /> : <PlayArrowIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              );
            })}
          </List>
          
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => {
              setSelectedAlbum(null);
              setAlbumTracks([]);
            }}
          >
            Back to Search Results
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Search;
