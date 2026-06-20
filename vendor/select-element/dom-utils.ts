/**
 * DOM utilities for useSelectElement hook.
 * 
 * @zai/select-element v3.0.0
 */

import type { SelectElementConfig, ElementRect, SelectedElement } from './types';
import { DEFAULT_CONFIG, EN_LOCALE } from './types';

type MergedConfig = Required<Omit<SelectElementConfig, 'onSelect' | 'onCancel' | 'locale'>>;

/** Inject the select-element CSS styles into <head> */
export function injectStyles(config: MergedConfig, locale: typeof EN_LOCALE): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = 'select-element-styles';
  style.textContent = `
    ${config.useOverlay ? '' : `
    .select-element-highlight {
      outline: 2px solid ${config.highlightColor} !important;
      outline-offset: -2px !important;
      background-color: ${config.highlightBg} !important;
      box-shadow: 0 0 0 4px rgba(137, 180, 250, 0.3) !important;
    }
    `}
    .select-element-tooltip {
      position: fixed !important; z-index: 999999 !important;
      background: #1e1e2e !important; border: 1px solid ${config.highlightColor} !important;
      border-radius: 6px !important; padding: 8px 12px !important;
      font-family: 'JetBrains Mono', 'Consolas', monospace !important;
      font-size: 11px !important; color: #cdd6f4 !important;
      pointer-events: none !important; max-width: 350px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
    }
    .select-element-tooltip-tag { color: #a6e3a1 !important; font-weight: bold !important; }
    .select-element-tooltip-id { color: #f9e2af !important; }
    .select-element-tooltip-class { color: ${config.highlightColor} !important; }
    .select-element-tooltip-dims { color: #94e2d5 !important; margin-left: 8px !important; }
    .select-element-tooltip-hint { color: #6c7086 !important; margin-top: 4px !important; font-size: 10px !important; }
    .select-element-tooltip-parent { color: #a6adc8 !important; font-size: 10px !important; margin-top: 2px !important; padding-top: 4px !important; border-top: 1px solid #313244 !important; }
    .select-element-overlay {
      position: fixed !important; inset: 0 !important; z-index: 999998 !important;
      cursor: crosshair !important; background: transparent !important;
    }
    .select-element-highlight-box {
      position: fixed !important; pointer-events: none !important; z-index: 999997 !important;
      border: 2px solid ${config.highlightColor} !important;
      background: ${config.highlightBg} !important;
      transition: all 0.1s ease !important; border-radius: 2px !important;
    }
    .select-element-mode-indicator {
      position: fixed !important; top: 20px !important; left: 50% !important;
      transform: translateX(-50%) !important;
      background: ${config.highlightColor} !important; color: #1e1e2e !important;
      padding: 8px 24px !important; border-radius: 20px !important;
      font-weight: bold !important; font-size: 14px !important;
      z-index: 9999999 !important;
      box-shadow: 0 4px 12px ${config.highlightColor}80 !important;
      animation: select-element-pulse 2s infinite !important;
      font-family: system-ui, -apple-system, sans-serif !important;
    }
    @keyframes select-element-pulse {
      0%, 100% { box-shadow: 0 4px 12px ${config.highlightColor}80; }
      50% { box-shadow: 0 4px 20px ${config.highlightColor}cc; }
    }
  `;
  document.head.appendChild(style);
  return style;
}

/** Create overlay + highlight box (for overlay mode) */
export function createOverlay(): { overlay: HTMLDivElement; highlight: HTMLDivElement } {
  const overlay = document.createElement('div');
  overlay.className = 'select-element-overlay';
  document.body.appendChild(overlay);

  const highlight = document.createElement('div');
  highlight.className = 'select-element-highlight-box';
  document.body.appendChild(highlight);

  document.body.style.cursor = 'crosshair';
  document.body.style.userSelect = 'none';

  return { overlay, highlight };
}

/** Create mode indicator banner */
export function createModeIndicator(text: string): HTMLDivElement {
  const indicator = document.createElement('div');
  indicator.className = 'select-element-mode-indicator';
  indicator.textContent = text;
  document.body.appendChild(indicator);
  return indicator;
}

