// Supabase configuration
const SUPABASE_URL = 'https://bduxfhafzxnvggchayzm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DrmfsRByqnz2jNs8pluAUQ_zQbCGIGG';

// Initialize Supabase Client
window.supabaseApp = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State management
let currentUser = null;

async function enforceRouteGuard() {
    const { data: { session } } = await window.supabaseApp.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUIForUser(currentUser);
    } else {
        currentUser = null;
        const protectedPages = ['dashboard.html', 'billing.html', 'history.html', 'settings.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    }
}

enforceRouteGuard();

// Listen for auth state changes
window.supabaseApp.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        updateUIForUser(currentUser);
    } else {
        currentUser = null;
        // If on a protected page, redirect to login
        const protectedPages = ['dashboard.html', 'billing.html', 'history.html', 'settings.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    }
});

// Update UI elements that depend on user data
function updateUIForUser(user) {
    const emailElements = document.querySelectorAll('.popup-email');
    emailElements.forEach(el => el.textContent = user.email);
    
    // In a real app, you'd fetch the user's name and credits from the database
    // For now, we use a placeholder or split the email
    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    const nameElements = document.querySelectorAll('.popup-name, .username');
    nameElements.forEach(el => el.textContent = name);
    
    // Welcome title on dashboard
    const welcomeTitle = document.querySelector('.header-titles h1');
    if (welcomeTitle && window.location.pathname.includes('dashboard.html')) {
        welcomeTitle.textContent = `Welcome back, ${name}`;
    }
    
    // Update avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
    const avatarImages = document.querySelectorAll('.popup-avatar, .user-profile .avatar img');
    avatarImages.forEach(img => img.src = avatarUrl);
}

// Sign out function attached to window for easy access
window.signOut = async function() {
    const { error } = await window.supabaseApp.auth.signOut();
    if (error) {
        console.error('Error signing out:', error.message);
        alert('Error signing out. Please try again.');
    } else {
        window.location.href = 'index.html';
    }
};

// Add listener to sign out buttons once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Find all links or buttons with text 'Sign out'
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
        if (el.textContent.trim() === 'Sign out' && (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'DIV')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                window.signOut();
            });
        }
    });
});
