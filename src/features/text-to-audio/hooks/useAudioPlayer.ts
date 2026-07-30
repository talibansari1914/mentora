/*
  Purpose:
    Custom React hook to encapsulate HTML5 Audio player functionality,
    managing play, pause, stop, time tracking, seeking, and playback speed.
  Input:
    audioUrl (string | null): The URL of the generated audio track.
    initialSpeed (number, optional): Desired playback speed (defaults to 1.0).
  Outputs:
    Object containing:
      - State: isPlaying, currentTime, duration, isLoaded, error
      - Actions: play, pause, stop, seek, setSpeed
  Error Handling:
    - Catches and handles playback promise rejections (e.g., autoplay restrictions).
    - Sets an explicit error state if the audio source fails to load.
  Future:
    Can be expanded to support volume control, mute toggles, buffering states, and waveform data.
*/

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  error: string | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (timeSeconds: number) => void;
  setSpeed: (speed: number) => void;
}

export const useAudioPlayer = (
  audioUrl: string | null,
  initialSpeed: number = 1.0
): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and clean up Audio element when audioUrl changes
  useEffect(() => {
    if (!audioUrl) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setIsLoaded(false);
      setError(null);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = initialSpeed;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoaded(true);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsPlaying(false);
      setIsLoaded(false);
      setError('Failed to load the generated audio source.');
    };

    // Attach native HTML5 Audio event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Cleanup on component unmount or when audioUrl changes
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [audioUrl, initialSpeed]);

  const play = useCallback(() => {
    if (!audioRef.current || !isLoaded) return;

    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        console.error('Audio play error:', err);
        setError('Playback was prevented or interrupted.');
        setIsPlaying(false);
      });
  }, [isLoaded]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const seek = useCallback((timeSeconds: number) => {
    if (!audioRef.current) return;
    const safeTime = Math.max(0, Math.min(timeSeconds, audioRef.current.duration || 0));
    audioRef.current.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoaded,
    error,
    play,
    pause,
    stop,
    seek,
    setSpeed
  };
};