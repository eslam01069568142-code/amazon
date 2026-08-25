const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
  });
  const page = await context.newPage();

  console.log('Navigating to production...');
  await page.goto('https://bkamelnaharda.vercel.app/', { waitUntil: 'networkidle' });

  console.log('Clicking button...');
  const buttons = page.locator('button', { hasText: 'الفئات' });
  const btnCount = await buttons.count();
  if (btnCount === 0) {
    console.log('BUTTON CLICK: ERROR - Button not found');
    await browser.close();
    return;
  }
  
  await buttons.first().click();
  await page.waitForTimeout(1000); // Wait for React to render

  const data = await page.evaluate(() => {
    const divs = document.querySelectorAll('div');
    let dropdown = null;
    let overlay = null;
    
    for (const div of divs) {
      if (div.className.includes('dropdownMenu')) {
        dropdown = div;
      }
      if (div.style.zIndex === '999' && div.style.position === 'fixed') {
        overlay = div;
      }
    }

    if (!dropdown) {
      return { found: false };
    }

    const rect = dropdown.getBoundingClientRect();
    const computed = window.getComputedStyle(dropdown);
    
    let overlayData = null;
    if (overlay) {
      const oStyle = window.getComputedStyle(overlay);
      overlayData = {
        position: oStyle.position,
        top: oStyle.top,
        left: oStyle.left,
        right: oStyle.right,
        bottom: oStyle.bottom,
        zIndex: oStyle.zIndex,
        width: oStyle.width,
        height: oStyle.height,
        pointerEvents: oStyle.pointerEvents,
      };
    }

    return {
      found: true,
      rect: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      style: {
        position: computed.position,
        top: computed.top,
        left: computed.left,
        right: computed.right,
        bottom: computed.bottom,
        zIndex: computed.zIndex,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        transform: computed.transform,
        pointerEvents: computed.pointerEvents
      },
      parent: dropdown.parentNode ? dropdown.parentNode.tagName : 'NONE',
      overlay: overlayData
    };
  });

  console.log('--- DIAGNOSTICS ---');
  console.log(JSON.stringify(data, null, 2));

  // FORCED FIXED POSITION TEST
  const forcedFixedVisible = await page.evaluate(() => {
    const divs = document.querySelectorAll('div');
    let dropdown = null;
    for (const div of divs) {
      if (div.className.includes('dropdownMenu')) {
        dropdown = div;
        break;
      }
    }
    if (!dropdown) return false;
    
    dropdown.style.position = 'fixed';
    dropdown.style.top = '100px';
    dropdown.style.left = '20px';
    dropdown.style.right = 'auto';
    dropdown.style.zIndex = '999999';
    
    const rect = dropdown.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && window.getComputedStyle(dropdown).display !== 'none';
  });

  console.log('FORCED FIXED POSITION TEST:', forcedFixedVisible ? 'VISIBLE' : 'NOT VISIBLE');

  // FORCED VISIBILITY TEST
  const forcedVisVisible = await page.evaluate(() => {
    const divs = document.querySelectorAll('div');
    let dropdown = null;
    for (const div of divs) {
      if (div.className.includes('dropdownMenu')) {
        dropdown = div;
        break;
      }
    }
    if (!dropdown) return false;
    
    dropdown.style.display = 'flex';
    dropdown.style.visibility = 'visible';
    dropdown.style.opacity = '1';
    dropdown.style.transform = 'none';
    dropdown.style.zIndex = '999999';
    
    const rect = dropdown.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && window.getComputedStyle(dropdown).display !== 'none';
  });

  console.log('FORCED VISIBILITY TEST:', forcedVisVisible ? 'VISIBLE' : 'NOT VISIBLE');
  
  await browser.close();
})();
