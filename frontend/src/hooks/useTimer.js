// src/hooks/useTimer.js

/**
 * ============================================
 * useTimer Hook
 * ============================================
 * 
 * Track waktu untuk setiap pertanyaan
 */

import { useState, useEffect, useRef } from 'react';

export const useTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);
  
  const start = () => {
    setIsRunning(true);
  };
  
  const stop = () => {
    setIsRunning(false);
  };
  
  const reset = () => {
    setSeconds(0);
    setIsRunning(false);
  };
  
  const getTime = () => {
    return seconds;
  };
  
  return {
    seconds,
    isRunning,
    start,
    stop,
    reset,
    getTime,
  };
};

export default useTimer;