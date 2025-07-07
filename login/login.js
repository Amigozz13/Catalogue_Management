console.log("login.js loaded");

// Example login handler
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password})
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            document.getElementById('login-message').innerHTML = '<span class="success">Login successful!</span>';
            setTimeout(() => {
                window.location.href = '/catalogue_manager';
            }, 1500); // 1.5 seconds delay
        } else {
            document.getElementById('login-message').innerHTML = `<span class="error">${result.error}</span>`;
        }
    })
    .catch(() => {
        document.getElementById('login-message').innerHTML = '<span class="error">Network error.</span>';
    });
}
