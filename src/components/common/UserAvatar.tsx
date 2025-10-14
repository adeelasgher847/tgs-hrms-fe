import React, { useState } from 'react';
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
  const [imgError, setImgError] = useState(false);

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

  const isCurrentUser = currentUser?.id === user.id;
  const effectiveProfilePictureUrl = isCurrentUser ? profilePictureUrl : null;

  const avatarStyle = {
    width: size,
    height: size,
    fontSize: `${size * 0.4}px`,
    cursor: clickable ? 'pointer' : 'default',
    backgroundColor:
      imgError || !(effectiveProfilePictureUrl || user.profile_pic)
        ? generateAvatarColor(user.first_name)
        : 'transparent',
    '& .MuiAvatar-img': {
      objectFit: 'cover',
      objectPosition: 'top',
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

  const imageUrl = effectiveProfilePictureUrl
    ? effectiveProfilePictureUrl
    : user.profile_pic
      ? user.id
        ? `${API_BASE_URL}/users/${user.id}/profile-picture`
        : `${API_BASE_URL}${user.profile_pic}`
      : '';

  return (
    <Avatar sx={avatarStyle} onClick={onClick} {...avatarProps}>
      {!imgError && imageUrl ? (
        <img
          src={imageUrl}
          alt={`${user.first_name} ${user.last_name}`}
          loading='lazy'
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
      ) : (
        getInitials(user.first_name, user.last_name)
      )}
    </Avatar>
  );
};

export default UserAvatar;
