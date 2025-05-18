import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  useTheme,
  Skeleton,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Chip,
  Divider,
  Badge,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
  QueueMusic as QueueMusicIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
// import { TransitionProps } from '@mui/material/transitions';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { getToken, refreshToken } from '../services/spotifyAuth';

// const Transition = React.forwardRef(function Transition(
//   props: TransitionProps & { children: React.ReactElement },
//   ref: React.Ref<unknown>,
// ) {
//   return <Slide direction="up" ref={ref} {...props} />;
// });

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 180,
  height: 180,
  border: `4px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[10],
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

const fetchWithTokenRefresh = async (url, options = {}) => {
  let token = getToken();
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  // If token expired, refresh and try again
  if (response.status === 401) {
    // await refreshToken();
    token = getToken();
    response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState({
    username: '',
    bio: ''
  });
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch Spotify profile
  const { data: userProfile, isLoading: loadingProfile, error: profileError } = useQuery(
    'userProfile',
    () => fetchWithTokenRefresh('https://api.spotify.com/v1/me')
  );

  // Fetch user's top artists (short term)
  const { data: topArtists, isLoading: loadingTopArtists } = useQuery(
    ['topArtists', userProfile?.id],
    () => fetchWithTokenRefresh('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term'),
    { enabled: !!userProfile?.id }
  );

  // Fetch user's top tracks (short term)
  const { data: topTracks, isLoading: loadingTopTracks } = useQuery(
    ['topTracks', userProfile?.id],
    () => fetchWithTokenRefresh('https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term'),
    { enabled: !!userProfile?.id }
  );

  // Fetch user's playlists
  const { data: playlists, isLoading: loadingPlaylists } = useQuery(
    ['playlists', userProfile?.id],
    () => fetchWithTokenRefresh(`https://api.spotify.com/v1/users/${userProfile?.id}/playlists?limit=4`),
    { enabled: !!userProfile?.id }
  );

  // Fetch recently played tracks
  const { data: recentlyPlayed, isLoading: loadingRecentlyPlayed } = useQuery(
    ['recentlyPlayed', userProfile?.id],
    () => fetchWithTokenRefresh('https://api.spotify.com/v1/me/player/recently-played?limit=5'),
    { enabled: !!userProfile?.id }
  );

  // Mutation for updating profile
  const updateProfileMutation = useMutation(
    (updatedData) => fetch(`/api/users/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', username]);
        setOpenEditDialog(false);
        showSnackbar('Profile updated successfully!', 'success');
      },
      onError: () => {
        showSnackbar('Failed to update profile', 'error');
      }
    }
  );

  const handleEditOpen = () => {
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      username: profileData.username,
      bio: profileData.bio
    });
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    showSnackbar('Profile link copied to clipboard!', 'success');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handlePlayTrack = (uri) => {
    // Implement play track functionality
    console.log('Playing track:', uri);
  };

  const handleViewArtist = (id) => {
    navigate(`/artist/${id}`);
  };

  const handleViewPlaylist = (id) => {
    navigate(`/playlist/${id}`);
  };

  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 },
      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, #121212 100%)`,
      minHeight: '100vh'
    }}>
      {/* Profile Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          letterSpacing: 1,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {userProfile?.display_name || 'Profile'}
        </Typography>
        
        <Box>
          <Tooltip title="Share profile">
            <IconButton onClick={handleShareProfile} sx={{ mr: 1 }}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit profile">
            <IconButton onClick={handleEditOpen}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loadingProfile ? (
        <ProfileSkeleton />
      ) : profileError ? (
        <Typography color="error">{profileError.message}</Typography>
      ) : userProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Grid container spacing={3}>
            {/* Left Column - Profile Info */}
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'sticky',
                top: 20
              }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Fab color="primary" size="small">
                      <PersonIcon />
                    </Fab>
                  }
                >
                  <StyledAvatar 
                    src={userProfile.images?.[0]?.url}
                    alt={userProfile.display_name}
                    sx={{ bgcolor: theme.palette.primary.main, }}
                  >
                    {!userProfile.images?.[0]?.url && <PersonIcon sx={{ fontSize: 80 }} />}
                  </StyledAvatar>
                </Badge>

                <Typography variant="h5" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                  {userProfile.display_name}
                </Typography>
                
                <Chip 
                  label={`${userProfile.followers?.total || 0} Followers`} 
                  size="small" 
                  sx={{ mb: 2 }} 
                />
                
                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                  {profileData.bio || 'No bio yet'}
                </Typography>
                
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>STATS</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <StatBox 
                        icon={<QueueMusicIcon />} 
                        value={playlists?.total || 0} 
                        label="Playlists" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <StatBox 
                        icon={<FavoriteIcon />} 
                        value={userProfile.followers?.total || 0} 
                        label="Followers" 
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Grid>

            {/* Middle Column - Top Artists & Your Playlists */}
            <Grid item xs={12} md={4}>
              {/* Top Artists Section */}
              <Section 
                title="Top Artists" 
                action={
                  <Button 
                    endIcon={<SettingsIcon />} 
                    size="small"
                    onClick={() => navigate('/top-artists')}
                  >
                    View All
                  </Button>
                }
              >
                {loadingTopArtists ? (
                  <ArtistGridSkeleton />
                ) : topArtists?.items?.length > 0 ? (
                  <ArtistGrid 
                    artists={topArtists.items} 
                    onArtistClick={handleViewArtist}
                  />
                ) : (
                  <Typography color="textSecondary">No top artists data available</Typography>
                )}
              </Section>

              {/* Playlists Section */}
              <Section 
                title="Your Playlists" 
                action={
                  <Tooltip title="Create playlist">
                    <Fab color="primary" size="small" onClick={() => navigate('/create-playlist')}>
                      <AddIcon />
                    </Fab>
                  </Tooltip>
                }
                sx={{ mt: 3 }}
              >
                {loadingPlaylists ? (
                  <PlaylistGridSkeleton />
                ) : playlists?.items?.length > 0 ? (
                  <PlaylistGrid 
                    playlists={playlists.items} 
                    onPlaylistClick={handleViewPlaylist}
                  />
                ) : (
                  <Typography color="textSecondary">No playlists found</Typography>
                )}
              </Section>
            </Grid>

            {/* Right Column - Recently Played */}
            <Grid item xs={12} md={5}>
              {/* Recently Played Section */}
              <Section 
                title="Recently Played"
              >
                {loadingRecentlyPlayed ? (
                  <TrackListSkeleton />
                ) : recentlyPlayed?.items?.length > 0 ? (
                  <TrackList 
                    tracks={recentlyPlayed.items.map(item => item.track)} 
                    onPlayClick={handlePlayTrack}
                  />
                ) : (
                  <Typography color="textSecondary">No recently played tracks</Typography>
                )}
              </Section>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog
        open={openEditDialog}
        // TransitionComponent={Transition}
        keepMounted
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Edit Profile</Typography>
          <IconButton onClick={handleEditClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Username"
            value={profileData.username}
            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Bio"
            value={profileData.bio}
            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleEditClose} 
            startIcon={<CloseIcon />}
            disabled={updateProfileMutation.isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            startIcon={updateProfileMutation.isLoading ? <CircularProgress size={20} /> : <CheckIcon />}
            disabled={updateProfileMutation.isLoading}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

// Reusable Section Component
const Section = ({ title, children, action, sx = {} }) => (
  <Paper sx={{ 
    p: 3, 
    borderRadius: 3,
    background: 'rgba(24,24,24,0.7)',
    backdropFilter: 'blur(10px)',
    ...sx 
  }}>
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mb: 3
    }}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {action}
    </Box>
    {children}
  </Paper>
);

