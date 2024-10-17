(ns playground.tldraw
  (:require [rum.core :as rum]
            ["/tldraw-logseq" :as tldraw]))

(def persist-key "playground.index")

;; from apps/logseq/src/documents/dev.ts
(def dev-doc-model
  {"currentPageId" "page1",
   "selectedIds" ["0jy4JuM61pS9QQthBDme-"],
   "pages"
   [{"id" "page1",
     "name" "Page",
     "shapes"
     [{"parentId" "page1",
       "handles"
       {"start" {"id" "start", "canBind" true, "point" [0 0]}, "end" {"id" "end", "canBind" true, "point" [392 272]}},
       "scale" [1 1],
       "label" "",
       "id" "0jy4JuM61pS9QQthBDme-",
       "stroke" "",
       "fill" "",
       "strokeWidth" 1,
       "type" "line",
       "decorations" {"end" "arrow"},
       "nonce" 1655952872458,
       "opacity" 1,
       "point" [379.6805699752259 82.67652436640805 0.5]}
      {"parentId" "page1",
       "pageId" "car",
       "collapsed" false,
       "blockType" "P",
       "collapsedHeight" 0,
       "scale" [1 1],
       "id" "hRp0fnc0i2BZIjEbZqO6_",
       "stroke" "",
       "fill" "",
       "strokeWidth" 2,
       "type" "logseq-portal",
       "nonce" 1655952865192,
       "size" [600 320],
       "opacity" 1,
       "point" [876.7157262252258 195.59449311640805]}],
     "bindings" {},
     "nonce" 1}],
   "assets" []})

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
