// Authentication module for Rigas62
// Credentials are injected at build time from GitHub Secrets
(function() {
    'use strict';

    const SESSION_KEY = 'rigas62_auth';

    // These placeholders are replaced by GitHub Actions during deployment
    const AUTH_USER = '__AUTH_USER__';
    const AUTH_PASS = '__AUTH_PASS__';

    // Verify credentials
    function verifyCredentials(username, password) {
        return username === AUTH_USER && password === AUTH_PASS;
    }

    // Check if user is authenticated
    function isAuthenticated() {
        const token = sessionStorage.getItem(SESSION_KEY);
        return token && token.startsWith('r62_');
    }

    // Set authentication
    function setAuthenticated() {
        const token = 'r62_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, token);
    }

    // Clear authentication
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }

    // Export for use in other files
    window.Rigas62Auth = {
        isAuthenticated,
        setAuthenticated,
        logout,
        verifyCredentials
    };

    // Login page logic
    if (document.getElementById('loginForm')) {
        // Already authenticated? Redirect to home
        if (isAuthenticated()) {
            window.location.href = 'index.html';
        }

        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            const container = document.querySelector('.login-container');

            if (verifyCredentials(username, password)) {
                setAuthenticated();
                window.location.href = 'index.html';
            } else {
                errorMessage.classList.add('show');
                container.classList.add('shake');
                setTimeout(() => container.classList.remove('shake'), 400);
            }
        });

        // Clear error on input
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                document.getElementById('errorMessage').classList.remove('show');
            });
        });
    }
})();
