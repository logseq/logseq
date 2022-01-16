(ns frontend.tools.html-export
  (:require-macros [hiccups.core :as hiccups :refer [html]])
  (:require [clojure.set :as set]
            [clojure.walk :as walk]
            [frontend.components.block :as block]
            [frontend.db :as db]
            [medley.core :as medley]
            [frontend.format.block :as format-block]))

;; Consider generate a db index so that search can still works

;; Or maybe TiddlyWiki

;; It could be better that we can reuse some parts of this module in a nodejs tool,
;; so users don't have to use the web for exporting to htmls or publishing.

(defn- build-block
  [config block]
  (let [block (format-block/parse-title-and-body block)
        body (:block/body block)
        block (block/build-block-title config block)]
    [:div.block
     block
     (when (seq body)
       (for [child body]
         (block/markup-element-cp config child)))]))

(defn export-page
  [page-name blocks show-notification!]
  (let [{:keys [slide]} (db/get-page-properties page-name)
        slide? slide
        blocks (if (:block/pre-block? (first blocks))
                 (rest blocks)
                 blocks)]
    (if (seq blocks)
      (let [config {:html-export? true :slide? slide?}
            hiccup [:div.page
                    (for [block blocks]
                      (build-block config block))]
            remove-attrs #{:on-click :on-change}
            hiccup (walk/postwalk (fn [f]
                                    (if (and (map? f)
                                             (seq (set/intersection remove-attrs (set (keys f)))))

                                      (medley/remove-keys remove-attrs f)
                                      f))
                                  hiccup)]
        (html hiccup))
      (show-notification! "The published content can't be empty." :error))))
