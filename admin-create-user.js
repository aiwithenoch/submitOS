const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bduxfhafzxnvggchayzm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdXhmaGFmenhudmdnY2hheXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU4ODM2NywiZXhwIjoyMDk2MTY0MzY3fQ.D7oHciH7YSzOO6Je7EMpc0Eg-H4J3IDmG1c_2jqGLoI';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUser() {
    // 1. Delete the bad user
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) return console.error('List error:', listError);
    
    const badUser = users.users.find(u => u.email === 'aiwithenoch@gmail.com');
    if (badUser) {
        console.log('Deleting bad user:', badUser.id);
        const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(badUser.id);
        if (delError) console.error('Delete error:', delError);
    }
    
    // 2. Create the user cleanly via admin API
    console.log('Creating user properly...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: 'aiwithenoch@gmail.com',
        password: 'EnochAnsong@2003',
        email_confirm: true,
        user_metadata: { full_name: 'Ai Withenoch' }
    });
    
    if (error) {
        console.error('Create error:', error);
    } else {
        console.log('User created successfully:', data.user.id);
    }
}

fixUser();
