'use client';

import React from 'react';

export const AdminThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <div 
      className="admin-theme-root contents"
      style={{
        // Refined Pro Dark Theme (Task #8)
        '--ops-primary': '#6366f1', // indigo-500
        '--ops-dark': '#4f46e5',    // indigo-600
        '--ops-bg': '#020617',      // slate-950
        '--ops-sidebar': '#0f172a', // slate-900
        '--ops-border': '#1e293b',  // slate-800
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};
