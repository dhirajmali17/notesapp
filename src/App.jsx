// src/App.jsx
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={styles.container}>
          <h1>Welcome, {user.username} 👋</h1>
          <p>You are now signed in to your Notes App.</p>
          <button style={styles.button} onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    padding: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007eb6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default App;
