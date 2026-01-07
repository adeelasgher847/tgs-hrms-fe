import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Divider,
  useTheme,
} from '@mui/material';
import type { Department } from '../../types';
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
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        direction: isRtl ? 'rtl' : 'ltr',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '20px',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 1px 3px rgba(0,0,0,0.3)' 
          : '0 1px 3px rgba(0,0,0,0.1)',
        p: '20px',
        gap: '32px',
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0, '&:last-child': { pb: 0 } }}>
        <Typography
          component='h2'
          fontWeight={500}
          fontSize={{ xs: '20px', lg: '28px' }}
          lineHeight='36px'
          letterSpacing='-2%'
          sx={{
            color: theme.palette.text.primary,
            textAlign: isRtl ? 'right' : 'left',
            mb: '10px',
          }}
        >
          {isRtl ? department.nameAr : department.name}
        </Typography>
        <Divider sx={{ borderColor: theme.palette.divider }} />
        {(isRtl ? department.descriptionAr : department.description) && (
          <Typography
            fontWeight={400}
            fontSize={{ xs: '16px', lg: 'var(--body-font-size)' }}
            lineHeight='var(--body-line-height)'
            letterSpacing='var(--body-letter-spacing)'
            sx={{
              color: theme.palette.text.primary,
              textAlign: isRtl ? 'right' : 'left',
              mt: '10px',
            }}
          >
            {isRtl ? department.descriptionAr : department.description}
          </Typography>
        )}
      </CardContent>

      {(onEdit || onDelete) && (
        <CardActions
          sx={{ p: 0, justifyContent: 'flex-start', gap: { xs: 0.5, sm: 1 } }}
        >
          {onEdit && (
            <IconButton
              onClick={() => onEdit(department)}
              size='small'
              sx={{
                p: { xs: 0.5, sm: 1 },
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Box
                component='img'
                src={Icons.edit}
                alt='Edit'
                sx={{
                  width: { xs: 16, sm: 20 },
                  height: { xs: 16, sm: 20 },
                  // filter: theme.palette.mode === 'dark'
                  //   ? 'brightness(0) saturate(100%) invert(48%) sepia(95%) saturate(2476%) hue-rotate(195deg) brightness(98%) contrast(101%)'
                  //   : 'none',
                }}
              />
            </IconButton>
          )}

          {onDelete && (
            <IconButton
              onClick={() => onDelete(department)}
              size='small'
              sx={{
                p: { xs: 0.5, sm: 1 },
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Box
                component='img'
                src={Icons.delete}
                alt='Delete'
                sx={{
                  width: { xs: 16, sm: 20 },
                  height: { xs: 16, sm: 20 },
                  filter: theme.palette.mode === 'dark'
                    ? 'brightness(0) saturate(100%) invert(27%) sepia(95%) saturate(7151%) hue-rotate(348deg) brightness(95%) contrast(89%)'
                    : 'none',
                }}
              />
            </IconButton>
          )}
        </CardActions>
      )}
    </Card>
  );
};
