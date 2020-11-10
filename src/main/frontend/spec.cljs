(ns frontend.spec
  (:require [cljs.spec.alpha :as s]
            [frontend.config :as config]
            [expound.alpha :as expound]))

;; disable in production
(when config/dev? (s/check-asserts true))

(set! s/*explain-out* expound/printer)

(defn validate [spec value]
  (when-let [error (s/explain-data spec value)]
    (if config/dev?
      (throw (ex-info (expound/expound-str spec value) error))
      (js/console.log (expound/expound-str spec value)))))

(s/def :user/repo string?)

(comment
  (validate :user/repo 1))