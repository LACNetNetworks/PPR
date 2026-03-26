# Testing Strategy

## Run tests

- `npm test`: run all tests once
- `npm run test:watch`: run tests in watch mode

## Current scope

- Unit tests for breadcrumb routing logic in:
  - `src/components/breadcrumb.utils.test.ts`

## Recommended rollout

1. Critical routing and role guards
- `src/components/role-protected-route.tsx`
- `src/app/(app)/application-layout.tsx`
- breadcrumb and sidebar route helpers

2. Data shaping and UI decision logic
- table/grid URL builders
- project, stage and task derived states

3. Key user flows
- smoke tests for:
  - login and role landing route
  - project list to project detail navigation
  - evidence and permissions navigation

4. Regression suite for bugs
- every fixed bug should add a focused test near the affected module

## Conventions

- Keep tests close to code: `*.test.ts` / `*.test.tsx`
- Favor pure-function tests first, then component behavior tests
- Use one test case per business rule to simplify debugging
