/**
 * SelectElementFAB - Draggable Floating Action Button
 * 
 * @zai/select-element v3.0.0
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { SelectedElement, SelectElementConfig, FABPosition, FABSize, SelectElementFABProps, MIDNIGHT_COLORS as MIDNIGHT_COLORS_TYPE } from './types';
import { MIDNIGHT_COLORS } from './types';
import { useSelectElement } from './useSelectElement';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SIZE_MAP: Record<FABSize, { button: number; icon: number; ring: number; shadow: string }> = {
  sm: { button: 40, icon: 16, ring: 48, shadow: '0 2px 8px' },
  md: { button: 52, icon: 20, ring: 60, shadow: '0 3px 12px' },
  lg: { button: 64, icon: 24, ring: 72, shadow: '0 4px 16px' },
};

function getDefaultPosition(position: FABPosition, offset: number, buttonSize: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  const margin = offset;
  switch (position) {
    case 'bottom-right':  return { x: window.innerWidth - buttonSize - margin, y: window.innerHeight - buttonSize - margin };
    case 'bottom-left':   return { x: margin, y: window.innerHeight - buttonSize - margin };
    case 'top-right':     return { x: window.innerWidth - buttonSize - margin, y: margin };
    case 'top-left':      return { x: margin, y: margin };
  }
}

// SVG Icons
function MousePointer2Icon({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
      <path d="m13 13 6 6"/>
    </svg>
  );
}

function XIcon({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
      <circle cx="5" cy="5" r="2"/>
      <circle cx="12" cy="5" r="2"/>
      <circle cx="19" cy="5" r="2"/>
      <circle cx="5" cy="12" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="19" cy="12" r="2"/>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Floating Action Button for element selection — midnight color theme.
 * Supports drag-and-drop positioning.
 */
