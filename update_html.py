import os

html_files = ['index.html', 'history.html', 'settings.html']

old_content = """                <div class="user-profile">
                    <div class="avatar">
                        <img src="https://ui-avatars.com/api/?name=Ai+Withenoch&background=0D8ABC&color=fff" alt="User Avatar">
                    </div>
                    <span class="username">Ai Withenoch</span>
                </div>"""

new_content = """                <div class="profile-container">
                    <div class="profile-popup" id="profilePopup">
                        <div class="popup-header">
                            <img src="https://ui-avatars.com/api/?name=Ai+Withenoch&background=0D8ABC&color=fff" class="popup-avatar" alt="Avatar">
                            <div class="popup-user-info">
                                <span class="popup-name">Ai Withenoch</span>
                                <span class="popup-email">aiwithenoch@gmail.com</span>
                            </div>
                        </div>
                        <div class="popup-divider"></div>
                        <a href="settings.html" class="popup-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            Manage account
                        </a>
                        <a href="#" class="popup-item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            Sign out
                        </a>
                    </div>
                    <div class="user-profile" id="userProfileBtn">
                        <div class="avatar">
                            <img src="https://ui-avatars.com/api/?name=Ai+Withenoch&background=0D8ABC&color=fff" alt="User Avatar">
                        </div>
                        <span class="username">Ai Withenoch</span>
                    </div>
                </div>"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old_content, new_content)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file}")
