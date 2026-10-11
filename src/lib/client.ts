/** Thin fetch wrapper for the PromptDeck API. Throws an Error carrying the server message. */
export async function api<T = void>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
  });
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data ? String(data.error) : undefined;
    throw new Error(message ?? `Request failed (${response.status})`);
  }
  return data as T;
}

export const jsonBody = (value: unknown): RequestInit => ({ body: JSON.stringify(value) });

/** Copies text to the clipboard; falls back to execCommand where the Clipboard API is unavailable. */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("Copying is not supported in this browser");
}

export const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
