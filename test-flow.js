

async function testFlow() {
  const GATEWAY_URL = 'http://localhost:8080';
  console.log('Testing flow...');

  try {
    // 1. Get Cakes
    console.log('\n--- 1. Fetching Cakes ---');
    const cakesRes = await fetch(`${GATEWAY_URL}/api/cakes`);
    const cakes = await cakesRes.json();
    console.log(`Fetched ${cakes.length} cakes`);

    // If no cakes, we might need to seed
    if (cakes.length === 0) {
      console.log('No cakes found. Please seed the database.');
    }

    // 2. Request OTP
    console.log('\n--- 2. Requesting OTP ---');
    const reqOtpRes = await fetch(`${GATEWAY_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'testuser' })
    });
    const otpData = await reqOtpRes.json();
    console.log('OTP Request Response:', otpData);

    console.log('\n--- Note: We cannot programmatically get the OTP unless we check Mailpit API ---');
    
    // Check Mailpit API for the OTP
    const mailpitRes = await fetch('http://localhost:8025/api/v1/messages');
    const mailpitData = await mailpitRes.json();
    const messages = mailpitData.messages;
    if (!messages || messages.length === 0) {
      console.log('No messages in Mailpit!');
      return;
    }
    
    const latestMessage = messages[0]; // Assuming latest is first
    const msgDetailsRes = await fetch(`http://localhost:8025/api/v1/message/${latestMessage.ID}`);
    const msgDetails = await msgDetailsRes.json();
    const text = msgDetails.Text;
    console.log('Email received from Mailpit:', text);
    
    // Extract OTP: "Your login code is: 123456. It will expire in 5 minutes."
    const match = text.match(/code is: (\d{6})/);
    if (!match) {
      console.log('Could not parse OTP from email.');
      return;
    }
    const otp = match[1];
    console.log(`Extracted OTP: ${otp}`);

    // 3. Login
    console.log('\n--- 3. Logging in ---');
    const loginRes = await fetch(`${GATEWAY_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'testuser', otp })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    const token = loginData.token;
    
    if (!token) {
        console.log('Failed to get token');
        return;
    }

    if (cakes.length > 0) {
        const cakeId = cakes[0]._id;
        // 4. Add to basket
        console.log(`\n--- 4. Adding Cake ${cakeId} to Basket ---`);
        const basketRes = await fetch(`${GATEWAY_URL}/api/basket/testuser/items`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cakeId, quantity: 2 })
        });
        console.log('Add to basket status:', basketRes.status);
        
        // 5. Checkout
        console.log('\n--- 5. Checkout ---');
        const checkoutRes = await fetch(`${GATEWAY_URL}/api/orders/checkout`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId: 'testuser' })
        });
        const checkoutData = await checkoutRes.json();
        console.log('Checkout Response:', checkoutData);
        
        // Wait a few seconds for RabbitMQ -> Notification Service -> Mailpit
        console.log('Waiting 3 seconds for notification to process...');
        await new Promise(r => setTimeout(r, 3000));
        
        // Check notifications
        const notifRes = await fetch(`${GATEWAY_URL}/api/notifications/testuser`, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        const notifData = await notifRes.json();
        console.log('\n--- 6. Notifications for testuser ---');
        console.log(notifData);
        
        // Check Mailpit again
        const mailpitRes2 = await fetch('http://localhost:8025/api/v1/messages');
        const mailpitData2 = await mailpitRes2.json();
        const latestMsg2 = mailpitData2.messages[0];
        const msgDetailsRes2 = await fetch(`http://localhost:8025/api/v1/message/${latestMsg2.ID}`);
        const msgDetails2 = await msgDetailsRes2.json();
        console.log('\n--- 7. Latest Email in Mailpit (Order Confirmation) ---');
        console.log('Subject:', msgDetails2.Subject);
        console.log('Text:', msgDetails2.Text);
    }
    
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testFlow();
