"use client";

import { useState } from "react";
import { MediaUploader } from "./media-uploader";

/**
 * Wrapper that pairs the MediaUploader with a hidden
 * form field, so the uploaded URL is included in the
 * parent <form> submission.
 */
export function LogoUrlField({
  name,
  defaultValue,
  hint,
}: {
  name: string;
  defaultValue?: string;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div className="space-y-2">
      <MediaUploader
        value={value}
        onChange={setValue}
        folder="tools/logos"
        hint={hint}
      />
      {/* Hidden field that ships the URL with the parent form */}
      <input type="hidden" name={name} value={value} />
      {/* Also show the URL as a read-only text below the uploader
          so the operator can see what was uploaded */}
      {value && (
        <p className="break-all rounded-md bg-zinc-50 px-2 py-1 font-mono text-[10px] text-zinc-500 dark:bg-zinc-900">
          {value}
        </p>
      )}
    </div>
  );
}
