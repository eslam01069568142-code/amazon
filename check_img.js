const { Jimp } = require('jimp');
async function run() {
  const image = await Jimp.read('public/logo.png');
  console.log(`WIDTH: ${image.bitmap.width}, HEIGHT: ${image.bitmap.height}`);
}
run();
