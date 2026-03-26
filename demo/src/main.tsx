/**
 * Application entry point
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ConvexClientProvider } from './ConvexClientProvider'
import { AppIdProvider } from './components/AppIdProvider'
import { Toaster } from 'react-hot-toast'
import './index.css'
import '@vowel.to/client/css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppIdProvider>
      <ConvexClientProvider>
        <App />
        <Toaster position="top-right" />
      </ConvexClientProvider>
    </AppIdProvider>
  </React.StrictMode>,
)
