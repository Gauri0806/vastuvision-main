import test from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let projectId = '';

// Test credentials
const userCredentials = {
  name: 'Test Agent',
  email: `testagent_${Date.now()}@example.com`,
  password: 'TestPassword123'
};

test('VastuVision Integrated API Testing Suite', async (t) => {
  
  await t.test('1. UNIT TEST: Authentication - User Registration', async () => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userCredentials)
    });
    
    const data = await response.json();
    assert.strictEqual(response.status, 201, `Expected 201, got ${response.status} - ${data.message}`);
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Token should be generated upon registration');
    
    // Save token for subsequent tests
    authToken = data.token;
  });

  await t.test('2. UNIT TEST: Authentication - User Login', async () => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userCredentials.email,
        password: userCredentials.password
      })
    });
    
    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token, 'Token should be returned upon successful login');
    
    // Refresh token
    authToken = data.token;
  });

  await t.test('3. INTEGRATION TEST: Get User Profile', async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, userCredentials.email, 'Email should match');
  });

  await t.test('4. UNIT TEST: Project Management - Create Project', async () => {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({
        name: 'Automated Test House',
        houseType: '2bhk',
        status: 'draft'
      })
    });
    
    const data = await response.json();
    assert.strictEqual(response.status, 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.project._id, 'Project ID should be returned');
    
    projectId = data.project._id;
  });

  await t.test('5. INTEGRATION TEST: Fetch All Projects', async () => {
    const response = await fetch(`${API_URL}/projects`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.projects), 'Projects should be an array');
    assert.ok(data.projects.length >= 1, 'There should be at least one project created');
  });

  await t.test('6. INTEGRATION TEST: Vastu Engine - Score Calculation', async () => {
    // Testing Vastu Engine independent logic via Vastu endpoint
    const mockRooms = [
      { name: 'Master Bedroom', zone: 'SW' },
      { name: 'Kitchen', zone: 'SE' },
      { name: 'Living Room', zone: 'N' }
    ];

    const response = await fetch(`${API_URL}/vastu/analyze`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify({
        rooms: mockRooms,
        projectId: projectId
      })
    });
    
    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.score !== undefined, 'Vastu score should be generated');
    assert.ok(data.score >= 0 && data.score <= 100, 'Score should be between 0 and 100');
  });

  await t.test('7. UNIT TEST: Project Management - Delete Project', async () => {
    const response = await fetch(`${API_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
  });
});
