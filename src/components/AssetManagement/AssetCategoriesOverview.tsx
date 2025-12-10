import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { assetCategories } from '../../Data/assetCategories';

const AssetCategoriesOverview: React.FC = () => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' fontWeight={600} gutterBottom>
          Asset Categories Overview
        </Typography>
        <Typography variant='body1' color='text.secondary'>
          Comprehensive asset inventory categories with detailed subcategories
          for better organization and management.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 3,
        }}
      >
        {assetCategories.map(category => (
          <Box key={category.id}>
            <Card
              sx={{
                height: '100%',
                border: `2px solid ${category.color}20`,
                '&:hover': {
                  boxShadow: `0 8px 32px ${category.color}30`,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: `${category.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: category.color,
                        opacity: 0.8,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant='h6'
                      fontWeight={600}
                      color={category.color}
                    >
                      {category.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {category.nameAr}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  {category.description}
                </Typography>

                {category.subcategories &&
                  category.subcategories.length > 0 && (
                    <Accordion
                      sx={{
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        backgroundColor: 'transparent',
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          minHeight: 32,
                          '& .MuiAccordionSummary-content': {
                            margin: '8px 0',
                            '&.Mui-expanded': { margin: '8px 0' },
                          },
                        }}
                      >
                        <Typography variant='body2' fontWeight={500}>
                          Subcategories ({category.subcategories.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <List dense sx={{ py: 0 }}>
                          {category.subcategories.map((subcategory, index) => (
                            <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 24 }}>
                                <Box sx={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                  •
                                </Box>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                  >
                                    {subcategory}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`${category.subcategories?.length || 0} Items`}
                    size='small'
                    variant='outlined'
                    sx={{
                      borderColor: category.color,
                      color: category.color,
                      fontSize: '0.7rem',
                    }}
                  />
                  <Chip
                    label='Default Category'
                    size='small'
                    variant='outlined'
                    color='primary'
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 4 }}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Category Statistics
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 2,
              }}
            >
              <Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='primary' fontWeight={600}>
                    {assetCategories.length}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Main Categories
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant='h4' color='secondary' fontWeight={600}>
                    {assetCategories.reduce(
                      (sum, cat) => sum + (cat.subcategories?.length || 0),
                      0
                    )}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Subcategories
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant='h4'
                    color='success.main'
                    fontWeight={600}
                  >
                    {
                      assetCategories.filter(
                        cat => cat.subcategories && cat.subcategories.length > 0
                      ).length
                    }
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Categories with Subcategories
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant='h4'
                    color='warning.main'
                    fontWeight={600}
                  >
                    8
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Default Categories
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AssetCategoriesOverview;
