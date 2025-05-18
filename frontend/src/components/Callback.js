// src/components/Callback.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAccessToken } from '../services/spotifyAuth';

function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      getAccessToken(code)
        .then(() => {
          console.log('✅ Token received and stored');
          navigate('/'); // redirect to home
        })
        .catch((err) => {
          console.error('❌ Error exchanging token:', err);
        });
    } else {
      console.error('❌ No code found in URL');
    }
  }, [searchParams, navigate]);

  return <div>Authenticating with Spotify...</div>;
}

export default Callback;
