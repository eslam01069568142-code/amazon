function buildAmazonAffiliateUrl(originalUrl, trackingId) {
  if (!trackingId || !originalUrl) return originalUrl;
  try {
    const isShortLink = /(?:link\.amazon|amzn\.to|amzlinks\.in)/i.test(originalUrl);
    if (isShortLink) return originalUrl;

    let fullUrl = originalUrl;
    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
       fullUrl = 'https://' + originalUrl;
    }
    const urlObj = new URL(fullUrl);
    if (!urlObj.hostname.toLowerCase().includes('amazon')) return originalUrl;

    const currentTag = urlObj.searchParams.get('tag');
    if (currentTag) {
      if (currentTag !== trackingId) {
        urlObj.searchParams.set('tag', trackingId);
      }
    } else {
      urlObj.searchParams.set('tag', trackingId);
    }
    return urlObj.toString();
  } catch (error) {
    return originalUrl;
  }
}

console.log('--- TEST 1: Amazon URL بدون Affiliate Tag ---');
const t1 = buildAmazonAffiliateUrl('https://www.amazon.eg/dp/B08XYZ123', 'my-tag-21');
console.log('Result:', t1);
console.log('Pass:', t1 === 'https://www.amazon.eg/dp/B08XYZ123?tag=my-tag-21' ? 'YES' : 'NO');

console.log('\n--- TEST 2: Amazon URL يحتوي Affiliate Tag ---');
const t2 = buildAmazonAffiliateUrl('https://www.amazon.eg/dp/B08XYZ123?tag=old-tag-20', 'my-tag-21');
console.log('Result:', t2);
console.log('Pass:', t2 === 'https://www.amazon.eg/dp/B08XYZ123?tag=my-tag-21' ? 'YES' : 'NO');

console.log('\n--- TEST 3: Existing Query Parameters ---');
const t3 = buildAmazonAffiliateUrl('https://www.amazon.eg/dp/B08XYZ123?ref=123&color=red', 'my-tag-21');
console.log('Result:', t3);
console.log('Pass:', t3.includes('tag=my-tag-21') && t3.includes('ref=123') ? 'YES' : 'NO');

console.log('\n--- TEST 4: Tracking ID Missing ---');
const t4 = buildAmazonAffiliateUrl('https://www.amazon.eg/dp/B08XYZ123', '');
console.log('Result:', t4);
console.log('Pass:', t4 === 'https://www.amazon.eg/dp/B08XYZ123' ? 'YES' : 'NO');

console.log('\n--- TEST 5: Short Link Protection ---');
const t5 = buildAmazonAffiliateUrl('https://amzn.to/3xyz', 'my-tag-21');
console.log('Result:', t5);
console.log('Pass:', t5 === 'https://amzn.to/3xyz' ? 'YES' : 'NO');
