const axios = require('axios');

async function check() {
  try {
    const loginRes = await axios.post('http://127.0.0.1:3001/api/v1/auth/login', {
      email: 'admin@nexworth.test',
      password: 'P@ssword123'
    });
    const token = loginRes.data.token;
    console.log('Login successful');
    
    const statsRes = await axios.get('http://127.0.0.1:3001/api/v1/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Stats Response:', JSON.stringify(statsRes.data, null, 2));
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

check();
