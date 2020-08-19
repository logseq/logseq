(ns frontend.context.i18n
  (:require [frontend.tools.tongue :as tongue]
            [rum.core :as rum]
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
        t (partial tongue/translate prefered-language)]
    (set-preferred-language (fetch-local-language))
    (rum/bind-context [*tongue-context* [prefered-language set-preferred-language t]]
                      children)))

(rum/defc use-tongue []
          (rum/with-context [value *tongue-context*]
                            (if (nil? value)
                              (throw "use-i18n must be used within a i18n-provider")
                              value)))
