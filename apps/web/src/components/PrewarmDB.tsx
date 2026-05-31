'use client';

import { useEffect } from 'react';
import { config } from '../config';

/**
 * PrewarmDB Component
 * 
 * Automatically wakes up the serverless database (Neon Postgres) when the user
 * loads any page of the web application. It runs once when the app is loaded
 * in the user's browser, triggering a fire-and-forget background ping to the
 * backend's /health endpoint.
 */
export default function PrewarmDB() {
  useEffect(() => {
    const triggerPrewarm = async () => {
      try {
        // Resolve the root /health endpoint from the configured API URL
        const healthUrl = config.apiUrl.replace('/api/v1', '/health');
        
        // Fire-and-forget background call
        fetch(healthUrl, { 
          method: 'GET', 
          mode: 'cors',
          credentials: 'omit'
        }).catch(() => {
          // Silent catch to prevent console clutter during server cold starts
        });
      } catch (err) {
        // Silent catch for safety
      }
    };

    triggerPrewarm();
  }, []);

  return null; // Headless component
}
