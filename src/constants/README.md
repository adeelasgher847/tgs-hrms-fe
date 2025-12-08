# Constants Directory

This directory contains application-wide constants to replace magic numbers and strings throughout the codebase.

## Files

- `appConstants.ts` - Main constants file containing:
  - Timeouts (API requests, delays, etc.)
  - Validation limits (min/max lengths, file sizes)
  - Pagination defaults
  - Colors (brand colors, theme colors)
  - Sizes (avatars, icons, buttons, modals)
  - Breakpoints
  - API configuration
  - Date formats
  - Status values
  - Error and success messages

## Usage

```typescript
import { TIMEOUTS, VALIDATION_LIMITS, COLORS } from '../constants/appConstants';

// Instead of: setTimeout(() => {}, 1000)
setTimeout(() => {}, TIMEOUTS.FAKE_DELAY);

// Instead of: if (name.length < 2)
if (name.length < VALIDATION_LIMITS.MIN_DEPARTMENT_NAME_LENGTH)
  // Instead of: color: '#464b8a'
  color: COLORS.PRIMARY;
```

## Guidelines

- All magic numbers and strings should be extracted to constants
- Constants should be grouped by category
- Use descriptive names that explain the purpose
- Add JSDoc comments for complex constants
- Export as `const` objects for better IDE autocomplete
