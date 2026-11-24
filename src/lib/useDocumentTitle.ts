import { useEffect } from "react";

/** Sets the document title and description for a route. */
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    let meta: HTMLMetaElement | null = null;
    if (description) {
      meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}
