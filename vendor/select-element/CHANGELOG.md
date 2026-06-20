# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-06

### Features
- CSS Path - `SelectedElement.cssPath` now includes full CSS selector path (e.g. `div > section#intro > h2:nth-of-type(1)`)
- `getCssPath()` utility exported for standalone use
- ElementDialog now shows CSS Path and Text Content rows with click-to-copy
- CopyRow helper component for copyable labeled values

### Changes
- `SelectedElement` interface: added required `cssPath: string` field
- ElementDialog: new CSS Path section (mauve label, monospace, click to copy)
- ElementDialog: new Text Content section (green label, click to copy)
- ElementDialog: CopyRow component with check icon feedback

## [1.0.0] - 2025-01

### Features
- Draggable FAB button - drag to reposition, position saved to localStorage
- Syntax highlighting - HTML highlighting with Catppuccin Mocha colors
- Element type detection - smart identification with EN/RU translations
- Copy button - one-click copy of element HTML
- Grip icon indicator - visual hint that button is draggable
- Touch support - drag works on mobile devices
- Keyboard navigation - Arrow Up/Down for parent/child, Escape to cancel
- Zero dependencies - only React peer dependency
- Full TypeScript support

### Components
- `SelectElementFAB` - Floating Action Button with drag-and-drop
- `ElementDialog` - Simple dialog with syntax-highlighted code
- `useSelectElement` - React hook for element selection

---

Built with: React + TypeScript
