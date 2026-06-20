/**
 * @zai/select-element — Drop-in DOM element selection for React/Next.js
 *
 * v3.0.0 — Draggable FAB, simplified dialog, midnight theme, i18n (EN/RU)
 *
 * Quick start:
 *   import { SelectElementFAB, ElementDialog } from '@zai/select-element';
 *   
 *   const [element, setElement] = useState(null);
 *   
 *   <SelectElementFAB onElementSelect={(el) => setElement(el)} />
 *   {element && <ElementDialog element={element} onClose={() => setElement(null)} />}
 *
 * Hook usage:
 *   import { useSelectElement, RU_LOCALE } from '@zai/select-element';
 *
 *   const { isActive, activate, deactivate } = useSelectElement({
 *     locale: RU_LOCALE,
 *     showModeIndicator: true,
 *     onSelect: (el) => console.log(el),
 *   });
 */

// Hook
export { useSelectElement } from './useSelectElement';

// Types
export type {
  SelectedElement,
  SelectElementConfig,
  SelectElementState,
  ElementRect,
  SelectElementLocale,
  SelectElementFABProps,
  ElementDialogProps,
  FABPosition,
  FABSize,
} from './types';

export {
  DEFAULT_CONFIG,
  EN_LOCALE,
  RU_LOCALE,
  MIDNIGHT_COLORS,
  CATPPUCCIN_COLORS,
} from './types';

// Components
export { SelectElementFAB } from './SelectElementFAB';
export { ElementDialog, escapeHtml, highlightHTML } from './ElementDialog';

// Utilities
export { getCssPath } from './dom-utils';
