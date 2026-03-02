/**
 * Converts Base44 CSV exports into a single SQL INSERT file
 * that can be pasted into the Supabase SQL Editor.
 *
 * Usage: node scripts/csv-to-sql.mjs
 * Output: base44-import.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORT_DIR = path.join(__dirname, '..', 'base44-export');
const OUTPUT_FILE = path.join(__dirname, '..', 'base44-import.sql');

// ── CSV Parser (handles quoted multiline fields + embedded quotes) ──
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

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (headers.length > 0 && currentRow.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = currentRow[idx]; });
      rows.push(obj);
    }
  }

  return rows;
}

// ── SQL Helpers ──
function esc(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function escBool(val) {
  if (val === 'true' || val === true) return 'TRUE';
  if (val === 'false' || val === false) return 'FALSE';
  return 'NULL';
}

function escJSON(val) {
  if (!val || val === '' || val === '""') return 'NULL';
  try {
    // Validate it's valid JSON, then escape for SQL
    const parsed = JSON.parse(val);
    return "'" + JSON.stringify(parsed).replace(/'/g, "''") + "'::jsonb";
  } catch {
    return 'NULL';
  }
}

function escDate(val) {
  if (!val || val === '') return 'NULL';
  return "'" + val + "'";
}

function escInt(val) {
  if (!val || val === '') return 'NULL';
  const n = parseInt(val);
  return isNaN(n) ? 'NULL' : String(n);
}

function readCSV(filename) {
  const files = fs.readdirSync(EXPORT_DIR);
  const match = files
    .filter(f => f.toLowerCase().startsWith(filename.toLowerCase()) && f.endsWith('.csv'))
    .sort((a, b) => b.length - a.length)[0];

  if (!match) {
    console.log(`⏭️  ${filename} — not found, skipping`);
    return null;
  }

  const content = fs.readFileSync(path.join(EXPORT_DIR, match), 'utf-8');
  const rows = parseCSV(content);
  console.log(`📁 ${match}: ${rows.length} records`);
  return rows;
}

// ── Entity → SQL Mappers ──

function studentsToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO students (user_id, full_name, username, profile_image, city, description, additional_images, weekly_video_url, coordinates, contact_info, contribution_details, services, service_areas, category_main, category_sub, is_holiday_highlight, holiday_type, tags, created_date, updated_date)
VALUES (${esc(r.user_id)}, ${esc(r.full_name)}, ${esc(r.username)}, ${esc(r.profile_image)}, ${esc(r.city)}, ${esc(r.description)}, ${escJSON(r.additional_images) || "'[]'::jsonb"}, ${esc(r.weekly_video_url)}, ${escJSON(r.coordinates)}, ${escJSON(r.contact_info) || "'{}'::jsonb"}, ${escJSON(r.contribution_details) || "'{}'::jsonb"}, ${escJSON(r.services) || "'[]'::jsonb"}, ${escJSON(r.service_areas) || "'[]'::jsonb"}, ${esc(r.category_main)}, ${esc(r.category_sub)}, ${escBool(r.is_holiday_highlight)}, ${esc(r.holiday_type)}, ${escJSON(r.tags) || "'[]'::jsonb"}, ${escDate(r.created_date)}, ${escDate(r.updated_date)});`
  ).join('\n');
}

function serviceCategoriesToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO service_categories (main_category, sub_category, is_active, display_order, created_date)
VALUES (${esc(r.main_category)}, ${esc(r.sub_category)}, ${escBool(r.is_active)}, ${escInt(r.display_order)}, ${escDate(r.created_date)});`
  ).join('\n');
}

function notificationsToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO notifications (user_id, type, title, message, is_read, related_id, created_date)
VALUES (${esc(r.user_id)}, ${esc(r.type)}, ${esc(r.title)}, ${esc(r.message)}, ${escBool(r.is_read)}, ${esc(r.related_entity_id || r.action_url)}, ${escDate(r.created_date)});`
  ).join('\n');
}

function privateMessagesToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO private_messages (sender_id, recipient_id, subject, content, is_read, related_post_id, created_date)
VALUES (${esc(r.sender_id)}, ${esc(r.recipient_id)}, ${esc(r.subject)}, ${esc(r.content)}, ${escBool(r.is_read)}, ${esc(r.related_post_id)}, ${escDate(r.created_date)});`
  ).join('\n');
}

function spotlightRequestsToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO spotlight_requests (user_id, personal_story, business_description, what_i_offer, tagline, images, video_url, contact_preference, status, selected_week, admin_feedback, created_date, updated_date)
VALUES (${esc(r.user_id)}, ${esc(r.personal_story)}, ${esc(r.business_description)}, ${esc(r.what_i_offer)}, ${esc(r.tagline)}, ${escJSON(r.images) || "'[]'::jsonb"}, ${esc(r.video_url)}, ${esc(r.contact_preference)}, ${esc(r.status)}, ${r.selected_week ? escDate(r.selected_week) : 'NULL'}, ${esc(r.admin_feedback)}, ${escDate(r.created_date)}, ${escDate(r.updated_date)});`
  ).join('\n');
}

function profileApprovalsToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO profile_approvals (user_id, student_profile_id, type, proposed_data, current_data, changes_summary, status, admin_feedback, reviewed_by, reviewed_at, created_date)
VALUES (${esc(r.user_id)}, ${esc(r.student_profile_id)}, ${esc(r.type)}, ${escJSON(r.proposed_data)}, ${escJSON(r.current_data)}, ${esc(r.changes_summary)}, ${esc(r.status)}, ${esc(r.admin_feedback)}, ${esc(r.reviewed_by)}, ${escDate(r.reviewed_at)}, ${escDate(r.created_date)});`
  ).join('\n');
}

function categoryRequestsToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO category_requests (user_id, suggested_category, reason, status, admin_feedback, created_date)
VALUES (${esc(r.user_id)}, ${esc(r.requested_category)}, ${esc(r.description)}, ${esc(r.status)}, ${esc(r.admin_response)}, ${escDate(r.created_date)});`
  ).join('\n');
}

function holidaySectionsToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO holiday_sections (title, description, holiday_type, is_active, created_date, updated_date)
VALUES (${esc(r.title)}, ${esc(r.subtitle)}, ${esc(r.current_holiday)}, ${escBool(r.is_active)}, ${escDate(r.created_date)}, ${escDate(r.updated_date)});`
  ).join('\n');
}

function prayerRequestsToSQL(rows) {
  return rows.map(r =>
    `INSERT INTO prayer_requests (name_for_prayer, request_types, valid_for, valid_until, context_note, status, requester_id, requester_name, prayers_from, created_date)
VALUES (${esc(r.name_for_prayer)}, ${escJSON(r.request_types) || "'[]'::jsonb"}, ${esc(r.valid_for)}, ${r.valid_until ? escDate(r.valid_until) : 'NULL'}, ${esc(r.context_note)}, ${esc(r.status)}, ${esc(r.requester_id)}, ${esc(r.requester_name)}, ${escJSON(r.prayers_from) || "'[]'::jsonb"}, ${escDate(r.created_date)});`
  ).join('\n');
}

// ── Main ──
function main() {
  console.log('🔄 Converting Base44 CSVs to SQL...\n');

  const sections = [];

  sections.push('-- ============================================');
  sections.push('-- Base44 → Supabase Data Import');
  sections.push('-- Generated: ' + new Date().toISOString());
  sections.push('-- ============================================\n');

  const imports = [
    { file: 'Student_export', table: 'students', fn: studentsToSQL },
    { file: 'ServiceCategory_export', table: 'service_categories', fn: serviceCategoriesToSQL },
    { file: 'Notification_export', table: 'notifications', fn: notificationsToSQL },
    { file: 'PrivateMessage_export', table: 'private_messages', fn: privateMessagesToSQL },
    { file: 'SpotlightRequest_export', table: 'spotlight_requests', fn: spotlightRequestsToSQL },
    { file: 'ProfileApproval_export', table: 'profile_approvals', fn: profileApprovalsToSQL },
    { file: 'CategoryRequest_export', table: 'category_requests', fn: categoryRequestsToSQL },
    { file: 'HolidaySection_export', table: 'holiday_sections', fn: holidaySectionsToSQL },
    { file: 'PrayerRequest_export', table: 'prayer_requests', fn: prayerRequestsToSQL },
  ];

  let totalRecords = 0;

  for (const { file, table, fn } of imports) {
    const rows = readCSV(file);
    if (!rows || rows.length === 0) continue;

    sections.push(`\n-- ── ${table} (${rows.length} records) ──`);
    sections.push(fn(rows));
    totalRecords += rows.length;
  }

  const sql = sections.join('\n');
  fs.writeFileSync(OUTPUT_FILE, sql, 'utf-8');

  console.log(`\n✅ Generated: base44-import.sql`);
  console.log(`📊 Total: ${totalRecords} records`);
  console.log(`📦 File size: ${(sql.length / 1024).toFixed(1)} KB`);
  console.log(`\n👉 Copy the contents to Supabase SQL Editor and run!`);
}

main();
