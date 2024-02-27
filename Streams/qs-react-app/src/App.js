import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import MainPage from './MainPage'; // Import the MainPage component

function App() {
  const [streamData, setStreamData] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:3000", { transports: ['websocket'] });

    socket.on('streamData', (data) => {
      console.log('Received data:', data);
      const dataArray = Array.isArray(data) ? data : [data];
      setStreamData(prevStreamData => [...dataArray, ...prevStreamData]);
    });

    socket.on('connect', () => {
      console.log('Connected to the server.');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from the server.');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <MainPage streamData={streamData} />
      <div className="sticky-footer">
          Total Messages: {streamData.length}
      </div>
    </div>
  );
}

export default App;
