import React, { createContext, useState } from 'react';

export const YTMusicPlayerContext = createContext();

export const YTMusicPlayerProvider = ({ children }) => {
  const [ytVideoId, setYtVideoId] = useState(null);
  const [ytTrack, setYtTrack] = useState(null); // { title, artist, coverImage }
  const [isPlaying, setIsPlaying] = useState(false);
  const [ytPlayingId, setYtPlayingId] = useState(null); // track.id for highlighting

  return (
    <YTMusicPlayerContext.Provider value={{
      ytVideoId,
      setYtVideoId,
      ytTrack,
      setYtTrack,
      isPlaying,
      setIsPlaying,
      ytPlayingId,
      setYtPlayingId
    }}>
      {children}
    </YTMusicPlayerContext.Provider>
  );
}; 