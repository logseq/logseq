(ns frontend.components.cmdk.core-test
  (:require
   [cljs.test :refer [async deftest is]]
   [frontend.components.cmdk.core :as cmdk]
   [frontend.db.async :as db-async]
   [frontend.handler.editor :as editor-handler]
   [logseq.shui.ui :as shui]
   [promesa.core :as p]))

(deftest shift-open-page-uses-page-action-test
  (async done
    (let [page-id #uuid "11111111-1111-1111-1111-111111111111"
          item {:result-type :page
                :source-block {:block/uuid page-id
                               :block/name "ordinary page"}}
          state {::cmdk/highlighted-item (atom item)}
          calls (atom [])]
      (-> (p/with-redefs [db-async/<get-block
                          (fn [& args]
                            (swap! calls conj [:get-block args])
                            (p/resolved (:source-block item)))
                          editor-handler/open-block-in-sidebar!
                          (fn [block-id]
                            (swap! calls conj [:open block-id]))
                          shui/dialog-close!
                          (fn [dialog-id]
                            (swap! calls conj [:close dialog-id]))]
            (cmdk/handle-action :open state {:shift? true}))
          (p/then
           (fn []
             (is (= [[:open page-id]
                     [:close :ls-dialog-cmdk]]
                    @calls))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
