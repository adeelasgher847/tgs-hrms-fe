import React, { useState, useRef } from 'react';
import {
  Box,
  Avatar,
  Button,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  PhotoCamera,
  Delete,
  CloudUpload,
  Close,
  Edit,
} from '@mui/icons-material';
import { profileApiService, type UserProfile } from '../../api/profileApi';
import { useUser } from '../../context/UserContext';
import { snackbar } from '../../utils/snackbar';

interface ProfilePictureUploadProps {
  user: UserProfile;
  onProfileUpdate: (updatedUser: UserProfile) => void;
  size?: number;
  showUploadButton?: boolean;
  showRemoveButton?: boolean;
  clickable?: boolean;
  showEditOverlay?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  user,
  onProfileUpdate,
  size = 80,
  showUploadButton = true,
  showRemoveButton = true,
  clickable = true,
  showEditOverlay = true,
}) => {
  const { updateUser } = useUser();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  const getInitials = (first: string, last: string): string => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  const generateAvatarColor = (name: string): string => {
    const colors = [
      '#f44336',
      '#e91e63',
      '#9c27b0',
      '#673ab7',
      '#3f51b5',
      '#2196f3',
      '#03a9f4',
      '#00bcd4',
      '#009688',
      '#4caf50',
      '#8bc34a',
      '#cddc39',
      '#ffeb3b',
      '#ffc107',
      '#ff9800',
      '#ff5722',
      '#795548',
      '#9e9e9e',
      '#607d8b',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or GIF)');
      snackbar.error('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setError(
        `File size (${fileSizeMB} MB) must be less than 5MB. Please select a smaller image.`
      );
      snackbar.error(
        `File size (${fileSizeMB} MB) must be less than 5MB. Please select a smaller image.`
      );
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = e => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setShowUploadDialog(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      // Get the correct user ID from JWT token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const correctUserId = tokenPayload.sub;

      const response = await profileApiService.uploadProfilePicture(
        correctUserId, // Use the correct user ID from JWT
        selectedFile
      );

      updateUser(response.user);
      onProfileUpdate(response.user);
      snackbar.success('Profile picture updated successfully!');
      setShowUploadDialog(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      let errorMessage = 'Failed to upload profile picture';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'Bad request - check file format and size';
      } else if (err.response?.status === 403) {
        errorMessage =
          'Permission denied - you can only update your own profile picture';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication failed - please log in again';
      }

      setError(errorMessage);
      snackbar.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);

    try {
      const response = await profileApiService.removeProfilePicture(user.id);
      updateUser(response.user);
      onProfileUpdate(response.user);
      snackbar.success('Profile picture removed successfully!');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to remove profile picture';
      setError(errorMessage);
      snackbar.error(errorMessage);
    } finally {
      setRemoving(false);
    }
  };

  const handleAvatarClick = () => {
    if (clickable && showUploadButton) {
      fileInputRef.current?.click();
    }
  };

  const renderAvatar = () => {
    const avatarStyle = {
      width: size,
      height: size,
      fontSize: `${size * 0.4}px`,
      cursor: clickable ? 'pointer' : 'default',
      backgroundColor: user.profile_pic
        ? 'transparent'
        : generateAvatarColor(user.first_name),
      '&:hover': clickable
        ? {
            opacity: 0.8,
            transform: 'scale(1.05)',
            transition: 'all 0.2s ease-in-out',
          }
        : {},
    };

    if (user.profile_pic) {
      // Use the GET API endpoint instead of direct file access
      const imageUrl = `${API_BASE_URL}/users/${user.id}/profile-picture`;

      return (
        <Avatar
          src={imageUrl}
          alt={`${user.first_name} ${user.last_name}`}
          sx={avatarStyle}
          onClick={handleAvatarClick}
        />
      );
    }

    return (
      <Avatar sx={avatarStyle} onClick={handleAvatarClick}>
        {getInitials(user.first_name, user.last_name)}
      </Avatar>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Avatar with Overlay */}
      <Box
        sx={{ position: 'relative' }}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        {renderAvatar()}

        {/* Edit Overlay */}
        {showEditOverlay && clickable && showUploadButton && (
          <Fade in={showOverlay}>
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Edit sx={{ color: 'white', fontSize: size * 0.3 }} />
            </Box>
          </Fade>
        )}

        {/* Upload Icon Overlay (for non-hover state) */}
        {clickable && showUploadButton && !showEditOverlay && (
          <IconButton
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: 'primary.main',
              color: 'white',
              width: Math.max(32, size * 0.4),
              height: Math.max(32, size * 0.4),
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoCamera sx={{ fontSize: Math.max(16, size * 0.2) }} />
          </IconButton>
        )}
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {showUploadButton && (
          <Tooltip title='Upload new profile picture'>
            <Button
              variant='outlined'
              size='small'
              startIcon={<CloudUpload />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
            >
              Upload
            </Button>
          </Tooltip>
        )}

        {showRemoveButton && user.profile_pic && (
          <Tooltip title='Remove current profile picture'>
            <Button
              variant='outlined'
              color='error'
              size='small'
              startIcon={removing ? <CircularProgress size={16} /> : <Delete />}
              onClick={handleRemove}
              disabled={uploading || removing}
            >
              Remove
            </Button>
          </Tooltip>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity='error' sx={{ width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e0e0e0',
            pb: 2,
          }}
        >
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Upload Profile Picture
          </Typography>
          <IconButton
            onClick={() => setShowUploadDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            {previewUrl && (
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  mb: 3,
                  display: 'inline-block',
                  borderRadius: 2,
                }}
              >
                <Avatar
                  src={previewUrl}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: '3px solid #e0e0e0',
                  }}
                />
              </Paper>
            )}
            <Typography variant='body1' sx={{ fontWeight: 500, mb: 1 }}>
              {selectedFile?.name}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              File size:{' '}
              {selectedFile
                ? (selectedFile.size / 1024 / 1024).toFixed(2)
                : '0'}{' '}
              MB
            </Typography>
            {selectedFile && selectedFile.size > 5 * 1024 * 1024 && (
              <Alert severity='error' sx={{ mb: 2 }}>
                File size exceeds 5MB limit. Please select a smaller image.
              </Alert>
            )}
            <Typography variant='caption' color='text.secondary'>
              This will replace your current profile picture
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setShowUploadDialog(false)} variant='outlined'>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant='contained'
            disabled={
              uploading || (selectedFile && selectedFile.size > 5 * 1024 * 1024)
            }
            startIcon={uploading ? <CircularProgress size={16} /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePictureUpload;
