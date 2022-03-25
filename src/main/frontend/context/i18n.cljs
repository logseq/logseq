(ns frontend.context.i18n
  (:require [frontend.dicts :as dicts]
            [frontend.modules.shortcut.dict :as shortcut-dict]
            [medley.core :refer [deep-merge]]
            [frontend.state :as state]))

;; TODO
;; - [x] Get the preferred language from state
;; - [x] Update the preferred language
;; - [x] Create t functiona which takes a keyword and returns text with the current preferred language
;; - [x] Add fetch for local browser preferred language if user has set it already
;; - [ ] Fetch preferred language from backend if user is logged in

(defn fetch-local-language []
  (.. js/window -navigator -language))

(defonce translate-dicts (atom {}))

(defn t
  [& args]
  (let [preferred-language (keyword (state/sub :preferred-language))
        _ (when (nil? preferred-language)
            (state/set-preferred-language! (fetch-local-language)))
        dicts (or (get @translate-dicts preferred-language)
                  (let [result (some-> (deep-merge dicts/dicts shortcut-dict/dicts)
                                       dicts/translate)]
                    (swap! translate-dicts assoc preferred-language result)
                    result))]
    (apply (partial dicts preferred-language) args)))
