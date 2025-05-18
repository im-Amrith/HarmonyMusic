# Harmony - Modern Music App

A modern music app that allows users to listen to songs for free, featuring AI-driven recommendations, playlist creation, and social interaction capabilities.

## Features

- **User Authentication**: Sign up and log in securely using Google accounts, phone numbers, or email (using Spotify for authentication)
- **Music Streaming**: Listen to a wide array of songs using a combination of Spotify data and YouTube Music playback via a Python backend.
- **AI-Driven Recommendations**: Personalized music suggestions based on user preferences and listening history
- **Playlist Management**: Create, edit, and save playlists
- **Search Functionality**: Search for specific songs, albums, or artists using both Spotify and YouTube Music.
- **Social Features**:
  - Follow/Unfollow friends and family
  - Direct messaging with text, images, and songs
  - Collaborative playlists
  - Group chats for sharing music

## Tech Stack

- **Frontend**: React with modern UI libraries
- **Backend**: Python with FastAPI (for YouTube Music integration)
- **Spotify Integration**: Frontend uses Spotify API for authentication and data.
- **YouTube Music Integration**: Python backend uses ytmusicapi for searching and playback links.
- **Node.js/Express/MongoDB/Socket.io**: (Mention if these are still planned or used for other features like social/auth beyond Spotify)

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Python 3.7+
- pip
- Spotify Developer Account (for API credentials)

### API Key Setup

1.  **Spotify API**: Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/). Create an application and note down your Client ID and Client Secret. You will need to configure a Redirect URI for your application (e.g., `http://localhost:3000/callback`).
2.  **Backend Configuration**: Create a `.env` file in the `backend/python` directory and add your Spotify credentials:
    ```dotenv
    SPOTIFY_CLIENT_ID=YOUR_SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET=YOUR_SPOTIFY_CLIENT_SECRET
    SPOTIFY_REDIRECT_URI=YOUR_SPOTIFY_REDIRECT_URI
    ```
3.  **YouTube Music API**: The `ytmusicapi` library may require initial authentication setup. Follow the instructions for [ytmusicapi authentication](https://ytmusicapi.readthedocs.io/en/latest/setup/oauth.html) to create an `oauth.json` file in the `backend/python` directory.

**Important**: Add `oauth.json` and `.env` to your `.gitignore` file to prevent committing sensitive information.

### Installation

1. Clone this repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install Python backend dependencies:
   ```bash
   cd backend/python
   pip install -r requirements.txt
   ```
   *(Create a `requirements.txt` if it doesn't exist with `fastapi`, `uvicorn`, `ytmusicapi`, `python-dotenv`)*

### Running the Application

1.  Start the Python backend server:
    ```bash
    cd backend/python
    uvicorn ytmusic_server:app --reload
    ```
2.  Start the frontend development server:
    ```bash
    cd frontend
    npm start
    ```

## Project Structure

- `/backend/node` - Node.js/Express server (if applicable)
- `/backend/python` - Python/FastAPI server for YouTube Music integration
- `/frontend` - React frontend application
- `/docs` - Documentation files

## License

MIT

#
