# @zai/select-element

[![GitHub release](https://img.shields.io/github/v/release/stsgs1980/SelectElement?style=flat-square&include_prereleases)](https://github.com/stsgs1980/SelectElement/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb?style=flat-square)](https://react.dev/)

> Drop-in DOM element selection for React/Next.js

**Features:**
- Draggable FAB button - move anywhere on screen, position persists
- Midnight theme - Catppuccin Mocha colors, beautiful syntax highlighting
- i18n - English + Russian translations built-in
- Keyboard navigation - Arrow Up/Down for parent/child, Escape to cancel
- Zero dependencies - only React peer dependency
- Fully typed - TypeScript support out of the box

## Install

```bash
bun add github:stsgs1980/SelectElement
# or
npm install github:stsgs1980/SelectElement
# or
yarn add github:stsgs1980/SelectElement
```

For a specific version / tag:

```bash
bun add github:stsgs1980/SelectElement#v1.1.0
```

> **Next.js**: add `transpilePackages: ['@zai/select-element']` to `next.config.ts` so TypeScript sources are compiled automatically.

## Quick Start

### FAB Button (recommended)

```tsx
import { SelectElementFAB, ElementDialog } from '@zai/select-element';
import { useState } from 'react';

function App() {
  const [selectedElement, setSelectedElement] = useState(null);

  return (
    <>
      {/* Draggable FAB button */}
      <SelectElementFAB 
        onElementSelect={(el) => setSelectedElement(el)}
        draggable={true}
      />
      
      {/* Element info dialog */}
      {selectedElement && (
        <ElementDialog 
          element={selectedElement} 
          onClose={() => setSelectedElement(null)} 
        />
      )}
    </>
  );
}
```

### Hook Usage

```tsx
import { useSelectElement, RU_LOCALE } from '@zai/select-element';

function MyComponent() {
  const { isActive, activate, deactivate } = useSelectElement({
    locale: RU_LOCALE,
    showModeIndicator: true,
    onSelect: (element) => {
      console.log('Selected:', element.tagName, element.rect);
    },
  });

  return (
    <button onClick={isActive ? deactivate : activate}>
      {isActive ? 'Stop Selection' : 'Select Element'}
    </button>
  );
}
```

## Components

### `<SelectElementFAB />`

Floating Action Button with drag-and-drop support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `draggable` | `boolean` | `true` | Enable drag to reposition |
| `position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | `'bottom-right'` | Initial position |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `offset` | `number` | `24` | Distance from edge |
| `label` | `string` | `'Select Element'` | Tooltip text |
| `activeLabel` | `string` | `'Scanning...'` | Active state tooltip |
| `onElementSelect` | `(element: SelectedElement) => void` | - | Selection callback |
| `showTooltip` | `boolean` | `true` | Show tooltip on hover |
| `disablePulse` | `boolean` | `false` | Disable active animation |

### `<ElementDialog />`

Simple dialog displaying element info with syntax highlighting.

| Prop | Type | Description |
|------|------|-------------|
| `element` | `SelectedElement` | Selected element data |
| `onClose` | `() => void` | Close callback |

## Types

```typescript
interface SelectedElement {
  tagName: string;
  id?: string;
  className?: string;
  outerHTML: string;
  innerHTML: string;
  innerText?: string;
  styles: Record<string, string>;
  attributes: Record<string, string>;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

## Locales

```tsx
import { EN_LOCALE, RU_LOCALE } from '@zai/select-element';

// Use with hook
useSelectElement({ locale: RU_LOCALE });
```

## Themes

The package uses Catppuccin Mocha color palette:

```tsx
import { CATPPUCCIN_COLORS, MIDNIGHT_COLORS } from '@zai/select-element';

// CATPPUCCIN_COLORS - dialog theme
// MIDNIGHT_COLORS - FAB button theme
```

## Updating

```bash
bun update @zai/select-element
# or
npm install github:stsgs1980/SelectElement
```

## Security

This repository uses Branch Protection to prevent unauthorized changes:

| Setting | Value |
|---------|-------|
| Branch | `main` |
| Require PR before merging | Yes |
| Restrict push access | Owner only |

Only the repository owner can push directly to `main`. All other changes require a Pull Request with review.

## License

MIT (c) stsgs1980

---

Built with: React + TypeScript
