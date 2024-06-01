import { useState, useEffect } from 'react';

interface VideoStreamConfig {
  resolution: string;
  bitrate: string;
  frameRate: number;
}

interface StreamHealthStatus {
  isConnected: boolean;
  networkLatency: number;
  packetLoss: number;
}

const useStreamControl = () => {
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [streamConfig, setStreamConfig] = useState<VideoStreamConfig>({ resolution: '1080p', bitrate: '4500kbps', frameRate: 60 });
  const [streamHealth, setStreamHealth] = useState<StreamHealthStatus>({ isConnected: false, networkLatency: 0, packetLoss: 0 });

  const startVideoStream = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/start_stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamConfig),
      });
      if (response.ok) setStreamActive(true);
      else console.error('Failed to start video stream');
    } catch (error) {
      console.error('Error starting video stream:', error);
    }
  };

  const modifyStreamConfig = async (newConfig: VideoStreamConfig) => {
    setStreamConfig(newConfig);
    if (streamActive) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/adjust_settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig),
        });
        if (!response.ok) console.error('Failed to modify stream config');
      } catch (error) {
        console.error('Error modifying stream config:', error);
      }
    }
  };

  useEffect(() => {
    if (streamActive) {
      const healthMonitoringInterval = setInterval(async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/stream_health`);
          const currentHealth: StreamHealthStatus = await response.json();
          setStreamHealth(currentHealth);
        } catch (error) {
          console.error('Error fetching stream health:', error);
        }
      }, 5000);

      return () => clearInterval(healthMonitoringInterval);
    }
  }, [streamActive]);

  return { 
    streamActive, 
    streamConfig, 
    streamHealth, 
    activateStream: startVideoStream, 
    updateStreamConfig: modifyStreamConfig 
  };
};

export default useStreamControl;