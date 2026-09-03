const urls = [
  'https://link.amazon/B04Z5QETZ',
  'https://link.amazon/B04M8FvJl',
  'https://link.amazon/B0dHXH3Cp',
  'https://link.amazon/B02NXGcVl',
  'https://link.amazon/B0burCJFX'
];

async function run() {
  for (const url of urls) {
    try {
      console.log(`\n--- Scraping ${url} ---`);
      const res = await fetch('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, preview: false })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Success: ${data.product?.title?.substring(0, 50)}...`);
        console.log(`ASIN: ${data.product?.id}`);
        console.log(`Price: ${data.product?.price}`);
        console.log(`Category: ${data.product?.category}`);
        console.log(`Image: ${data.product?.image}`);
        console.log(`Original URL: ${data.product?.original_url}`);
      } else {
        console.log(`❌ Failed: ${data.error || JSON.stringify(data)}`);
      }
    } catch(e) {
      console.error(`❌ Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}
run();
