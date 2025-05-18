import React, { useState } from 'react';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  LibraryMusic as LibraryIcon,
  Add as AddIcon,
  Favorite as FavoriteIcon,
  ChevronLeft,
  ChevronRight,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import CreatePlaylistDialog from '../CreatePlaylistDialog';

const Sidebar = ({ collapsed, onCollapseToggle, mobile, playlists = [], onCreatePlaylist }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Search', icon: <SearchIcon />, path: '/search' },
    { text: 'Your Library', icon: <LibraryIcon />, path: '/library' },
    { text: 'Create Playlist', icon: <AddIcon />, action: () => setCreateDialogOpen(true) },
    { text: 'Liked Songs', icon: <FavoriteIcon />, path: '/liked' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const handleMenuClick = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Collapse Button */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'flex-end',
        p: 1,
        ...(mobile && { display: 'none' })
      }}>
        <Tooltip title={collapsed ? "Expand" : "Collapse"} placement="right">
          <IconButton onClick={onCollapseToggle}>
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <Tooltip 
            key={item.text} 
            title={collapsed ? item.text : ''} 
            placement="right"
            disableHoverListener={!collapsed}
          >
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => handleMenuClick(item)}
                selected={item.path && location.pathname === item.path}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                  borderRadius: 2,
                  transition: 'all 0.2s cubic-bezier(.47,1.64,.41,.8)',
                  bgcolor: item.path && location.pathname === item.path ? 'rgba(29,185,84,0.15)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(29,185,84,0.08)',
                    transform: 'scale(1.04)'
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 3,
                    justifyContent: 'center',
                    color: item.path && location.pathname === item.path ? '#1DB954' : 'var(--text-color)',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: collapsed ? 0 : 1,
                    whiteSpace: 'nowrap',
                    color: item.path && location.pathname === item.path ? '#1DB954' : 'var(--text-color)',
                    fontWeight: item.path && location.pathname === item.path ? 700 : 400,
                    transition: 'color 0.2s',
                  }} 
                />
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Playlists Section */}
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
          {playlists.length > 0 && playlists.map((pl) => (
            <Tooltip 
              key={pl.id} 
              title={collapsed ? pl.name : ''} 
              placement="right"
              disableHoverListener={!collapsed}
            >
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  onClick={() => navigate(`/playlist/${pl.id}`)}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2.5,
                    borderRadius: 2,
                    transition: 'all 0.2s cubic-bezier(.47,1.64,.41,.8)',
                    '&:hover': {
                      bgcolor: 'rgba(29,185,84,0.08)',
                      transform: 'scale(1.04)'
                    },
                  }}
                >
                  <ListItemText 
                    primary={pl.name} 
                    sx={{ 
                      opacity: collapsed ? 0 : 1,
                      whiteSpace: 'nowrap',
                      color: 'var(--text-color)',
                      pl: collapsed ? 0 : 4
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>

      {/* Create Playlist Dialog (Using the new component) */}
      <CreatePlaylistDialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        onCreate={onCreatePlaylist}
      />
    </Box>
  );
};

export default Sidebar;