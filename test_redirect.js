async function test() {
  try {
    const res = await fetch('https://link.amazon/B0aRoNoEb');
    console.log('Final URL:', res.url);
    console.log('Status:', res.status);
  } catch (err) {
    console.error(err);
  }
}
test();
