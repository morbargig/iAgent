# Memory Leak Fixes Plan - Frontend

## Overview
The frontend application experiences high memory usage (2GB+) over time. This document outlines identified memory leaks and their fixes.

---

## Critical Issues

### 1. Unbounded `loadedConversations` Map
**File:** `apps/frontend/src/app/app.tsx:321-322`

**Problem:**
```typescript
const [loadedConversations, setLoadedConversations] = useState<Map<string, Conversation>>(new Map());
```
- Map grows indefinitely as user opens conversations
- No eviction policy or max size limit
- Each Conversation contains large message arrays

**Solution:**
- Implement LRU cache with max 20 conversations
- Evict oldest conversations when limit exceeded

---

### 2. setInterval with Missing Dependencies
**File:** `apps/frontend/src/app/app.tsx:1372-1427`

**Problem:**
- useEffect creates interval but dependency array is incomplete
- `updateLoadedConversation` missing from deps
- Creates overlapping intervals on state changes

**Solution:**
- Add missing dependencies to array
- Or use refs for stable function references

---

### 3. Window Event Listeners with Stale Refs
**File:** `apps/frontend/src/app/app.tsx:1545-1552`

**Problem:**
- `beforeunload` and `pagehide` handlers capture refs
- Refs hold large conversation objects
- Prevents garbage collection

**Solution:**
- Memoize handler with useCallback
- Ensure proper cleanup on dependency changes

---

### 4. setTimeout Without Cleanup (File Upload)
**File:** `apps/frontend/src/hooks/useFileHandling.ts:85-99`

**Problem:**
```typescript
setTimeout(() => {
  setAttachedFiles((prev) => [...prev, {...}]);
  setUploadingFiles((prev) => prev.filter((f) => f.tempId !== tempId));
}, 500);
```
- No timer reference stored
- Cannot cancel on unmount
- Fires state updates on unmounted component

**Solution:**
- Store timer ID in ref
- Clear timer in cleanup function
- Use isMounted flag pattern

---

### 5. Translation State Accumulation
**File:** `apps/frontend/src/contexts/TranslationContext.tsx:42-67`

**Problem:**
```typescript
translations: { ...prev.translations, [lang]: module.default }
```
- All loaded languages stay in state
- Switching languages 100x = 100 language modules in memory

**Solution:**
- Keep only current + fallback language
- Clear previous translations on language switch

---

### 6. Missing Ref Dependency in useStreamingManagement
**File:** `apps/frontend/src/hooks/useStreamingManagement.ts:36-48`

**Problem:**
- `streamingClientRef` accessed but not in dependency array
- Creates stale closure

**Solution:**
- Add `streamingClientRef` to dependencies (refs are stable, safe to add)

---

### 7. Streaming Buffer Never Cleared
**File:** `apps/frontend/src/utils/streaming-client.ts:71-113`

**Problem:**
```typescript
let buffer = '';
let sections: Record<string, { content: string; parsed: ParsedMessageContent }> = {};
const sectionBuilders: Record<string, ReturnType<typeof createStreamingMarkupBuilder>> = {};
```
- Buffer accumulates streamed content
- `sections` and `sectionBuilders` never cleared
- Large responses persist in closure

**Solution:**
- Add cleanup in finally block after stream completes
- Clear buffer, sections, sectionBuilders on complete/error

---

### 8. React Query Over-fetching
**File:** `apps/frontend/src/lib/queryClient.ts:10`

**Problem:**
```typescript
refetchOnReconnect: 'always',
refetchOnMount: true,
```
- Every reconnect triggers all queries
- Cache grows with duplicate data

**Solution:**
```typescript
refetchOnReconnect: 'stale',
refetchOnMount: 'stale',
```

---

### 9. useQueries with Large Arrays
**File:** `apps/frontend/src/hooks/useAttachments.ts:42-56`

**Problem:**
- Creates query subscription per attachment ID
- 1000 attachments = 1000 subscriptions

**Solution:**
- Add pagination or limit (max 50 concurrent queries)
- Load more on demand

---

## Implementation Order

1. **queryClient.ts** - Quick config change, immediate impact
2. **streaming-client.ts** - Add cleanup, high impact
3. **app.tsx (loadedConversations)** - Add LRU limit, high impact
4. **useFileHandling.ts** - Add timer cleanup
5. **TranslationContext.tsx** - Limit cached translations
6. **app.tsx (useEffect deps)** - Fix dependency arrays
7. **useStreamingManagement.ts** - Add missing dependency
8. **useAttachments.ts** - Add query limit

---

## Testing

After fixes, verify:
1. Memory stays stable over extended use
2. Open/close 50+ conversations - memory should stabilize
3. Stream multiple long responses - no buffer accumulation
4. Switch languages repeatedly - memory stable
5. Upload multiple files - no orphaned timers

---

## Phase 1 Completion Notes

**Date:** 2025-12-22
**Assigned Agents:** Claude Opus 4.5, frontend-engineer

### Completed Tasks

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Change refetchOnReconnect to 'stale' | queryClient.ts | ✅ Done |
| 2 | Add buffer cleanup in finally block | streaming-client.ts | ✅ Done |
| 3 | Add LRU limit (20) to loadedConversations | app.tsx | ✅ Done |
| 4 | Add timer cleanup with refs | useFileHandling.ts | ✅ Done |
| 5 | Limit cached translations (current + fallback) | TranslationContext.tsx | ✅ Done |
| 6 | Fix useEffect dependency arrays | app.tsx | ✅ Done |
| 7 | Verify useStreamingManagement refs pattern | useStreamingManagement.ts | ✅ Verified OK |
| 8 | Add query limit (50 max) | useAttachments.ts | ✅ Done |

### Changes Summary

1. **queryClient.ts**: Changed `refetchOnReconnect: 'always'` → `'stale'` and `refetchOnMount: true` → `'stale'`

2. **streaming-client.ts**: Added cleanup in finally block to clear `buffer`, `sectionBuilders`, and `sections`

3. **app.tsx**:
   - Added `MAX_LOADED_CONVERSATIONS = 20` constant
   - Added `enforceConversationLimit()` LRU helper function
   - Added `setLoadedConversationsWithLimit()` wrapper
   - Replaced 16 direct `setLoadedConversations` calls with the wrapper
   - Added missing deps to setInterval useEffect

4. **useFileHandling.ts**:
   - Added `pendingTimersRef` to track active timers
   - Added useEffect cleanup to clear all timers on unmount
   - Modified setTimeout to register/unregister from ref

5. **TranslationContext.tsx**:
   - Added `DEFAULT_FALLBACK_LANG = "en"` constant
   - Modified `loadTranslation` to only keep current lang + English fallback
   - Memoized with useCallback

6. **useAttachments.ts**:
   - Added `MAX_CONCURRENT_ATTACHMENT_QUERIES = 50` limit
   - Added `hasMore` return value to indicate truncation

### Blockers/Issues
None - all tasks completed successfully.

### Next Steps
- Run build to verify no TypeScript errors
- Test the application to verify memory usage improvement
- Monitor memory in browser DevTools during extended use
