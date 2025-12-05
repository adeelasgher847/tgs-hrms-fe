# Codebase Refactoring Plan

## Summary

This document outlines the plan to address three key issues:

1. Inconsistent Naming Conventions
2. Folder Structure Organization
3. Magic Numbers/Strings

## 1. Constants File Created ✅

**File:** `src/constants/appConstants.ts`

Contains centralized constants for:

- Timeouts (API requests, delays, snackbars)
- Validation limits (min/max lengths, file sizes)
- Pagination defaults
- Colors (brand and theme colors)
- Sizes (avatars, icons, buttons, modals)
- Breakpoints
- API configuration
- Date formats
- Status values
- Error and success messages

**Files Updated:**

- ✅ `src/components/department/Department-form-modal.tsx`
- ✅ `src/components/UserProfile/EditProfileModal.tsx`
- ✅ `src/api/benefits.ts`
- ✅ `src/utils/snackbar.ts`
- ✅ `src/components/Login.tsx`

## 2. File Naming Inconsistencies (Pending)

### Issues Found:

- **Kebab-case files:**
  - `Department-form-modal.tsx` → Should be `DepartmentFormModal.tsx`
  - `Delete-confirmation-dialog.tsx` → Should be `DeleteConfirmationDialog.tsx`
  - `Department-card.tsx` → Should be `DepartmentCard.tsx`
  - `Designation-manager.tsx` → Should be `DesignationManager.tsx`
  - `Designation-modal.tsx` → Should be `DesignationModal.tsx`
  - `Designations-list.tsx` → Should be `DesignationsList.tsx`

- **Typo fixes:**
  - `Nabvar.tsx` → Should be `Navbar.tsx`
  - `Desigantions/` folder → Should be `Designations/`

### Action Plan:

1. Rename files to PascalCase
2. Update all imports across codebase
3. Fix folder name typo (`Desigantions` → `Designations`)

## 3. Folder Structure (Pending)

### Current Issues:

- **Root components that should be organized:**
  - `Login.tsx` → `auth/Login.tsx`
  - `Signup.tsx` → `auth/Signup.tsx`
  - `ResetPassword.tsx` → `auth/ResetPassword.tsx`
  - `Forget.tsx` → `auth/ForgetPassword.tsx`
  - `ConfirmPassword.tsx` → `auth/ConfirmPassword.tsx`
  - `SelectPlan.tsx` → `auth/SelectPlan.tsx`
  - `SignupSuccess.tsx` → `auth/SignupSuccess.tsx`
  - `CompanyDetails.tsx` → `company/CompanyDetails.tsx`
  - `Tenant.tsx` → `tenant/Tenant.tsx` or `tenant/TenantPage.tsx`
  - `Dashboard.tsx` → Keep in root (main entry point)
  - `Layout.tsx` → Keep in root (main layout)
  - `Error404.tsx` → `common/Error404.tsx`
  - `ProtectedRoute.tsx` → `common/ProtectedRoute.tsx`
  - `SidebarMenu.tsx` → `common/SidebarMenu.tsx` or merge with `Sidebar.tsx`
  - `ConfirmPayment.tsx` → `payments/ConfirmPayment.tsx`
  - `TokenValidationTest.tsx` → Remove or move to `dev/` if needed

- **Duplicate files:**
  - `DepartmentCard.tsx` (root) and `department/DepartmentCard.tsx` → Consolidate

### Proposed Structure:

```
src/components/
├── auth/
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── ResetPassword.tsx
│   ├── ForgetPassword.tsx
│   ├── ConfirmPassword.tsx
│   ├── SelectPlan.tsx
│   └── SignupSuccess.tsx
├── common/
│   ├── AppButton.tsx
│   ├── AppCard.tsx
│   ├── AppSelect.tsx
│   ├── AppTable.tsx
│   ├── AppTextField.tsx
│   ├── ErrorBoundary.tsx
│   ├── ErrorSnackbar.tsx
│   ├── Error404.tsx
│   ├── Pagination.tsx
│   ├── ProfilePictureUpload.tsx
│   ├── ProtectedRoute.tsx
│   ├── RouteErrorBoundary.tsx
│   └── UserAvatar.tsx
├── company/
│   └── CompanyDetails.tsx
├── tenant/
│   └── TenantPage.tsx
├── payments/
│   └── ConfirmPayment.tsx
├── Dashboard.tsx (root - main entry)
├── Layout.tsx (root - main layout)
└── [other existing folders...]
```

## 4. Magic Numbers/Strings Replacement (In Progress)

### Remaining Files to Update:

- Components with hardcoded colors (use `COLORS` constant)
- Components with hardcoded sizes (use `SIZES` constant)
- Components with hardcoded validation limits (use `VALIDATION_LIMITS`)
- Components with hardcoded timeouts (use `TIMEOUTS`)
- Components with hardcoded pagination values (use `PAGINATION`)

### Priority Files:

1. `src/components/Signup.tsx` - Has validation limits
2. `src/components/SelectPlan.tsx` - Has colors and sizes
3. `src/components/CompanyDetails.tsx` - Has colors
4. `src/components/Tenant.tsx` - Has colors and sizes
5. All Payroll components - Have various magic numbers
6. All AssetManagement components - Have sizes and colors

## Implementation Order

1. ✅ Create constants file
2. ✅ Replace timeouts in key files
3. ⏳ Replace validation limits
4. ⏳ Replace colors
5. ⏳ Replace sizes
6. ⏳ Fix file naming
7. ⏳ Reorganize folder structure
8. ⏳ Update all imports

## Notes

- All changes should maintain backward compatibility where possible
- Update imports incrementally to avoid breaking changes
- Test after each major refactoring step
- Consider using a codemod or script for bulk import updates