// Stat Box Component
const StatBox = ({ icon, value, label }) => (
  <Paper sx={{ 
    p: 2, 
    display: 'flex', 
    alignItems: 'center',
    borderRadius: 2
  }}>
    <Box sx={{ 
      bgcolor: 'primary.main', 
      p: 1, 
      borderRadius: 1,
      mr: 2,
      display: 'flex',
      color: 'primary.contrastText'
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h6">{value}</Typography>
      <Typography variant="caption" color="textSecondary">{label}</Typography>
    </Box>
  </Paper>
);

// Skeleton Loader
const ProfileSkeleton = () => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Skeleton variant="circular" width={180} height={180} />
      <Skeleton variant="text" width="60%" height={40} sx={{ mt: 2 }}/>
      <Skeleton variant="text" width="40%" height={24}/>
      <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2, borderRadius: 2 }} />
    </Grid>
    <Grid item xs={12} md={4}>
      <Skeleton variant="text" width="30%" height={40} />
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3, borderRadius: 2 }} />
      <Skeleton variant="text" width="30%" height={40} />
      <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
    </Grid>
    <Grid item xs={12} md={5}>
      <Skeleton variant="text" width="30%" height={40} />
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} variant="rectangular" width="100%" height={70} sx={{ mb: 1, borderRadius: 2 }} />
      ))}
    </Grid>
  </Grid>
);

