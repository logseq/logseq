(ns frontend.tools.html-export
  (:require-macros [hiccups.core :as hiccups :refer [html]])
  (:require [frontend.db :as db]
            [frontend.components.hiccup :as hiccup]
            [frontend.extensions.slide :as slide]
            [hiccups.runtime :as hiccupsrt]
            [clojure.walk :as walk]
            [clojure.set :as set]
            [medley.core :as medley]))

;; Consider generate a db index so that search can still works

;; Or maybe TiddlyWiki

;; It could be better that we can reuse some parts of this module in a nodejs tool,
;; so users don't have to use the web for exporting to htmls or publishing.

(defn- build-heading
  [config heading]
  (let [body (:heading/body heading)
        heading (hiccup/build-heading-part config heading)]
    [:div.heading
     heading
     (when (seq body)
       (for [child body]
         (do
           (hiccup/block config child))))]))

(defn export-page
  [page-name headings show-notification!]
  (let [{:keys [slide] :as directives} (db/get-page-directives page-name)
        slide? slide
        headings (if (:heading/pre-heading? (first headings))
                   (rest headings)
                   headings)]
    (if (seq headings)
      (let [config {:html-export? true :slide? slide?}
            hiccup (if slide?
                     (let [sections (hiccup/build-slide-sections headings
                                                                 (merge
                                                                  config
                                                                  {:id "slide"
                                                                   :start-level 2})
                                                                 build-heading)]
                       (slide/slide-content false "" sections))
                     [:div.page
                      (for [heading headings]
                        (build-heading config heading))])
            remove-attrs #{:on-click :on-change}
            hiccup (walk/postwalk (fn [f]
                                    (if (and (map? f)
                                             (seq (set/intersection remove-attrs (set (keys f)))))

                                      (medley/remove-keys remove-attrs f)
                                      f))
                                  hiccup)]
        (html hiccup))
      (show-notification! "The published content can't be empty." :error))))
