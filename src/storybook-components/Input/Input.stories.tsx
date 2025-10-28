import type { Meta, StoryObj } from '@storybook/react';
import Input from './Input';
import { useState } from 'react';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A versatile input component with various types and states.',
      },
    },
  },
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'search'],
      description: 'Input type',
    },
    variant: {
      control: { type: 'select' },
      options: ['outlined', 'filled', 'standard'],
      description: 'Input variant',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium'],
      description: 'Input size',
    },
    error: {
      control: { type: 'boolean' },
      description: 'Error state',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disabled state',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Required field',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Full width input',
    },
    multiline: {
      control: { type: 'boolean' },
      description: 'Multiline input',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Default Input',
    placeholder: 'Enter text...',
  },
};

export const Email: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const Password: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    showPasswordToggle: true,
  },
};

export const Search: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Search',
    type: 'search',
    placeholder: 'Search...',
  },
};

export const Number: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Amount',
    type: 'number',
    placeholder: 'Enter amount',
  },
};

export const WithError: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Input with Error',
    placeholder: 'This input has an error',
    error: true,
    errorMessage: 'This field is required',
  },
};

export const WithHelperText: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Input with Helper Text',
    placeholder: 'Enter your information',
    helperText: 'This is helpful information about the input',
  },
};

export const Disabled: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
  },
};

export const Required: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Required Input',
    placeholder: 'This field is required',
    required: true,
  },
};

export const Small: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Small Input',
    placeholder: 'Small size input',
    size: 'small',
  },
};

export const Multiline: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Multiline Input',
    placeholder: 'Enter multiple lines of text...',
    multiline: true,
    rows: 4,
  },
};

export const FullWidth: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Input {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    label: 'Full Width Input',
    placeholder: 'This input takes full width',
    fullWidth: true,
  },
};

export const AllTypes: Story = {
  render: () => {
    const [values, setValues] = useState({
      text: '',
      email: '',
      password: '',
      search: '',
      number: '',
    });

    return (
      <StoryThemeWrapper>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'var(--spacing-lg)', 
          maxWidth: '400px',
          padding: 'var(--spacing-lg)',
        }}>
          <Input
            label="Text Input"
            type="text"
            value={values.text}
            onChange={(value) => setValues({ ...values, text: value })}
          />
          <Input
            label="Email Input"
            type="email"
            value={values.email}
            onChange={(value) => setValues({ ...values, email: value })}
          />
          <Input
            label="Password Input"
            type="password"
            value={values.password}
            onChange={(value) => setValues({ ...values, password: value })}
            showPasswordToggle
          />
          <Input
            label="Search Input"
            type="search"
            value={values.search}
            onChange={(value) => setValues({ ...values, search: value })}
          />
          <Input
            label="Number Input"
            type="number"
            value={values.number}
            onChange={(value) => setValues({ ...values, number: value })}
          />
        </div>
      </StoryThemeWrapper>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All input types displayed together with state management. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};
