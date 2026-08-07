const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const loginBody = JSON.stringify({ email: 'rahul@gymfrek.com', password: 'Rahul@Rahul@sys@qwer99' });
    const login = await request(
      {
        hostname: 'localhost',
        port: 5002,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginBody),
        },
      },
      loginBody
    );
    console.log('LOGIN', login.statusCode, login.body);
    if (login.statusCode !== 200) return;
    const { accessToken } = JSON.parse(login.body);
    const invoice = await request({
      hostname: 'localhost',
      port: 5002,
      path: '/api/members/7e4fad96-e27a-47e5-8ab7-9fb1dead0363/invoice',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    console.log('INVOICE', invoice.statusCode, invoice.body);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();