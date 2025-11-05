# Design Patterns & Architecture Guide

## Philosophy

This guide outlines design patterns and architectural principles that promote maintainable, scalable, and type-safe code. Focus on ideas and concepts rather than specific implementations.

## Core Principles

### 1. Separation of Concerns
Keep generic utilities separate from application-specific code. Create clear boundaries between reusable libraries and business logic.

### 2. Factory Pattern
Use factories to create typed instances from configuration. This enables reusability while maintaining type safety through generics.

### 3. Type-Driven Development
Define types first, then implement. Use type guards for runtime validation to ensure type safety throughout the application.

### 4. Minimalism
Write self-documenting code. Remove unnecessary comments and documentation. Prefer simple solutions over complex ones.

### 5. Code Reuse
Always reuse code when possible. Extract common functionality into reusable utilities. Avoid duplication.

### 6. File Organization
Split files by responsibility. Keep files small and focused. One concept per file.

### 7. Code Cleanup
Remove unused code, old documentation, and dead code. Keep the codebase clean and maintainable.

---

## Design Patterns

### Factory Pattern

**Idea**: Create typed instances from configuration without code duplication.

**Structure**: Generic factory function that accepts configuration and returns typed hooks/utilities.

**When to Use**: When you need multiple typed instances of similar functionality with different configurations.

**Benefits**: Type safety, reusability, single source of truth, easy to extend.

---

### Type Guard Pattern

**Idea**: Provide runtime type validation while maintaining compile-time type safety.

**Structure**: Define types, create type guards using library functions, use guards in factories.

**Type Guard Rules**:
- Object schemas → Use `isType` with object schema
- Records with unknown keys → Use `isIndexRecord` with value type
- Records with known keys → Use `isRecord` with key array and value type

**Benefits**: Runtime safety, type narrowing, early error detection, self-documenting validation.

---

### Layered Architecture

**Idea**: Separate generic utilities from application-specific code.

**Structure**: 
- Library Layer: Generic, reusable, framework-agnostic
- Application Layer: App-specific types, configuration, business logic

**Benefits**: Reusability across projects, clear boundaries, independent testing, single responsibility.

---

### Destructuring Export Pattern

**Idea**: Simplify exports by eliminating intermediate variables.

**Structure**: Export directly from factory using destructuring instead of creating intermediate variables.

**Benefits**: Fewer lines, clearer intent, less memory usage, simpler code.

---

### Module Resolution Strategy

**Idea**: Handle module resolution correctly for different environments.

**Structure**: Use appropriate module resolution per environment (nodenext for libraries, bundler for apps).

**Benefits**: Correct module resolution, TypeScript compatibility, runtime compatibility.

---

### Mock Mode Pattern

**Idea**: Provide development/testing mode without external dependencies.

**Structure**: Check mock mode flag, route to appropriate implementation (mock or live).

**Benefits**: Faster development, no external dependencies, predictable test data, easy mode switching.

---

### Centralized Exports

**Idea**: Provide single entry point for related functionality.

**Structure**: Individual files export functionality, index file re-exports related items.

**Benefits**: Single import point, easy refactoring, clear module boundaries, better tree-shaking.

---

### Type-Safe Configuration

**Idea**: Ensure configuration matches types at compile time.

**Structure**: Define types, create configuration that matches types, TypeScript enforces correctness.

**Benefits**: Compile-time type checking, early error detection, self-documenting, refactor-safe.

---

## Code Style Principles

### Simplicity
- Write simple, readable code
- Remove unnecessary complexity
- Prefer straightforward solutions

### Consistency
- Follow established patterns
- Use uniform code style
- Maintain naming conventions

### Type Safety
- Leverage TypeScript fully
- Use generics for reusability
- Use type guards for validation

### Organization
- Split files by responsibility
- Keep files focused
- Group related functionality

### Cleanup
- Remove unused code
- Delete old documentation
- Clean up dead code

---

## Development Workflow

### Before Starting
1. Check recent changes to understand current state
2. Review existing patterns in similar files
3. Understand the task requirements

### When Creating Code
1. Define types first
2. Create type guards
3. Use factory pattern for reusable functionality
4. Split files appropriately
5. Reuse existing code when possible
6. Keep code simple and readable

### When Refactoring
1. Remove unused code
2. Simplify existing code
3. Convert to established patterns
4. Remove intermediate variables
5. Clean up old documentation

### Code Review
1. Remove unused imports
2. Delete dead code
3. Simplify complex logic
4. Ensure consistency
5. Follow CSS style guidelines

---

## Best Practices

### ✅ Do
- Reuse code through factories and utilities
- Split files by responsibility
- Remove unused code and documentation
- Keep code simple and readable
- Check recent changes before starting
- Follow CSS style guidelines
- Use type guards for validation
- Leverage TypeScript generics

### ❌ Don't
- Duplicate code unnecessarily
- Create large, monolithic files
- Keep unused or dead code
- Add unnecessary complexity
- Ignore existing patterns
- Skip code cleanup
- Forget type safety
- Mix concerns between layers

---

## Pattern Selection Guide

| Need | Pattern | Concept |
|------|---------|---------|
| Multiple typed instances | Factory Pattern | Configuration-driven creation |
| Runtime validation | Type Guards | Type-safe validation |
| Code reuse | Factory Pattern | Generic implementation |
| Development mode | Mock Mode | Flag-based routing |
| Related exports | Centralized Exports | Single entry point |
| Type safety | Type-Safe Configuration | Compile-time checking |

---

## Summary

These patterns promote:

1. **Reusability**: Generic code for multiple use cases
2. **Type Safety**: Leverage TypeScript fully
3. **Maintainability**: Clear structure and patterns
4. **Simplicity**: Minimal, clean code
5. **Consistency**: Uniform patterns throughout
6. **Cleanliness**: Remove unused code and documentation

Focus on ideas and principles. Implementation details should follow these patterns naturally.
