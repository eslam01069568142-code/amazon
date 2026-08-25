const links = [
  'https://link.amazon/B09YmUrY5',
  'https://link.amazon/B06Iuk7a7',
  'https://link.amazon/B021ca3vz'
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
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error importing', link, e.message);
    }
    // Wait to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
}
importLinks();
