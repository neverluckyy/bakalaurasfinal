const BACKEND_URL = 'https://bakalaurasfinal-production.up.railway.app';

async function verifyBackend() {
    console.log(`🔍 Verifying Backend at ${BACKEND_URL}`);
    console.log('----------------------------------------');

    // 1. Test Health Endpoint
    try {
        console.log('Testing /api/health...');
        const healthRes = await fetch(`${BACKEND_URL}/api/health`);
        const healthData = await healthRes.json();

        if (healthRes.ok) {
            console.log('✅ /api/health is OK');
            console.log('Response:', JSON.stringify(healthData, null, 2));
        } else {
            console.error('❌ /api/health failed with status:', healthRes.status);
            console.error('Response:', healthData);
        }
    } catch (error) {
        console.error('❌ /api/health connection failed:', error.message);
    }

    console.log('----------------------------------------');

    // 2. Test Root Endpoint
    try {
        console.log('Testing / ...');
        const rootRes = await fetch(`${BACKEND_URL}/`);
        const rootData = await rootRes.json();

        if (rootRes.ok) {
            console.log('✅ / is OK');
            console.log('Response:', JSON.stringify(rootData, null, 2));
        } else {
            console.error('❌ / failed with status:', rootRes.status);
        }
    } catch (error) {
        console.error('❌ / connection failed:', error.message);
    }

    console.log('----------------------------------------');

    // 3. Test Registration Endpoint
    try {
        console.log('Testing /api/auth/register ...');

        const randomEmail = `test_${Date.now()}@example.com`;
        const payload = {
            email: randomEmail,
            password: 'TestPassword123!',
            display_name: 'Test User',
            avatar_key: 'robot_coral',
            terms_accepted: true,
            privacy_accepted: true
        };

        const regRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // mimic frontend origin just in case
                'Origin': 'https://sensebait.pro'
            },
            body: JSON.stringify(payload)
        });

        const regData = await regRes.json();

        if (regRes.ok) {
            console.log('✅ Registration successful');
            console.log('User created:', regData.user ? regData.user.email : 'OK');
        } else {
            console.error('❌ Registration failed with status:', regRes.status);
            console.error('Response:', regData);
        }

    } catch (error) {
        console.error('❌ Registration connection failed:', error.message);
    }
    console.log('----------------------------------------');
}

verifyBackend();
