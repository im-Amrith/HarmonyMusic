import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  CssBaseline,
  Drawer,
  styled,
  css
} from '@mui/material';
import { 
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon 
} from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Player from '../Player/Player';

const drawerWidth = 240;
const collapsedWidth = 73;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open, collapsed }) => css`
    flex-grow: 1;
    padding: ${theme.spacing(3)};
    transition: ${theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    })};
    margin-left: ${collapsed ? collapsedWidth : 0}px;
    ${open && css`
      margin-left: ${drawerWidth}px;
      transition: ${theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      })};
    `}
  `
);

const Layout = () => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: 'var(--background-color)'
    }}>
      <CssBaseline />
      
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'var(--card-background)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          width: { sm: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)` },
          ml: { sm: `${collapsed ? collapsedWidth : drawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(collapsed && {
            width: { sm: `calc(100% - ${collapsedWidth}px)` },
            ml: { sm: `${collapsedWidth}px` },
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ 
            flexGrow: 1,
            color: 'var(--text-color)',
            fontWeight: 700
          }}>
            Harmony
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{
          width: { sm: collapsed ? collapsedWidth : drawerWidth },
          flexShrink: { sm: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(collapsed && {
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'var(--card-background)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)'
            },
          }}
        >
          <Sidebar 
            collapsed={false} 
            onCollapseToggle={handleCollapseToggle}
            mobile
          />
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: collapsed ? collapsedWidth : drawerWidth,
              backgroundColor: 'var(--card-background)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              ...(collapsed && {
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }),
            },
          }}
          open
        >
          <Sidebar 
            collapsed={collapsed} 
            onCollapseToggle={handleCollapseToggle}
          />
        </Drawer>
      </Box>

      {/* Main Content */}
      <Main open={mobileOpen} collapsed={collapsed}>
        <Toolbar /> {/* This pushes content below AppBar */}
        <Outlet />
      </Main>
      
      {/* Player */}
      <Box sx={{ 
        height: '80px',
        flexShrink: 0,
        backgroundColor: 'var(--card-background)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        ml: { sm: collapsed ? `${collapsedWidth}px` : `${drawerWidth}px` },
        width: { sm: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)` },
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>
        <Player />
      </Box>
    </Box>
  );
};

export default Layout;