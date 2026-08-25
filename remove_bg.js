const { Jimp } = require('jimp');

async function removeWhiteBackground() {
  const image = await Jimp.read('public/logo.png');
  const targetColor = {r: 255, g: 255, b: 255};
  
  const colorDistance = (c1, c2) => {
    return Math.sqrt(
      Math.pow(c1.r - c2.r, 2) + 
      Math.pow(c1.g - c2.g, 2) + 
      Math.pow(c1.b - c2.b, 2)
    );
  };
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // If pixel is very close to white, make it transparent
    if (colorDistance({r,g,b}, targetColor) < 30) {
      this.bitmap.data[idx + 3] = 0;
    }
  });
  
  await image.write('public/logo.png');
  console.log('Background removed successfully.');
}

removeWhiteBackground().catch(console.error);
