import { supabase } from '../lib/supabase';
import { MeetFile, getFileCategory, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../types/meetFiles';

export class MeetFilesService {
  private static readonly BUCKET_NAME = 'meet-files';

  static async uploadFile(
    meetId: string, 
    file: File, 
    userId: string
  ): Promise<{ data: MeetFile | null; error: string | null }> {
    try {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return { 
          data: null, 
          error: `File type ${file.type} is not allowed. Please upload images, PDFs, documents, or spreadsheets.` 
        };
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return { 
          data: null, 
          error: `File size must be less than ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` 
        };
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${meetId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { data: null, error: 'Failed to upload file' };
      }

      // Get the category
      const category = getFileCategory(file.type);

      // Save file metadata to database
      const { data: fileData, error: dbError } = await supabase
        .from('meet_files')
        .insert({
          meet_id: meetId,
          file_name: file.name,
          file_path: uploadData.path,
          file_type: file.type,
          file_size: file.size,
          category,
          uploaded_by: userId
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.BUCKET_NAME).remove([uploadData.path]);
        console.error('Database error:', dbError);
        return { data: null, error: 'Failed to save file information' };
      }

      return { data: fileData, error: null };
    } catch (error) {
      console.error('Unexpected error in uploadFile:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  static async getFiles(meetId: string): Promise<{ data: MeetFile[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('meet_files')
        .select('*')
        .eq('meet_id', meetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return { data: [], error: 'Failed to fetch files' };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Unexpected error in getFiles:', error);
      return { data: [], error: 'An unexpected error occurred' };
    }
  }

  static async deleteFile(fileId: string): Promise<{ error: string | null }> {
    try {
      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('meet_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError || !fileData) {
        return { error: 'File not found' };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileData.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('meet_files')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        return { error: 'Failed to delete file' };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error in deleteFile:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  static async getFileUrl(filePath: string): Promise<{ data: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('URL generation error:', error);
        return { data: null, error: 'Failed to generate file URL' };
      }

      return { data: data.signedUrl, error: null };
    } catch (error) {
      console.error('Unexpected error in getFileUrl:', error);
      return { data: null, error: 'An unexpected error occurred' };
    }
  }

  static async downloadFile(filePath: string, fileName: string): Promise<{ error: string | null }> {
    try {
      const { data: url, error } = await this.getFileUrl(filePath);
      
      if (error || !url) {
        return { error: error || 'Failed to get file URL' };
      }

      // Fetch the file as blob to force download
      const response = await fetch(url);
      if (!response.ok) {
        return { error: 'Failed to fetch file for download' };
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      return { error: null };
    } catch (error) {
      console.error('Unexpected error in downloadFile:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  static async printFile(filePath: string): Promise<{ error: string | null }> {
    try {
      const { data: url, error } = await this.getFileUrl(filePath);
      
      if (error || !url) {
        return { error: error || 'Failed to get file URL' };
      }

      // Open in new window for printing
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      if (printWindow) {
        // Wait for content to load before triggering print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // Close window after print dialog (optional)
            // printWindow.close();
          }, 1000); // Give some time for content to fully render
        };
        
        // Fallback: If onload doesn't fire, try after a delay
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            try {
              printWindow.print();
            } catch (e) {
              console.warn('Fallback print attempt failed:', e);
            }
          }
        }, 2000);
      } else {
        return { error: 'Popup blocked. Please allow popups for this site to enable printing.' };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error in printFile:', error);
      return { error: 'An unexpected error occurred' };
    }
  }
} 