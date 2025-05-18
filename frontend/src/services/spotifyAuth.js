// spotifyAuth.js - Handles Spotify authentication using PKCE flow

// Spotify API endpoints
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';


// Your app's client ID from .env file
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
console.log('CLIENT_ID:', CLIENT_ID );
console.log('REDIRECT_URI:', REDIRECT_URI);


// The permissions we're requesting
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played', // Add this for recently played
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state'
];

// Generate a random string for the state parameter
function generateRandomString(length ) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Convert a string to base64-url format
function base64urlencode(str) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate a code verifier and challenge for PKCE
async function generateCodeChallenge() {
  const codeVerifier = generateRandomString(64);
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const codeChallenge = base64urlencode(digest);
  
  return { codeVerifier, codeChallenge };
}

// Redirect the user to Spotify's authorization page
export async function redirectToSpotifyAuthorize() {
  const { codeVerifier, codeChallenge } = await generateCodeChallenge();
  
  // Store the code verifier in localStorage to use later
  localStorage.setItem('code_verifier', codeVerifier);
  
  // Build the authorization URL with all required parameters
  const authUrl = new URL(AUTH_ENDPOINT);
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  console.log('Redirect URL:', authUrl.toString());
  
  // Redirect to Spotify's authorization page
  window.location.href = authUrl.toString();
}

// Exchange the authorization code for an access token
export async function getAccessToken(code) {
  // Get the code verifier from localStorage
  const codeVerifier = localStorage.getItem('code_verifier');
  
  if (!codeVerifier) {
    throw new Error('No code verifier found. Please try logging in again.');
  }
  
  // Prepare the request body
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: codeVerifier
  });
  
  try {
    // Make the token request
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });
    
    if (!response.ok) {
      throw new Error('HTTP status ' + response.status);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Store the tokens in localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('expires_at', Date.now() + (data.expires_in * 1000));
    
    return data;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Check if the user is logged in (has a valid access token)
export function isLoggedIn() {
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = localStorage.getItem('expires_at');
  
  return accessToken && Date.now() < expiresAt;
}

// Get the current access token
export function getToken() {
  if (isLoggedIn()) {
    return localStorage.getItem('access_token');
  }
  return null;
}

// Log the user out by removing all tokens
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('expires_at');
  localStorage.removeItem('code_verifier');
  
  // Redirect to home page
  window.location.href = '/';
}


