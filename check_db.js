require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { count, error } = await supabase.from('materials').select('*', { count: 'exact', head: true });
  if (error) console.error("Error:", error);
  else console.log("Total materials in Supabase:", count);
}

check();
