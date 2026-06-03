// Debug script to find the correct simple-icons keys
import * as si from 'simple-icons';
const want = ['openai','anthropic','google','microsoft','deepseek','jasper','notion','midjourney','ideogram','github','replit','zapier','make','n8n','perplexity','apache'];
for (const w of want) {
  const key = 'si' + w.charAt(0).toUpperCase() + w.slice(1);
  const found = si[key] ? 'FOUND' : 'NOT FOUND';
  console.log(`${w} -> ${key}: ${found}`);
}

const all = Object.keys(si);
const patterns = /Openai|Anthropic|Google|Microsoft|Notion|Midjourney|Ideogram|Github|Replit|Zapier|Make|N8n|Perplexity|Deepseek|Jasper/;
console.log('\nMatching keys:');
console.log(all.filter(k => patterns.test(k)).join('\n'));
