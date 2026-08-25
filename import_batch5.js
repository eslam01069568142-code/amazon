const links = [
  'https://link.amazon/B0cG4Ical',
  'https://link.amazon/B05WguWF7'
];

async function importLinks() {
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
