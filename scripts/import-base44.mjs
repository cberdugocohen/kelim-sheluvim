/**
 * Base44 → Supabase Data Import Script
 * 
 * Reads CSV exports from base44-export/ folder and imports them
 * into the Supabase database.
 * 
 * Usage: node scripts/import-base44.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORT_DIR = path.join(__dirname, '..', 'base44-export');

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

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CSV Parser (handles quoted multiline fields + JSON) ──
function parseCSV(content) {
  const rows = [];
  let headers = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (inQuotes) {
      if (ch === '"' && content[i + 1] === '"') {
        currentField += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        currentField += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
      } else if (ch === '\n' || (ch === '\r' && content[i + 1] === '\n')) {
        currentRow.push(currentField);
        currentField = '';
        if (ch === '\r') i++;
        i++;

        if (headers.length === 0) {
          headers = currentRow;
        } else if (currentRow.length === headers.length) {
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = currentRow[idx]; });
          rows.push(obj);
        }
        currentRow = [];
      } else {
        currentField += ch;
        i++;
      }
    }
  }

  // Last row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = currentRow[idx]; });
      rows.push(obj);
    }
  }

  return rows;
}

// ── Helpers ──
function parseJSON(val) {
  if (!val || val === '' || val === '""') return null;
  try { return JSON.parse(val); } catch { return val; }
}

function parseBool(val) {
  if (val === 'true' || val === true) return true;
  if (val === 'false' || val === false) return false;
  return null;
}

function parseDate(val) {
  if (!val || val === '') return null;
  return val;
}

function readCSV(filename) {
  const files = fs.readdirSync(EXPORT_DIR);
  // Find the latest version (with (1) suffix if exists)
  const match = files
    .filter(f => f.toLowerCase().startsWith(filename.toLowerCase()) && f.endsWith('.csv'))
    .sort((a, b) => b.length - a.length)[0]; // prefer (1) version

  if (!match) {
    console.log(`⏭️  ${filename} — file not found, skipping`);
    return null;
  }

  const content = fs.readFileSync(path.join(EXPORT_DIR, match), 'utf-8');
  const rows = parseCSV(content);
  console.log(`📁 ${match}: ${rows.length} records`);
  return rows;
}

// ── Batch insert helper (100 at a time) ──
async function batchInsert(table, rows) {
  if (!rows || rows.length === 0) return 0;
  
  let inserted = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`  ❌ Error inserting into ${table} (batch ${i}):`, error.message);
      // Try one by one
      for (const row of batch) {
        const { error: singleErr } = await supabase.from(table).insert(row);
        if (singleErr) {
          console.error(`  ⚠️  Skip row:`, singleErr.message, JSON.stringify(row).substring(0, 100));
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
    }
  }

  return inserted;
}

// ── Entity Mappers ──

function mapStudents(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    full_name: r.full_name || null,
    username: r.username || null,
    profile_image: r.profile_image || null,
    city: r.city || null,
    description: r.description || null,
    additional_images: parseJSON(r.additional_images) || [],
    weekly_video_url: r.weekly_video_url || null,
    coordinates: parseJSON(r.coordinates) || null,
    contact_info: parseJSON(r.contact_info) || {},
    contribution_details: parseJSON(r.contribution_details) || {},
    services: parseJSON(r.services) || [],
    service_areas: parseJSON(r.service_areas) || [],
    category_main: r.category_main || null,
    category_sub: r.category_sub || null,
    is_holiday_highlight: parseBool(r.is_holiday_highlight),
    holiday_type: r.holiday_type || null,
    tags: parseJSON(r.tags) || [],
    created_date: parseDate(r.created_date),
    updated_date: parseDate(r.updated_date),
  }));
}

function mapServiceCategories(rows) {
  return rows.map(r => ({
    main_category: r.main_category || null,
    sub_category: r.sub_category || null,
    is_active: parseBool(r.is_active),
    display_order: r.display_order ? parseInt(r.display_order) : null,
    created_date: parseDate(r.created_date),
  }));
}

function mapNotifications(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    type: r.type || null,
    title: r.title || null,
    message: r.message || null,
    is_read: parseBool(r.is_read),
    related_id: r.related_entity_id || r.action_url || null,
    created_date: parseDate(r.created_date),
  }));
}

function mapPrivateMessages(rows) {
  return rows.map(r => ({
    sender_id: r.sender_id || '',
    recipient_id: r.recipient_id || '',
    subject: r.subject || null,
    content: r.content || null,
    is_read: parseBool(r.is_read),
    related_post_id: r.related_post_id || null,
    created_date: parseDate(r.created_date),
  }));
}

function mapSpotlightRequests(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    personal_story: r.personal_story || null,
    business_description: r.business_description || null,
    what_i_offer: r.what_i_offer || null,
    tagline: r.tagline || null,
    images: parseJSON(r.images) || [],
    video_url: r.video_url || null,
    contact_preference: r.contact_preference || null,
    status: r.status || 'pending',
    selected_week: r.selected_week || null,
    admin_feedback: r.admin_feedback || null,
    created_date: parseDate(r.created_date),
    updated_date: parseDate(r.updated_date),
  }));
}

function mapProfileApprovals(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    student_profile_id: r.student_profile_id || null,
    type: r.type || null,
    proposed_data: parseJSON(r.proposed_data) || null,
    current_data: parseJSON(r.current_data) || null,
    changes_summary: r.changes_summary || null,
    status: r.status || 'pending',
    admin_feedback: r.admin_feedback || null,
    reviewed_by: r.reviewed_by || null,
    reviewed_at: parseDate(r.reviewed_at),
    created_date: parseDate(r.created_date),
  }));
}

function mapCategoryRequests(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    suggested_category: r.requested_category || null,
    reason: r.description || null,
    status: r.status || 'pending',
    admin_feedback: r.admin_response || null,
    created_date: parseDate(r.created_date),
  }));
}

function mapHolidaySections(rows) {
  return rows.map(r => ({
    title: r.title || null,
    description: r.subtitle || null,
    holiday_type: r.current_holiday || null,
    is_active: parseBool(r.is_active),
    created_date: parseDate(r.created_date),
    updated_date: parseDate(r.updated_date),
  }));
}

function mapPrayerRequests(rows) {
  return rows.map(r => ({
    name_for_prayer: r.name_for_prayer || null,
    request_types: parseJSON(r.request_types) || [],
    valid_for: r.valid_for || null,
    valid_until: r.valid_until || null,
    context_note: r.context_note || null,
    status: r.status || 'פעיל',
    requester_id: r.requester_id || null,
    requester_name: r.requester_name || null,
    prayers_from: parseJSON(r.prayers_from) || [],
    created_date: parseDate(r.created_date),
  }));
}

function mapServices(rows) {
  return rows.map(r => ({
    title: r.title || '',
    description: r.description || null,
    category: r.category || null,
    geographic_area: r.geographic_area || null,
    price: r.price || null,
    images: parseJSON(r.images) || [],
    video_url: r.video_url || null,
    is_approved: parseBool(r.is_approved),
    provider_id: r.provider_id || null,
    provider_name: r.provider_name || null,
    provider_image: r.provider_image || null,
    is_holiday_highlight: parseBool(r.is_holiday_highlight),
    holiday_type: r.holiday_type || null,
    created_date: parseDate(r.created_date),
    updated_date: parseDate(r.updated_date),
  }));
}

function mapCommunityPosts(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    user_name: r.user_name || null,
    content: r.content || null,
    category: r.category || null,
    likes: parseJSON(r.likes) || [],
    comments: parseJSON(r.comments) || [],
    is_active: parseBool(r.is_active) ?? true,
    created_date: parseDate(r.created_date),
    updated_date: parseDate(r.updated_date),
  }));
}

function mapGratitudePosts(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    user_name: r.user_name || null,
    content: r.content || null,
    recipient_name: r.recipient_name || null,
    likes: parseJSON(r.likes) || [],
    is_active: parseBool(r.is_active) ?? true,
    created_date: parseDate(r.created_date),
  }));
}

function mapEvents(rows) {
  return rows.map(r => ({
    title: r.title || '',
    description: r.description || null,
    event_type: r.event_type || null,
    location: r.location || null,
    is_online: parseBool(r.is_online),
    start_date: parseDate(r.start_date) || null,
    end_date: parseDate(r.end_date) || null,
    max_participants: r.max_participants ? parseInt(r.max_participants) : null,
    registration_required: parseBool(r.registration_required),
    cost: r.cost || 'חינם',
    contact_info: r.contact_info || null,
    tags: parseJSON(r.tags) || [],
    image_url: r.image_url || null,
    organizer_id: r.organizer_id || null,
    is_active: parseBool(r.is_active) ?? true,
    participants: parseJSON(r.participants) || [],
    created_date: parseDate(r.created_date),
    updated_date: parseDate(r.updated_date),
  }));
}

function mapRecommendations(rows) {
  return rows.map(r => ({
    service_id: r.service_id || null,
    content: r.content || null,
    recommender_id: r.recommender_id || null,
    created_date: parseDate(r.created_date),
  }));
}

function mapBugReports(rows) {
  return rows.map(r => ({
    user_id: r.user_id || null,
    title: r.title || null,
    description: r.description || null,
    severity: r.severity || null,
    status: r.status || 'open',
    likes: parseJSON(r.likes) || [],
    admin_response: r.admin_response || null,
    created_date: parseDate(r.created_date),
    updated_date: parseDate(r.updated_date),
  }));
}

// ── Main Import ──
async function main() {
  console.log('🚀 Base44 → Supabase Import');
  console.log(`📍 Supabase: ${SUPABASE_URL}`);
  console.log(`📂 Export dir: ${EXPORT_DIR}\n`);

  const imports = [
    { file: 'Student_export', table: 'students', mapper: mapStudents },
    { file: 'ServiceCategory_export', table: 'service_categories', mapper: mapServiceCategories },
    { file: 'Service_export', table: 'services', mapper: mapServices },
    { file: 'Notification_export', table: 'notifications', mapper: mapNotifications },
    { file: 'PrivateMessage_export', table: 'private_messages', mapper: mapPrivateMessages },
    { file: 'SpotlightRequest_export', table: 'spotlight_requests', mapper: mapSpotlightRequests },
    { file: 'ProfileApproval_export', table: 'profile_approvals', mapper: mapProfileApprovals },
    { file: 'CategoryRequest_export', table: 'category_requests', mapper: mapCategoryRequests },
    { file: 'HolidaySection_export', table: 'holiday_sections', mapper: mapHolidaySections },
    { file: 'PrayerRequest_export', table: 'prayer_requests', mapper: mapPrayerRequests },
    { file: 'CommunityPost_export', table: 'community_posts', mapper: mapCommunityPosts },
    { file: 'GratitudePost_export', table: 'gratitude_posts', mapper: mapGratitudePosts },
    { file: 'Event_export', table: 'events', mapper: mapEvents },
    { file: 'Recommendation_export', table: 'recommendations', mapper: mapRecommendations },
    { file: 'BugReport_export', table: 'bug_reports', mapper: mapBugReports },
  ];

  const results = [];

  for (const { file, table, mapper } of imports) {
    const rows = readCSV(file);
    if (!rows) { results.push({ table, status: 'skipped' }); continue; }

    const mapped = mapper(rows);
    const count = await batchInsert(table, mapped);
    results.push({ table, total: rows.length, inserted: count });
    console.log(`  ✅ ${table}: ${count}/${rows.length} inserted\n`);
  }

  console.log('\n📊 Import Summary:');
  console.log('─'.repeat(50));
  for (const r of results) {
    if (r.status === 'skipped') {
      console.log(`  ⏭️  ${r.table}: skipped (no file)`);
    } else {
      const icon = r.inserted === r.total ? '✅' : '⚠️';
      console.log(`  ${icon} ${r.table}: ${r.inserted}/${r.total}`);
    }
  }
  console.log('─'.repeat(50));
  console.log('🎉 Import complete!');
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
