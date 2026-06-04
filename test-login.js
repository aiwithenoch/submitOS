const fetch = require('node-fetch');

const url = "https://bduxfhafzxnvggchayzm.supabase.co/auth/v1/token?grant_type=password";
const apikey = "sb_publishable_DrmfsRByqnz2jNs8pluAUQ_zQbCGIGG";

fetch(url, {
    method: 'POST',
    headers: {
        'apikey': apikey,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        email: 'aiwithenoch@gmail.com',
        password: 'EnochAnsong@2003'
    })
}).then(r => r.json()).then(console.log).catch(console.error);
