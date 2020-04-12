(ns frontend.components.content
  (:require [rum.core :as rum]
            [frontend.format :as format]
            [frontend.format.org-mode :as org]
            [frontend.format.markdown :as md]
            [frontend.handler :as handler]
            [frontend.util :as util]
            [frontend.state :as state]))

(defn- highlight!
  []
  (doseq [block (-> (js/document.querySelectorAll "pre code")
                    (array-seq))]
    (js/hljs.highlightBlock block)))

(defonce render-formats
  #{:org :md :markdown
    :adoc :asciidoc})

;; TODO: lazy load highlight.js
(rum/defcs html < rum/reactive
  {:init (fn [state props]
           (let [format (keyword (second (:rum/args state)))
                 loader? (contains? render-formats format)]
             (when loader?
               (when-not (format/loaded? format)
                 (format/lazy-load format)))
             state))
   :did-mount (fn [state]
                (highlight!)
                (handler/render-local-images!)
                state)
   :did-update (fn [state]
                 (highlight!)
                 state)}
  [state content format config]
  (let [format (format/normalize format)]
    (cond
     (contains? handler/img-formats format)
     content

     (contains? render-formats format)
     (let [{:keys [format/loading]} (rum/react state/state)
           loading? (get loading (format/normalize format))]
       (if loading?
         [:div "loading ..."]
         (util/raw-html (format/to-html content format config))))

     :else
     [:div.pre-white-space.mt-6
      content])))
