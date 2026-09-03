async function triggerVercelRevalidate() {
  const url = 'https://bkamelnaharda.vercel.app/api/revalidate';
  console.log("SENDING REVALIDATION REQUEST TO VERCEL PRODUCTION:", url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Antigravity-Revalidate-Script/1.0'
      }
    });

    const status = res.status;
    const json = await res.json().catch(() => null);
    console.log(`\n==========================================`);
    console.log(`VERCEL REVALIDATE HTTP STATUS: ${status}`);
    console.log(`VERCEL REVALIDATE RESPONSE JSON:`, JSON.stringify(json, null, 2));
    console.log(`==========================================\n`);

    // Also trigger GET revalidate just in case
    const getRes = await fetch(url);
    const getStatus = getRes.status;
    const getJson = await getRes.json().catch(() => null);
    console.log(`VERCEL GET REVALIDATE STATUS: ${getStatus}`);
    console.log(`VERCEL GET REVALIDATE JSON:`, JSON.stringify(getJson, null, 2));

  } catch (err) {
    console.error("FAILED TO HIT VERCEL REVALIDATE ENDPOINT:", err.message);
  }
}

triggerVercelRevalidate();
