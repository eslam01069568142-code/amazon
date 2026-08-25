const https = require('https');
https.get('https://bkamelnaharda.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // The sections are passed as sections=[...] in the RSC payload or static props.
    // Let's find "type":"products_by_category" or just search for the sections array.
    const match = data.match(/sections(\\\":|":)\[.*?\]/g);
    if (match) {
      console.log('FOUND SECTIONS MATCHES:');
      console.log(match.join('\n\n'));
    } else {
      console.log('NO SECTIONS MATCH FOUND IN HTML');
    }
  });
}).on('error', err => console.log('ERROR:', err));
