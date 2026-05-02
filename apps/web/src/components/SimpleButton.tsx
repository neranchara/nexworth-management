import React from 'react';

export const SimpleButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    data-testid="simple-button"
  >
    {label}
  </button>
);
