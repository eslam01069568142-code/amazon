async function run() {
  const url = 'https://link.amazon/B0f1EXjTd';
  try {
    console.log(`Scraping ${url}...`);
    const res = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, category: 'General', preview: false })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e.message);
  }
}
run();
