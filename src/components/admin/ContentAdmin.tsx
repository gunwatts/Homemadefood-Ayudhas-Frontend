"use client";

import { useEffect, useState } from "react";
import type { ContentField } from "@/lib/adminTypes";
import { formatDateTime } from "@/lib/format";
import { errorText, useAdmin } from "./AdminContext";
import { Badge, ImageField, SectionHeader, Spinner, Toggle } from "./ui";

export function ContentAdmin() {
  const { call, notify } = useAdmin();
  const [fields, setFields] = useState<ContentField[] | null>(null);
  const [group, setGroup] = useState("Business");

  useEffect(() => {
    call<ContentField[]>("/api/admin/content").then(setFields).catch((e) => notify(errorText(e), "error"));
  }, [call, notify]);

  if (!fields) return <Spinner />;
  const groups = Array.from(new Set(fields.map((f) => f.group)));

  return (
    <>
      <SectionHeader
        title="Site text & settings"
        description="Contact details, home page and story text, legal notices and site switches. The owner should approve all public wording."
      />
      <div role="tablist" aria-label="Content groups" className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {groups.map((g) => (
          <button
            key={g}
            role="tab"
            type="button"
            aria-selected={group === g}
            onClick={() => setGroup(g)}
            className="shrink-0 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-medium aria-selected:border-brand aria-selected:bg-brand aria-selected:text-white"
          >
            {g}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {fields
          .filter((f) => f.group === group)
          .map((f) => (
            <ContentEditor key={f.key} field={f} onSaved={(nf) => setFields((all) => all?.map((x) => (x.key === nf.key ? nf : x)) ?? null)} />
          ))}
      </div>
    </>
  );
}

function ContentEditor({ field, onSaved }: { field: ContentField; onSaved: (f: ContentField) => void }) {
  const { call, notify } = useAdmin();
  const [title, setTitle] = useState(field.title);
  const [body, setBody] = useState(field.body);
  const [image, setImage] = useState(field.image_url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const multi = field.kind === "textarea";
  const dirty = title !== field.title || body !== field.body || image !== field.image_url;

  async function save(next?: { body?: string }) {
    setBusy(true);
    setError(null);
    try {
      const saved = await call<ContentField>(`/api/admin/content/${field.key}`, {
        method: "PUT",
        body: { title: multi ? title : undefined, body: next?.body ?? body, image_url: field.has_image ? image ?? "" : undefined },
      });
      onSaved(saved);
      setBody(saved.body);
      setImage(saved.image_url);
      notify("Saved. Visitors will see the change on their next page load.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (field.kind === "bool") {
    return (
      <div className="card p-4">
        <Toggle id={`c-${field.key}`} checked={body === "true"} onChange={(v) => { setBody(v ? "true" : "false"); save({ body: v ? "true" : "false" }); }} label={field.label} />
        {field.help && <p className="hint">{field.help}</p>}
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="font-semibold">{field.label}</p>
        {!field.public && <Badge tone="warn">Private</Badge>}
        {field.updated_at && <span className="text-xs text-muted">Last saved {formatDateTime(field.updated_at)}</span>}
      </div>
      {field.help && <p className="mb-3 text-sm text-muted">{field.help}</p>}
      <div className="space-y-3">
        {multi && (
          <div>
            <label htmlFor={`t-${field.key}`} className="label">Heading</label>
            <input id={`t-${field.key}`} className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
        )}
        <div>
          <label htmlFor={`b-${field.key}`} className={multi ? "label" : "sr-only"}>{multi ? "Text" : field.label}</label>
          {multi ? (
            <textarea id={`b-${field.key}`} className="input font-normal" rows={Math.min(16, Math.max(4, body.split("\n").length + 1))} value={body} onChange={(e) => setBody(e.target.value)} />
          ) : (
            <input id={`b-${field.key}`} className="input" value={body} onChange={(e) => setBody(e.target.value)} />
          )}
          {multi && <p className="hint">Blank line = new paragraph · &quot;- &quot; = bullet point · &quot;## &quot; = sub-heading · **bold**</p>}
        </div>
        {field.has_image && <ImageField id={`i-${field.key}`} label="Photo" value={image} onChange={setImage} />}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button type="button" className="btn btn-primary px-5" disabled={!dirty || busy} onClick={() => save()}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
