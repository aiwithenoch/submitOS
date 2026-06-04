const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    let event = req.body;
    if (typeof event === 'string') {
        event = JSON.parse(event);
    }

    console.log('Received Dodo webhook:', JSON.stringify(event));

    // Wait, Dodo Payments sends event types differently based on the resource.
    // e.g. "payment.succeeded" or "payment_succeeded" ?
    const type = event.type || event.event_type || (event.data && event.data.status);
    
    // Check if payment was successful
    if (type === 'payment.succeeded' || type === 'payment.successful' || (event.data && event.data.status === 'succeeded')) {
        const payment = event.data;
        const customerId = payment.metadata && (payment.metadata.customer_id || payment.metadata.user_id);
        
        if (customerId) {
            const supabaseUrl = 'https://bduxfhafzxnvggchayzm.supabase.co';
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdXhmaGFmenhudmdnY2hheXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU4ODM2NywiZXhwIjoyMDk2MTY0MzY3fQ.D7oHciH7YSzOO6Je7EMpc0Eg-H4J3IDmG1c_2jqGLoI';
            
            const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
            
            let creditsToAdd = 100; // Default
            if (payment.product_id === 'pdt_0NctEvIG0q9y6YofXe0wp') creditsToAdd = 50;
            else if (payment.product_id === 'pdt_0NctEzqe4C6kQjZDy8BaU') creditsToAdd = 150;
            else if (payment.product_id === 'pdt_0NctF5YejRu7ZpdvrajI8') creditsToAdd = 300;

            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('credits')
                .eq('id', customerId)
                .single();
                
            const newCredits = (profile?.credits || 0) + creditsToAdd;
            
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', customerId);
                
            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            console.log(`Successfully added ${creditsToAdd} credits to user ${customerId}`);
        }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
};
