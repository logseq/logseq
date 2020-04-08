(ns frontend.format
  (:require [frontend.format.org-mode :as org :refer [->OrgMode]]
            [frontend.format.markdown :as markdown :refer [->Markdown]]
            [frontend.format.protocol :as protocol]))

(defn to-html
  ([content suffix]
   (to-html content suffix nil))
  ([content suffix config]
   (when-let [record (case suffix
                       "org"
                       (->OrgMode content)
                       (list "md" "markdown")
                       (->Markdown content)
                       nil)]
     (if config
       (protocol/toHtml record config)
       (protocol/toHtml record)))))
