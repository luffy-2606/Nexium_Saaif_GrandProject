// Test script to verify n8n webhook accessibility
// Replace YOUR_N8N_WEBHOOK_URL with your actual webhook URL

const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL'; // Replace this!

async function testN8nWebhook() {
  console.log('🧪 Testing n8n webhook accessibility...');
  console.log('📍 Webhook URL:', N8N_WEBHOOK_URL);
  
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test',
        message: 'Testing webhook from production'
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Webhook is accessible!');
      console.log('📄 Response:', result);
    } else {
      console.log('❌ Webhook returned error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Failed to reach webhook:', error.message);
  }
}

testN8nWebhook();