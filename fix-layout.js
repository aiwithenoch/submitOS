const fs = require('fs');
const glob = require('glob');

const files = glob.sync('*.html');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    // 1. Fix missing </div> in logo-container
    const oldLogoHtml = `                        <span class="logo-text">CleanSubmit</span>
                    <button id="close-sidebar-btn" class="icon-btn" aria-label="Close sidebar">`;
    
    const newLogoHtml = `                        <span class="logo-text">CleanSubmit</span>
                    </div>
                    <button id="close-sidebar-btn" class="icon-btn" aria-label="Close sidebar">`;
    
    content = content.replace(oldLogoHtml, newLogoHtml);
    
    // 2. Remove avatars in HTML
    content = content.replace(/<img[^>]*class="[^"]*avatar[^"]*"[^>]*>/g, '');
    content = content.replace(/<img[^>]*id="sidebarAvatar"[^>]*>/g, '');
    content = content.replace(/<img[^>]*class="profile-avatar"[^>]*>/g, '');
    
    fs.writeFileSync(file, content, 'utf-8');
}

console.log("Fixed layout and removed avatars from HTML.");
