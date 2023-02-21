(ns frontend.data-bridge.diff-merge
  (:require [logseq.graph-parser.data-bridge.diff-merge :as gp-diff]
            [frontend.state :as state]
            [rum.core :as rum]
            [frontend.db :as db]))

(rum/defcs merge-view < rum/reactive
  (rum/local nil ::result)
  [state & args]
  (let [*result (::result state)]
    (reset! *result (-> (apply gp-diff/diff-merge args)
                        (gp-diff/getHTML)
                        (.-outerHTML)))
    [:div#merge-view {:dangerouslySetInnerHTML {:__html @*result}}]))


(defn merge-demo
  [base & branches]
  (state/set-modal!
   (fn [_close-fn]
     (apply merge-view base branches))
   {:id :merge-demo :label "modal-merge-demo"}))


(defn merge-demo-pages
  [& pages]
  (let [p2t-fn (fn [page-name] (-> (db/get-page-file page-name)
                                   (:file/content)))
        texts (map p2t-fn pages)]
    (apply merge-demo texts)))


