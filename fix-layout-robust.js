const fs = require('fs');
const glob = require('glob');

const files = glob.sync('*.html');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');

    // Fix missing </div> in logo-container
    // We match the span and the button line
    const regex = /<span class="logo-text">CleanSubmit<\/span>\s*<button id="close-sidebar-btn"/g;
    const replacement = `<span class="logo-text">CleanSubmit</span>\n                    </div>\n                    <button id="close-sidebar-btn"`;
    
    content = content.replace(regex, replacement);
    
    fs.writeFileSync(file, content, 'utf-8');
}
console.log('Fixed missing div robustly.');
