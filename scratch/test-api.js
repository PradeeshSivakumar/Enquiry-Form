const jwt = require('../backend/node_modules/jsonwebtoken');

async function main() {
  const token = jwt.sign(
    { id: 1, email: 'admin@test.com', role: 'admin', name: 'Admin' },
    'supersecret123',
    { expiresIn: '1h' }
  );

  console.log('Using JWT token:', token);
  
  try {
    const healthRes = await fetch('http://127.0.0.1:3000/api/health');
    console.log('Health check status:', healthRes.status, await healthRes.json());
  } catch (err) {
    console.error('API server is not running on port 3000 or could not connect:', err.message);
    process.exit(1);
  }

  const payload = {
    full_name: 'Sneha Iyer Test',
    company_name: 'Test Corp',
    email: 'sneha@test.com',
    mobile: '9876543210',
    interests: ['Product A'],
    department: 'Operations', // Existing department, invalid under new rules
    lead_category: 'Potential'
  };

  console.log('Sending PUT to update visitor 239 with invalid department...');
  const res = await fetch('http://127.0.0.1:3000/api/enquiries/239', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  console.log('Response Status:', res.status);
  const data = await res.json();
  console.log('Response Body:', data);
}

main().catch(err => {
  console.error('Error running test:', err);
});
