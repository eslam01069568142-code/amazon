const links = [
  'https://link.amazon/B0cISni8X',
  'https://link.amazon/B04mkgF90',
  'https://link.amazon/B046UEJj6',
  'https://link.amazon/B09w1p04f',
  'https://link.amazon/B09lgndrH',
  'https://link.amazon/B0iq8PB0E',
  'https://link.amazon/B03rVMIXF'
];

async function importLinks() {
  const results = [];
  for (const link of links) {
    console.log('Importing:', link);
    try {
      const response = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link })
      });
      const data = await response.json();
      console.log('RESULT|' + link + '|' + (data.status || 'ERROR') + '|' + (data.product?.id || '') + '|' + (data.product?.category || '') + '|' + (data.product?.title || ''));
    } catch (e) {
      console.log('RESULT|' + link + '|FAILED|' + e.message);
    }
    // Wait to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
}
importLinks();
