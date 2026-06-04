document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        openSidebarBtn.style.display = 'flex';
    });

    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        openSidebarBtn.style.display = 'none';
    });

    // Profile popup toggle
    const profileBtn = document.getElementById('userProfileBtn');
    const profilePopup = document.getElementById('profilePopup');

    if (profileBtn && profilePopup) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profilePopup.classList.toggle('visible');
        });

        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !profilePopup.contains(e.target)) {
                profilePopup.classList.remove('visible');
            }
        });
    }
});
