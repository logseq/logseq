(ns frontend.context.i18n
  "This ns is a system component that handles translation for the entire
  application. The ns dependencies for this ns must be small since it is used
  throughout the application."
  (:require [frontend.dicts :as dicts]
            [tongue.core :as tongue]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]))

(def dicts (merge dicts/dicts {:tongue/fallback :en}))

(def translate
  (tongue/build-translate dicts))

(defn t
  [& args]
  (let [preferred-language (keyword (state/sub :preferred-language))]
    (try
      (apply translate preferred-language args)
      (catch :default e
        (log/error :failed-translation {:arguments args
                                        :lang preferred-language})
        (state/pub-event! [:capture-error {:error e
                                           :payload {:type :failed-translation
                                                     :arguments args
                                                     :lang preferred-language}}])
        (apply translate :en args)))))

(defn- fetch-local-language []
  (.. js/window -navigator -language))

;; TODO: Fetch preferred language from backend if user is logged in
(defn start []
  (let [preferred-language (state/sub :preferred-language)]
    (when (nil? preferred-language)
      (state/set-preferred-language! (fetch-local-language)))))
