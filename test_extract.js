const fs = require('fs');
const html = fs.readFileSync('prod2.html', 'utf8');

const regex = /<script src="(\/_next\/static\/chunks\/[a-zA-Z0-9-_\.]+\.js)"/g;
let match;
const urls = [];
while ((match = regex.exec(html)) !== null) {
  urls.push('https://bkamelnaharda.vercel.app' + match[1]);
}
console.log('Found scripts:', urls.length);
fs.writeFileSync('fetch_scripts.ps1', urls.map((url, i) => Invoke-WebRequest -Uri "" -OutFile "chunk_.js").join('\n'));
