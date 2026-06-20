/**
 * Select Element - Types
 * 
 * @zai/select-element v3.0.0
 */

export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedElement {
  tagName: string;
  id?: string;
  className?: string;
  outerHTML: string;
  innerHTML: string;
  innerText?: string;
  cssPath: string;
  styles: Record<string, string>;
  attributes: Record<string, string>;
  rect: ElementRect;
}

/**
 * Localized strings for the select-element module.
 */
export interface SelectElementLocale {
  tooltipHint?: string;
  autoSelectFrom?: (origTag: string) => string;
  navigatedToParent?: string;
  navigatedToOriginal?: string;
  modeIndicatorText?: string;
}

/** English locale (default) */
export const EN_LOCALE: Required<SelectElementLocale> = {
  tooltipHint: 'Click to select | Arrow Up/Down for parent/child | Esc to cancel',
  autoSelectFrom: (origTag: string) => `Auto-selected from <${origTag}> (Down for original)`,
  navigatedToParent: 'Navigated to parent',
  navigatedToOriginal: 'Navigated to original element',
  modeIndicatorText: 'SELECT ELEMENT MODE ACTIVE',
};

/** Russian locale */
export const RU_LOCALE: Required<SelectElementLocale> = {
  tooltipHint: 'Клик - выбор | Вверх/Вниз - родитель/потомок | Esc - отмена',
  autoSelectFrom: (origTag: string) => `Авто-выбор из <${origTag}> (Вниз - оригинал)`,
  navigatedToParent: 'Перешли к родителю',
  navigatedToOriginal: 'Перешли к оригиналу',
  modeIndicatorText: 'РЕЖИМ ВЫБОРА ЭЛЕМЕНТА',
};

export interface SelectElementConfig {
  /** Highlight color (default: #89b4fa) */
  highlightColor?: string;
  /** Background color for highlight (default: rgba(137, 180, 250, 0.15)) */
  highlightBg?: string;
  /** Max HTML length to capture (default: 2000) */
  maxHtmlLength?: number;
  /** Max innerText length to capture (default: 200) */
  maxTextLength?: number;
  /** Important CSS properties to capture */
  styleProperties?: string[];
  /** Tags to skip when finding parent container */
  smallTags?: string[];
  /** Show tooltip on hover (default: true) */
  showTooltip?: boolean;
  /** Use overlay mode instead of modifying element (default: false) */
  useOverlay?: boolean;
  /** Show mode indicator at top of screen (default: false) */
  showModeIndicator?: boolean;
  /** Localized strings (default: English) */
  locale?: SelectElementLocale;
  /** Callback when element is selected */
  onSelect?: (element: SelectedElement) => void;
  /** Callback when mode is cancelled */
  onCancel?: () => void;
}

export interface SelectElementState {
  isActive: boolean;
  selectedElement: SelectedElement | null;
}

// Default configuration
export const DEFAULT_CONFIG: Required<Omit<SelectElementConfig, 'onSelect' | 'onCancel' | 'locale'>> = {
  highlightColor: '#89b4fa',
  highlightBg: 'rgba(137, 180, 250, 0.15)',
  maxHtmlLength: 2000,
  maxTextLength: 200,
  styleProperties: [
    'display', 'position', 'flexDirection', 'alignItems', 'justifyContent',
    'padding', 'margin', 'width', 'height', 'backgroundColor', 'color',
    'fontSize', 'fontFamily', 'border', 'borderRadius', 'overflow',
    'zIndex', 'opacity', 'gap', 'boxShadow', 'gridTemplateColumns'
  ],
  smallTags: ['span', 'svg', 'path', 'use', 'img', 'i', 'small', 'strong', 'em', 'b', 'a', 'button'],
  showTooltip: true,
  useOverlay: false,
  showModeIndicator: false,
};

/* ------------------------------------------------------------------ */
/*  FAB Types                                                         */
/* ------------------------------------------------------------------ */

export type FABPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type FABSize = 'sm' | 'md' | 'lg';

export interface SelectElementFABProps {
  position?: FABPosition;
  offset?: number;
  size?: FABSize;
  zIndex?: number;
  showTooltip?: boolean;
  label?: string;
  activeLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  tooltipStyle?: React.CSSProperties;
  colors?: Partial<typeof MIDNIGHT_COLORS>;
  disablePulse?: boolean;
  draggable?: boolean;
  isActive?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  onElementSelect?: (element: SelectedElement) => void;
  highlightColor?: string;
  highlightBg?: string;
  maxHtmlLength?: number;
  maxTextLength?: number;
  styleProperties?: string[];
  smallTags?: string[];
  showSelectTooltip?: boolean;
  useOverlay?: boolean;
  showModeIndicator?: boolean;
  locale?: SelectElementConfig['locale'];
  onCancel?: () => void;
}

export const MIDNIGHT_COLORS = {
  base: '#1a1a2e',
  hover: '#2a2a4a',
  active: '#4a3aff',
  activeHover: '#5b4bff',
  icon: '#9d9dcc',
  iconActive: '#ffffff',
  shadow: 'rgba(26, 26, 46, 0.45)',
  activeShadow: 'rgba(74, 58, 255, 0.40)',
  ring: 'rgba(74, 58, 255, 0.25)',
} as const;

/* ------------------------------------------------------------------ */
/*  Dialog Types                                                      */
/* ------------------------------------------------------------------ */

export interface ElementDialogProps {
  element: SelectedElement;
  onClose: () => void;
}

export const CATPPUCCIN_COLORS = {
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
  text: '#cdd6f4',
  subtext0: '#a6adc8',
  subtext1: '#bac2de',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay0: '#6c7086',
  overlay1: '#7f849c',
  overlay2: '#9399b2',
  blue: '#89b4fa',
  lavender: '#b4befe',
  sapphire: '#74c7ec',
  sky: '#89dceb',
  teal: '#94e2d5',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  peach: '#fab387',
  maroon: '#eba0ac',
  red: '#f38ba8',
  mauve: '#cba6f7',
  pink: '#f5c2e7',
  flamingo: '#f2cdcd',
  rosewater: '#f5e0dc',
} as const;
