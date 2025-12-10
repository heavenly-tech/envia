"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Italic, Strikethrough, List, ListOrdered, Link as LinkIcon, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface EditorProps {
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
}

export interface EditorRef {
    insertText: (text: string) => void;
    focus: () => void;
}

const Editor = forwardRef<EditorRef, EditorProps>(({ value, onChange, onFocus }, ref) => {
    const isInternalChange = useRef(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4'
            }
        },
        onUpdate: ({ editor }) => {
            isInternalChange.current = true;
            onChange(editor.getHTML());
        },
        onFocus: () => {
            onFocus?.();
        },
    });

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        insertText: (text: string) => {
            if (editor) {
                editor.chain().focus().insertContent(text).run();
            }
        },
        focus: () => {
            editor?.commands.focus();
        },
    }), [editor]);

    // Sync editor content when value prop changes externally
    useEffect(() => {
        if (editor && !isInternalChange.current && value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
        isInternalChange.current = false;
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-md bg-card">
            {/* Toolbar */}
            <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/30">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(editor.isActive('bold') ? 'bg-muted-foreground/20' : '')}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(editor.isActive('italic') ? 'bg-muted-foreground/20' : '')}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn(editor.isActive('strike') ? 'bg-muted-foreground/20' : '')}
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1 self-center" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(editor.isActive('bulletList') ? 'bg-muted-foreground/20' : '')}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(editor.isActive('orderedList') ? 'bg-muted-foreground/20' : '')}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1 self-center" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        const previousUrl = editor.getAttributes('link').href
                        const url = window.prompt('URL', previousUrl)

                        if (url === null) {
                            return
                        }

                        if (url === '') {
                            editor.chain().focus().extendMarkRange('link').unsetLink().run()
                            return
                        }

                        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
                    }}
                    className={cn(editor.isActive('link') ? 'bg-muted-foreground/20' : '')}
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>

                <div className="flex-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().unsetAllMarks().run()}
                >
                    <RemoveFormatting className="h-4 w-4" />
                </Button>
            </div>

            <EditorContent editor={editor} />
        </div>
    )
});

Editor.displayName = 'Editor';

export default Editor;

