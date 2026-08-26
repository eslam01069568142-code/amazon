import https from 'https';

const url = 'https://link.amazon/B0dPKRXkS';

function follow(u) {
  https.get(u, (res) => {
    console.log('Status:', res.statusCode);
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log('Redirects to:', res.headers.location);
      follow(res.headers.location);
    } else {
      console.log('Final URL:', u);
    }
  }).on('error', console.error);
}

follow(url);
