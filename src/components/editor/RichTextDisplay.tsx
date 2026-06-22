import DOMPurify from 'dompurify'

interface Props {
  html: string
  clamp?: number
  className?: string
  style?: React.CSSProperties
}

const ALLOWED_TAGS = [
  'p','br','strong','em','u','s','h1','h2','h3','h4',
  'ul','ol','li','blockquote','hr','a','code','pre','mark','span',
]
const ALLOWED_ATTR = ['href', 'rel', 'target', 'class', 'style']

export function RichTextDisplay({ html, clamp, style }: Props) {
  if (!html || html === '<p></p>') return null
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: clean }}
        style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 13,
          lineHeight: 1.6,
          overflow: clamp ? 'hidden' : undefined,
          display: clamp ? '-webkit-box' : undefined,
          WebkitLineClamp: clamp,
          WebkitBoxOrient: clamp ? 'vertical' as const : undefined,
          ...style,
        }}
      />
      <style>{`
        .rte-display p { margin: 0 0 0.4em; }
        .rte-display p:last-child { margin-bottom: 0; }
        .rte-display h1,.rte-display h2,.rte-display h3 { color: white; font-weight: 700; margin: 0.5em 0 0.25em; }
        .rte-display ul { list-style: disc; padding-left: 1.4em; margin: 0.3em 0; }
        .rte-display ol { list-style: decimal; padding-left: 1.4em; margin: 0.3em 0; }
        .rte-display li { margin-bottom: 0.2em; }
        .rte-display blockquote { border-left: 3px solid var(--accent,#7c6bff); padding-left: 10px; margin: 0.5em 0; color: rgba(255,255,255,0.55); font-style: italic; }
        .rte-display a { color: var(--accent,#7c6bff); text-decoration: underline; }
        .rte-display strong { font-weight: 700; color: rgba(255,255,255,0.9); }
        .rte-display code { background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.88em; }
        .rte-display mark { background: rgba(var(--accent-rgb,124,107,255),0.25); color: white; border-radius: 2px; padding: 0 2px; }
        .rte-display hr { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 0.5em 0; }
      `}</style>
    </>
  )
}
