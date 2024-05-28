import { useState, useEffect } from 'react';

interface StreamSettings {
  resolution: string;
  bitrate: string;
  frameRate: number;
}

interface StreamHealth {
  isConnected: boolean;
  networkLatency: number;
  lostPackets: number;
}

const useVideoStream = () => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamSettings, setStreamSettings] = useState<StreamSettings>({ resolution: '1080p', bitrate: '4500kbps', frameRate: 60 });
  const [streamHealth, setStreamHealth] = useState<StreamHealth>({ isConnected: false, networkLatency: 0, lostPackets: 0 });

  const startStream = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/start_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamSettings),
      });
      if (response.ok) setIsStreaming(true);
      else console.error('Failed to start stream');
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  };

  const adjustStreamSettings = async (newSettings: StreamSettings) => {
    setStreamSettings(newSettings);
    if (isStreaming) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/adjust_settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        if (!response.ok) console.error('Failed to adjust stream settings');
      } catch (error) {
        console.error('Error adjusting stream settings:', error);
      }
    }
  };

  useEffect(() => {
    if (isStreaming) {
      const intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/stream_health`);
          const data: StreamHealth = await response.json();
          setStreamHealth(data);
        } catch (error) {
          console.error('Error fetching stream health:', error);
        }
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [isStreaming]);

  return { isStreaming, streamSettings, streamHealth, startStream, adjustStreamSettings };
};

export default useVideoStream;