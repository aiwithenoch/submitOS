import os
import glob
import re

html_files = glob.glob('*.html')

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix missing </div> in logo-container
    old_logo_html = """                        <span class="logo-text">CleanSubmit</span>
                    <button id="close-sidebar-btn" class="icon-btn" aria-label="Close sidebar">"""
    
    new_logo_html = """                        <span class="logo-text">CleanSubmit</span>
                    </div>
                    <button id="close-sidebar-btn" class="icon-btn" aria-label="Close sidebar">"""
    
    content = content.replace(old_logo_html, new_logo_html)
    
    # 2. Remove avatars in HTML
    # We will remove <img ... avatar ...> and similar things.
    content = re.sub(r'<img[^>]*class="[^"]*avatar[^"]*"[^>]*>', '', content)
    content = re.sub(r'<img[^>]*id="sidebarAvatar"[^>]*>', '', content)
    content = re.sub(r'<img[^>]*class="profile-avatar"[^>]*>', '', content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed layout and removed avatars from HTML.")
