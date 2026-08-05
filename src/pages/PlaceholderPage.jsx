import React from 'react';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">{title}</h1>
      <div style={{ padding: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>This page is not fully implemented in the mock yet.</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
