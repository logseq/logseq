(ns playground.tldraw
  (:require [rum.core :as rum]
            ["tldraw-logseq" :as tldraw]))

(def persist-key "playground.index")

;; from apps/logseq/src/documents/dev.ts
(def dev-doc-model
  {:currentPageId "page1",
   :selectedIds ["yt1" "yt2"],
   :pages
   [{:name "Page",
     :id "page1",
     :shapes
     [{:id "yt1",
       :type "youtube",
       :parentId "page1",
       :point [100 100],
       :size [160 90],
       :embedId ""}
      {:id "yt2",
       :type "youtube",
       :parentId "page1",
       :point [300 300],
       :size [160 90],
       :embedId ""}],
     :bindings []}],
   :assets []})

(set! *warn-on-infer* false)

;; Debounce it?
(defn on-persist [app]
  (let [document (.-serialized app)]
    ;; persit to localstorage
    (.setItem js/sessionStorage persist-key (js/JSON.stringify document))))

(defn on-load []
  (if-let [raw-str (.getItem js/sessionStorage persist-key)]
    (js->clj (js/JSON.parse raw-str))
    dev-doc-model))

(def model (on-load))

(rum/defc test-comp [props] [:div (js/JSON.stringify props)])

(rum/defc Tldraw []
  (tldraw/App (clj->js {:PageComponent test-comp
                        :onPersist on-persist
                        :model model})))

