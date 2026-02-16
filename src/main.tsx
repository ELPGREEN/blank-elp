import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize i18n before rendering
import './i18n';

const rootElement = document.getElementById("root");

if (!rootElement) {
  // Fallback if root element is not found
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:#0a192f;color:white;flex-direction:column;gap:16px;">
      <h1>ELP Green Technology</h1>
      <p>Loading error. Please refresh the page.</p>
      <button onclick="window.location.reload()" style="padding:8px 16px;background:#22c55e;color:white;border:none;border-radius:4px;cursor:pointer;">
        Reload
      </button>
    </div>
  `;
} else {
  const root = createRoot(rootElement);
  
  // Error boundary wrapper for the entire app
  try {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:#0a192f;color:white;flex-direction:column;gap:16px;">
        <h1>ELP Green Technology</h1>
        <p>An error occurred. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="padding:8px 16px;background:#22c55e;color:white;border:none;border-radius:4px;cursor:pointer;">
          Reload
        </button>
      </div>
    `;
  }
}
