# Infrastructure & Code Style Guide

## Overview

This guide documents infrastructure patterns and code style principles. Focus on concepts and ideas rather than specific implementations.

## Core Principles

### Code Organization
- **Split files** by responsibility
- **One concept per file**
- **Keep files small and focused**
- **Group related functionality**

### Code Style
- **Arrow functions** for all exports
- **Named exports** only (no default exports)
- **Self-documenting code** (no unnecessary comments)
- **Simple and readable** code

### Code Reuse
- **Factory pattern** for reusable functionality
- **Extract common code** into utilities
- **Avoid duplication**
- **Leverage generics** for type-safe reuse

### Code Cleanup
- **Remove unused code** immediately
- **Delete old documentation** when outdated
- **Clean up dead code** regularly
- **Keep codebase minimal**

### Development Process
- **Check recent changes** to understand current state
- **Review existing patterns** before creating new code
- **Follow established patterns** for consistency
- **Understand task requirements** before starting

### CSS Style Guidelines
- **Follow project CSS standards**
- **Use consistent naming conventions**
- **Maintain style consistency**
- **Follow design system guidelines**

---

## Library Structure

### Idea
Separate generic utilities from application-specific code.

### Structure
- **Libraries**: Generic, reusable, framework-agnostic
- **Applications**: App-specific types, configuration, business logic

### Benefits
- Reusability across projects
- Clear boundaries
- Independent testing
- Single responsibility

---

## Hook Patterns

### Idea
Use factory pattern to create typed hooks from configuration.

### Structure
1. **Factory Function** (generic, reusable)
2. **App-Specific Hook** (typed from factory)
3. **Re-export** (centralized exports)

### Benefits
- Type safety
- Reusability
- Configuration-driven
- Easy to extend

---

## Storage Implementation

### Idea
Use type-safe storage with runtime validation.

### Structure
1. **Type Definitions**: Define keys and values
2. **Type Guards**: Runtime validation
3. **Factory**: Create typed hooks from configuration
4. **App Usage**: Use typed hooks in application

### Type Guard Rules
- Object schemas → `isType`
- Unknown key records → `isIndexRecord`
- Known key records → `isRecord`

---

## Import/Export Patterns

### Idea
Organize imports logically and export directly from factories.

### Import Order
1. External libraries
2. Internal library imports
3. Relative imports
4. Type-only imports last

### Export Pattern
- Use destructuring exports from factories
- Avoid intermediate variables
- Export directly from factory

### File Extensions
- Include `.js` extensions in library files (nodenext)
- Extensions optional in app files (bundler)

---

## File Organization

### Hooks
- One hook per file
- Centralized exports in index
- Group related hooks

### Types
- Type definitions separate from guards
- Keep related types together
- Clear naming conventions

### Services
- One service per file
- Group related services
- Clear responsibilities

---

## Development Workflow

### Creating New Code
1. Check recent changes
2. Review existing patterns
3. Define types first
4. Create type guards
5. Use factory pattern
6. Split files appropriately
7. Reuse existing code

### Refactoring Code
1. Remove unused code
2. Simplify logic
3. Convert to patterns
4. Remove intermediate variables
5. Clean up documentation

### Code Review Checklist
- Remove unused imports
- Delete dead code
- Simplify complex logic
- Ensure consistency
- Follow CSS guidelines

---

## TypeScript Guidelines

### Type Safety
- Use generics for reusability
- Leverage type guards for validation
- Keep types with related code
- Use type inference when possible

### Module Resolution
- Use appropriate resolution per environment
- Include file extensions where required
- Configure path mappings correctly

---

## CSS Style Guidelines

### Principles
- Follow project CSS standards
- Use consistent naming
- Maintain style consistency
- Follow design system

### Practices
- Use design tokens
- Follow component patterns
- Maintain responsive design
- Ensure accessibility

---

## Quick Reference

### Code Creation
1. Check recent changes
2. Review patterns
3. Define types
4. Create guards
5. Use factory
6. Split files
7. Reuse code

### Code Cleanup
1. Remove unused code
2. Delete old docs
3. Simplify logic
4. Follow patterns
5. Ensure consistency

### Code Style
- Arrow functions
- Named exports
- No comments
- Simple code
- Split files

---

## Summary

Key principles:
- **Reuse code** through factories and utilities
- **Split files** by responsibility
- **Remove unused code** regularly
- **Keep code simple** and readable
- **Check changes** before starting
- **Follow CSS guidelines** consistently

Focus on ideas and patterns. Implementation follows naturally from these principles.
