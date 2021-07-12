(ns frontend.extensions.zotero.handler
  (:require [frontend.handler.page :as page-handler]
            [frontend.extensions.zotero.api :as zotero-api]
            [cljs.core.async :refer [go <!]]
            [frontend.extensions.zotero.extractor :as extractor]
            [clojure.string :as str]))

;; FIXME need to quote the property value
(defn create-zotero-page [key]
  (go
    (let [item                           (<! (zotero-api/item key))
          {:keys [page-name properties]} (extractor/extract item)]
      (page-handler/create! page-name {:redirect? false :format :markdown})
      (doseq [[field value] properties]
        (page-handler/page-add-property! page-name field value))
      (js/alert "finish"))))


(comment
  (create-zotero-page  "JAHCZRNB")
  (create-zotero-page  "RFYNAQTN"))
