require('dotenv').config();
const fetch = global.fetch || require('node-fetch');

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;

console.log('Listing models from', url);

fetch(url)
  .then((res) => res.json())
  .then((json) => {
    console.log(JSON.stringify(json, null, 2));
  })
  .catch((err) => {
    console.error('Fetch error:', err);
    process.exit(1);
  });
