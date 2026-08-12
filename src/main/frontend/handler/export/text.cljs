(ns frontend.handler.export.text
  "export blocks/pages as text"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.extensions.zip :as zip]
            [frontend.handler.export.common :as common]
            [frontend.util :as util]
            [goog.dom :as gdom]
            [frontend.handler.export.text-impl :as text-impl]
            [promesa.core :as p]))

;;; export fns

(defn export-blocks-as-markdown
  "options:
  :indent-style \"dashes\" | \"spaces\" | \"no-indent\"
  :remove-options [:emphasis :page-ref :tag :property]
  :other-options {:keep-only-level<=N int :newline-after-block bool}"
  [repo root-block-uuids-or-page-uuid options]
  {:pre [(or (coll? root-block-uuids-or-page-uuid)
             (uuid? root-block-uuids-or-page-uuid))]}
  (util/profile
    :export-blocks-as-markdown
    (-> (common/<export-blocks-as-format repo root-block-uuids-or-page-uuid :markdown options)
        (p/catch (fn [e]
                   (js/console.error e))))))

(defn export-files-as-markdown
  "options see also `export-blocks-as-markdown`"
  [files options]
  (mapv
   (fn [{:keys [path title content]}]
     (util/profile (print-str :export-files-as-markdown title)
       [(or path title)
        (text-impl/export-helper content :markdown options)]))
   files))

(defn export-repo-as-markdown!
  "TODO: indent-style and remove-options"
  [repo]
  (p/let [files* (util/profile :get-file-content (common/<get-file-contents repo "md"))]
    (when (seq files*)
      (let [files (export-files-as-markdown files* nil)
            repo' (string/replace repo config/db-version-prefix "")
            zip-file-name (str repo' "_markdown_" (quot (util/time-ms) 1000))]
        (p/let [zipfile (zip/make-zip zip-file-name files repo')]
          (when-let [anchor (gdom/getElement "export-as-markdown")]
            (.setAttribute anchor "href" (js/window.URL.createObjectURL zipfile))
            (.setAttribute anchor "download" (.-name zipfile))
            (.click anchor)))))))

;;; export fns (ends)
