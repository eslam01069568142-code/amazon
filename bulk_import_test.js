const urls = [
  "https://link.amazon/B04frw23d",
  "https://link.amazon/B0fJ6M58F",
  "https://link.amazon/B07KQGTid",
  "https://link.amazon/B0cwwgmig",
  "https://amzn.to/4ioRGsr"
];

async function run() {
  try {
    const res = await fetch("http://localhost:3001/api/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ urls })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

run();
