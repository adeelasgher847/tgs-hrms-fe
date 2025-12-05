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
import edit from '../../assets/dashboardIcon/edit.svg';
import deleteIcon from '../../assets/dashboardIcon/ui-delete.svg';

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
        px: 2,
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        // Keep card layout fixed LTR so data blocks don't shift on language change
        direction: 'ltr',
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        boxShadow: 'unset',
        '&:hover': {
          // transform: "translateY(-4px)",
          // boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant='h6'
            component='h2'
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {department.name}
          </Typography>
        </Box>

        {department.subtitle && (
          <Typography
            variant='body2'
            sx={{
              color: 'text.secondary',
              textAlign: 'left',
              mb: 2,
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {department.subtitle}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        {department.description && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{
              mb: 2,
              lineHeight: 1.6,
              textAlign: 'left',
            }}
          >
            {department.description}
          </Typography>
        )}
      </CardContent>

      {(onEdit || onDelete) && (
        <CardActions
          sx={{
            justifyContent: 'flex-start',
            px: 2,
            pb: 2,
          }}
        >
          <Box display='flex' width={100}>
            {onEdit && (
              <IconButton
                onClick={() => onEdit(department)}
                color='success'
                size='small'
                sx={{
                  border: `1px solid ${borderColor}`,
                  borderTopLeftRadius: isRtl ? 0 : '5px',
                  borderBottomLeftRadius: isRtl ? 0 : '5px',
                  borderTopRightRadius: isRtl ? '5px' : 0,
                  borderBottomRightRadius: isRtl ? '5px' : 0,
                  '&:hover': {
                    backgroundColor: 'orange',
                    color: 'white',
                  },
                }}
              >
                <img
                  src={edit}
                  alt='Absent'
                  style={{
                    width: 15,
                    height: 15,
                    filter:
                      'invert(48%) sepia(59%) saturate(528%) hue-rotate(85deg) brightness(90%) contrast(91%)',
                  }}
                />
                {/* <EditIcon fontSize="small" /> */}
              </IconButton>
            )}

            {onDelete && (
              <IconButton
                onClick={() => onDelete(department)}
                color='error'
                size='small'
                sx={{
                  border: `1px solid ${borderColor}`,
                  borderTopLeftRadius: isRtl ? '5px' : 0,
                  borderBottomLeftRadius: isRtl ? '5px' : 0,
                  borderTopRightRadius: isRtl ? 0 : '5px',
                  borderBottomRightRadius: isRtl ? 0 : '5px',
                  '&:hover': {
                    backgroundColor: 'orange',
                    color: 'white',
                  },
                }}
              >
                <img
                  src={deleteIcon}
                  alt='Delete'
                  style={{
                    width: 15,
                    height: 15,
                    filter:
                      'invert(28%) sepia(97%) saturate(1404%) hue-rotate(329deg) brightness(95%) contrast(96%)',
                  }}
                />
              </IconButton>
            )}
          </Box>
        </CardActions>
      )}
    </Card>
  );
};
