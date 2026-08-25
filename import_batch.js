const links = [
  'https://link.amazon/B08nKLC8U',
  'https://link.amazon/B01EwWEpl',
  'https://link.amazon/B0iuot8Zk',
  'https://link.amazon/B0hnBC74K',
  'https://link.amazon/B072B143H'
];

async function importLinks() {
  for (const link of links) {
    console.log('Importing:', link);
    try {
      const response = await fetch('http://localhost:3001/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link })
      });
      const data = await response.json();
      console.log('Result for', link, ':', response.status, data);
    } catch (e) {
      console.error('Error importing', link, e);
    }
    // Wait a couple seconds to avoid hammering the endpoint/amazon
    await new Promise(r => setTimeout(r, 2000));
  }
}

importLinks();
