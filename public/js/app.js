// public/js/app.js
// LifePlan — Main Application JavaScript
// This script checks if the server and database are running,
// then updates the status indicators on the welcome page.

/**
 * Check server health by calling GET /api/health
 */
async function checkServerHealth() {
  const indicator = document.querySelector('#server-status .status-indicator');
  const statusText = document.getElementById('server-status-text');

  try {
    const response = await fetch('/api/health');
    const data = await response.json();

    if (data.success) {
      indicator.classList.remove('loading');
      indicator.classList.add('connected');
      statusText.textContent = 'Connected';
      statusText.style.color = 'var(--accent-green)';
    } else {
      throw new Error('Server returned unsuccessful response');
    }
  } catch (error) {
    indicator.classList.remove('loading');
    indicator.classList.add('disconnected');
    statusText.textContent = 'Offline';
    statusText.style.color = 'var(--accent-red)';
    console.error('Server health check failed:', error);
  }
}

/**
 * Check database connection by calling GET /api/db-test
 */
async function checkDatabaseConnection() {
  const indicator = document.querySelector('#db-status .status-indicator');
  const statusText = document.getElementById('db-status-text');

  try {
    const response = await fetch('/api/db-test');
    const data = await response.json();

    if (data.success && data.data.connected) {
      indicator.classList.remove('loading');
      indicator.classList.add('connected');
      statusText.textContent = 'Connected';
      statusText.style.color = 'var(--accent-green)';
    } else {
      throw new Error(data.message || 'Database not connected');
    }
  } catch (error) {
    indicator.classList.remove('loading');
    indicator.classList.add('disconnected');
    statusText.textContent = 'Not Connected';
    statusText.style.color = 'var(--accent-red)';
    console.error('Database connection check failed:', error);
  }
}

/**
 * Initialize the app — runs when the page loads
 */
async function init() {
  // Small delay so the loading animation is visible
  await new Promise(resolve => setTimeout(resolve, 800));

  // Check both server and database
  await checkServerHealth();
  await checkDatabaseConnection();
}

// Run init when the page finishes loading
document.addEventListener('DOMContentLoaded', init);
