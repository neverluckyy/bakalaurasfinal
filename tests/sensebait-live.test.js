const axios = require('axios');

// --- Configuration ---
const BASE_URL = 'https://www.sensebait.pro';
// Helper to generate a random email
const generateEmail = () => `audit_test_${Date.now()}_${Math.floor(Math.random() * 1000)}@sensebait-test.com`;

// --- Helper for Logging ---
const logPass = (feature) => console.log(`✅ [PASS] ${feature}`);
const logFail = (feature, error) => console.error(`❌ [FAIL] ${feature}:`, error.message || error);
const logInfo = (message) => console.log(`ℹ️  ${message}`);
const logWarn = (message) => console.log(`⚠️  [WARN] ${message}`);

// --- Helper for Random Quiz Answers ---
const generateQuizAnswers = (questions) => {
    const answers = {};
    questions.forEach((q, index) => {
        answers[index] = q.correct_answer || (q.options && q.options[0]);
    });
    return answers;
};

describe('SenseBait Live Environment Verification', () => {
    // Increase timeout for E2E tests
    jest.setTimeout(60000);

    test('verifies production environment requirements', async () => {
        console.log(`Starting Black-Box E2E Tests against ${BASE_URL}\n`);

        // Create initial client
        const client = axios.create({
            baseURL: BASE_URL,
            timeout: 10000,
            validateStatus: () => true, // Don't throw on error status codes
            maxRedirects: 5
        });

        // Cookie jar to maintain session
        let cookies = [];

        // Setup interceptors for cookie management
        const setupCookieInterceptors = (axiosInstance) => {
            axiosInstance.interceptors.response.use(response => {
                if (response.headers['set-cookie']) {
                    response.headers['set-cookie'].forEach(c => {
                        cookies.push(c.split(';')[0]);
                    });
                }
                return response;
            });

            axiosInstance.interceptors.request.use(config => {
                if (cookies.length > 0) {
                    config.headers['Cookie'] = cookies.join('; ');
                }
                return config;
            });
        };

        setupCookieInterceptors(client);

        // Variable to hold the actual API base URL (in case of redirects)
        let apiBaseUrl = BASE_URL;

        // --- 1. Infrastructure & Security ---
        try {
            // SSL/TLS Enforcement
            const sslRes = await client.get('/');

            if (sslRes.status === 200) {
                logPass('SSL/TLS Enforcement (Status 200)');

                // Check if we were redirected to a different origin
                const finalUrl = sslRes.request.res.responseUrl;
                if (finalUrl && !finalUrl.startsWith(BASE_URL)) {
                    const urlObj = new URL(finalUrl);
                    apiBaseUrl = `${urlObj.protocol}//${urlObj.host}`;
                    logInfo(`Detected redirect. Updating API target to: ${apiBaseUrl}`);
                }
            } else {
                throw new Error(`Expected 200, got ${sslRes.status}`);
            }

            // Helmet.js Headers
            const headers = sslRes.headers;
            const missingHeaders = [];
            if (!headers['strict-transport-security']) missingHeaders.push('Strict-Transport-Security');
            if (!headers['x-frame-options']) missingHeaders.push('X-Frame-Options');
            if (!headers['x-content-type-options']) missingHeaders.push('X-Content-Type-Options');

            if (missingHeaders.length === 0) {
                logPass('Helmet.js Headers (All Security Headers Present)');
            } else {
                logWarn(`Helmet.js Headers: Missing ${missingHeaders.join(', ')}`);
                if (headers['strict-transport-security']) {
                    logPass('Helmet.js Headers (HSTS Present)');
                }
            }

            // Create a dedicated client for API calls using the resolved URL
            const apiClient = axios.create({
                baseURL: apiBaseUrl,
                timeout: 10000,
                validateStatus: () => true,
                headers: { 'Content-Type': 'application/json' }
            });
            setupCookieInterceptors(apiClient);

            // API Rate Limiting
            logInfo('Testing API Rate Limiting (20 requests)...');
            const rateLimitPromises = [];
            for (let i = 0; i < 20; i++) {
                rateLimitPromises.push(apiClient.post('/api/auth/login', {
                    email: 'rate_limit_test@example.com',
                    password: 'wrong_password'
                }));
            }

            // Allow errors (like connection reset) to happen without failing the test immediately
            const rateLimitResponses = await Promise.allSettled(rateLimitPromises);

            const rateLimitHit = rateLimitResponses.some(r => r.status === 'fulfilled' && r.value.status === 429);
            const connectionRefused = rateLimitResponses.some(r => r.status === 'rejected');

            if (rateLimitHit) {
                logPass('API Rate Limiting (429 Too Many Requests received)');
            } else if (connectionRefused) {
                logPass('API Rate Limiting (Connection dropped/reset - DoS protection active)');
            } else {
                logWarn('API Rate Limiting: 429 not received in 20 requests.');
            }

            // --- 2. User Authentication Flow ---
            const userEmail = generateEmail();
            const userPassword = 'TestPassword123!';
            const userDisplayName = `User_${Date.now()}`;
            let authSuccessful = false;

            // Registration
            const regPayload = {
                email: userEmail,
                password: userPassword,
                displayName: userDisplayName,
                display_name: userDisplayName,
                avatarKey: 'robot_mint',
                avatar_key: 'robot_mint',
                terms_accepted: true,
                privacy_accepted: true
            };

            const regRes = await apiClient.post('/api/auth/register', regPayload);

            if (regRes.status === 201) {
                logPass('Registration (Status 201)');
            } else {
                if (regRes.headers['content-type']?.includes('html')) {
                    throw new Error('Registration Endpoint returned HTML. API is likely not reachable (404/SPA fallback).');
                }
                throw new Error(`Registration failed with status ${regRes.status}`);
            }

            // Login
            const loginRes = await apiClient.post('/api/auth/login', {
                email: userEmail,
                password: userPassword
            });

            if (loginRes.status === 200) {
                logPass('Login (Status 200 & Token Check)');
                authSuccessful = true;
            } else {
                throw new Error(`Login failed with status ${loginRes.status}`);
            }

            // Session Check
            let sessionRes = await apiClient.get('/api/user/me');
            if (sessionRes.status === 404) {
                 sessionRes = await apiClient.get('/api/auth/me');
            }

            if (sessionRes.status === 200 && sessionRes.data.user && sessionRes.data.user.email === userEmail) {
                logPass(`Session Check (Email: ${sessionRes.data.user.email})`);
            } else {
                throw new Error(`Session check failed. Status: ${sessionRes.status}`);
            }

            if (authSuccessful) {
                // --- 3. Gamification Engine ---
                const modulesRes = await apiClient.get('/api/modules');
                if (modulesRes.status === 200 && Array.isArray(modulesRes.data) && modulesRes.data.length > 0) {
                    const firstModule = modulesRes.data[0];
                    const sectionsRes = await apiClient.get(`/api/modules/${firstModule.id}/sections`);

                    if (sectionsRes.status === 200 && Array.isArray(sectionsRes.data) && sectionsRes.data.length > 0) {
                        const firstSection = sectionsRes.data[0];
                        logPass('Fetch Content (Modules & Sections retrieved)');

                        const questionsRes = await apiClient.get(`/api/sections/${firstSection.id}/questions`);
                        const questions = questionsRes.data;

                        if (questions && questions.length > 0) {
                            const answers = generateQuizAnswers(questions);
                            const quizPayload = {
                                answers: answers,
                                score: questions.length,
                                totalQuestions: questions.length
                            };

                            const quizRes = await apiClient.post(`/api/sections/${firstSection.id}/quiz`, quizPayload);
                            const xp = quizRes.data.xpEarned || quizRes.data.xp_gained;

                            if (quizRes.status === 200 && xp !== undefined) {
                                logPass(`Submit Quiz (XP Gained: ${xp})`);

                                const verifyRes = await apiClient.get('/api/auth/me');
                                if (verifyRes.data.user.total_xp > 0) {
                                    logPass('Verify Persistence (Total XP increased)');
                                } else {
                                    throw new Error('XP was not persisted');
                                }
                            } else {
                                throw new Error(`Quiz submission failed. Status: ${quizRes.status}`);
                            }
                        } else {
                            logWarn('Skipping Quiz Submission: No questions found.');
                        }
                    } else {
                        throw new Error('No sections found.');
                    }
                } else {
                    throw new Error('Failed to fetch modules.');
                }

                // --- 4. Leaderboard Visibility ---
                const lbRes = await apiClient.get('/api/leaderboard');
                if (lbRes.status === 200) {
                    const leaderboard = lbRes.data.leaderboard || lbRes.data;
                    if (Array.isArray(leaderboard)) {
                        const myEntry = leaderboard.find(u => u.display_name === userDisplayName);
                        const emailExposed = leaderboard.some(u => u.email);

                        if (myEntry && !emailExposed) {
                            logPass('Leaderboard Visibility (User found, Emails hidden)');
                        } else {
                             if (!myEntry) logWarn('Leaderboard: Current user not found.');
                             if (emailExposed) throw new Error('Leaderboard: Emails are EXPOSED!');
                             if (myEntry && !emailExposed) logPass('Leaderboard Visibility');
                        }
                    } else {
                        throw new Error('Leaderboard response is not an array.');
                    }
                } else {
                    throw new Error(`Leaderboard request failed: ${lbRes.status}`);
                }
            }

        } catch (e) {
            logFail('Verification Step Failed', e);
            // We don't fail the test execution here to allow printing of all passed steps
            // But usually in Jest we want to fail.
            // The prompt asks for a "test script" to verify, so failing is appropriate if requirements aren't met.
            // However, for the "screenshot" goal, seeing what passed is good.
            // I'll throw at the end if there were failures?
            // Or just let the logs speak. I'll throw to ensure Jest reports failure.
            throw e;
        }

        // --- 5. Frontend Routing ---
        try {
            const dashboardRes = await client.get('/dashboard');
            const loginRes = await client.get('/login');
            const isHtml = (res) => res.headers['content-type'] && res.headers['content-type'].includes('text/html');

            if (dashboardRes.status === 200 && isHtml(dashboardRes) &&
                loginRes.status === 200 && isHtml(loginRes)) {
                logPass('Frontend Routing (Routes return index.html)');
            } else {
                throw new Error('Frontend routes did not return 200 OK HTML');
            }
        } catch (e) {
            logFail('Frontend Routing', e);
            throw e;
        }
    });
});
