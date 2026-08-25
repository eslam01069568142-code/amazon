const { Jimp } = require('jimp');

async function processLogo() {
  const image = await Jimp.read('C:\\Users\\hp\\.gemini\\antigravity\\brain\\eb1a6bd0-06aa-44c2-9231-0c26677f4213\\.user_uploaded\\media__1787524736145.png');
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  
  const visited = new Uint8Array(w * h);
  const queue = [];
  
  // A color is considered background if it's close to white (or the edge color)
  // Let's sample the top-left pixel as the background color
  const bgIdx = 0;
  const bgR = image.bitmap.data[bgIdx];
  const bgG = image.bitmap.data[bgIdx+1];
  const bgB = image.bitmap.data[bgIdx+2];
  
  const colorDistance = (r, g, b, r2, g2, b2) => {
    return Math.sqrt(Math.pow(r - r2, 2) + Math.pow(g - g2, 2) + Math.pow(b - b2, 2));
  };
  
  // We will treat any pixel within a distance of 100 from white as background
  const TOLERANCE = 100;
  
  function push(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    
    const pIdx = idx * 4;
    const r = image.bitmap.data[pIdx];
    const g = image.bitmap.data[pIdx+1];
    const b = image.bitmap.data[pIdx+2];
    
    if (colorDistance(r, g, b, 255, 255, 255) < TOLERANCE) {
      visited[idx] = 1;
      queue.push({x, y});
      // Make it transparent
      image.bitmap.data[pIdx+3] = 0;
    } else {
      // It's part of the logo. Let's do some anti-aliasing edge softening by reducing alpha if it's close
      const dist = colorDistance(r, g, b, 255, 255, 255);
      if (dist < TOLERANCE + 50) {
          // Semi transparent edge
          image.bitmap.data[pIdx+3] = Math.max(0, image.bitmap.data[pIdx+3] - 100);
      }
    }
  }

  // Start flood fill from the 4 corners
  push(0, 0);
  push(w-1, 0);
  push(0, h-1);
  push(w-1, h-1);
  
  let head = 0;
  while(head < queue.length) {
    const {x, y} = queue[head++];
    push(x+1, y);
    push(x-1, y);
    push(x, y+1);
    push(x, y-1);
  }
  
  await image.write('public/logo.png');
  await image.write('src/app/icon.png');
  console.log('Flood fill background removal complete.');
}
processLogo().catch(console.error);
