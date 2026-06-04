const fs = require('fs');
const glob = require('glob');

const files = glob.sync('*.html');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    // Remove the entire <div class="avatar">...</div> block
    content = content.replace(/<div class="avatar">\s*<img[^>]*>\s*<\/div>/g, '');
    
    // Also just in case there are naked imgs from ui-avatars:
    content = content.replace(/<img[^>]*ui-avatars\.com[^>]*>/g, '');
    
    fs.writeFileSync(file, content, 'utf-8');
}
console.log('Avatars removed completely.');
