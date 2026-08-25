const { createClient } = require('@supabase/supabase-js');
try {
  const client = createClient('https://xyz.supabase.co', undefined);
  console.log('Client created!');
} catch (e) {
  console.log('Error:', e.message);
}
