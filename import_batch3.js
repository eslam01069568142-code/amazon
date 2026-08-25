async function importLink() {
  const link = 'https://link.amazon/B03cr2NIR';
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
    console.error('Error importing:', e.message);
  }
}
importLink();
