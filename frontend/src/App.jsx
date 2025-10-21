// Example: App.js
import React, { useEffect } from 'react';
import { subscribeToPush } from './utils/pushSubscribe';

function App() {
  useEffect(() => {
    // Optional: auto-subscribe on load
    // subscribeToPush();
  }, []);

  return (
    <div>
      <h1>Push Notification Demo</h1>
      <button onClick={subscribeToPush}>Subscribe to Notifications</button>
    </div>
  );
}

export default App;
