import React, { useState } from 'react';
import { Avatar, type AvatarProps } from '@mui/material';

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
  const [imgError, setImgError] = useState(false);

  const getInitials = (first: string, last: string) =>
    `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();

  const generateAvatarColor = (name: string) => {
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
    return colors[name.charCodeAt(0) % colors.length];
  };

  const avatarStyle = {
    width: size,
    height: size,
    fontSize: `${size * 0.4}px`,
    cursor: clickable ? 'pointer' : 'default',
    backgroundColor: imgError
      ? '#9e9e9e'
      : user.profile_pic
      ? 'transparent'
      : generateAvatarColor(user.first_name),
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

  let imageUrl: string | null = null;

  if (user.profile_pic) {
    imageUrl = user.profile_pic.startsWith('http')
      ? user.profile_pic
      : `https://via.placeholder.com/${size}x${size}?text=${getInitials(user.first_name, user.last_name)}`;
  }

  if (!imageUrl || imgError) {
    imageUrl = null;
  }

  return (
    <Avatar
      sx={avatarStyle}
      onClick={onClick}
      {...avatarProps}
      alt={`${user.first_name} ${user.last_name}`}
    >
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={`${user.first_name} ${user.last_name}`}
          onError={() => setImgError(true)}
          loading='lazy'
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
            borderRadius: '50%',
          }}
        />
      ) : imgError ? null : (
        getInitials(user.first_name, user.last_name)
      )}
    </Avatar>
  );
};

export default UserAvatar;
