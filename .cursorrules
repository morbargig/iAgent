# Cursor AI Rules - Design Patterns & Code Style

## Core Principles

1. **Check recent changes** - Review git history and recent edits first
2. **Remove unused code** - Delete unused imports, functions, variables, files
3. **Remove old documentation** - Delete outdated docs and comments
4. **Reuse code** - Use existing utilities, factories, patterns
5. **Split files** - Break large files into smaller, focused files
6. **Keep code simple** - Readable, straightforward code
7. **Follow guidelines** - CSS/UI guidelines when applicable

## Code Style

- **Exports**: `export const functionName = () => {}` (arrow functions, named exports)
- **No comments**: Code should be self-explanatory
- **File extensions**: Include `.js` in relative imports for libraries (nodenext)
- **Imports**: External → Internal → Relative → Types

## Patterns

### Factory Pattern
If creating reusable functionality:
- Use factory pattern with generics
- Create typed instances from configuration
- Export directly from factory using destructuring

### Type Guards
If validating types:
- Object schemas → `isType({ field: isString })`
- Unknown keys → `isIndexRecord(isValue)`
- Known keys → `isRecord(['key1'], isValue)`

### File Organization
If organizing code:
- One concept per file
- Centralized exports in `index.ts`
- Split files by responsibility

## Development Workflow

### Before Starting
If beginning a task:
1. Check recent changes (git history, recent edits)
2. Review existing patterns in similar files
3. Understand task requirements

### When Creating Code
If writing new code:
1. Define types first
2. Use factory pattern if reusable
3. Split files appropriately
4. Reuse existing code
5. Keep code simple

### When Refactoring
If refactoring:
1. Remove unused code
2. Remove old documentation
3. Simplify code
4. Convert to patterns
5. Split large files

## Guidelines

### Front/React Code
If working with React/front code:
- Follow patterns from INFRASTRUCTURE_GUIDE.md
- Use factory pattern for hooks
- Export from factories using destructuring
- Keep files small and focused

### CSS/UI Code
If working with CSS/UI:
- Follow STYLE_GUIDE.md
- Use Material-UI components consistently
- Follow design tokens and color palette
- Maintain responsive design patterns
- Ensure RTL/LTR support

## Quick Reference

- **Storage hooks**: Factory → Typed hook → Re-export
- **Type guards**: `isType` (objects), `isIndexRecord` (unknown keys)
- **Exports**: Named exports, arrow functions, destructuring
- **Files**: One concept per file, split by responsibility

## Reference Documents

- **DESIGN_PATTERNS_GUIDE.md**: Generic design patterns (read first)
- **INFRASTRUCTURE_GUIDE.md**: Project-specific details
- **STYLE_GUIDE.md**: CSS/UI guidelines
