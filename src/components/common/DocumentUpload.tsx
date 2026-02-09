import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  useTheme,
  Button,
} from '@mui/material';
import {
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { env } from '../../config/env';
import { authService } from '../../api/authService';
import axiosInstance from '../../api/axiosInstance';

export interface DocumentItem {
  id: string;
  url?: string; // For existing documents (URLs)
  file?: File; // For new documents (Files)
  name: string;
}

interface DocumentUploadProps {
  label?: string;
  existingDocuments?: string[]; // Array of document URLs
  newDocuments?: File[]; // Array of new File objects
  onDocumentsChange?: (documents: { existing: string[]; new: File[] }) => void;
  onDocumentRemove?: (type: 'existing' | 'new', index: number) => void;

  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  disabled?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label = 'Supporting Documents (Optional)',
  existingDocuments = [],
  newDocuments = [],
  onDocumentsChange,
  onDocumentRemove,
  multiple = true,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageBlobUrls, setImageBlobUrls] = useState<Map<string, string>>(new Map());

  // Helper function to construct base URL for documents
  const getBaseDocumentUrl = (docUrl: string): string => {
    if (!docUrl) return '';
    if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
      return docUrl;
    }
    if (docUrl.startsWith('/')) {
      return `${env.apiBaseUrl}${docUrl}`;
    }
    return `${env.apiBaseUrl}/${docUrl}`;
  };

  // Fetch image as blob with authentication and create blob URL
  const fetchImageAsBlob = async (docUrl: string): Promise<string | null> => {
    try {
      const baseUrl = getBaseDocumentUrl(docUrl);
      const response = await axiosInstance.get(baseUrl, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: response.data.type || 'image/jpeg',
      });
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    } catch (error) {
      console.error('Failed to fetch image:', error);
      return null;
    }
  };

  // Load images as blobs for existing documents
  useEffect(() => {
    const loadImages = async () => {
      const newBlobUrls = new Map<string, string>();

      for (const docUrl of existingDocuments) {
        if (!imageBlobUrls.has(docUrl)) {
          const blobUrl = await fetchImageAsBlob(docUrl);
          if (blobUrl) {
            newBlobUrls.set(docUrl, blobUrl);
          }
        }
      }

      if (newBlobUrls.size > 0) {
        setImageBlobUrls(prev => {
          const updated = new Map(prev);
          newBlobUrls.forEach((url, key) => updated.set(key, url));
          return updated;
        });
      }
    };

    if (existingDocuments.length > 0) {
      loadImages();
    }

    // Cleanup blob URLs when component unmounts or documents change
    return () => {
      imageBlobUrls.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingDocuments.join(',')]); // Only re-run when documents change

  // Check if a file is an image
  const isImageFile = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension);
  };

  // Validate if file is an image
  const validateImageFile = (file: File): boolean => {
    return file.type.startsWith('image/') || isImageFile(file.name);
  };

  // Get file name from URL or File
  const getFileName = (urlOrFile: string | File): string => {
    if (typeof urlOrFile === 'string') {
      return urlOrFile.split('/').pop() || 'Document';
    }
    return urlOrFile.name;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const validFiles: File[] = [];

    files.forEach(file => {
      // Only allow image files
      if (!validateImageFile(file)) {
        return;
      }
      if (file.size > maxSize) {
        // Could show error here
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0 && onDocumentsChange) {
      onDocumentsChange({
        existing: existingDocuments,
        new: [...newDocuments, ...validFiles],
      });
    }

    // Reset input
    e.target.value = '';
  };

  // Handle document removal
  const handleRemove = (type: 'existing' | 'new', index: number) => {
    if (onDocumentRemove) {
      onDocumentRemove(type, index);
    } else if (onDocumentsChange) {
      if (type === 'existing') {
        const updated = existingDocuments.filter((_, i) => i !== index);
        onDocumentsChange({ existing: updated, new: newDocuments });
      } else {
        const updated = newDocuments.filter((_, i) => i !== index);
        onDocumentsChange({ existing: existingDocuments, new: updated });
      }
    }
  };



  // Render document preview
  const renderDocument = (
    doc: string | File,
    type: 'existing' | 'new',
    index: number
  ) => {
    const fileName = getFileName(doc);
    const isExisting = type === 'existing';
    const docUrlString = isExisting ? (doc as string) : '';

    // For existing documents, use blob URL if available, otherwise try direct URL
    let imageUrl = '';
    if (isExisting && docUrlString) {
      // Try blob URL first (with authentication)
      const blobUrl = imageBlobUrls.get(docUrlString);
      if (blobUrl) {
        imageUrl = blobUrl;
      } else {
        // Fallback to direct URL with token in query param
        const token = authService.getAccessToken();
        const baseUrl = getBaseDocumentUrl(docUrlString);
        const separator = baseUrl.includes('?') ? '&' : '?';
        imageUrl = `${baseUrl}${separator}t=${Date.now()}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      }
    } else {
      // For new files, create object URL
      imageUrl = URL.createObjectURL(doc as File);
    }

    if (!imageUrl || imageUrl === '') return null;

    return (
      <Paper
        key={`${type}-${index}`}
        elevation={1}
        sx={{
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          position: 'relative',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          '&:hover': {
            boxShadow: 2,
          },
        }}
      >
        {/* Image Preview - Always show image directly, clickable to open */}
        <Box
          sx={{
            width: '100%',
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.action.hover,
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #ccc',
            cursor: isExisting && docUrlString ? 'pointer' : 'default',
            '&:hover': {
              boxShadow: isExisting && docUrlString ? 2 : 0,
            },
          }}
          onClick={() => {
            if (isExisting && docUrlString) {
              const baseUrl = getBaseDocumentUrl(docUrlString);
              window.open(baseUrl, '_blank');
            }
          }}
        >
          <Box
            component='img'
            src={imageUrl}
            alt={fileName}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transition: 'transform 0.2s',
            }}
          />
        </Box>

        {/* File Name */}
        <Typography
          variant='body2'
          sx={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '12px',
          }}
          title={fileName}
        >
          {fileName}
        </Typography>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            justifyContent: 'center',
          }}
        >
          {!disabled && (
            <>
              <IconButton
                size='small'
                onClick={() => handleRemove(type, index)}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.error.light,
                    color: theme.palette.error.dark,
                  },
                }}
                title='Remove document'
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </>
          )}
        </Box>
      </Paper>
    );
  };

  const hasDocuments = existingDocuments.length > 0 || newDocuments.length > 0;

  return (
    <Box>
      <Typography
        variant='subtitle2'
        sx={{
          mb: 1.5,
          fontWeight: 500,
          fontSize: { xs: '14px', sm: '16px' },
        }}
      >
        {label}
      </Typography>

      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mb: 1, display: 'block', fontSize: '12px' }}
          >
            Existing Documents:
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(120px, 1fr))',
                sm: 'repeat(auto-fill, minmax(140px, 1fr))',
                md: 'repeat(auto-fill, minmax(160px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {existingDocuments.map((doc, index) =>
              renderDocument(doc, 'existing', index)
            )}
          </Box>
        </Box>
      )}

      {/* New Documents */}
      {newDocuments.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mb: 1, display: 'block', fontSize: '12px' }}
          >
            {existingDocuments.length > 0 ? 'New Documents to Add:' : 'Documents:'}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(auto-fill, minmax(120px, 1fr))',
                sm: 'repeat(auto-fill, minmax(140px, 1fr))',
                md: 'repeat(auto-fill, minmax(160px, 1fr))',
              },
              gap: 1.5,
            }}
          >
            {newDocuments.map((file, index) =>
              renderDocument(file, 'new', index)
            )}
          </Box>
        </Box>
      )}

      {/* File Input Button */}
      {!disabled && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <input
            ref={fileInputRef}
            type='file'
            accept={accept || 'image/*'}
            multiple={multiple}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <Button
            variant='outlined'
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            sx={{
              textTransform: 'none',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            {hasDocuments ? 'Add More Documents' : 'Choose files'}
          </Button>
          {!hasDocuments && (
            <Typography
              variant='caption'
              color='text.secondary'
              sx={{ fontSize: '12px' }}
            >
              No file chosen
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DocumentUpload;

