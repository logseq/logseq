(ns logseq.publish.ssr
  "SSR helpers for published pages.")

(defn render-page-html
  "Renders HTML for a published page.

  Options:
  - :render-page-fn should return HTML string for the given snapshot.
  - :wrap-html-fn should wrap the rendered body with document-level markup.
  "
  [snapshot {:keys [render-page-fn wrap-html-fn]}]
  (let [body (when render-page-fn (render-page-fn snapshot))]
    (if wrap-html-fn
      (wrap-html-fn body)
      body)))
