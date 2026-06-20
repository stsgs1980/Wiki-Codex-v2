/**
 * ElementDialog - Simple element info dialog with syntax highlighting
 * 
 * @zai/select-element v3.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import type { SelectedElement, ElementDialogProps, CATPPUCCIN_COLORS as CATPPUCCIN_COLORS_TYPE } from './types';
import { CATPPUCCIN_COLORS } from './types';

/* ------------------------------------------------------------------ */
/*  Syntax Highlighting                                                */
/* ------------------------------------------------------------------ */

/** Escape HTML entities */
export function escapeHtml(html: string): string {
  return html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** HTML syntax highlighter with Catppuccin colors */
export function highlightHTML(html: string): string {
  let result = '';
  let i = 0;
  
  while (i < html.length) {
    // Tag start
    if (html.slice(i, i + 4) === '&lt;') {
      const isClosing = html[i + 4] === '/';
      const tagStart = isClosing ? i + 5 : i + 4;
      
      let tagEnd = tagStart;
      while (tagEnd < html.length && /[\w-]/.test(html[tagEnd])) {
        tagEnd++;
      }
      
      const tagName = html.slice(tagStart, tagEnd);
      
      result += `<span style="color:${CATPPUCCIN_COLORS.overlay1}">&lt;</span>`;
      if (isClosing) result += '/';
      result += `<span style="color:${CATPPUCCIN_COLORS.red}">${tagName}</span>`;
      
      i = tagEnd;
      continue;
    }
    
    // Tag end
    if (html.slice(i, i + 4) === '&gt;') {
      result += `<span style="color:${CATPPUCCIN_COLORS.overlay1}">&gt;</span>`;
      i += 4;
      continue;
    }
    
    // Attribute
    const attrMatch = html.slice(i).match(/^([\w-]+)=/);
    if (attrMatch) {
      const attrName = attrMatch[1];
      result += `<span style="color:${CATPPUCCIN_COLORS.peach}">${attrName}</span>=`;
      i += attrMatch[0].length;
      continue;
    }
    
    // Quoted value
    if (html[i] === '"') {
      let end = i + 1;
      while (end < html.length && html[end] !== '"') {
        end++;
      }
      const value = html.slice(i + 1, end);
      result += `"<span style="color:${CATPPUCCIN_COLORS.green}">${value}</span>"`;
      i = end + 1;
      continue;
    }
    
    // HTML comment
    if (html.slice(i, i + 8) === '&lt;!--') {
      let end = html.indexOf('--&gt;', i);
      if (end === -1) end = html.length;
      else end += 5;
      
      result += `<span style="color:${CATPPUCCIN_COLORS.overlay0}">${html.slice(i, end)}</span>`;
      i = end;
      continue;
    }
    
    result += html[i];
    i++;
  }
  
  return result;
}

/* ------------------------------------------------------------------ */
/*  Element Type Detection                                             */
/* ------------------------------------------------------------------ */

const ELEMENT_TYPES: Record<string, { en: string; ru: string }> = {
  'card': { en: 'Card', ru: 'Карточка' },
  'button': { en: 'Button', ru: 'Кнопка' },
  'container': { en: 'Container', ru: 'Контейнер' },
  'header': { en: 'Header', ru: 'Хедер' },
  'footer': { en: 'Footer', ru: 'Футер' },
  'sidebar': { en: 'Sidebar', ru: 'Сайдбар' },
  'form': { en: 'Form', ru: 'Форма' },
  'image': { en: 'Image', ru: 'Изображение' },
  'icon': { en: 'Icon', ru: 'Иконка' },
  'text': { en: 'Text', ru: 'Текст' },
  'list': { en: 'List', ru: 'Список' },
  'table': { en: 'Table', ru: 'Таблица' },
  'menu': { en: 'Menu', ru: 'Меню' },
  'badge': { en: 'Badge', ru: 'Бейдж' },
  'media': { en: 'Media', ru: 'Медиа' },
  'input': { en: 'Input', ru: 'Поле ввода' },
  'heading': { en: 'Heading', ru: 'Заголовок' },
  'label': { en: 'Label', ru: 'Лейбл' },
  'navigation': { en: 'Navigation', ru: 'Навигация' },
  'section': { en: 'Section', ru: 'Секция' },
  'block': { en: 'Block', ru: 'Блок' },
  'element': { en: 'Element', ru: 'Элемент' },
  'list-item': { en: 'List Item', ru: 'Элемент списка' },
};

function getElementType(element: SelectedElement): { en: string; ru: string } {
  const tag = element.tagName.toLowerCase();
  const className = element.className?.toLowerCase() || '';
  const id = element.id?.toLowerCase() || '';
  const width = element.rect.width;
  const height = element.rect.height;
  const area = width * height;
  
  const classLower = `${className} ${id}`.toLowerCase();
  
  if (classLower.includes('card') || classLower.includes('modal')) return ELEMENT_TYPES['card'];
  if (classLower.includes('button') || classLower.includes('btn')) return ELEMENT_TYPES['button'];
  if (classLower.includes('container') || classLower.includes('wrapper')) return ELEMENT_TYPES['container'];
  if (classLower.includes('header') || classLower.includes('navbar')) return ELEMENT_TYPES['header'];
  if (classLower.includes('footer')) return ELEMENT_TYPES['footer'];
  if (classLower.includes('sidebar')) return ELEMENT_TYPES['sidebar'];
  if (classLower.includes('form') || classLower.includes('input')) return ELEMENT_TYPES['form'];
  if (classLower.includes('image') || classLower.includes('img')) return ELEMENT_TYPES['image'];
  if (classLower.includes('icon')) return ELEMENT_TYPES['icon'];
  if (classLower.includes('text') || classLower.includes('title')) return ELEMENT_TYPES['text'];
  if (classLower.includes('list')) return ELEMENT_TYPES['list'];
  if (classLower.includes('table') || classLower.includes('grid')) return ELEMENT_TYPES['table'];
  if (classLower.includes('menu')) return ELEMENT_TYPES['menu'];
  if (classLower.includes('badge') || classLower.includes('tag')) return ELEMENT_TYPES['badge'];
  
  if (tag === 'button' || tag === 'a') return ELEMENT_TYPES['button'];
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return ELEMENT_TYPES['input'];
  if (tag === 'img' || tag === 'svg' || tag === 'canvas' || tag === 'video') return ELEMENT_TYPES['media'];
  if (tag === 'form') return ELEMENT_TYPES['form'];
  if (tag === 'table') return ELEMENT_TYPES['table'];
  if (tag === 'ul' || tag === 'ol') return ELEMENT_TYPES['list'];
  if (tag === 'li') return ELEMENT_TYPES['list-item'];
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return ELEMENT_TYPES['heading'];
  if (tag === 'p' || tag === 'span') return ELEMENT_TYPES['text'];
  if (tag === 'label') return ELEMENT_TYPES['label'];
  if (tag === 'header') return ELEMENT_TYPES['header'];
  if (tag === 'footer') return ELEMENT_TYPES['footer'];
  if (tag === 'nav') return ELEMENT_TYPES['navigation'];
  if (tag === 'main' || tag === 'section' || tag === 'article') return ELEMENT_TYPES['section'];
  if (tag === 'aside') return ELEMENT_TYPES['sidebar'];
  
  if (tag === 'div') {
    if (area > 100000 || width > 600) return ELEMENT_TYPES['container'];
    if (area > 20000) return ELEMENT_TYPES['block'];
    return ELEMENT_TYPES['element'];
  }
  
  return ELEMENT_TYPES['element'];
}

/* ------------------------------------------------------------------ */
/*  SVG Icons                                                          */
/* ------------------------------------------------------------------ */

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 10V3C3 2.44772 3.44772 2 4 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Copy Row Helper                                                   */
/* ------------------------------------------------------------------ */

function CopyRow({ label, labelColor, value, copied, onCopy }: {
  label: string;
  labelColor: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: labelColor, fontWeight: 500, fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: CATPPUCCIN_COLORS.text,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 4,
          background: copied ? `${CATPPUCCIN_COLORS.green}20` : 'transparent',
          transition: 'background 0.15s ease',
        }}
        onClick={onCopy}
        title="Click to copy"
      >
        {value}
      </span>
      <button
        onClick={onCopy}
        style={{
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', color: copied ? CATPPUCCIN_COLORS.green : CATPPUCCIN_COLORS.subtext0,
          cursor: 'pointer', borderRadius: 4, transition: 'color 0.15s ease', flexShrink: 0,
        }}
        title="Copy"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Simple element info dialog with syntax-highlighted code
 */
export function ElementDialog({ element, onClose }: ElementDialogProps) {
  const elementType = getElementType(element);
  const [copied, setCopied] = useState(false);
  const [copiedCssPath, setCopiedCssPath] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(element.outerHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCssPath = async () => {
    await navigator.clipboard.writeText(element.cssPath);
    setCopiedCssPath(true);
    setTimeout(() => setCopiedCssPath(false), 2000);
  };

  const handleCopyText = async () => {
    if (!element.innerText) return;
    await navigator.clipboard.writeText(element.innerText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatHTML = (html: string): string => highlightHTML(escapeHtml(html));

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 17, 27, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          backgroundColor: CATPPUCCIN_COLORS.base,
          border: `1px solid ${CATPPUCCIN_COLORS.surface1}`,
          borderRadius: '12px',
          minWidth: '320px',
          maxWidth: '500px',
          maxHeight: '80vh',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${CATPPUCCIN_COLORS.surface0}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: CATPPUCCIN_COLORS.text, fontWeight: 600, fontSize: 15 }}>
              {elementType.en}
            </span>
            <span style={{ color: CATPPUCCIN_COLORS.overlay0, fontSize: 13 }}>
              ({elementType.ru})
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={handleCopy}
              title="Copy code"
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: copied ? CATPPUCCIN_COLORS.green : 'transparent',
                border: 'none',
                color: copied ? CATPPUCCIN_COLORS.base : CATPPUCCIN_COLORS.subtext0,
                cursor: 'pointer',
                borderRadius: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = CATPPUCCIN_COLORS.surface0;
                  e.currentTarget.style.color = CATPPUCCIN_COLORS.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = CATPPUCCIN_COLORS.subtext0;
                }
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
            
            <button
              onClick={onClose}
              title="Close"
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: CATPPUCCIN_COLORS.subtext0,
                cursor: 'pointer',
                borderRadius: 6,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = CATPPUCCIN_COLORS.surface0;
                e.currentTarget.style.color = CATPPUCCIN_COLORS.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = CATPPUCCIN_COLORS.subtext0;
              }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Code with syntax highlighting */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: CATPPUCCIN_COLORS.mantle,
            overflow: 'auto',
            maxHeight: '200px',
            flexShrink: 0,
          }}
        >
          <pre
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
              fontSize: 11,
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              lineHeight: 1.5,
              color: CATPPUCCIN_COLORS.text,
            }}
          >
            <code dangerouslySetInnerHTML={{ __html: formatHTML(element.outerHTML) }} />
          </pre>
        </div>

        {/* Size and Position */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: CATPPUCCIN_COLORS.teal, fontWeight: 500, fontSize: 13 }}>Size</span>
            <span style={{ color: CATPPUCCIN_COLORS.overlay0, fontSize: 12 }}>(Размер):</span>
            <span style={{ color: CATPPUCCIN_COLORS.text, fontSize: 13 }}>
              {Math.round(element.rect.width)}x{Math.round(element.rect.height)} px
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: CATPPUCCIN_COLORS.lavender, fontWeight: 500, fontSize: 13 }}>Position</span>
            <span style={{ color: CATPPUCCIN_COLORS.overlay0, fontSize: 12 }}>(Позиция):</span>
            <span style={{ color: CATPPUCCIN_COLORS.text, fontSize: 13 }}>
              ({Math.round(element.rect.x)}, {Math.round(element.rect.y)})
            </span>
          </div>

          {/* CSS Path */}
          {element.cssPath && (
            <CopyRow
              label="CSS Path"
              labelColor={CATPPUCCIN_COLORS.mauve}
              value={element.cssPath}
              copied={copiedCssPath}
              onCopy={handleCopyCssPath}
            />
          )}

          {/* Text Content */}
          {element.innerText && (
            <CopyRow
              label="Text"
              labelColor={CATPPUCCIN_COLORS.green}
              value={element.innerText}
              copied={copiedText}
              onCopy={handleCopyText}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ElementDialog;
