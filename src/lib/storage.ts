import { getSupabase } from './supabase';

export type StorageBucket = 'panchayat-documents' | 'complaint-attachments' | 'expenditure-bills';

export interface UploadResult {
  url: string | null;
  error: string | null;
  path: string | null;
}

export async function uploadFileToSupabase(
  bucket: StorageBucket,
  file: File,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      url: null,
      error: 'Supabase is not configured. Please configure your Supabase URL & Key.',
      path: null,
    };
  }

  // Max 10MB file size limit
  if (file.size > 10 * 1024 * 1024) {
    return {
      url: null,
      error: 'File size exceeds 10MB limit. Please upload a smaller file.',
      path: null,
    };
  }

  // Allowed mime types: images and documents (pdf, doc, docx, xls, etc)
  const allowedPrefixes = ['image/', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
  const isAllowed = allowedPrefixes.some(prefix => file.type.startsWith(prefix) || file.type.includes('pdf') || file.name.endsWith('.pdf'));

  if (!isAllowed) {
    return {
      url: null,
      error: 'Invalid file type. Allowed formats: PNG, JPG, JPEG, WEBP, PDF.',
      path: null,
    };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 30);
    const uniqueFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      // If bucket does not exist, return a helpful hint
      if (error.message?.includes('bucket not found') || error.message?.includes('The resource was not found')) {
        return {
          url: null,
          error: `Storage bucket "${bucket}" not found. Run the schema.sql script in Supabase to create the required storage buckets.`,
          path: null,
        };
      }
      return {
        url: null,
        error: error.message,
        path: null,
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrlData.publicUrl,
      error: null,
      path: data.path,
    };
  } catch (err: any) {
    return {
      url: null,
      error: err?.message || 'Failed to upload file',
      path: null,
    };
  }
}