// Artist Grid Component
const ArtistGrid = ({ artists, onArtistClick }) => (
  <Grid container spacing={2}>
    {artists.map((artist) => (
      <Grid item xs={6} sm={4} key={artist.id}>
        <motion.div whileHover={{ scale: 1.03 }}>
          <Paper 
            sx={{ p: 2, borderRadius: 3, textAlign: 'center', cursor: 'pointer' }}
            onClick={() => onArtistClick(artist.id)}
          >
            <Avatar 
              src={artist.images?.[0]?.url}
              sx={{ width: 90, height: 90, mx: 'auto', mb: 2 }}
            />
            <Typography variant="subtitle1" noWrap>{artist.name}</Typography>
            <Typography variant="caption" color="textSecondary">
              {artist.genres?.[0] || 'Artist'}
            </Typography>
          </Paper>
        </motion.div>
      </Grid>
    ))}
  </Grid>
);

const ArtistGridSkeleton = () => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4].map((item) => (
      <Grid item xs={6} sm={4} key={item}>
        <Skeleton variant="rectangular" width="100%" height={150} sx={{ borderRadius: 3 }} />
      </Grid>
    ))}
  </Grid>
);

// Track List Component
const TrackList = ({ tracks, onPlayClick }) => (
  <List>
    {tracks.map((track) => (
      <motion.div key={track.id} whileHover={{ scale: 1.01 }}>
        <ListItem 
          sx={{ 
            mb: 1, 
            borderRadius: 2,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemAvatar>
            <Avatar 
              variant="square" 
              src={track.album?.images?.[0]?.url}
              sx={{ width: 56, height: 56, mr: 2 }}
            />
          </ListItemAvatar>
          <ListItemText 
            primary={track.name}
            secondary={`${track.artists?.map(a => a.name).join(', ')} • ${track.album?.name}`}
            secondaryTypographyProps={{ color: 'text.secondary' }}
          />
          <IconButton onClick={() => onPlayClick(track.uri)}>
            <PlayArrowIcon color="primary" />
          </IconButton>
          <IconButton>
            <FavoriteIcon color="primary" />
          </IconButton>
        </ListItem>
      </motion.div>
    ))}
  </List>
);

const TrackListSkeleton = () => (
  <List>
    {[1, 2, 3, 4, 5].map((item) => (
      <ListItem key={item} sx={{ mb: 1, borderRadius: 2 }}>
        <Skeleton variant="rectangular" width={56} height={56} sx={{ mr: 2 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
        <Skeleton variant="circular" width={40} height={40} sx={{ ml: 1 }} />
        <Skeleton variant="circular" width={40} height={40} sx={{ ml: 1 }} />
      </ListItem>
    ))}
  </List>
);

// Playlist Grid Component
const PlaylistGrid = ({ playlists, onPlaylistClick }) => (
  <Grid container spacing={2}>
    {playlists.map((playlist) => (
      <Grid item xs={12} key={playlist.id}>
        <motion.div whileHover={{ scale: 1.02 }}>
          <Paper 
            sx={{ p: 2, borderRadius: 3, display: 'flex', cursor: 'pointer' }}
            onClick={() => onPlaylistClick(playlist.id)}
          >
            <Avatar 
              variant="square" 
              src={playlist.images?.[0]?.url}
              sx={{ width: 70, height: 70, mr: 2 }}
            />
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle1" noWrap>{playlist.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {playlist.tracks?.total || 0} songs • {playlist.owner?.display_name}
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Grid>
    ))}
  </Grid>
);

const PlaylistGridSkeleton = () => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4].map((item) => (
      <Grid item xs={12} key={item}>
        <Skeleton variant="rectangular" width="100%" height={90} sx={{ borderRadius: 3 }} />
      </Grid>
    ))}
  </Grid>
);

export default Profile;