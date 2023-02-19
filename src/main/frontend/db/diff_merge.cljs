(ns frontend.db.diff-merge
  (:require ["./diff-merge.js" :refer [Merger visualizeAsHTML]]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [frontend.state :as state]
            [rum.core :as rum]
            [frontend.db :as db]
            [cljs-bean.core :as bean]))

(defn merge
  [base & branches]
  (let [mldoc gp-mldoc/MldocInstance
        merger (Merger. mldoc)]
    (.mergeBranches merger base (bean/->js branches))))

(rum/defcs merge-view < rum/reactive
  (rum/local nil ::result)
  [state & args]
  (let [*result (::result state)]
    (reset! *result (-> (apply merge args)
                        (visualizeAsHTML)
                        (.-outerHTML)))
    [:div#merge-view {:dangerouslySetInnerHTML {:__html @*result}}]))


(defn merge-demo
  [base & branches]
  (prn branches)
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
