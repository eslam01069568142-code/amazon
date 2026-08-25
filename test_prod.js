const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR]: ${err.toString()}`));
  
  const network = [];
  page.on('request', req => {
    if(req.url().includes('supabase') || req.url().includes('api')) {
      network.push(`[REQ] ${req.url()}`);
    }
  });
  page.on('response', res => {
    if(res.url().includes('supabase') || res.url().includes('api')) {
      network.push(`[RES] ${res.url()} - ${res.status()}`);
    }
  });

  console.log('Navigating to production...');
  await page.goto('https://bkamelnaharda.vercel.app/', { waitUntil: 'networkidle0' });
  
  console.log('Finding Categories button...');
  const buttons = await page.$$('button');
  let categoryBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('الفئات')) {
      categoryBtn = btn;
      break;
    }
  }

  if (!categoryBtn) {
    console.log('ERROR: Categories button not found!');
    await browser.close();
    return;
  }

  console.log('Clicking button...');
  await categoryBtn.click();
  
  await new Promise(r => setTimeout(r, 1000));

  console.log('Evaluating DOM...');
  const portalInfo = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    let dropdown = null;
    let overlay = null;
    for(const div of Array.from(allDivs)) {
      if(div.className.includes('dropdownMenu')) {
        dropdown = div;
      }
      if(div.style.zIndex === '999' && div.style.position === 'fixed') {
        overlay = div;
      }
    }
    
    if(!dropdown) return { found: false, reason: 'No element with dropdownMenu class found in DOM.' };
    
    const computed = window.getComputedStyle(dropdown);
    const rect = dropdown.getBoundingClientRect();
    const parentNode = dropdown.parentNode ? dropdown.parentNode.nodeName : 'NONE';
    
    const links = dropdown.querySelectorAll('a');
    const itemsText = Array.from(links).map(a => a.textContent).join(', ');
    
    return {
      found: true,
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      pointerEvents: computed.pointerEvents,
      position: computed.position,
      zIndex: computed.zIndex,
      top: computed.top,
      right: computed.right,
      width: rect.width,
      height: rect.height,
      parent: parentNode,
      itemsCount: links.length,
      itemsText,
      hasOverlay: !!overlay
    };
  });
  
  console.log('\n--- DIAGNOSTICS ---');
  console.log('Logs:', logs);
  console.log('Network (Supabase/API):', network);
  console.log('DOM Portal:', portalInfo);
  
  await browser.close();
})();