export function SelectElementFAB({
  position = 'bottom-right',
  offset = 24,
  size = 'md',
  zIndex = 9999,
  showTooltip = true,
  label = 'Select Element',
  activeLabel = 'Scanning...',
  className = '',
  style,
  tooltipStyle,
  colors: colorOverrides,
  disablePulse = false,
  draggable = true,
  isActive: externalIsActive,
  onActivate,
  onDeactivate,
  onElementSelect,
  highlightColor,
  highlightBg,
  maxHtmlLength,
  maxTextLength,
  styleProperties,
  smallTags,
  showSelectTooltip,
  useOverlay,
  showModeIndicator,
  locale,
  onCancel,
}: SelectElementFABProps) {
  const [mounted, setMounted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return true;
  });
  const [hovered, setHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const isControlled = externalIsActive !== undefined;

  // Drag state
  const s = SIZE_MAP[size];
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; fabX: number; fabY: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Standalone hook
  const standaloneHook = useSelectElement({
    highlightColor, highlightBg, maxHtmlLength, maxTextLength,
    styleProperties, smallTags, showTooltip: showSelectTooltip,
    useOverlay, showModeIndicator, locale,
    onSelect: onElementSelect, onCancel,
  });

  const isActive = isControlled ? (externalIsActive ?? false) : standaloneHook.isActive;
  const activate = isControlled ? (onActivate ?? (() => {})) : standaloneHook.activate;
  const deactivate = isControlled ? (onDeactivate ?? (() => {})) : standaloneHook.deactivate;

  // Initialize position
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem('select-fab-position');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.x >= 0 && parsed.y >= 0 && 
            parsed.x < window.innerWidth - s.button && 
            parsed.y < window.innerHeight - s.button) {
          setFabPosition(parsed);
          return;
        }
      } catch {}
    }
    setFabPosition(getDefaultPosition(position, offset, s.button));
  }, [mounted, position, offset, s.button]);

  // Save position
  useEffect(() => {
    if (fabPosition && draggable) {
      localStorage.setItem('select-fab-position', JSON.stringify(fabPosition));
    }
  }, [fabPosition, draggable]);

  // Inject keyframes
  useEffect(() => {
    if (document.getElementById('select-fab-keyframes')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'select-fab-keyframes';
    styleEl.textContent = `
      @keyframes select-fab-pulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
        70% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable) return;
    e.preventDefault();
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      fabX: fabPosition?.x ?? 0,
      fabY: fabPosition?.y ?? 0,
    };
  }, [draggable, fabPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    hasMovedRef.current = true;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    let newX = dragStartRef.current.fabX + deltaX;
    let newY = dragStartRef.current.fabY + deltaY;
    
    newX = Math.max(0, Math.min(newX, window.innerWidth - s.button));
    newY = Math.max(0, Math.min(newY, window.innerHeight - s.button));
    
    setFabPosition({ x: newX, y: newY });
  }, [isDragging, s.button]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!draggable) return;
    const touch = e.touches[0];
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      fabX: fabPosition?.x ?? 0,
      fabY: fabPosition?.y ?? 0,
    };
  }, [draggable, fabPosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    hasMovedRef.current = true;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    
    let newX = dragStartRef.current.fabX + deltaX;
    let newY = dragStartRef.current.fabY + deltaY;
    
    newX = Math.max(0, Math.min(newX, window.innerWidth - s.button));
    newY = Math.max(0, Math.min(newY, window.innerHeight - s.button));
    
    setFabPosition({ x: newX, y: newY });
  }, [isDragging, s.button]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Global events
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    e.stopPropagation();
    if (isActive) deactivate(); else activate();
  }, [isActive, activate, deactivate]);

  if (!mounted || fabPosition === null) return null;

  const c = { ...MIDNIGHT_COLORS, ...colorOverrides };
  
  const tooltipOnLeft = fabPosition.x > window.innerWidth / 2;
  const tooltipPlacement: React.CSSProperties = tooltipOnLeft
    ? { right: '100%', marginRight: 12, top: '50%', transform: 'translateY(-50%)' }
    : { left: '100%', marginLeft: 12, top: '50%', transform: 'translateY(-50%)' };

  const fabContent = (
    <div 
      style={{ 
        position: 'fixed', 
        zIndex, 
        left: fabPosition.x, 
        top: fabPosition.y,
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        touchAction: draggable ? 'none' : 'auto',
      }}
    >
      {isActive && !disablePulse && (
        <span style={{
          position: 'absolute', top: '50%', left: '50%',
          width: s.ring, height: s.ring, transform: 'translate(-50%, -50%)',
          borderRadius: '50%', backgroundColor: c.ring,
          animation: 'select-fab-pulse 2s ease-out infinite', pointerEvents: 'none',
        }} />
      )}

      {tooltipVisible && !isDragging && (
        <div style={{
          position: 'absolute', ...tooltipPlacement,
          backgroundColor: c.base, color: c.icon, padding: '6px 12px',
          borderRadius: 8, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
          boxShadow: `0 2px 8px ${c.shadow}`,
          border: `1px solid ${isActive ? c.active : c.hover}`,
          transition: 'all 0.15s ease', pointerEvents: 'none', ...tooltipStyle,
        }}>
          {isActive ? activeLabel : label}
          {draggable && <span style={{ display: 'block', fontSize: 10, opacity: 0.6, marginTop: 2 }}>drag to move</span>}
        </div>
      )}

      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onMouseEnter={() => { setHovered(true); if (showTooltip) setTooltipVisible(true); }}
        onMouseLeave={() => { setHovered(false); setTooltipVisible(false); }}
        className={className}
        aria-label={isActive ? activeLabel : label}
        style={{
          width: s.button, 
          height: s.button, 
          borderRadius: '50%',
          border: 'none', 
          cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer', 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'relative',
          backgroundColor: isActive ? (hovered ? c.activeHover : c.active) : (hovered ? c.hover : c.base),
          color: isActive ? c.iconActive : c.icon,
          boxShadow: isActive ? `${s.shadow} ${c.activeShadow}` : `${s.shadow} ${c.shadow}`,
          transition: isDragging ? 'none' : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered && !isDragging ? 'scale(1.08)' : 'scale(1)', 
          outline: 'none', 
          ...style,
        }}
      >
        {isActive
          ? <XIcon width={s.icon} height={s.icon} />
          : <MousePointer2Icon width={s.icon} height={s.icon} />
        }
        {draggable && !isActive && (
          <span style={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
          }}>
            <GripIcon />
          </span>
        )}
      </button>
    </div>
  );

  return createPortal(fabContent, document.body);
}

export default SelectElementFAB;
