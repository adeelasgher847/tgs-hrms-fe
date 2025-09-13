import React from 'react';
import { Avatar, type AvatarProps } from '@mui/material';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { useUser } from '../../hooks/useUser';

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'alt'> {
  user: {
    id?: string;
    first_name: string;
    last_name: string;
    profile_pic?: string | null;
  };
  size?: number;
  clickable?: boolean;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 40,
  clickable = false,
  onClick,
  sx,
  ...avatarProps
}) => {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const { profilePictureUrl } = useProfilePicture();
  const { user: currentUser } = useUser();

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

  // ✅ Only use profilePictureUrl from context if this is the current user's avatar
  const isCurrentUser = currentUser?.id === user.id;
  const effectiveProfilePictureUrl = isCurrentUser ? profilePictureUrl : null;

  const avatarStyle = {
    width: size,
    height: size,
    fontSize: `${size * 0.4}px`,
    cursor: clickable ? 'pointer' : 'default',
    backgroundColor:
      effectiveProfilePictureUrl || user.profile_pic
        ? 'transparent'
        : generateAvatarColor(user.first_name),
    '& .MuiAvatar-img': {
      objectFit: 'cover',
      objectPosition: 'top', // ✅ NEW: Centers image at top
    },
    '&:hover': clickable
      ? {
          opacity: 0.8,
          transform: 'scale(1.05)',
          transition: 'all 0.2s ease-in-out',
        }
      : {},
    ...sx,
  };

  // ✅ Use effectiveProfilePictureUrl (only for current user) or fall back to user.profile_pic
  const hasProfilePicture = effectiveProfilePictureUrl || user.profile_pic;

  if (hasProfilePicture) {
    let imageUrl: string;

    if (effectiveProfilePictureUrl) {
      // If this is the current user and we have a profilePictureUrl from context, use it
      imageUrl = effectiveProfilePictureUrl;
    } else if (user.profile_pic) {
      // Fall back to constructing URL from user.profile_pic
      imageUrl = user.id
        ? `${API_BASE_URL}/users/${user.id}/profile-picture`
        : `${API_BASE_URL}${user.profile_pic}`;
    } else {
      // This shouldn't happen, but just in case
      imageUrl = '';
    }

    return (
      <Avatar
        src={imageUrl}
        alt={`${user.first_name} ${user.last_name}`}
        sx={avatarStyle}
        onClick={onClick}
        {...avatarProps}
      />
    );
  }

  return (
    <Avatar sx={avatarStyle} onClick={onClick} {...avatarProps}>
      {getInitials(user.first_name, user.last_name)}
    </Avatar>
  );
};

export default UserAvatar;
