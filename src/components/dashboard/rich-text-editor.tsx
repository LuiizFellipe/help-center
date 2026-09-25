"use client";

import { useCallback, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { toast } from "sonner";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  SeparatorHorizontal,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

async function uploadImageFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch("/api/images", { method: "POST", body: formData });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Falha ao enviar a imagem");
      return null;
    }
    const body = (await response.json()) as { url: string };
    return body.url;
  } catch {
    toast.error("Falha ao enviar a imagem");
    return null;
  }
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`size-8 ${active ? "bg-accent text-primary" : ""}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Toolbar({ editor, onImageClick, uploading }: {
  editor: Editor;
  onImageClick: () => void;
  uploading: boolean;
}) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link (deixe vazio para remover):", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-t-lg border bg-muted/50 px-2 py-1.5">
      <ToolbarButton
        label="Negrito"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Itálico"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Sublinhado"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
      >
        <UnderlineIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Riscado"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        <Strikethrough />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 !h-5" />

      <ToolbarButton
        label="Título de seção (H2)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        label="Subtítulo (H3)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      >
        <Heading3 />
      </ToolbarButton>
      <ToolbarButton
        label="Lista com marcadores"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Citação"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote />
      </ToolbarButton>
      <ToolbarButton
        label="Divisor"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <SeparatorHorizontal />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 !h-5" />

      <ToolbarButton
        label="Inserir link"
        onClick={setLink}
        active={editor.isActive("link")}
      >
        <Link2 />
      </ToolbarButton>
      {editor.isActive("link") ? (
        <ToolbarButton
          label="Remover link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink />
        </ToolbarButton>
      ) : null}
      <ToolbarButton
        label="Inserir imagem"
        onClick={onImageClick}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 !h-5" />

      <ToolbarButton
        label="Desfazer"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        label="Refazer"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Escreva o conteúdo do artigo…",
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "article-content px-4 py-3 focus:outline-none",
      },
      handlePaste: (view, event) => {
        const file = event.clipboardData?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        event.preventDefault();
        void handleFiles([file]);
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length === 0) return false;
        event.preventDefault();
        void handleFiles(files);
        return true;
      },
    },
    onUpdate({ editor: current }) {
      onChange(current.getHTML());
    },
  });

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!editor) return;
      setUploading(true);
      try {
        for (const file of files) {
          const url = await uploadImageFile(file);
          if (url) {
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
          }
        }
      } finally {
        setUploading(false);
      }
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="min-h-[420px] animate-pulse rounded-lg border bg-muted/30" />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Toolbar
        editor={editor}
        uploading={uploading}
        onImageClick={() => fileInputRef.current?.click()}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) await handleFiles(files);
        }}
      />
    </div>
  );
}
