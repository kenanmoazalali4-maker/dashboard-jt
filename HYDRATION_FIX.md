# Hydration Mismatch Fix - Applied May 17, 2026

## Issue
React hydration mismatch error in ApplicationsClient component:
- Server rendered: `/apply`
- Client rendered: `http://localhost:3000/apply`

## Root Cause
Line 20 of ApplicationsClient.tsx had conditional URL construction during render:
```typescript
const applyLink = typeof window !== "undefined" ? `${window.location.origin}/apply` : "/apply";
```

This is evaluated during render, causing server/client mismatch.

## Solution Applied
Converted to use `useState` + `useEffect` with client-side initialization:

```typescript
const [applyLink, setApplyLink] = useState("/apply");

useEffect(() => {
  setApplyLink(`${window.location.origin}/apply`);
}, []);
```

Now:
- Server renders with default `/apply`
- Client updates to full URL after hydration
- No mismatch error

## How to Prevent Similar Issues

### ❌ Wrong - Causes Hydration Mismatch
```typescript
// Conditional in render
const value = typeof window !== 'undefined' ? complexValue : simpleValue;

// Date/random in render
const id = Math.random().toString();
const stamp = Date.now();

// Using window directly
const url = window.location.href;
```

### ✅ Right - Safe from Hydration Mismatch
```typescript
// Use useState + useEffect for dynamic values
const [value, setValue] = useState(defaultValue);
useEffect(() => {
  setValue(complexValue);
}, []);

// Server-side only for date calculations
// (safe if used in data fetching, not in render)
const now = Math.floor(Date.now() / 1000);

// useEffect for window access
const [href, setHref] = useState('');
useEffect(() => {
  setHref(window.location.href);
}, []);
```

## Files Modified
- `src/app/applications/ApplicationsClient.tsx` - Fixed applyLink construction

## Testing
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+Shift+R`
3. Navigate to `/applications`
4. Check console for hydration errors - should be gone

## Reference
- https://react.dev/link/hydration-mismatch
- https://nextjs.org/docs/messages/react-hydration-error
