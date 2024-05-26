import React, { useState, useRef, useEffect, ChangeEventHandler, MouseEventHandler } from 'react';

interface VideoPlayerProps {
  src: string;
  type?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, type = 'video/mp4' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [quality, setQuality] = useState('720p');

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.volume = volume;
  }, [volume]);

  const togglePlayPause: MouseEventHandler<HTMLButtonElement> = () => {
    const video = videoRef.current;
    if (!video) return;

    const method = video.paused ? 'play' : 'pause';
    video[method]();
    setIsPlaying(!video.paused);
  };

  const handleVolumeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleQualityChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setQuality(e.target.value);
  };

  return (
    <div>
      <video ref={videoRef} width="100%" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}>
        <source src={src} type={type} />
        Your browser does not support the video tag.
      </video>
      <div>
        <button onClick={togglePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
        <div>
          <label htmlFor="volume">Volume:</label>
          <input
            type="range"
            id="volume"
            name="volume"
            min="0"
            max="1"
            step="0.05"
            value={volume.toString()}
            onChange={handleVolumeChange}
          />
        </div>
        <div>
          <label htmlFor="quality">Quality:</label>
          <select name="quality" id="quality" value={quality} onChange={handleQualityChange}>
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