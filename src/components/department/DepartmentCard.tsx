import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Divider,
} from '@mui/material';
import type { Department } from '../../types';
import { useOutletContext } from 'react-router-dom';
import { Icons } from '../../assets/icons';

interface DepartmentCardProps {
  department: Department;
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
  isRtl?: boolean;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onEdit,
  onDelete,
  isRtl = false,
}) => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const bgColor = darkMode ? '#111' : '#fff';
  const textColor = darkMode ? '#8f8f8f' : '#000';
  const borderColor = darkMode ? '#333' : '#f0f0f0';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        direction: isRtl ? 'rtl' : 'ltr',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        p: '20px',
        gap: '32px',
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, '&:last-child': { pb: 0 } }}>
        <Typography
          component='h2'
          fontWeight={500}
          fontSize='28px'
          lineHeight='36px'
          letterSpacing='-2%'
          color='#2C2C2C'
          sx={{
            textAlign: isRtl ? 'right' : 'left',
            mb: '10px',
          }}
        >
          {isRtl ? department.nameAr : department.name}
        </Typography>
        <Divider />
        {(isRtl ? department.descriptionAr : department.description) && (
          <Typography
            fontWeight={400}
            fontSize='var(--body-font-size)'
            lineHeight='var(--body-line-height)'
            letterSpacing='var(--body-letter-spacing)'
            color='#2C2C2C'
            sx={{
              textAlign: isRtl ? 'right' : 'left',
              mt: '10px',
            }}
          >
            {isRtl ? department.descriptionAr : department.description}
          </Typography>
        )}
      </CardContent>

      {(onEdit || onDelete) && (
        <CardActions sx={{ p: 0, justifyContent: 'flex-start', gap: 1 }}>
          {onEdit && (
            <IconButton
              onClick={() => onEdit(department)}
              size='small'
              sx={{
                p: 1,
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Box
                component='img'
                src={Icons.edit}
                alt='Edit'
                sx={{
                  width: 20,
                  height: 20,
                }}
              />
            </IconButton>
          )}

          {onDelete && (
            <IconButton
              onClick={() => onDelete(department)}
              size='small'
              sx={{
                p: 1,
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Box
                component='img'
                src={Icons.delete}
                alt='Delete'
                sx={{
                  width: 20,
                  height: 20,
                }}
              />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
};
