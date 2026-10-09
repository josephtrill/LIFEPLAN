document.addEventListener('DOMContentLoaded', () => {
  const authForm = document.getElementById('auth-form');
  const toggleBtn = document.getElementById('toggle-btn');
  const toggleText = document.getElementById('toggle-text');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const usernameGroup = document.getElementById('username-group');
  const emailLabel = document.getElementById('email-label');
  const submitBtn = document.getElementById('submit-btn');
  
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  let isLogin = true;

  // Toggle between Login and Registration mode
  toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    
    // Clear messages
    hideMessages();

    if (isLogin) {
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Log in to manage your life.';
      usernameGroup.classList.add('hidden');
      document.getElementById('username').required = false;
      emailLabel.textContent = 'Username or Email';
      submitBtn.textContent = 'LOGIN';
      toggleText.textContent = "Don't have an account?";
      toggleBtn.textContent = 'REGISTER';
    } else {
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Start your journey to self-discipline.';
      usernameGroup.classList.remove('hidden');
      document.getElementById('username').required = true;
      emailLabel.textContent = 'Email Address';
      submitBtn.textContent = 'REGISTER';
      toggleText.textContent = "Already have an account?";
      toggleBtn.textContent = 'LOGIN';
    }
  });

  // Handle Form Submission
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable button and clear messages while processing
    submitBtn.disabled = true;
    submitBtn.textContent = 'PLEASE WAIT...';
    hideMessages();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    let url = '/api/auth/login';
    let body = { usernameOrEmail: email, password };

    if (!isLogin) {
      url = '/api/auth/register';
      body = {
        username: document.getElementById('username').value,
        email: email,
        password: password
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess(isLogin ? 'Login successful! Redirecting...' : 'Registration successful! Redirecting...');
        
        // Wait 1.5 seconds then redirect
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      } else {
        // Show the error message from the backend
        showError(data.message || 'Authentication failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = isLogin ? 'LOGIN' : 'REGISTER';
      }
    } catch (error) {
      console.error('Auth Error:', error);
      showError('Unable to connect to the server. Please check your internet connection.');
      submitBtn.disabled = false;
      submitBtn.textContent = isLogin ? 'LOGIN' : 'REGISTER';
    }
  });

  // Helper functions for UI messages
  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
  }

  function showSuccess(msg) {
    successMessage.textContent = msg;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
  }

  function hideMessages() {
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
  }
});
