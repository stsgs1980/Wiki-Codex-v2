/**
 * useSelectElement - React hook for element selection
 * 
 * @zai/select-element v3.0.0
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SelectElementConfig, SelectedElement } from './types';
import { DEFAULT_CONFIG, EN_LOCALE } from './types';
import {
  injectStyles, createOverlay, createModeIndicator, createTooltip,
  updateTooltip, updateOverlayHighlight, extractElementInfo,
  findSmartParent, cleanupDOM,
} from './dom-utils';

/**
 * useSelectElement - Unified hook for element selection
 *
 * Features: hover highlighting, tooltip, smart parent detection,
 * Arrow Up/Down navigation, Escape to cancel, i18n via locale config.
 */
export function useSelectElement(config: SelectElementConfig = {}) {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  // Filter out undefined values before merging
  const definedConfig = Object.fromEntries(
    Object.entries(config).filter(([_, v]) => v !== undefined)
  ) as SelectElementConfig;

  const mergedConfig = { ...DEFAULT_CONFIG, ...definedConfig };
  const locale = { ...EN_LOCALE, ...config.locale };

  // Stabilize config ref
  const configRef = useRef(mergedConfig);
  const localeRef = useRef(locale);
  const onSelectRef = useRef(config.onSelect);
  const onCancelRef = useRef(config.onCancel);
  
  // Update refs in effect
  useEffect(() => {
    configRef.current = mergedConfig;
    localeRef.current = locale;
    onSelectRef.current = config.onSelect;
    onCancelRef.current = config.onCancel;
  });

  // DOM refs
  const hoveredElementRef = useRef<HTMLElement | null>(null);
  const currentElementRef = useRef<HTMLElement | null>(null);
  const originalElementRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const lastSelectionTimeRef = useRef(0);

  const activate = useCallback(() => setIsActive(true), []);
  const deactivate = useCallback(() => { setIsActive(false); setSelectedElement(null); }, []);

  // Main effect
  useEffect(() => {
    if (!isActive) {
      cleanupDOM(styleRef.current, tooltipRef.current, overlayRef.current, highlightRef.current, indicatorRef.current, hoveredElementRef.current, configRef.current.useOverlay);
      styleRef.current = null; tooltipRef.current = null; overlayRef.current = null;
      highlightRef.current = null; indicatorRef.current = null; hoveredElementRef.current = null;
      lastSelectionTimeRef.current = 0;
      return;
    }

    const cfg = configRef.current;
    const loc = localeRef.current;

    // Inject styles
    styleRef.current = injectStyles(cfg, loc);

    // Create overlay if needed
    if (cfg.useOverlay) {
      const { overlay, highlight } = createOverlay();
      overlayRef.current = overlay;
      highlightRef.current = highlight;
    }

    // Create mode indicator
    if (cfg.showModeIndicator) {
      indicatorRef.current = createModeIndicator(loc.modeIndicatorText);
    }

    // Create tooltip
    if (cfg.showTooltip) {
      tooltipRef.current = createTooltip(loc.tooltipHint);
    }

    // Event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (cfg.useOverlay && (target === overlayRef.current || target === highlightRef.current)) return;
      if (tooltipRef.current && (target === tooltipRef.current || tooltipRef.current.contains(target))) return;
      if (indicatorRef.current && (target === indicatorRef.current || indicatorRef.current.contains(target))) return;

      const smartTarget = findSmartParent(target, cfg.smallTags);

      if (hoveredElementRef.current === smartTarget) {
        if (tooltipRef.current && cfg.showTooltip) updateTooltip(tooltipRef.current, smartTarget, e);
        return;
      }

      if (hoveredElementRef.current && !cfg.useOverlay) hoveredElementRef.current.classList.remove('select-element-highlight');
      if (!cfg.useOverlay) smartTarget.classList.add('select-element-highlight');

      hoveredElementRef.current = smartTarget;
      currentElementRef.current = smartTarget;
      originalElementRef.current = target;

      if (cfg.useOverlay && highlightRef.current) updateOverlayHighlight(highlightRef.current, smartTarget);

      let parentHint = '';
      if (smartTarget !== target) parentHint = loc.autoSelectFrom(target.tagName.toLowerCase());
      if (tooltipRef.current && cfg.showTooltip) updateTooltip(tooltipRef.current, smartTarget, e, parentHint);
    };

    const handleClick = (e: MouseEvent) => {
      if (!isActive) return;
      const now = Date.now();
      if (now - lastSelectionTimeRef.current < 500) return;
      lastSelectionTimeRef.current = now;

      const target = e.target as HTMLElement;
      if (cfg.useOverlay && (target === overlayRef.current || target === highlightRef.current)) return;
      if (tooltipRef.current && (target === tooltipRef.current || tooltipRef.current.contains(target))) return;
      if (indicatorRef.current && (target === indicatorRef.current || indicatorRef.current.contains(target))) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const elementToSelect = hoveredElementRef.current || target;
      const elementInfo = extractElementInfo(elementToSelect, cfg);

      setSelectedElement(elementInfo);
      onSelectRef.current?.(elementInfo);

      if (!cfg.useOverlay && elementToSelect) elementToSelect.classList.remove('select-element-highlight');
      hoveredElementRef.current = null;
      currentElementRef.current = null;
      originalElementRef.current = null;

      cleanupDOM(styleRef.current, tooltipRef.current, overlayRef.current, highlightRef.current, indicatorRef.current, null, cfg.useOverlay);
      styleRef.current = null; tooltipRef.current = null; overlayRef.current = null;
      highlightRef.current = null; indicatorRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setIsActive(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanupDOM(styleRef.current, tooltipRef.current, overlayRef.current, highlightRef.current, indicatorRef.current, hoveredElementRef.current, cfg.useOverlay);
        styleRef.current = null; tooltipRef.current = null; overlayRef.current = null;
        highlightRef.current = null; indicatorRef.current = null; hoveredElementRef.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setIsActive(false);
        onCancelRef.current?.();
      } else if (e.key === 'ArrowUp' && currentElementRef.current?.parentElement) {
        e.preventDefault();
        const parent = currentElementRef.current.parentElement;
        if (parent && parent !== document.body && parent !== document.documentElement) {
          if (!cfg.useOverlay && hoveredElementRef.current) hoveredElementRef.current.classList.remove('select-element-highlight');
          hoveredElementRef.current = parent;
          currentElementRef.current = parent;
          if (!cfg.useOverlay) parent.classList.add('select-element-highlight');
          if (cfg.useOverlay && highlightRef.current) updateOverlayHighlight(highlightRef.current, parent);
          if (tooltipRef.current && cfg.showTooltip) {
            const parentHint = loc.navigatedToParent;
            updateTooltip(tooltipRef.current, parent, new MouseEvent('mousemove'), parentHint);
          }
        }
      } else if (e.key === 'ArrowDown' && currentElementRef.current && originalElementRef.current) {
        e.preventDefault();
        if (!cfg.useOverlay && hoveredElementRef.current) hoveredElementRef.current.classList.remove('select-element-highlight');
        hoveredElementRef.current = originalElementRef.current;
        currentElementRef.current = originalElementRef.current;
        if (!cfg.useOverlay) originalElementRef.current.classList.add('select-element-highlight');
        if (cfg.useOverlay && highlightRef.current) updateOverlayHighlight(highlightRef.current, originalElementRef.current);
        if (tooltipRef.current && cfg.showTooltip) {
          updateTooltip(tooltipRef.current, originalElementRef.current, new MouseEvent('mousemove'), loc.navigatedToOriginal);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      cleanupDOM(styleRef.current, tooltipRef.current, overlayRef.current, highlightRef.current, indicatorRef.current, hoveredElementRef.current, cfg.useOverlay);
      styleRef.current = null; tooltipRef.current = null; overlayRef.current = null;
      highlightRef.current = null; indicatorRef.current = null;
    };
  }, [isActive]);

  return {
    isActive,
    selectedElement,
    activate,
    deactivate,
    setSelectedElement,
  };
}

export default useSelectElement;
