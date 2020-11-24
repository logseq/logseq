(ns frontend.spec
  (:require [cljs.spec.alpha :as s]
            [frontend.config :as config]
            [lambdaisland.glogi :as log]
            [expound.alpha :as expound]))

;; disable in production
(when config/dev? (s/check-asserts true))

(set! s/*explain-out* expound/printer)

(defn validate
  "This function won't crash the current thread, just log error."
  [spec value]
  (when (s/explain-data spec value)
    (let [error-message (expound/expound-str spec value)]
      (log/error :spec/validate-failed error-message))))

(s/def :user/repo string?)

(comment
  (validate :user/repo 1))