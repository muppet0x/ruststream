import React, { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  type?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, type = "video/mp4" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [quality, setQuality] = useState<string>('720p');

  useEffect(() => {
    if(videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const playPauseVideo = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(`Quality set to ${e.target.value}`);
    setQuality(e.target.value);
  };

  return (
    <div>
      <video ref={videoRef} width="100%">
        <source src={src} type={type} />
        Your browser does not support the video tag.
      </video>
      <div>
        <button onClick={playPauseVideo}>{isPlaying ? 'Pause' : 'Play'}</button>
        
        <div>
          <label htmlFor="volume">Volume:</label>
          <input
            type="range"
            id="volume"
            name="volume"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
        
        <div>
          <label htmlFor="quality">Quality:</label>
          <select 
            name="quality" 
            id="quality" 
            value={quality} 
            onChange={handleQualityChange}>
            <option value="360p">360p</option>
            <option value="480p">480p</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;