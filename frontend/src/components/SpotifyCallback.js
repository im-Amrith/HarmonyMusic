import React, { useEffect, useState } from 'react';
import { getAccessToken } from '../services/spotifyAuth';
import { useNavigate } from 'react-router-dom';

function SpotifyCallback() {
  const [status, setStatus] = useState('Loading...');
  const navigate = useNavigate();

  useEffect(() => {
    // Get the authorization code from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Exchange the code for an access token
      getAccessToken(code)
        .then(() => {
          setStatus('Login successful! Redirecting...');
          // Redirect to the home page after successful login
          setTimeout(() => navigate('/'), 2000);
        })
        .catch(error => {
          console.error('Authentication error:', error);
          setStatus('Authentication failed. Please try again.');
          // Redirect to the home page after a delay
          setTimeout(() => navigate('/'), 3000);
        });
    } else {
      setStatus('No authorization code found. Please try logging in again.');
      // Redirect to the home page after a delay
      setTimeout(() => navigate('/'), 3000);
    }
  }, [navigate]);

  return (
    <div className="spotify-callback">
      <h2>Spotify Authentication</h2>
      <p>{status}</p>
    </div>
  );
}

export default SpotifyCallback;