/** Create tooltip element */
export function createTooltip(hint: string): HTMLDivElement {
  const tooltip = document.createElement('div');
  tooltip.className = 'select-element-tooltip';
  tooltip.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span class="select-element-tooltip-tag"></span>
      <span class="select-element-tooltip-dims"></span>
    </div>
    <div class="select-element-tooltip-parent"></div>
    <div class="select-element-tooltip-hint">${hint}</div>
  `;
  document.body.appendChild(tooltip);
  return tooltip;
}

/** Update tooltip position and content */
export function updateTooltip(
  tooltip: HTMLDivElement,
  element: HTMLElement,
  e: MouseEvent,
  parentHint = '',
) {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classStr = typeof element.className === 'string'
    ? element.className.replace('select-element-highlight', '').trim().split(' ').slice(0, 3).filter(c => c).map(c => `.${c}`).join('')
    : '';
  const rect = element.getBoundingClientRect();

  const tagEl = tooltip.querySelector('.select-element-tooltip-tag');
  if (tagEl) tagEl.innerHTML = `<span class="select-element-tooltip-tag">&lt;${tagName}&gt;</span>${id ? `<span class="select-element-tooltip-id">${id}</span>` : ''}${classStr ? `<span class="select-element-tooltip-class">${classStr}</span>` : ''}`;

  const dimsEl = tooltip.querySelector('.select-element-tooltip-dims');
  if (dimsEl) dimsEl.innerHTML = `${Math.round(rect.width)} x ${Math.round(rect.height)} px`;

  const parentEl = tooltip.querySelector('.select-element-tooltip-parent');
  if (parentEl) parentEl.innerHTML = parentHint;

  let tooltipX = e.clientX + 15;
  let tooltipY = e.clientY + 15;
  if (tooltipX + 370 > window.innerWidth) tooltipX = e.clientX - 370;
  if (tooltipY + 120 > window.innerHeight) tooltipY = e.clientY - 120;
  tooltip.style.left = `${tooltipX}px`;
  tooltip.style.top = `${tooltipY}px`;
  tooltip.style.display = 'block';
}

/** Update overlay highlight position */
export function updateOverlayHighlight(highlight: HTMLDivElement, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  highlight.style.left = `${rect.left}px`;
  highlight.style.top = `${rect.top}px`;
  highlight.style.width = `${rect.width}px`;
  highlight.style.height = `${rect.height}px`;
  highlight.style.display = 'block';
}

/** Extract element info into SelectedElement */
export function extractElementInfo(
  element: HTMLElement,
  config: MergedConfig,
): SelectedElement {
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const computedStyles: Record<string, string> = {};
  for (const prop of config.styleProperties) {
    const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    const value = styles.getPropertyValue(cssProp);
    if (value) computedStyles[prop] = value;
  }

  const attrs: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) attrs[attr.name] = attr.value;

  const classNameStr = typeof element.className === 'string'
    ? element.className
    : ((element as unknown as SVGElement).className as SVGAnimatedString | undefined)?.baseVal || '';

  const cleanClassName = classNameStr
    .replace('select-element-highlight', '').replace('select-element-hovered', '').trim();

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: cleanClassName || undefined,
    outerHTML: element.outerHTML.replace(/ select-element-highlight/g, '').replace(/ select-element-hovered/g, '').slice(0, config.maxHtmlLength),
    innerHTML: element.innerHTML.slice(0, config.maxHtmlLength),
    innerText: element.textContent?.substring(0, config.maxTextLength) || undefined,
    cssPath: getCssPath(element),
    styles: computedStyles,
    attributes: attrs,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
  };
}

/** Find smart parent container for small elements */
export function findSmartParent(el: HTMLElement, smallTags: string[]): HTMLElement {
  const tagName = el.tagName.toLowerCase();
  const rect = el.getBoundingClientRect();
  const isSmall = rect.width < 60 || rect.height < 30;
  const isSmallTag = smallTags.includes(tagName);

  if ((isSmall || isSmallTag) && el.parentElement) {
    const parent = el.parentElement;
    const parentClasses = typeof parent.className === 'string' ? parent.className : '';
    const isContainer =
      parentClasses.includes('flex') || parentClasses.includes('grid') ||
      parentClasses.includes('button') || parentClasses.includes('badge') ||
      parentClasses.includes('card') || parentClasses.includes('rounded') ||
      parent.tagName.toLowerCase() === 'button' || parent.getAttribute('role') === 'button';
    if (isContainer) return parent;
  }
  return el;
}

/** Generate a CSS selector path from element up to body */
export function getCssPath(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += '#' + current.id;
      parts.unshift(selector);
      break;
    }
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => (c as Element).tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    parts.unshift(selector);
    current = parent;
  }
  return parts.join(' > ');
}

/** Full cleanup of all injected DOM elements */
export function cleanupDOM(
  styleRef: HTMLStyleElement | null,
  tooltipRef: HTMLDivElement | null,
  overlayRef: HTMLDivElement | null,
  highlightRef: HTMLDivElement | null,
  indicatorRef: HTMLDivElement | null,
  hoveredElement: HTMLElement | null,
  useOverlay: boolean,
) {
  if (hoveredElement && !useOverlay) hoveredElement.classList.remove('select-element-highlight');
  styleRef?.remove();
  tooltipRef?.remove();
  overlayRef?.remove();
  highlightRef?.remove();
  indicatorRef?.remove();
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}
