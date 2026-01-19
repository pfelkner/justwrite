# PRD: Document Deletion Feature

## Introduction

Add document deletion functionality with platform-specific UX patterns. Desktop users see a hover-triggered delete button, while mobile users can swipe-to-delete. All deletions require confirmation via an AlertDialog, and deleted cards animate out smoothly with remaining cards reflowing into place.

This feature allows users to clean up unwanted drafts and documents, keeping their workspace organized.

## Goals

- Allow document owners to permanently delete their documents
- Provide intuitive, platform-appropriate deletion UX (hover button on desktop, swipe on mobile)
- Require explicit confirmation before deletion to prevent accidents
- Provide smooth visual feedback via exit animations and layout reflow
- Maintain German localization for UI text

## User Stories

### US-001: Add hard delete mutation to backend
**Description:** As a developer, I need a backend mutation to permanently delete documents so the feature has API support.

**Acceptance Criteria:**
- [ ] Add `remove` mutation to `convex/documents.ts`
- [ ] Use `ctx.db.delete()` for permanent deletion (not soft delete)
- [ ] Follow same auth pattern as existing `archive` mutation (owner-only)
- [ ] Typecheck passes (`npx convex dev` runs without errors)

---

### US-002: Add AlertDialog component
**Description:** As a developer, I need an AlertDialog component for the confirmation modal.

**Acceptance Criteria:**
- [ ] Install AlertDialog via `npx shadcn@latest add alert-dialog`
- [ ] Component created at `src/components/ui/alert-dialog.tsx`
- [ ] Component integrates with existing shadcn setup
- [ ] Typecheck passes

---

### US-003: Create useIsMobile hook
**Description:** As a developer, I need to detect mobile vs desktop viewport to show the appropriate deletion UX.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useIsMobile.ts`
- [ ] Returns `true` when viewport width < 768px (Tailwind's `md` breakpoint)
- [ ] Includes resize event listener with cleanup
- [ ] Typecheck passes
- [ ] Unit tests pass

---

### US-004: Create delete confirmation dialog
**Description:** As a user, I want to confirm before deleting so I don't accidentally lose documents.

**Acceptance Criteria:**
- [ ] Create `src/components/delete-confirm-dialog.tsx`
- [ ] Controlled component with `open`, `onOpenChange`, `onConfirm` props
- [ ] German text: "Dokument löschen?" as title
- [ ] Shows `isDeleting` loading state on confirm button
- [ ] Destructive (red) styling on confirm button
- [ ] Dialog cannot close while `isDeleting` is true
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Create DocumentCard with desktop delete button
**Description:** As a desktop user, I want to see a delete button when hovering over a document card so I can quickly delete unwanted documents.

**Acceptance Criteria:**
- [ ] Create `src/components/document-card.tsx`
- [ ] Extract individual card UI from `documents-card.tsx`
- [ ] Ghost delete button with `Trash2` icon in top-right corner
- [ ] Button hidden by default, visible on hover (`opacity-0 group-hover:opacity-100`)
- [ ] Button click calls `onDeleteRequest` callback
- [ ] `e.stopPropagation()` prevents card click when clicking delete
- [ ] Uses existing `icon-sm` size and `ghost` variant from button.tsx
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Add mobile swipe-to-delete gesture
**Description:** As a mobile user, I want to swipe a document card left to delete it, following standard mobile patterns.

**Acceptance Criteria:**
- [ ] Use Framer Motion `drag="x"` on DocumentCard
- [ ] `dragConstraints={{ left: 0, right: 0 }}` to snap back
- [ ] 100px left swipe threshold triggers delete dialog
- [ ] Visual feedback: red background tint appears during swipe
- [ ] `touch-pan-y` CSS allows vertical scrolling while enabling horizontal swipe
- [ ] Card click only triggers if `Math.abs(x.get()) < 10` (not a swipe)
- [ ] Typecheck passes
- [ ] Unit tests for swipe detection logic pass
- [ ] Verify in browser using dev-browser skill (mobile viewport)

---

### US-007: Update DocumentsCard with animations and deletion flow
**Description:** As a user, I want deleted cards to animate out smoothly and remaining cards to reflow into place.

**Acceptance Criteria:**
- [ ] Wrap document grid in `AnimatePresence mode="popLayout"`
- [ ] Each DocumentCard wrapped in `motion.div` with `layout` prop
- [ ] Exit animation: `{{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}`
- [ ] State management: `deleteTarget` and `isDeleting` state
- [ ] Wire up `removeDocument` mutation from Convex
- [ ] Integrate `DeleteConfirmDialog` component
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- **FR-1:** The system must provide a `remove` mutation in `convex/documents.ts` that permanently deletes a document using `ctx.db.delete()`
- **FR-2:** Only the document owner can delete their documents (same auth as archive mutation)
- **FR-3:** On desktop (viewport ≥ 768px), a ghost delete button with Trash2 icon appears in the top-right corner on hover
- **FR-4:** On mobile (viewport < 768px), swiping a card left by ≥ 100px triggers the delete confirmation
- **FR-5:** Clicking the delete button or completing a swipe opens a confirmation AlertDialog
- **FR-6:** The confirmation dialog displays German text: "Dokument löschen?"
- **FR-7:** The confirm button shows loading state while deletion is in progress
- **FR-8:** The dialog cannot be dismissed (closed or cancelled) while deletion is in progress
- **FR-9:** Upon successful deletion, the card animates out with `opacity: 0, scale: 0.8` over 200ms
- **FR-10:** Remaining cards smoothly reflow to fill the gap using Framer Motion's `layout` prop
- **FR-11:** Clicking anywhere on the card (except the delete button) still opens the document
- **FR-12:** Mobile swipe must not interfere with vertical scrolling

## Non-Goals

- No soft delete / trash / recovery functionality – deletion is permanent
- No batch delete of multiple documents
- No undo after confirmation
- No restrictions based on document content or word count
- No admin override to delete others' documents
- No keyboard shortcuts for deletion

## Technical Considerations

- **Existing Components:** Use existing `button.tsx` with `icon-sm` size and `ghost` variant
- **shadcn Config:** AlertDialog installs via existing `components.json` configuration
- **Framer Motion:** Already available in project for animations
- **Convex Patterns:** Follow existing auth patterns in `documents.ts` (see `archive` mutation)
- **Mobile Detection:** Use window resize listener with `768px` breakpoint (Tailwind's `md`)

## Design Considerations

- Delete button uses `Trash2` icon from lucide-react
- Destructive actions use red/destructive color variants
- Swipe reveals red background tint as visual affordance
- Exit animation (scale + fade) provides satisfying feedback
- German localization for dialog text ("Dokument löschen?")

## Success Metrics

- Desktop: Hover → trash icon visible → click → dialog → confirm → card animates out (< 3 clicks)
- Mobile: Swipe left ≥ 100px → dialog → confirm → card animates out (single gesture + confirm)
- Cancel flow: Dialog closes without side effects
- No accidental deletions: Confirmation required for all deletions
- No scroll interference: Mobile vertical scroll works normally

## Open Questions

- Should the delete confirmation include the document title for clarity?
- Should there be a brief toast notification after successful deletion?
- What should happen if deletion fails (network error)?
