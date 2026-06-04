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
    let body = req.body;
    if (typeof body === 'string') {
        body = JSON.parse(body);
    }
    const { productId, quantity = 1, customerId, documentId } = body;
    
    // Use the provided Dodo Payments API Key
    const apiKey = process.env.DODO_PAYMENTS_API_KEY || 'N3zkXB9JuMuBSaYB.DA15R27MQe83w33cfO_4Qqzpbavljz9IZIPESAdIrhhgpLTN';
    
    // Create payment session directly via Dodo REST API
    const dodoRes = await fetch('https://live.dodopayments.com/payments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: quantity,
            payment_link: true, 
            return_url: documentId ? 'https://submit-os.vercel.app/history.html?success=true' : 'https://submit-os.vercel.app/billing.html?success=true',
            metadata: {
                customer_id: customerId,
                documentId: documentId || null
            }
        })
    });

    if (!dodoRes.ok) {
        const err = await dodoRes.text();
        throw new Error(err);
    }

    const data = await dodoRes.json();
    
    res.status(200).json({ url: data.payment_link || data.url || (data.data && data.data.payment_link) || (data.data && data.data.url) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
