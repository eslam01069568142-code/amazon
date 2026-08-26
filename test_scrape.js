const url = "http://localhost:3000/api/scrape";

async function testScrape() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://link.amazon/B0dPKRXkS" })
    });
    const data = await res.json();
    console.log("Scrape API Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
testScrape();
