# @iagent/front-react

This library provides generic React storage hooks infrastructure that can be configured with app-specific types, guards, and defaults.

## Infrastructure

- **Generic Types**: Type definitions for storage hooks
- **useDeepMemo**: Deep equality memoization hook
- **Factory Functions**: Create typed hooks from configuration

## Usage

The library provides factory functions that create typed hooks based on your app's storage configuration:

```typescript
import { createUseLocalStorage, createUseSessionStorage } from '@iagent/front-react';

const hooks = createUseLocalStorage({
  defaults: myDefaults,
  guards: myGuards,
});

export const { useAppLocalStorage, useAppReadLocalStorage } = hooks;
```

## Running unit tests

Run `nx test @iagent/front-react` to execute the unit tests via [Jest](https://jestjs.io).
