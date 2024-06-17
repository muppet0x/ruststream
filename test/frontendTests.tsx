import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StreamingComponent = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchStreams = async () => {
    setLoading(true); // Ensure loading state is reset on subsequent calls
    try {
      const response = await axios.get(process.env.REACT_APP_STREAMING_ENDPOINT || 'http://localhost/stream');
      if (response.status === 200 && response.data && response.data.data) {
        setStreams(response.data.data);
      } else {
        // The else block might be redundant here as a non-200 response would typically throw an error.
        throw new Error('The data format is incorrect or the endpoint is not responding as expected.');
      }
    } catch (err) {
      // Error handling specifically for Axios errors
      if (axios.isAxiosError(err)) {
        // More granular error handling can be implemented here based on `err.response.status` or other properties
        const message = err.response ? `Server responded with status code ${err.response.status}` : `Failed to reach the server: ${err.message}`;
        setError(message);
      } else {
        // Generic error handling for non-Axios errors
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      // Ensure we always exit the loading state whether the request succeeds or fails
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${process.env.REACT_APP_STREAMING_ENDPOINT}`)
      .then((response) => response.json())
      .then((data) => setStreams(data))
      .catch((error) => setError("Failed to load streams"))
      .finally(() => setLoading(false));
  }, []); // Dependency array remains empty to run only once after the initial render

  // Function to handle filter changes
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredStreams = streams.filter((stream) =>
    stream.title.toLowerCase().includes(filter.toLowerCase())
  );

  // Render loading UI
  if (loading) return <div data-testid="loading-indicator">Loading...</div>;

  // Render error message UI
  if (error) return <div data-testid="error-message">{error}</div>;

  // Render streams UI
  return (
    <div>
      <input 
        type="text" 
        placeholder="Search streams..." 
        onChange={handleFilterChange} // Fixed the function call to properly update filter state
      />
      <div className="responsive-streaming-container">
        {filteredStreams.length > 0 ? (
          filteredStreams.map((stream) => (
            <div key={stream.id}>
              <h3>{stream.title}</h3>
              <p>Status: {stream.status}</p>
            </div>
          ))
        ) : (
          <p>No streams found that match your search criteria.</p>
        )}
      </div>
    </div>
  );
};

export default StreamingComponent;