"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { maxPhotoBytes } from "@/domain/items/image-file";

const acceptTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionFor(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return "png";
}

function normalizeImageFile(file: File): File | null {
  const type = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!acceptTypes.has(type)) return null;
  if (file.size <= 0 || file.size > maxPhotoBytes) return null;
  if (file.name && file.name !== "image") return file;
  return new File([file], `paste.${extensionFor(type)}`, { type, lastModified: Date.now() });
}

function firstClipboardImage(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.items)) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const raw = item.getAsFile();
    if (!raw) continue;
    const file = normalizeImageFile(raw);
    if (file) return file;
  }
  for (const file of Array.from(data.files)) {
    const normalized = normalizeImageFile(file);
    if (normalized) return normalized;
  }
  return null;
}

export function PhotoField({ currentPhotoSrc }: { currentPhotoSrc?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const setFile = useCallback((file: File | null) => {
    const input = inputRef.current;
    if (!input) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (!file) {
      input.value = "";
      setPreview(null);
      setFileName(null);
      setLocalError(null);
      return;
    }

    const normalized = normalizeImageFile(file);
    if (!normalized) {
      setLocalError("Нужен JPG, PNG или WebP до 5 МБ.");
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(normalized);
    input.files = transfer.files;

    const url = URL.createObjectURL(normalized);
    previewUrlRef.current = url;
    setPreview(url);
    setFileName(normalized.name);
    setLocalError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Ctrl+V / ⌘V anywhere in the item form — if clipboard has an image, attach it.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    function onPaste(event: ClipboardEvent) {
      const file = firstClipboardImage(event.clipboardData);
      if (!file) return;
      event.preventDefault();
      setFile(file);
    }

    form.addEventListener("paste", onPaste);
    return () => form.removeEventListener("paste", onPaste);
  }, [setFile]);

  const shownSrc = preview ?? currentPhotoSrc ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div
        tabIndex={0}
        onDrop={(event) => {
          event.preventDefault();
          const file = firstClipboardImage(event.dataTransfer);
          if (file) setFile(file);
        }}
        onDragOver={(event) => event.preventDefault()}
        className="rounded-2xl border border-dashed border-line-strong bg-muted/40 px-3 py-3 outline-none transition focus-visible:border-mint focus-visible:ring-2 focus-visible:ring-mint/30"
      >
        {shownSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shownSrc}
            alt=""
            className="mb-3 aspect-[4/3] w-full rounded-xl object-cover"
          />
        ) : null}

        <p className="text-sm leading-6 text-ink">
          Вставьте снимок из буфера:{" "}
          <kbd className="rounded bg-surface px-1.5 py-0.5 text-xs ring-1 ring-line">Ctrl</kbd>
          +
          <kbd className="rounded bg-surface px-1.5 py-0.5 text-xs ring-1 ring-line">V</kbd>
          {" "}
          (на Mac — ⌘V). Или выберите файл / перетащите сюда.
        </p>
        {fileName ? (
          <p className="mt-1 text-xs text-leaf">Выбрано: {fileName}</p>
        ) : currentPhotoSrc && !preview ? (
          <p className="mt-1 text-xs text-leaf">Сейчас в карточке — текущее фото. Новое заменит его.</p>
        ) : (
          <p className="mt-1 text-xs text-leaf">Без фото останется картинка категории.</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <label htmlFor={inputId} className="btn-ghost btn-sm cursor-pointer">
            Выбрать файл
          </label>
          {preview || fileName ? (
            <button type="button" className="btn-ghost btn-sm" onClick={() => setFile(null)}>
              Убрать
            </button>
          ) : null}
        </div>

        <input
          id={inputId}
          ref={inputRef}
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            if (!file) {
              setPreview(null);
              setFileName(null);
              setLocalError(null);
              return;
            }
            setFile(file);
          }}
        />
      </div>
      {localError ? <span className="text-sm font-medium text-ink">{localError}</span> : null}
    </div>
  );
}
