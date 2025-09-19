import IconImageCard from './IconImageCard';
import ApplicationIcon from '../../../assets/icons/Application.svg';
import filetextIcon from '../../../assets/dashboardIcon/file-text.svg';
import { Box } from '@mui/material';

const IconImageCardProps = () => {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <IconImageCard
        icon={
          <img
            src={ApplicationIcon}
            alt='icon'
            style={{ width: '100%', maxWidth: '130px', height: 'auto' }}
          />
        }
        imageSrc={filetextIcon}
        label={1573}
        title='Applications'
      />
    </Box>
  );
};

export default IconImageCardProps;
