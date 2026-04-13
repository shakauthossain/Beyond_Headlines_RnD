import { extractSearchIntent } from './src/services/ai.service';

async function test() {
  console.log('--- Testing Query Refinement ---');
  const queries = [
    'mideast conflcit',
    'fule price in bangladehs',
    'rohingya crisis updates'
  ];

  for (const q of queries) {
    try {
      const intent = await extractSearchIntent(q);
      console.log(`Original: "${q}"`);
      console.log(`Refined:  "${intent.refinedQuery}"`);
      console.log(`Slug:     "${intent.searchSlug}"`);
      console.log('---');
    } catch (e: any) {
      console.error(`Failed for ${q}: ${e.message}`);
    }
  }
}

test().catch(console.error);
