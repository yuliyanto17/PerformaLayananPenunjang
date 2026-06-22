// src/hooks/useDeviceInfo.js

/**
 * ============================================
 * useDeviceInfo Hook
 * ============================================
 * 
 * Get device information untuk tracking
 */

import { useState, useEffect } from 'react';

export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);
  
  useEffect(() => {
    // Detect device type
    const getDeviceType = () => {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
      }
      return 'desktop';
    };
    
    // Get browser info
    const getBrowserInfo = () => {
      const ua = navigator.userAgent;
      let browserName = 'Unknown';
      let browserVersion = 'Unknown';
      
      if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        browserVersion = ua.match(/Firefox\/(\d+)/)?.[1];
      } else if (ua.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        browserVersion = ua.match(/Chrome\/(\d+)/)?.[1];
      } else if (ua.indexOf('Safari') > -1) {
        browserName = 'Safari';
        browserVersion = ua.match(/Version\/(\d+)/)?.[1];
      } else if (ua.indexOf('Edge') > -1) {
        browserName = 'Edge';
        browserVersion = ua.match(/Edge\/(\d+)/)?.[1];
      }
      
      return { browserName, browserVersion };
    };
    
    // Get OS info
    const getOSInfo = () => {
      const ua = navigator.userAgent;
      if (ua.indexOf('Win') > -1) return 'Windows';
      if (ua.indexOf('Mac') > -1) return 'MacOS';
      if (ua.indexOf('Linux') > -1) return 'Linux';
      if (ua.indexOf('Android') > -1) return 'Android';
      if (ua.indexOf('iOS') > -1) return 'iOS';
      return 'Unknown';
    };
    
    const { browserName, browserVersion } = getBrowserInfo();
    
    setDeviceInfo({
      device_type: getDeviceType(),
      browser_name: browserName,
      browser_version: browserVersion,
      os_name: getOSInfo(),
      screen_size: `${window.screen.width}x${window.screen.height}`,
      user_agent: navigator.userAgent,
    });
  }, []);
  
  return deviceInfo;
};

export default useDeviceInfo;