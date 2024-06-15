import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StreamingComponent = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchStreams = async () => {
    try {
      const response = await axios.get(process.env.REACT_APP_STREAMING_ENDPOINT || 'http://localhost/stream');
      if (response.status === 200 && response.data && response.data.data) {
        setStreams(response.data.data);
        setLoading(false);
      } else {
        throw new Error('The data format is incorrect or the endpoint is not responding as expected.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // Handling Axios errors
        const message = err.response ? `Server responded with status code ${err.response.status}` : `Failed to reach the server: ${err.message}`;
        setError(message);
      } else {
        // Handling non-Axios errors
        setError('An unexpected error occurred. Please try again later.');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []); // Empty array ensures this effect runs only once after initial render

  const filteredStreams = streams.filter((stream) =>
    stream.title.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return <div data-testid="loading-indicator">Loading...</div>;
  if (error) return <div data-testid="error-message">{error}</div>;

  return (
    <div>
      <input 
        type="text" 
        placeholder="Search streams..." 
        onChange={(e) => setNetBarcode(e.target.value)} 
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