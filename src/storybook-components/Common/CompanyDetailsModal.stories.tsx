import type { Meta, StoryObj } from '@storybook/react';
import CompanyDetailsModal from './CompanyDetailsModal';
import { StoryThemeWrapper } from '../theme';
import { useState } from 'react';
import { Button, Box } from '@mui/material';

const meta: Meta<typeof CompanyDetailsModal> = {
  title: 'Common/CompanyDetailsModal',
  component: CompanyDetailsModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Company Details modal component for editing company information including company name, domain, and logo upload functionality.',
      },
    },
  },
  argTypes: {
    open: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed',
    },
    onCompanyUpdated: {
      action: 'company updated',
      description: 'Callback when company details are updated',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CompanyDetailsModal>;

// Mock company data
const mockCompanyDetails = {
  id: '1',
  company_name: 'Acme Corporation',
  domain: 'acme.com',
  logo_url: null as string | null,
  tenant_id: 'tenant_123',
  created_at: '2024-01-01T00:00:00Z',
};

const CompanyDetailsModalWrapper = (args: any) => {
  const [open, setOpen] = useState(false);

  return (
    <StoryThemeWrapper>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Button 
          variant="contained" 
          onClick={() => setOpen(true)}
          sx={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--primary-text)',
            fontFamily: 'var(--font-family-primary)',
            '&:hover': {
              backgroundColor: 'var(--primary-dark)',
            },
          }}
        >
          Open Company Details Modal
        </Button>
        <CompanyDetailsModal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          onCompanyUpdated={(updatedCompany) => {
            console.log('Company updated:', updatedCompany);
            setOpen(false);
          }}
        />
      </Box>
    </StoryThemeWrapper>
  );
};

export const Default: Story = {
  render: (args) => <CompanyDetailsModalWrapper {...args} />,
  args: {
    companyDetails: mockCompanyDetails,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default Company Details modal with company information. Click the button to open the modal and test the functionality.',
      },
    },
  },
};

export const WithLogo: Story = {
  render: (args) => <CompanyDetailsModalWrapper {...args} />,
  args: {
    companyDetails: {
      ...mockCompanyDetails,
      logo_url: 'https://i.pravatar.cc/150?img=1',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Company Details modal with existing company logo. Shows how the modal handles companies that already have a logo.',
      },
    },
  },
};

export const DifferentCompany: Story = {
  render: (args) => <CompanyDetailsModalWrapper {...args} />,
  args: {
    companyDetails: {
      id: '2',
      company_name: 'Tech Solutions Inc',
      domain: 'techsolutions.com',
      logo_url: null,
      tenant_id: 'tenant_456',
      created_at: '2024-01-15T00:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Company Details modal with different company data. Shows how the form initializes with different company information.',
      },
    },
  },
};


