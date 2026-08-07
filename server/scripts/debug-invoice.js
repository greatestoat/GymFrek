const http = require('http');

function req(opts, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  const loginBody = JSON.stringify({ email: 'rahulnanda9899@gmail.com', password: 'Rahul@123456' });
  const login = await req(
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
  const assignments = await req({
    hostname: 'localhost',
    port: 5002,
    path: '/api/members/7addd3cf-c761-4219-a003-8e2809bbfaee/assignments',
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('ASSIGNMENTS', assignments.statusCode, assignments.body);
  const invoice = await req({
    hostname: 'localhost',
    port: 5002,
    path: '/api/members/7addd3cf-c761-4219-a003-8e2809bbfaee/invoice',
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('INVOICE', invoice.statusCode, invoice.body);
})();