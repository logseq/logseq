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

(defn lazy-load-js
  [state]
  (let [format (keyword (second (:rum/args state)))
        loader? (contains? handler/html-render-formats format)]
    (when loader?
      (when-not (format/loaded? format)
        (format/lazy-load format)))))

;; TODO: lazy load highlight.js
(rum/defcs html < rum/reactive
  {:will-mount (fn [state]
                 (lazy-load-js state)
                 state)
   :did-mount (fn [state]
                (highlight!)
                (handler/render-local-images!)
                state)
   :did-update (fn [state]
                 (highlight!)
                 (handler/render-local-images!)
                 (lazy-load-js state)
                 state)}
  [state content format config]
  (let [format (format/normalize format)]
    (cond
     (contains? handler/img-formats format)
     content

     (contains? handler/html-render-formats format)
     (let [{:keys [format/loading]} (rum/react state/state)
           loading? (get loading (format/normalize format))]
       (if loading?
         [:div "loading ..."]
         (util/raw-html (format/to-html content format config))))

     :else
     [:div.pre-white-space.mt-6
      content])))
