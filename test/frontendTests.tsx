import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import StreamingComponent from './StreamingComponent';

const mock = new MockAdapter(axios);

const STREAMING_ENDPOINT = process.env.REACT_APP_STREAMING_ENDPOINT || 'http://localhost/stream';

const mockStreamData = {
  data: [
    { id: 1, title: 'Live Stream 1', status: 'live' },
    { id: 2, title: 'Live Stream 2', status: 'live' },
  ],
};

describe('StreamingComponent Tests', () => {
  beforeEach(() => {
    mock.reset();
  });

  it('fetches and displays stream data correctly', async () => {
    mock.onGet(STREAMING_ENDPOINT).reply(200, mockStreamToData);

    render(<StreamingComponent />);

    await waitFor(() => {
      expect(screen.getByText('Live Stream 1')).toBeInTheDocument();
      expect(screen.getByText('Live Stream 2')).toBeInTheDocument();
    });
  });

  it('displays error message on network failure', async () => {
    mock.onGet(STREAMING_ENDPOINT).networkError();

    render(<StreamingComponent />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load streams. Please try again later.')).toBeInTheDocument();
    });
  });

  it('handles slow network connection gracefully', async () => {
    mock.onGet(STREAMING_ENDPOINT).reply(() => {
      return new Promise(resolve => setTimeout(() => resolve([200, mockStreamToData]), 2000));
    });

    render(<StreamingComponent />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Live Stream 1')).toBeInTheDocument();
    });
  });

  it('retries fetching data on server error', async () => {
    mock
      .onGet(STREAMING_ENDPOINT)
      .replyOnce(500)
      .onGet(STREAMING_ENDPOINT)
      .reply(200, mockStreamData);

    render(<StreamingComponent />);

    await waitFor(() => {
      expect(screen.getByText('Live Stream 1')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('adjusts to screen size for responsive design', () => {
    render(<StreamingComponent />);
    
    fireEvent(window, new Event('resize'));
    expect(document.querySelector('.responsive-streaming-container')).toHaveStyle(`display: flex;`);
  });
});