(ns frontend.handler.common
  "Common fns for handlers"
  (:require ["ignore" :as Ignore]
            [cljs-bean.core :as bean]
            [cljs.reader :as reader]
            [frontend.db :as db]
            [frontend.handler.property :as property-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]))

(defn copy-to-clipboard-without-id-property!
  [repo format raw-text html blocks]
  (let [blocks' (map (fn [b] (assoc b :block/title (:block/raw-title (db/entity (:db/id b))))) blocks)]
    (util/copy-to-clipboard! (property-handler/remove-id-property repo format raw-text)
                             :html html
                             :graph repo
                             :blocks blocks')))

(defn config-with-document-mode
  [config]
  (assoc config
         :document/mode? (state/sub [:document/mode?])))

(defn ignore-files
  [pattern paths]
  (-> (Ignore)
      (.add pattern)
      (.filter (bean/->js paths))
      (bean/->clj)))

(defn safe-read-string
  [content error-message-or-handler]
  (try
    (reader/read-string content)
    (catch :default e
      (js/console.error e)
      (if (fn? error-message-or-handler)
        (error-message-or-handler e)
        (println error-message-or-handler))
      {})))

(defn listen-to-scroll!
  [element]
  (let [*scroll-timer (atom nil)
        on-scroll (fn []
                    (when @*scroll-timer
                      (js/clearTimeout @*scroll-timer))
                    (state/set-state! :ui/scrolling? true)
                    (state/save-scroll-position! (util/scroll-top))
                    (state/save-main-container-position!
                     (-> (util/app-scroll-container-node)
                         (gobj/get "scrollTop")))
                    (reset! *scroll-timer (js/setTimeout
                                           (fn [] (state/set-state! :ui/scrolling? false)) 500)))
        debounced-on-scroll (debounce on-scroll 100)]
    (.addEventListener element "scroll" debounced-on-scroll false)))
