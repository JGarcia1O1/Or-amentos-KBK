require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    const rawData = fs.readFileSync('./backups/materials_backup.json', 'utf-8');
    const materials = JSON.parse(rawData);

    console.log(`Starting import of ${materials.length} materials to Supabase...`);

    // Batching to prevent timeout/rate limits (Supabase handles up to 1000 per request, but let's be safe with 200)
    const BATCH_SIZE = 200;
    
    // Optional: First clear existing data? No, let's just insert. If the user wants a clean slate, they should say so.
    // Actually, we'll just insert. Supabase will generate IDs if we don't provide them.

    let successCount = 0;
    for (let i = 0; i < materials.length; i += BATCH_SIZE) {
      const batch = materials.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.from('materials').insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      } else {
        successCount += batch.length;
        console.log(`Inserted ${successCount} / ${materials.length}`);
      }
    }

    console.log("Import completed!");

  } catch (err) {
    console.error("Critical Error:", err);
  }
}

main();
