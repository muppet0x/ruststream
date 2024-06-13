import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StreamingComponent = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchStreams = async () => {
    try {
      const {
        data: { data },
      } = await axios.get(process.env.REACT_APP_STREAMING_ENDPOINT || 'http://localhost/stream');
      setStreams(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load streams. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const filteredStreams = streams.filter((stream) =>
    stream.title.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div data-testid="loading-indicator">Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <input 
        type="text" 
        placeholder="Search streams..." 
        onChange={(e) => setFilter(e.target.value)} 
      />
      <div className="responsive-streaming-container">
        {filteredStreams.map((stream) => (
          <div key={stream.id}>
            <h3>{stream.title}</h3>
            <p>Status: {stream.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StreamingComponent;