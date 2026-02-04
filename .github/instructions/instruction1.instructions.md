---
applyTo: '**'
---

Here’s a **clean, copy-paste ready GitHub Copilot instruction set** tailored **specifically for a React + TypeScript + Material UI (MUI) project**.
You can drop this into **`.github/copilot-instructions.md`** or VS Code **Copilot Custom Instructions**.

---

## 🔧 GitHub Copilot Instructions

**Project Stack:** React + TypeScript + Material UI (MUI)

### 1️⃣ General Coding Rules

- Use **TypeScript strictly** (no `any`, prefer explicit types).
- Use **functional components only**.
- Prefer **named exports** over default exports (unless routing requires default).
- Keep code **clean, readable, and production-ready**.
- Avoid unnecessary abstractions.

---

### 2️⃣ React & Project Structure

- Use this structure:

  ```
  src/
    components/
    pages/
    hooks/
    utils/
    types/
    theme/
    mock/
  ```

- One component per file.
- Keep components **small and reusable**.
- Separate **UI logic and business logic** when possible.

---

### 3️⃣ Material UI (MUI) Guidelines

- Use **MUI components only** (Button, Box, Grid, Stack, Card, Dialog, etc.).
- Prefer **`sx` prop** for styling.
- Do NOT use inline styles or CSS files unless required.
- Use **responsive values** with MUI breakpoints:

  ```ts
  sx={{ width: { xs: '100%', md: 360 } }}
  ```

- Follow consistent spacing:
  - Padding & margin using MUI spacing (`p={2}`, `mt={1}`, etc.)

- Use **MUI Icons** instead of custom SVGs.

---

### 4️⃣ TypeScript Best Practices

- Define reusable types in `src/types`.
- Use interfaces for props:

  ```ts
  interface UserCardProps {
    name: string;
    email: string;
  }
  ```

- Avoid implicit `any`.
- Use enums for statuses where applicable.

---

### 5️⃣ Forms & Validation

- Use **controlled components**.
- Prefer **MUI TextField, Select, Checkbox**.
- Handle validation explicitly (required fields, error messages).
- Keep form logic inside the component (no backend integration unless specified).

---

### 6️⃣ Data Handling

- Use **mock data** from `src/mock` unless API is explicitly requested.
- Do NOT assume backend APIs.
- Use `useState` and `useEffect` appropriately.
- Keep API logic separate if added later.

---

### 7️⃣ Responsiveness & Layout

- Mobile-first approach.
- Use:
  - `Grid` for layouts
  - `Stack` for spacing

- Ensure UI works at:
  - Mobile (≤600px)
  - Tablet (768px)
  - Desktop (≥1024px)

---

### 8️⃣ RTL / LTR Support (Important)

- Support both **RTL and LTR** layouts.
- Avoid hardcoded `marginLeft`, `paddingRight`, etc.
- Use logical properties:

  ```ts
  sx={{ ml: 2 }} // instead of marginLeft
  ```

- Icons and alignment should respect direction.

---

### 9️⃣ UX & UI Quality

- Buttons should have:
  - Clear labels
  - Proper disabled states

- Dialogs must include:
  - Title
  - Content
  - Actions (Cancel / Save)

- Tables should support:
  - Empty state
  - Loading state (if applicable)

---

### 🔟 What Copilot SHOULD Do

✅ Generate **full components**, not snippets
✅ Follow existing patterns
✅ Match MUI design consistency
✅ Use mock data when unsure

### 🚫 What Copilot SHOULD NOT Do

❌ Introduce new libraries without asking
❌ Mix CSS frameworks
❌ Use deprecated MUI APIs
❌ Write backend code unless requested

---

If you want, I can also give you:

- ✅ **HRMS-specific Copilot rules**
- ✅ **Form-heavy UI Copilot tuning**
- ✅ **RTL-first Copilot instructions**
- ✅ **A shorter “strict mode” version**

Just tell me 👍
