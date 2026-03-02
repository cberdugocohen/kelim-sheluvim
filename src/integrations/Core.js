import { supabase } from '@/api/supabase';

/**
 * InvokeLLM — stub replacement for Base44's LLM integration.
 * In production, connect this to your own OpenAI/Anthropic API endpoint.
 */
export async function InvokeLLM({ prompt, response_json_schema, add_context_from_internet }) {
  console.warn('InvokeLLM called but no AI backend configured. Returning empty response.');
  // Return an empty response matching expected schema shape
  if (response_json_schema?.properties) {
    const result = {};
    for (const [key, schema] of Object.entries(response_json_schema.properties)) {
      if (schema.type === 'array') result[key] = [];
      else if (schema.type === 'string') result[key] = '';
      else if (schema.type === 'number') result[key] = 0;
      else if (schema.type === 'boolean') result[key] = false;
      else result[key] = null;
    }
    return JSON.stringify(result);
  }
  return '{}';
}

/**
 * Upload a file to Supabase Storage.
 */
export async function UploadFile({ file }) {
  if (!file) throw new Error('No file provided');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('public-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('public-files')
    .getPublicUrl(filePath);

  return { file_url: publicUrl };
}
