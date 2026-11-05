import { documentTypeLabels, type DocumentType } from "@/domain/documents";

export type DocumentLinkItem = {
  id: string;
  type: DocumentType;
  number: string;
};

export function DocumentLinks({
  documents,
  compact = false,
}: {
  documents: DocumentLinkItem[];
  compact?: boolean;
}) {
  if (documents.length === 0) return null;

  return (
    <ul className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
      {documents.map((doc) => (
        <li key={doc.id}>
          <a
            href={`/catalog/acts/${doc.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className={
              compact
                ? "text-xs font-medium text-leaf hover:text-ink"
                : "text-sm font-medium text-leaf hover:text-ink"
            }
          >
            {doc.number} · {documentTypeLabels[doc.type]}
          </a>
          {!compact ? (
            <p className="text-xs text-leaf">Черновик. PDF из снимка реквизитов.</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
