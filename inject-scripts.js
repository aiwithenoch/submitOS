const fs = require('fs');

const files = ['index.html', 'register.html', 'dashboard.html', 'billing.html', 'history.html', 'settings.html'];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove existing supabase tags if any
    content = content.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>\s*/g, '');
    content = content.replace(/<script src="supabase-client\.js"><\/script>\s*/g, '');
    content = content.replace(/<script src="auth-forms\.js"><\/script>\s*/g, '');
    
    const isAuthPage = file === 'index.html' || file === 'register.html';
    
    const scriptsToInject = `
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="supabase-client.js"></script>
    ${isAuthPage ? '<script src="auth-forms.js"></script>' : '<script src="script.js"></script>'}
</body>`;
    
    // Remove script.js before body if it exists so we can cleanly append
    content = content.replace(/<script src="script\.js"><\/script>\s*<\/body>/, '</body>');

    content = content.replace('</body>', scriptsToInject);
    
    fs.writeFileSync(file, content);
    console.log(`Injected scripts into ${file}`);
});
