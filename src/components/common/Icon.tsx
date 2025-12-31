import React from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Category as CategoryIcon,
  Label as LabelIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material';

export type AppIconName =
  | 'add'
  | 'delete'
  | 'edit'
  | 'category'
  | 'subcategory'
  | 'remarks';

export interface IconProps {
  name: AppIconName;
  size?: number;
  sx?: SxProps<Theme>;
}

const iconMap: Record<AppIconName, React.ElementType> = {
  add: AddIcon,
  delete: DeleteIcon,
  edit: EditIcon,
  category: CategoryIcon,
  subcategory: LabelIcon,
  remarks: NotesIcon,
};

export default function Icon({ name, size = 20, sx }: IconProps) {
  const Comp = iconMap[name] ?? NotesIcon;
  return (
    <Comp
      sx={[{ fontSize: size }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    />
  );
}
