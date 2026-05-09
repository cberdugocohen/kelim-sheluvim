/**
 * Extract services from students.services JSONB field
 * and insert them into the services table.
 * 
 * Usage: node scripts/extract-services.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('🔍 Extracting services from students...\n');

  // Get all students with their services
  const { data: students, error } = await supabase
    .from('students')
    .select('*');

  if (error) {
    console.error('❌ Error fetching students:', error.message);
    process.exit(1);
  }

  console.log(`📁 Found ${students.length} students`);

  let allServices = [];

  for (const student of students) {
    const services = student.services;
    if (!services || !Array.isArray(services) || services.length === 0) continue;

    for (const svc of services) {
      allServices.push({
        title: svc.title || 'שירות',
        description: svc.description || null,
        category: svc.category || student.category_main || null,
        geographic_area: student.city || null,
        price: svc.price || (svc.type === 'free' ? 'חינם' : svc.type === 'paid' ? 'בתשלום' : null),
        images: svc.images || [],
        video_url: svc.video_url || null,
        is_approved: true,
        provider_id: student.user_id || null,
        provider_name: student.full_name || null,
        provider_image: student.profile_image || null,
        is_holiday_highlight: student.is_holiday_highlight || false,
        holiday_type: student.holiday_type || null,
        created_date: student.created_date || new Date().toISOString(),
        updated_date: student.updated_date || new Date().toISOString(),
      });
    }
  }

  console.log(`📋 Extracted ${allServices.length} services from students\n`);

  if (allServices.length === 0) {
    console.log('⚠️ No services found to import');
    return;
  }

  // Insert in batches
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < allServices.length; i += BATCH_SIZE) {
    const batch = allServices.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await supabase.from('services').insert(batch);
    
    if (insertError) {
      console.error(`  ❌ Batch error:`, insertError.message);
      // Try one by one
      for (const svc of batch) {
        const { error: singleErr } = await supabase.from('services').insert(svc);
        if (singleErr) {
          console.error(`  ⚠️ Skip "${svc.title}":`, singleErr.message);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\n✅ Inserted ${inserted}/${allServices.length} services into the services table`);
  console.log('🎉 Done!');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
