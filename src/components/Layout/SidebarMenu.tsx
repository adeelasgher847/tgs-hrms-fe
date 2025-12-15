import { List, ListItemButton, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';

const SidebarMenu = () => {
  return (
    <List>
      <ListItemButton component={Link} to='/dashboard'>
        <ListItemText primary='Dashboard' />
      </ListItemButton>
      <ListItemButton component={Link} to='/settings'>
        <ListItemText primary='Settings' />
      </ListItemButton>
      <ListItemButton component={Link} to='/profile'>
        <ListItemText primary='Profile' />
      </ListItemButton>
      {/* Add more menu items here */}
    </List>
  );
};

export default SidebarMenu;
