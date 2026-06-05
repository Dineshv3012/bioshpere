import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Code, Link2, Image as ImageIcon, Undo, Redo, Highlighter, Minus
} from 'lucide-react'
import { postsAPI } from '../../api'
import toast from 'react-hot-toast'

const ToolBtn = ({ onClick, active, title, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all
      ${active
        ? 'bg-primary-600/30 text-primary-400 border border-primary-600/30'
        : 'text-slate-400 hover:text-white hover:bg-white/10'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-5 bg-white/10 mx-1" />

export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your story…' }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: { class: 'focus:outline-none' },
    },
  })

  if (!editor) return null

  const handleImageUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const { data } = await postsAPI.uploadImg(file)
        editor.chain().focus().setImage({ src: data.url }).run()
      } catch {
        toast.error('Failed to upload image')
      }
    }
    input.click()
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="border border-white/[0.08] rounded-2xl overflow-hidden bg-dark-800/40">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-3 border-b border-white/[0.06] bg-dark-800/60">
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
          <Undo size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
          <Redo size={14} />
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">
          <Heading1 size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">
          <Heading2 size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">
          <Heading3 size={14} />
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike">
          <Strikethrough size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
          <Highlighter size={14} />
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Code size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <span className="font-mono text-xs">{'</>'}</span>
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={addLink} active={editor.isActive('link')} title="Add link">
          <Link2 size={14} />
        </ToolBtn>
        <ToolBtn onClick={handleImageUpload} title="Upload image">
          <ImageIcon size={14} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus size={14} />
        </ToolBtn>
      </div>

      {/* Editor */}
      <div className="p-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
