import { readFileSync } from 'fs'
import { join } from 'path'
import {
  detectContent,
  detectDarkUI,
  resolve,
  getProjectDescription,
} from '@/lib/theme-detection'
import type { SignatureParams, SignatureResult } from './signature-types'

const VALID_MODES = ['auto', 'dark', 'light']

function readLogoSvg(theme: string): string {
  const svgFileName = `${theme}.svg`
  const svgPath = join(process.cwd(), 'logos', svgFileName)

  try {
    return readFileSync(svgPath, 'utf-8')
  } catch {
    // Fallback to light.svg if the specific theme file doesn't exist
    try {
      return readFileSync(join(process.cwd(), 'logos', 'light.svg'), 'utf-8')
    } catch {
      return '<!-- logo not found -->'
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildSignatureHtml(params: {
  name: string
  role: string
  email: string
  phone: string
  logoSvg: string
}): string {
  const { name, role, email, phone } = params

  // Sanitize the inline SVG for safe HTML embedding
  const safeLogoSvg = params.logoSvg
    .replace(/<\?xml[^?]*\?>/g, '')
    .trim()

  const emailLink = email
    ? `<a href="mailto:${escapeHtml(email)}" style="color:#555555;text-decoration:none;">${escapeHtml(email)}</a>`
    : ''
  const phoneLink = phone
    ? `<a href="tel:${escapeHtml(phone)}" style="color:#555555;text-decoration:none;">${escapeHtml(phone)}</a>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;">
<table cellpadding="0" cellspacing="0" border="0" style="border-top:3px solid #FA3913;padding-top:12px;max-width:480px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td style="vertical-align:top;padding-right:16px;">
      <div style="width:48px;height:48px;">
        ${safeLogoSvg}
      </div>
    </td>
    <td style="vertical-align:top;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:16px;font-weight:bold;color:#1a1a1a;padding-bottom:2px;">
            ${escapeHtml(name)}
          </td>
        </tr>
        ${role ? `<tr><td style="font-size:13px;color:#777777;padding-bottom:6px;">${escapeHtml(role)}</td></tr>` : ''}
        ${email ? `<tr><td style="font-size:13px;color:#555555;padding-bottom:2px;">${emailLink}</td></tr>` : ''}
        ${phone ? `<tr><td style="font-size:13px;color:#555555;">${phoneLink}</td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export function generateSignature(params: SignatureParams): SignatureResult {
  const { project, name, role, email, phone, mode } = params

  if (!VALID_MODES.includes(mode)) {
    return { error: `Invalid mode "${mode}". Must be one of: auto, dark, light`, status: 400 }
  }

  if (!name) {
    return { error: 'Query parameter "name" is required', status: 400 }
  }

  const description = getProjectDescription(project)
  const content = detectContent(description)
  const darkUI = detectDarkUI(description)
  const theme = resolve(content, darkUI, mode)

  const logoSvg = readLogoSvg(theme)
  const html = buildSignatureHtml({ name, role, email, phone, logoSvg })

  return { html }
}
