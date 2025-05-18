import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material'; // Removed Typography, Box as they are not used here
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import Callback from './components/Callback'
// Layout components
import Layout from './components/Layout/Layout';

// Pages
import EnhancedHome from './pages/EnhancedHome'; // This should now be your full EnhancedHome component
import Login from './pages/Login';
import Register from './pages/Register';
import Playlist from './pages/Playlist';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Library from './pages/Library';
import LikedSongs from './pages/LikedSongs';
import SpotifyCallback from './components/SpotifyCallback'; // Import the new component
// Theme
import theme from './styles/theme';
import { YTMusicPlayerProvider } from './context/YTMusicPlayerContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  console.log("App_final_working: Rendering with nested layout routes.");
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <YTMusicPlayerProvider>
          <Router>
            <Routes>
              {/* Corrected Layout Route Structure */}
              <Route path="/" element={<Layout />}>
                {/* Index route for the layout - renders EnhancedHome at '/' */}
                <Route index element={<EnhancedHome />} />
                {/* Other routes nested under the layout */}
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="playlist/:id" element={<Playlist />} />
                <Route path="profile/" element={<Profile />} />
                <Route path="search" element={<Search />} />
                <Route path="library" element={<Library />} />
                <Route path="liked" element={<LikedSongs />} />
                <Route path="/callback" element={<SpotifyCallback />} />
              </Route>
            </Routes>
          </Router>
        </YTMusicPlayerProvider>
        <Toaster position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

