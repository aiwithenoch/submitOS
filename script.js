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
});
