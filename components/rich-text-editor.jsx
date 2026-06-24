"use client"

import { useRef, useEffect, useState } from "react"
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Type, Highlighter, Palette, Link, Image, Strikethrough, Code, Table } from "lucide-react"

export default function RichTextEditor({ value, onChange, placeholder = "Enter description..." }) {
  const editorRef = useRef(null)
  const [showTextColor, setShowTextColor] = useState(false)
  const [showBgColor, setShowBgColor] = useState(false)
  const [showFontSize, setShowFontSize] = useState(false)

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const handleColorChange = (type, color) => {
    execCommand(type === 'text' ? 'foreColor' : 'hiliteColor', color)
    if (type === 'text') setShowTextColor(false)
    else setShowBgColor(false)
  }

  const handleFontSize = (size) => {
    execCommand('fontSize', size)
    setShowFontSize(false)
  }

  const handleLink = () => {
    const url = prompt('Enter URL:')
    if (url) execCommand('createLink', url)
  }

  const handleImage = () => {
    const url = prompt('Enter image URL:')
    if (url) execCommand('insertImage', url)
  }

  const handleInsertIncludedExcludedTable = () => {
    if (!editorRef.current) return
    
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; border: 2px solid #10b981; margin: 16px 0;">
        <thead>
          <tr>
            <th style="border: 1px solid #10b981; padding: 12px; background-color: #f0fdf4; color: #10b981; font-weight: bold; text-align: left;">What's Included</th>
            <th style="border: 1px solid #10b981; padding: 12px; background-color: #fef2f2; color: #dc2626; font-weight: bold; text-align: left;">What's Excluded</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #10b981; padding: 12px; color: #10b981;">
              <ul style="margin: 0; padding-left: 20px;">
                <li>Professional certified local guides</li>
                <li>All ground transportation during trip</li>
                <li>Quality trekking equipment & permits</li>
                <li>Full board meals while trekking</li>
              </ul>
            </td>
            <td style="border: 1px solid #10b981; padding: 12px; color: #dc2626;">
              <ul style="margin: 0; padding-left: 20px;">
                <li>International flights and visa fees</li>
                <li>Personal trekking equipment and insurance</li>
                <li>Tips for guide and porter staff</li>
                <li>Any alcoholic beverages and personal snacks</li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    `
    
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = tableHTML
      const fragment = document.createDocumentFragment()
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      range.insertNode(fragment)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      editorRef.current.insertAdjacentHTML('beforeend', tableHTML)
    }
    
    editorRef.current.focus()
    handleInput()
  }

  const colors = [
    '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
    '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff',
    '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff',
    '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2',
    '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'
  ]

  const fontSizes = [
    { label: 'Small', value: '1' },
    { label: 'Normal', value: '3' },
    { label: 'Large', value: '5' },
    { label: 'Huge', value: '7' }
  ]

  const ToolbarButton = ({ onClick, icon: Icon, title, active = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active ? "bg-emerald-100 text-emerald-700" : "hover:bg-stone-100 text-stone-600"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )

  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-stone-200 bg-stone-50 flex-wrap">
        {/* Text Formatting */}
        <ToolbarButton onClick={() => execCommand("bold")} icon={Bold} title="Bold (Ctrl+B)" />
        <ToolbarButton onClick={() => execCommand("italic")} icon={Italic} title="Italic (Ctrl+I)" />
        <ToolbarButton onClick={() => execCommand("underline")} icon={Underline} title="Underline (Ctrl+U)" />
        <ToolbarButton onClick={() => execCommand("strikeThrough")} icon={Strikethrough} title="Strikethrough" />
        <ToolbarButton onClick={() => execCommand("formatBlock", "<pre>")} icon={Code} title="Code Block" />
        
        <div className="w-px h-6 bg-stone-300 mx-1" />
        
        {/* Headings */}
        <div className="relative">
          <ToolbarButton 
            onClick={() => {
              setShowFontSize(!showFontSize)
              setShowTextColor(false)
              setShowBgColor(false)
            }} 
            icon={Type} 
            title="Headings" 
          />
          {showFontSize && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 py-1 min-w-[150px]">
              {[1, 2, 3, 4, 5, 6].map(level => (
                <button
                  key={level}
                  onClick={() => {
                    execCommand('formatBlock', `<h${level}>`)
                    setShowFontSize(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-stone-100 text-stone-700 font-bold"
                  style={{ fontSize: `${1.5 - (level * 0.1)}rem` }}
                >
                  Heading {level}
                </button>
              ))}
              <button
                onClick={() => {
                  execCommand('formatBlock', '<p>')
                  setShowFontSize(false)
                }}
                className="w-full text-left px-3 py-2 hover:bg-stone-100 text-stone-700 border-t border-stone-100"
              >
                Normal Text
              </button>
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative">
          <ToolbarButton 
            onClick={() => {
              setShowTextColor(!showTextColor)
              setShowBgColor(false)
              setShowFontSize(false)
            }} 
            icon={Palette} 
            title="Text Color" 
          />
          {showTextColor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 p-2 grid grid-cols-7 gap-1">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange('text', color)}
                  className="w-6 h-6 rounded border border-stone-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        {/* Background Color */}
        <div className="relative">
          <ToolbarButton 
            onClick={() => {
              setShowBgColor(!showBgColor)
              setShowTextColor(false)
              setShowFontSize(false)
            }} 
            icon={Highlighter} 
            title="Highlight Color" 
          />
          {showBgColor && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 p-2 grid grid-cols-7 gap-1">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange('bg', color)}
                  className="w-6 h-6 rounded border border-stone-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="w-px h-6 bg-stone-300 mx-1" />
        
        {/* Lists */}
        <ToolbarButton onClick={() => execCommand("insertUnorderedList")} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => execCommand("insertOrderedList")} icon={ListOrdered} title="Numbered List" />
        
        <div className="w-px h-6 bg-stone-300 mx-1" />
        
        {/* Alignment */}
        <ToolbarButton onClick={() => execCommand("justifyLeft")} icon={AlignLeft} title="Align Left" />
        <ToolbarButton onClick={() => execCommand("justifyCenter")} icon={AlignCenter} title="Align Center" />
        <ToolbarButton onClick={() => execCommand("justifyRight")} icon={AlignRight} title="Align Right" />
        <ToolbarButton onClick={() => execCommand("justifyFull")} icon={AlignJustify} title="Justify" />
        
        <div className="w-px h-6 bg-stone-300 mx-1" />
        
        {/* Links & Images */}
        <ToolbarButton onClick={handleLink} icon={Link} title="Insert Link" />
        <ToolbarButton onClick={handleImage} icon={Image} title="Insert Image" />
        
        <div className="w-px h-6 bg-stone-300 mx-1" />
        
        {/* Table */}
        <ToolbarButton onClick={handleInsertIncludedExcludedTable} icon={Table} title="Insert Included/Excluded Table" />
        
        <div className="w-px h-6 bg-stone-300 mx-1" />
        
        {/* Undo/Redo */}
        <ToolbarButton onClick={() => execCommand("undo")} icon={Undo} title="Undo (Ctrl+Z)" />
        <ToolbarButton onClick={() => execCommand("redo")} icon={Redo} title="Redo (Ctrl+Y)" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onClick={() => {
          setShowTextColor(false)
          setShowBgColor(false)
          setShowFontSize(false)
        }}
        className="rich-text-content min-h-[300px] max-h-[500px] overflow-y-auto p-4 outline-none focus:ring-2 focus:ring-emerald-500"
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #a8a29e;
          pointer-events: none;
          display: block;
        }
        .rich-text-content table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #10b981;
          margin: 16px 0;
        }
        .rich-text-content table th,
        .rich-text-content table td {
          border: 1px solid #10b981;
          padding: 12px;
        }
        .rich-text-content table thead th:first-child {
          background-color: #f0fdf4;
          color: #10b981;
          font-weight: bold;
        }
        .rich-text-content table thead th:last-child {
          background-color: #fef2f2;
          color: #dc2626;
          font-weight: bold;
        }
        .rich-text-content table tbody td:first-child {
          color: #10b981;
        }
        .rich-text-content table tbody td:last-child {
          color: #dc2626;
        }
        .rich-text-content ul {
          list-style-type: disc;
          padding-left: 24px;
          margin: 12px 0;
        }
        .rich-text-content ol {
          list-style-type: decimal;
          padding-left: 24px;
          margin: 12px 0;
        }
        .rich-text-content li {
          margin-bottom: 4px;
        }
        .rich-text-content table ul {
          margin: 0;
          padding-left: 20px;
        }
      `}</style>
    </div>
  )
}
