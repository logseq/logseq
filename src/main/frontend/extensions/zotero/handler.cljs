(ns frontend.extensions.zotero.handler
  (:require [cljs.core.async :refer [<! go]]
            [clojure.string :as str]
            [frontend.extensions.zotero.api :as zotero-api]
            [frontend.extensions.zotero.extractor :as extractor]
            [frontend.extensions.zotero.setting :as setting]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]))

(defn add [page-name type key]
  (go
    (let [api-fn      (case type
                        :notes       zotero-api/notes
                        :attachments zotero-api/attachments)
          first-block (case type
                        :notes       (setting/setting :notes-block-text)
                        :attachments (setting/setting :attachments-block-text))
          should-add? (case type
                        :notes       (setting/setting :include-notes?)
                        :attachments (setting/setting :include-attachments?))]
      (when should-add?
        (let [items    (<! (api-fn key))
              md-items (->> items
                            (map extractor/extract)
                            (remove str/blank?))]
          (when (not-empty md-items)
            (when-let [id (:block/uuid
                           (editor-handler/api-insert-new-block!
                            first-block {:page page-name}))]
              (doseq [md-item md-items]
                (editor-handler/api-insert-new-block!
                 md-item
                 {:block-uuid id
                  :sibling?   false
                  :before?    false})))))))))

(defn handle-command-zotero
  [id page-name]
  (state/set-editor-show-zotero! false)
  (editor-handler/insert-command! id (str "[[" page-name "]]") nil {}))

(defn create-zotero-page
  ([item]
   (create-zotero-page item {}))
  ([item {:keys [block-dom-id] :as opt}]
   (go
     (let [{:keys [page-name properties]} (extractor/extract item)
           key                            (-> item :key)]
       (page-handler/create! page-name {:redirect? false :format :markdown :create-first-block? false})

       (editor-handler/api-insert-new-block!
        ""
        {:page       page-name
         :properties properties})

       (<! (add page-name :attachments key))

       (<! (add page-name :notes key))

       (handle-command-zotero block-dom-id page-name)

       (notification/show! (str "Successfully created page " page-name) :success)))))


(comment
  (create-zotero-page "JAHCZRNB")
  (create-zotero-page "RFYNAQTN")

  (create-zotero-page "3V6N8ECQ")

  (def page-name (:page-name (extractor/extract zotero-api/rr)))
  (def properties (:properties (extractor/extract zotero-api/rr)))
  (zotero-api/item   "3V6N8ECQ")

  (page-handler/create! "123" {:redirect? false :format :markdown :create-first-block? false})

  ;; this is good
  (editor-handler/api-insert-new-block!
   "yyy"
   {:block-uuid #uuid "60eee44e-7b9f-439d-8113-c8e5ab7a63e8"
    :before? false
    :sibling? false})
;; => #:block{:properties {}, :tags [], :format :markdown, :children #{}, :path-refs (#:block{:name "notes", :original-name "notes", :journal? false}), :meta {:timestamps [], :properties [], :start-pos 0, :end-pos 11}, :unordered true, :content "[[notes]]", :refs (#:block{:name "notes", :original-name "notes", :journal? false}), :file 60, :page 58, :title [["Link" {:url ["Page_ref" "notes"], :label [["Plain" ""]], :full_text "[[notes]]", :metadata ""}]], :level 1, :journal? false, :anchor "", :uuid #uuid "60eee44e-7b9f-439d-8113-c8e5ab7a63e8", :body []}


  #_(item "3V6N8ECQ")
  ;; (db/get-page-blocks)
  ;; (page-handler/page-add-property! )
  ;; (editor-handler/insert-new-block-aux! )

  ;; (db/entity [:block/name (str/lower-case "@picardMITMediaLaboratory")])

  ;; (db/get-page-blocks "ccc")

  ;; (def block (state/get-edit-block))
  #_(editor-handler/save-block-if-changed!
     block
     (property-util/insert-property :markdown "xxx" :test "value")
     {:force? true}))
