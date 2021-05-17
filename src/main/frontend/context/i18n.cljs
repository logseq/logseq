(ns frontend.context.i18n
  (:require [frontend.dicts :as dicts]
            [frontend.modules.shortcut.dict :as shortcut-dict]
            [rum.core :as rum]
            [medley.core :refer [deep-merge]]
            [frontend.state :as state]))

;; TODO
;; - [x] Get the preffered language from state
;; - [x] Update the preffered language
;; - [x] Create t functiona which takes a keyword and returns text with the current preffered language
;; - [x] Add fetch for local browser prefered language if user has set it already
;; - [ ] Fetch prefered language from backend if user is logged in

(defn fetch-local-language []
  (.. js/window -navigator -language))

(rum/defcontext *tongue-context*)

(rum/defc tongue-provider [children]
  (let [prefered-language (keyword (state/sub :preferred-language))
        set-preferred-language state/set-preferred-language!
        all-dicts (deep-merge dicts/dicts shortcut-dict/dict)
        t (partial (dicts/translate all-dicts) prefered-language)]
    (if (nil? prefered-language)
      (set-preferred-language (fetch-local-language))
      :ok)
    (rum/bind-context [*tongue-context* [t prefered-language set-preferred-language]]
                      children)))

(rum/defc use-tongue []
  (rum/with-context [value *tongue-context*]
    (if (nil? value)
      (throw "use-i18n must be used within a i18n-provider")
      value)))
