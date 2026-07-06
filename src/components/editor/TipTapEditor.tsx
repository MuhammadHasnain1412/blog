"use client";

import { RichTextEditor } from "@mantine/tiptap";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import {
  IconPhoto,
  IconUpload,
  IconTablePlus,
  IconColumnInsertRight,
  IconColumnRemove,
  IconRowInsertBottom,
  IconRowRemove,
  IconTableOff,
} from "@tabler/icons-react";

export default function TipTapEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Superscript,
      Subscript,
      Highlight,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Handle external value updates (initial load)
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      if (editor.getText() === "") {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  const addImageByUrl = () => {
    const url = window.prompt("Image URL darj karein:");
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        notifications.show({
          title: "Upload failed",
          message: data.error || "Image upload nahi ho saki.",
          color: "red",
        });
        return;
      }

      editor?.chain().focus().setImage({ src: data.url }).run();
    } catch {
      notifications.show({
        title: "Upload failed",
        message: "Kuch galat ho gaya. Dobara try karein.",
        color: "red",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const insertTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <RichTextEditor editor={editor}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      <RichTextEditor.Toolbar sticky stickyOffset={60} style={{ flexWrap: "wrap" }}>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.ClearFormatting />
          <RichTextEditor.Highlight />
          <RichTextEditor.Code />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
          <RichTextEditor.H4 />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Blockquote />
          <RichTextEditor.Hr />
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
          <RichTextEditor.Subscript />
          <RichTextEditor.Superscript />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
          <RichTextEditor.AlignJustify />
          <RichTextEditor.AlignRight />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.ColorPicker
            colors={[
              "#25262b",
              "#868e96",
              "#fa5252",
              "#e64980",
              "#be4bdb",
              "#7950f2",
              "#4c6ef5",
              "#228be6",
              "#15aabf",
              "#12b886",
              "#40c057",
              "#82c91e",
              "#fab005",
              "#fd7e14",
            ]}
          />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Control
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image"
            title="Device se image upload karein"
            disabled={uploading}
          >
            <IconUpload size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={addImageByUrl}
            aria-label="Insert image by URL"
            title="URL se image add karein"
          >
            <IconPhoto size={16} stroke={1.5} />
          </RichTextEditor.Control>
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Control
            onClick={insertTable}
            aria-label="Insert table"
            title="Table add karein"
          >
            <IconTablePlus size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() =>
              editor?.chain().focus().addColumnAfter().run()
            }
            aria-label="Add column"
            title="Column add karein"
          >
            <IconColumnInsertRight size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() =>
              editor?.chain().focus().deleteColumn().run()
            }
            aria-label="Remove column"
            title="Column hatayein"
          >
            <IconColumnRemove size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() =>
              editor?.chain().focus().addRowAfter().run()
            }
            aria-label="Add row"
            title="Row add karein"
          >
            <IconRowInsertBottom size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() =>
              editor?.chain().focus().deleteRow().run()
            }
            aria-label="Remove row"
            title="Row hatayein"
          >
            <IconRowRemove size={16} stroke={1.5} />
          </RichTextEditor.Control>
          <RichTextEditor.Control
            onClick={() =>
              editor?.chain().focus().deleteTable().run()
            }
            aria-label="Remove table"
            title="Table hatayein"
          >
            <IconTableOff size={16} stroke={1.5} />
          </RichTextEditor.Control>
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content style={{ minHeight: "300px" }} />
    </RichTextEditor>
  );
}
