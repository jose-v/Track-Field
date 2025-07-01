// Meet Files Types
export interface MeetFile {
  id: string;
  meet_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  category: 'image' | 'document' | 'spreadsheet' | 'other';
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface MeetFileUpload {
  file: File;
  category: 'image' | 'document' | 'spreadsheet' | 'other';
  preview?: string; // For image previews
}

export interface FileCategory {
  name: string;
  types: string[];
  icon: string;
  color: string;
}

export const FILE_CATEGORIES: Record<string, FileCategory> = {
  image: {
    name: 'Images',
    types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    icon: 'FaImage',
    color: 'green'
  },
  document: {
    name: 'Documents',
    types: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ],
    icon: 'FaFileAlt',
    color: 'blue'
  },
  spreadsheet: {
    name: 'Spreadsheets', 
    types: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ],
    icon: 'FaTable',
    color: 'purple'
  },
  other: {
    name: 'Other',
    types: [],
    icon: 'FaFile',
    color: 'gray'
  }
};

export const ALLOWED_FILE_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const getFileCategory = (fileType: string): 'image' | 'document' | 'spreadsheet' | 'other' => {
  for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
    if (config.types.includes(fileType)) {
      return category as 'image' | 'document' | 'spreadsheet' | 'other';
    }
  }
  return 'other';
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const truncateFileName = (fileName: string, maxLength: number = 25): string => {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
  
  return `${truncatedName}...${extension}`;
}; 