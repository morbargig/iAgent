<!-- e8500228-af21-4f09-bad5-0eb8d0bd4b7c d1a4c58f-6c56-48a7-ae03-242d00d3ac93 -->
# Implement Report Page with Backend Integration

## Overview

Create a reports page that displays numbered report links fetched from the backend. The page will be integrated into the existing chat interface, and clicking a report number will open the existing ReportDetailsPanel side panel.

## Implementation Steps

### Backend Changes

1. **Create Reports DTO** (`apps/backend/src/app/dto/chat.dto.ts`)

- Add `ReportListItemDto` with fields: `number` (string like "[1]"), `reportId` (string), `title` (optional string)
- Add `ReportsListDto` with `reports` array

2. **Create Reports Controller** (`apps/backend/src/app/controllers/reports.controller.ts`)

- Create `ReportsController` with `@Controller('reports')` and `@UseGuards(JwtAuthGuard)`
- Add `GET /api/reports` endpoint that returns mocked report list
- Mock data should include reports with numbers like "[1]", "[2]", etc. and corresponding reportIds

3. **Register Controller** (`apps/backend/src/app/app.module.ts`)

- Add `ReportsController` to the controllers array

### Frontend Changes

4. **Create Reports API Hook** (`apps/frontend/src/features/reports/api.ts`)

- Create `useReports` hook using React Query to fetch reports from `/api/reports`
- Define `ReportListItem` interface matching backend DTO
- Use same authentication pattern as other API hooks

5. **Create ReportsPage Component** (`apps/frontend/src/components/ReportsPage.tsx`)

- Display list of report links as `[1]`, `[2]`, etc.
- Use `useReports` hook to fetch data
- Each link should be clickable and call `onOpenReport` callback with `report://{reportId}` format
- Style consistently with existing components (iagent design system)
- Show loading state while fetching
- Handle empty state

6. **Integrate ReportsPage into App** (`apps/frontend/src/app/app.tsx`)

- Add state to track current view (chat vs reports)
- Add navigation method to switch to reports view
- Conditionally render `ReportsPage` or `ChatArea` based on current view
- Pass `openReportFromUrl` callback to `ReportsPage`

7. **Add Reports Navigation to Sidebar** (`apps/frontend/src/components/Sidebar.tsx`)

- Add "Reports" button/link in sidebar (similar to "New Chat" button)
- Add `onNavigateToReports` prop to Sidebar
- Call callback when Reports button is clicked

8. **Update ReportDetailsPanel** (`apps/frontend/src/components/ReportDetailsPanel.tsx`)

- Ensure `fetchReportDetails` function can handle reportIds from backend
- Update mock data if needed to match backend reportIds

## Files to Create/Modify

**Backend:**

- `apps/backend/src/app/controllers/reports.controller.ts` (new)
- `apps/backend/src/app/dto/chat.dto.ts` (modify)
- `apps/backend/src/app/app.module.ts` (modify)

**Frontend:**

- `apps/frontend/src/features/reports/api.ts` (new)
- `apps/frontend/src/components/ReportsPage.tsx` (new)
- `apps/frontend/src/app/app.tsx` (modify)
- `apps/frontend/src/components/Sidebar.tsx` (modify)
- `apps/frontend/src/components/ReportDetailsPanel.tsx` (modify if needed)

## Key Implementation Details

- Reports list endpoint: `GET /api/reports` (protected with JWT)
- Report link format: `report://{reportId}` (already supported)
- View switching: Use state in App component to toggle between chat and reports views
- Styling: Follow existing iagent design system patterns
- Authentication: Use same JWT pattern as other endpoints

### To-dos

- [ ] Add ReportListItemDto and ReportsListDto to chat.dto.ts
- [ ] Create ReportsController with GET /api/reports endpoint returning mocked reports
- [ ] Register ReportsController in app.module.ts
- [ ] Create useReports hook in features/reports/api.ts
- [ ] Create ReportsPage component displaying numbered report links
- [ ] Add view state and integrate ReportsPage into app.tsx
- [ ] Add Reports navigation button to Sidebar component
- [ ] Verify report links open ReportDetailsPanel correctly