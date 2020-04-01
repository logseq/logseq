(ns frontend.format
  (:require [frontend.format.org-mode :as org :refer [->OrgMode]]
            [frontend.format.markdown :as markdown :refer [->Markdown]]
            [frontend.format.protocol :as protocol]))

(defn to-html
  [content suffix]
  (when-let [record (case suffix
                 "org"
                 (->OrgMode content)
                 (list "md" "markdown")
                 (->Markdown content)
                 nil)]
    (protocol/toHtml record)))
