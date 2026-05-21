# Task 5-b: Add "Cleanup duplicates" button to dashboard

## Summary
Added "Очистить дубли" button to the dashboard Quick Actions section, wired to the existing `/api/documents/cleanup` endpoint with full scan → confirm → delete flow.

## Files Modified
- `/src/components/codex/dashboard-view.tsx` — Added cleanup button, state management, AlertDialog, scan/delete handlers
- `/src/app/page.tsx` — Added `onCleanupComplete={refreshAll}` prop to DashboardView
- `/worklog.md` — Appended work log entry

## Key Implementation Details
- **State**: `isScanning`, `isCleaning`, `duplicateGroups`, `showCleanupDialog`
- **Button**: Trash2 icon, "Очистить дубли" label, size="sm" h-7, font-mono text-xs — matches existing Quick Actions buttons
- **Scan flow**: POST `/api/documents/cleanup` `{action:'scan'}` → no dupes = toast → dupes found = AlertDialog
- **Dialog**: Per-group breakdown with reason badge, keep doc highlighted, duplicates listed with Trash2 icon in destructive color
- **Delete flow**: POST `/api/documents/cleanup` `{action:'delete', ids:[...]}` → success toast → `onCleanupComplete()`
- **Prop**: `onCleanupComplete?: () => void` — called after successful deletion; page.tsx passes `refreshAll`

## Lint
- Passes cleanly with zero errors
