(ns frontend.tools.html-export
  (:require-macros [hiccups.core :as hiccups :refer [html]])
  (:require [frontend.db :as db]
            [frontend.components.block :as block]
            [frontend.extensions.slide :as slide]
            [hiccups.runtime :as hiccupsrt]
            [clojure.walk :as walk]
            [clojure.set :as set]
            [medley.core :as medley]
            [frontend.db.queries :as db-queries]))

;; Consider generate a db index so that search can still works

;; Or maybe TiddlyWiki

;; It could be better that we can reuse some parts of this module in a nodejs tool,
;; so users don't have to use the web for exporting to htmls or publishing.

(defn- build-block
  [config block]
  (let [body (:block/body block)
        block (block/build-block-part config block)]
    [:div.block
     block
     (when (seq body)
       (for [child body]
         (do
           (block/markup-element-cp config child))))]))

(defn export-page
  [page-name blocks show-notification!]
  (let [{:keys [slide] :as properties} (db-queries/get-page-properties page-name)
        slide? slide
        blocks (if (:block/pre-block? (first blocks))
                 (rest blocks)
                 blocks)]
    (if (seq blocks)
      (let [config {:html-export? true :slide? slide?}
            hiccup (if slide?
                     (let [sections (block/build-slide-sections blocks
                                                                (merge
                                                                 config
                                                                 {:id "slide"
                                                                  :start-level 2
                                                                  :page-name page-name})
                                                                build-block)]
                       (slide/slide-content false "" sections))
                     [:div.page
                      (for [block blocks]
                        (build-block config block))])
            remove-attrs #{:on-click :on-change}
            hiccup (walk/postwalk (fn [f]
                                    (if (and (map? f)
                                             (seq (set/intersection remove-attrs (set (keys f)))))

                                      (medley/remove-keys remove-attrs f)
                                      f))
                                  hiccup)]
        (html hiccup))
      (show-notification! "The published content can't be empty." :error))))
