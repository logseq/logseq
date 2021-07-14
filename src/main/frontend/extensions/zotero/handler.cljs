(ns frontend.extensions.zotero.handler
  (:require [frontend.handler.page :as page-handler]
            [frontend.extensions.zotero.api :as zotero-api]
            [cljs.core.async :refer [go <!]]
            [frontend.util.property :as property-util]
            [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.extensions.zotero.extractor :as extractor]
            [clojure.string :as str]))

(defn create-zotero-page [key]
  (go
    (let [item                           (<! (zotero-api/item key))
          {:keys [page-name properties]} (extractor/extract item)]
      (page-handler/create! page-name {:redirect? false :format :markdown})
      (editor-handler/api-insert-new-block!
       ""
       {:page page-name
        :properties properties})
      (js/alert "finish"))))


(comment
  (create-zotero-page  "JAHCZRNB")
  (create-zotero-page  "RFYNAQTN")

  (create-zotero-page  "3V6N8ECQ")

  (def page-name (:page-name (extractor/extract zotero-api/rr)))
  (def properties (:properties (extractor/extract zotero-api/rr)))


  ;; this is good
  (editor-handler/api-insert-new-block!
   "abcabc"
   {:page page-name
    ;; :properties properties
    })

  ;; outliner error
  (editor-handler/api-insert-new-block!
   ""
   {:page page-name
    :properties properties})

  #_
  (item "3V6N8ECQ")
  ;; (db/get-page-blocks)
  ;; (page-handler/page-add-property! )
  ;; (editor-handler/insert-new-block-aux! )

  ;; (db/entity [:block/name (str/lower-case "@picardMITMediaLaboratory")])

  ;; (db/get-page-blocks "ccc")

  ;; (def block (state/get-edit-block))
  #_
  (editor-handler/save-block-if-changed!
   block
   (property-util/insert-property :markdown "xxx" :test "value")
   {:force? true}))
