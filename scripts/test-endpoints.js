async function testEndpoint(name, url, method, auth, expectedStatus) {
  const headers = {};
  if (auth) headers['Cookie'] = 'admin_auth=true';
  if (method !== 'GET') headers['Content-Type'] = 'application/json';
  
  const options = {
    method,
    headers,
    body: method !== 'GET' ? JSON.stringify({}) : undefined,
  };
  
  const res = await fetch(`http://localhost:3000${url}`, options);
  const status = res.status;
  const pass = status === expectedStatus || (expectedStatus === 'NOT_401' && status !== 401);
  
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: Expected ${expectedStatus}, Got ${status}`);
}

async function run() {
  console.log('--- RUNNING SECURITY TESTS ---');
  await testEndpoint('Scrape No Auth', '/api/scrape', 'POST', false, 401);
  await testEndpoint('Scrape With Auth', '/api/scrape', 'POST', true, 'NOT_401');
  
  await testEndpoint('Noon Scrape No Auth', '/api/noon-scrape', 'POST', false, 401);
  await testEndpoint('Noon Scrape With Auth', '/api/noon-scrape', 'POST', true, 'NOT_401');
  
  await testEndpoint('Categorize No Auth', '/api/categorize', 'POST', false, 401);
  await testEndpoint('Categorize With Auth', '/api/categorize', 'POST', true, 'NOT_401');
  
  await testEndpoint('Sections POST No Auth', '/api/sections', 'POST', false, 401);
  await testEndpoint('Sections POST With Auth', '/api/sections', 'POST', true, 'NOT_401');
  
  await testEndpoint('Sections PUT No Auth', '/api/sections/sec_123', 'PUT', false, 401);
  await testEndpoint('Sections GET No Auth', '/api/sections', 'GET', false, 200);
}

run();
