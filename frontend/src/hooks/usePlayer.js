import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from 'react-query';

export const usePlayer = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, updateVolume] = useState(50);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [setSpotifyError] = useState(null);

  // Initialize player state
  useEffect(() => {
    // Load player state from localStorage
    const savedState = JSON.parse(localStorage.getItem('playerState')) || {
      volume: 50,
      isPlaying: false,
    };

    updateVolume(savedState.volume);
    setIsPlaying(savedState.isPlaying);
  }, []);

  // Save player state to localStorage
  useEffect(() => {
    const saveState = () => {
      localStorage.setItem('playerState', JSON.stringify({
        volume,
        isPlaying,
      }));
    };

    saveState();

    // Save on volume change
    const volumeChangeHandler = () => {
      saveState();
    };

    // Save on play/pause
    const playPauseHandler = () => {
      saveState();
    };

    window.addEventListener('volumechange', volumeChangeHandler);
    window.addEventListener('play', playPauseHandler);
    window.addEventListener('pause', playPauseHandler);

    return () => {
      window.removeEventListener('volumechange', volumeChangeHandler);
      window.removeEventListener('play', playPauseHandler);
      window.removeEventListener('pause', playPauseHandler);
    };
  }, [volume, isPlaying]);

  // Handle socket events
  useEffect(() => {
    if (socket) {
      socket.on('playbackUpdate', (data) => {
        setProgress(data.progress);
        setDuration(data.duration);
        setIsPlaying(data.isPlaying);
      });

      socket.on('volumeUpdate', (data) => {
        updateVolume(data.volume);
      });

      socket.on('trackChange', (data) => {
        setCurrentTrack(data.trackId);
        setProgress(0);
        setDuration(data.duration);
        setIsPlaying(data.isPlaying);
      });
    }

    return () => {
      if (socket) {
        socket.off('playbackUpdate');
        socket.off('volumeUpdate');
        socket.off('trackChange');
      }
    };
  }, [socket]);

  // Player controls
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    socket.emit('togglePlay', { isPlaying: !isPlaying });
    if (setSpotifyError) setSpotifyError('...');
  };

  const nextTrack = () => {
    socket.emit('nextTrack');
  };

  const previousTrack = () => {
    socket.emit('previousTrack');
  };

  const seek = (position) => {
    setProgress(position);
    socket.emit('seek', { position });
  };

  const setsVolume = (newVolume) => {
    updateVolume(newVolume);
    socket.emit('setsVolume', { volume: newVolume });
  };

  return {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setsVolume,
  };
};
