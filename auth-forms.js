document.addEventListener('DOMContentLoaded', () => {
    // Sign In Logic
    const signInForm = document.querySelector('form[action="dashboard.html"]');
    if (signInForm && window.location.pathname.includes('index.html')) {
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = signInForm.querySelector('button[type="submit"]');
            
            submitBtn.textContent = 'Signing in...';
            submitBtn.disabled = true;
            
            const { data, error } = await window.supabaseApp.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                alert(error.message);
                submitBtn.textContent = 'Sign In';
                submitBtn.disabled = false;
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }

    // Sign Up Logic
    const signUpForm = document.querySelector('form[action="dashboard.html"]');
    if (signUpForm && window.location.pathname.includes('register.html')) {
        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = signUpForm.querySelector('button[type="submit"]');
            
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;
            
            const { data, error } = await window.supabaseApp.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            
            if (error) {
                alert(error.message);
                submitBtn.textContent = 'Create account';
                submitBtn.disabled = false;
            } else {
                alert('Account created successfully! You can now log in.');
                window.location.href = 'index.html';
            }
        });
    }
});
