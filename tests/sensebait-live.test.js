const axios = require('axios');

// Configuration
// Using the backend URL directly since we can't test the Netlify proxy locally/without deployment
const BACKEND_URL = 'https://bakalaurasfinal-bak.up.railway.app';

describe('SenseBait Live Backend Tests', () => {
    // 1. Health Check
    test('Backend health endpoint should return status 200', async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/health`);
            expect(response.status).toBe(200);
            expect(response.data.status).toBe('OK');
        } catch (error) {
            throw new Error(`Health check failed: ${error.message}. Is the backend running?`);
        }
    });

    // 2. Root Endpoint
    test('Backend root endpoint should be accessible', async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/`);
            expect(response.status).toBe(200);
        } catch (error) {
             throw new Error(`Root endpoint check failed: ${error.message}`);
        }
    });

    // 3. Register Endpoint (POST)
    test('Register endpoint should handle requests', async () => {
         try {
             await axios.post(`${BACKEND_URL}/api/auth/register`, {});
         } catch (error) {
             // We expect a 400 Bad Request or similar validation error,
             // NOT a 404 Not Found.
             expect(error.response).toBeDefined();
             expect(error.response.status).not.toBe(404);
         }
    });
});
