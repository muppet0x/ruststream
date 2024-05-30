import { useState, useEffect } from 'react';

interface VideoStreamSettings {
  resolution: string;
  bitrate: string;
  frameRate: number;
}

interface VideoStreamHealth {
  isConnected: boolean;
  networkLatency: number;
  lostPackets: number;
}

const useVideoStream = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [settings, setSettings] = useState<VideoStreamSettings>({ resolution: '1080p', bitrate: '4500kbps', frameRate: 60 });
  const [health, setHealth] = useState<VideoStreamHealth>({ isConnected: false, networkLatency: 0, lostPackets: 0 });

  const initiateStream = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/start_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (response.ok) setIsActive(true);
      else console.error('Failed to initiate stream');
    } catch (error) {
      console.error('Error initiating stream:', error);
    }
  };

  const updateStreamSettings = async (newSettings: VideoStreamSettings) => {
    setSettings(newSettings);
    if (isActive) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/adjust_settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        if (!response.ok) console.error('Failed to update stream settings');
      } catch (error) {
        console.error('Error updating stream settings:', error);
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      const healthCheckInterval = setInterval(async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/stream_health`);
          const currentHealth: VideoStreamHealth = await response.json();
          setHealth(currentHealth);
        } catch (error) {
          console.error('Error fetching stream health:', error);
        }
      }, 5000);

      return () => clearInterval(healthCheckInterval);
    }
  }, [isActive]);

  return { isActive, settings, health, startStream: initiateStream, adjustStreamSettings: updateStreamSettings };
};

export default useVideoStream;