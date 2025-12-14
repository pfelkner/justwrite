import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useCallback, useState } from 'react'

interface EditorProps {
  content: string
  onUpdate: (content: string, wordCount: number) => void
  placeholder?: string
  autoFocus?: boolean
}

export function Editor({ content, onUpdate, placeholder = "Fang an zu schreiben...", autoFocus = true }: EditorProps) {
  const [isSaving, setIsSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CharacterCount,
    ],
    content,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const words = editor.storage.characterCount.words()
      onUpdate(html, words)
    },
  })

  // Update content when prop changes (e.g., loading a different document)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Visual save indicator
  const handleSaveIndicator = useCallback(() => {
    setIsSaving(true)
    setTimeout(() => setIsSaving(false), 1000)
  }, [])

  if (!editor) {
    return (
      <div className="animate-pulse bg-muted rounded-lg h-[300px]" />
    )
  }

  const wordCount = editor.storage.characterCount.words()
  const charCount = editor.storage.characterCount.characters()

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border/50 bg-muted/30 rounded-t-lg">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Fett (Cmd+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Kursiv (Cmd+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Durchgestrichen"
        >
          <s>S</s>
        </ToolbarButton>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Überschrift 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Überschrift 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Überschrift 3"
        >
          H3
        </ToolbarButton>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Aufzählung"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Nummerierte Liste"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Zitat"
        >
          "
        </ToolbarButton>

        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Save indicator */}
        {isSaving && (
          <span className="text-xs text-muted-foreground animate-pulse">
            Speichert...
          </span>
        )}
      </div>

      {/* Editor Content */}
      <div className="border border-t-0 border-border/50 rounded-b-lg bg-background">
        <EditorContent editor={editor} />
      </div>

      {/* Word count footer */}
      <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground px-1">
        <span>{wordCount} Wörter</span>
        <span>{charCount} Zeichen</span>
      </div>
    </div>
  )
}

// Toolbar Button Component
function ToolbarButton({ 
  onClick, 
  isActive, 
  title, 
  children 
}: { 
  onClick: () => void
  isActive: boolean
  title: string
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        px-2 py-1 rounded text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        }
      `}
    >
      {children}
    </button>
  )
}
