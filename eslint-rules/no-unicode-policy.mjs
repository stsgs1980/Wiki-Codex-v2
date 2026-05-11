const BLOCKED = [
  '\u{1F300}-\u{1F9FF}',
  '\u{2600}-\u{26FF}',
  '\u{2700}-\u{27BF}',
  '\u{1F600}-\u{1F64F}',
  '\u{2190}-\u{21FF}',
  '\u{2300}-\u{23FF}',
  '\u{25A0}-\u{25FF}',
  '\u{27F0}-\u{27FF}',
  '\u{2900}-\u{297F}',
  '\u{2E80}-\u{2EFF}',
]
const RE = new RegExp('[' + BLOCKED.join('') + ']', 'u')

const noUnicodePolicyRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'No-Unicode Policy v1.0: disallow emoji and Unicode decorative symbols in strings',
      category: 'Style',
      recommended: true,
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string') return
        if (RE.test(context.getSourceCode().getText(node))) {
          context.report({ node, message: 'No-Unicode Policy v1.0: emoji/Unicode decorative symbols detected. Use SVG icons (Lucide) instead.' })
        }
      },
      TemplateElement(node) {
        if (node.value && typeof node.value === 'string' && RE.test(node.value)) {
          context.report({ node, message: 'No-Unicode Policy v1.0: emoji/Unicode decorative symbols detected.' })
        }
      },
    }
  },
}

const plugin = {
  rules: {
    'no-unicode-policy': noUnicodePolicyRule,
  },
}

export default plugin
