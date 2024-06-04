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
  const [streamConfig, setStreamConfig] = useState<VideoStreamConfig>({ 
    resolution: '1080p', 
    bitrate: '4500kbps', 
    frameRate: 60 
  });
  const [streamHealth, setStreamHealth] = useState<StreamHealthStatus>({ 
    isConnected: false, 
    networkLatency: 0, 
    packetLoss: 0 
  });

  // Function to start the video stream
  const startVideoStream = async () => {
    await sendRequest('start_stream', streamConfig, () => setStreamActive(true), 'Failed to start video stream');
  };

  // Function to modify the streaming configuration
  const modifyStreamConfig = async (newConfig: VideoStreamConfig) => {
    setStreamConfig(newConfig);
    if (streamActive) {
      await sendRequest('adjust_settings', newConfig, undefined, 'Failed to modify stream config');
    }
  };

  // Reusable function for sending requests
  const sendRequest = async (
    endpoint: string,
    body: object,
    onSuccess?: () => void,
    errorMessage?: string
  ) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) onSuccess?.();
      else console.error(errorMessage || 'Request failed');
    } catch (error) {
      console.error(errorMessage || 'Request error:', error);
    }
  };

  // Effect hook for monitoring stream health
  useEffect(() => {
    const monitorStreamHealth = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/stream_health`);
        if (response.ok) {
          const currentHealth: StreamHealthStatus = await response.json();
          setStreamHealth(currentHealth);
        } else {
          console.error('Failed to fetch stream health');
        }
      } catch (error) {
        console.error('Error fetching stream health:', error);
      }
    };

    if (streamActive) {
      const healthMonitoringInterval = setInterval(monitorStreamHealth, 5000);
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