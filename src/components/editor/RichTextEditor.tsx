import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, AlignLeft, AlignCenter, AlignRight,
  Highlighter, Link2, Link2Off, Minus, RotateCcw,
} from 'lucide-react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  disabled?: boolean
}

const ACCENT = 'var(--accent, #7c6bff)'
const INPUT_BG = 'var(--input-bg, #1e2248)'
const BORDER = 'rgba(255,255,255,0.10)'
const ACTIVE_BG = 'rgba(var(--accent-rgb,124,107,255),0.18)'

function ToolBtn({
  onClick, active, title, children,
}: { onClick: () => void; active?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: 'none', cursor: 'pointer',
        backgroundColor: active ? ACTIVE_BG : 'transparent',
        color: active ? ACCENT : 'rgba(255,255,255,0.65)',
        transition: 'all 0.1s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.12)', flexShrink: 0, margin: '0 2px' }} />
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 160, disabled }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write something...' }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('URL', editor.getAttributes('link').href ?? 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${BORDER}`,
      backgroundColor: INPUT_BG,
      overflow: 'hidden',
      opacity: disabled ? 0.6 : 1,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
        borderBottom: `1px solid ${BORDER}`,
        backgroundColor: 'rgba(255,255,255,0.03)',
      }}>
        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={14} /></ToolBtn>

        <Divider />

        {/* Text style */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={13} /></ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={14} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider line"><Minus size={14} /></ToolBtn>

        <Divider />

        {/* Alignment */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter size={13} /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight size={13} /></ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Add link"><Link2 size={13} /></ToolBtn>
        {editor.isActive('link') && (
          <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link"><Link2Off size={13} /></ToolBtn>
        )}

        <Divider />

        {/* Clear */}
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting"><RotateCcw size={13} /></ToolBtn>
      </div>

      {/* Editor body */}
      <EditorContent
        editor={editor}
        style={{ minHeight, padding: '12px 14px', color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 1.65 }}
      />

      <style>{`
        .tiptap { outline: none; }
        .tiptap p { margin: 0 0 0.5em; }
        .tiptap p:last-child { margin-bottom: 0; }
        .tiptap h1 { color: white; font-size: 1.4em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .tiptap h2 { color: white; font-size: 1.2em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .tiptap h3 { color: white; font-size: 1.05em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .tiptap ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
        .tiptap ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
        .tiptap li { margin-bottom: 0.25em; }
        .tiptap blockquote { border-left: 3px solid var(--accent,#7c6bff); padding-left: 12px; margin: 0.6em 0; color: rgba(255,255,255,0.6); font-style: italic; }
        .tiptap hr { border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 1em 0; }
        .tiptap a { color: var(--accent,#7c6bff); text-decoration: underline; }
        .tiptap strong { font-weight: 700; color: white; }
        .tiptap code { background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 4px; font-size: 0.88em; font-family: monospace; }
        .tiptap pre { background: rgba(0,0,0,0.3); padding: 10px 14px; border-radius: 8px; overflow-x: auto; margin: 0.6em 0; }
        .tiptap pre code { background: none; padding: 0; }
        .tiptap mark { background: rgba(var(--accent-rgb,124,107,255),0.3); color: white; border-radius: 3px; padding: 0 2px; }
        .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: rgba(255,255,255,0.25); pointer-events: none; height: 0; }
      `}</style>
    </div>
  )
}
