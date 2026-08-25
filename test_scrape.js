const cheerio = require('cheerio');

async function testScrape(url) {
  console.log('Fetching', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });
  console.log('Response status:', response.status);
  
  if (!response.ok) return;
  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('#productTitle').text().trim();
  console.log('Title:', title);
  
  let price = $('.a-price .a-offscreen').first().text().trim();
  if (!price) price = $('#corePriceDisplay_desktop_feature_div .a-price .a-offscreen').first().text().trim();
  console.log('Price:', price);
  
  const originalPrice = $('.a-text-price .a-offscreen').first().text().trim();
  console.log('Original Price:', originalPrice);
  
  const brand = $('#bylineInfo').first().text().trim() || $('#brand').first().text().trim();
  console.log('Brand:', brand);
  
  let finalCategoryTitle = '';
  const breadcrumbs = [];
  $('#wayfinding-breadcrumbs_container ul li span.a-list-item a, .a-breadcrumb ul li span.a-list-item a').each((i, el) => {
    breadcrumbs.push($(el).text().trim().replace(/\s+/g, ' '));
  });
  console.log('Breadcrumbs:', breadcrumbs);
}

testScrape('https://www.amazon.eg/dp/B08YYNK7VQ');
