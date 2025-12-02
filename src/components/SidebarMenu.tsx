import { List, ListItemButton, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const SIDEBAR_STRINGS = {
  en: {
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
  },
  ar: {
    dashboard: 'لوحة القيادة',
    settings: 'الإعدادات',
    profile: 'الملف',
  },
} as const;

const SidebarMenu = () => {
  const { language } = useLanguage();
  const L = SIDEBAR_STRINGS[language as 'en' | 'ar'] || SIDEBAR_STRINGS.en;

  return (
    <List>
      <ListItemButton component={Link} to='/dashboard'>
        <ListItemText primary={L.dashboard} />
      </ListItemButton>
      <ListItemButton component={Link} to='/settings'>
        <ListItemText primary={L.settings} />
      </ListItemButton>
      <ListItemButton component={Link} to='/profile'>
        <ListItemText primary={L.profile} />
      </ListItemButton>
      {/* Add more menu items here */}
    </List>
  );
};

export default SidebarMenu;
