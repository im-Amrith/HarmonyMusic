import React from 'react';
import { redirectToSpotifyAuthorize, isLoggedIn, logout } from '../services/spotifyAuth';

function SpotifyLogin() {
  const handleLogin = () => {
    console.log('Login button clicked');
    redirectToSpotifyAuthorize();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="spotify-login">
      {isLoggedIn() ? (
        <button onClick={handleLogout} className="logout-button">
          Logout from Spotify
        </button>
      ) : (
        <button onClick={handleLogin} className="login-button">
          Login with Spotify
        </button>
      )}
    </div>
  );
}

export default SpotifyLogin;
