(ns frontend.spec
  "Clojure spec related setup and helpers"
  (:require [cljs.spec.alpha :as s]
            [frontend.config :as config]
            [lambdaisland.glogi :as log]
            [expound.alpha :as expound]))

;; Enabled for all environments. We want asserts to run in production e.g.
;; frontend.storage one is preventing data corruption. If we introduce asserts
;; that are not perf sensitive, we will need to reconsider.
(s/check-asserts true)

(set! s/*explain-out* expound/printer)

(defn validate
  "This function won't crash the current thread, just log error."
  [spec value]
  (when config/dev?
    (if (s/explain-data spec value)
     (let [error-message (expound/expound-str spec value)
           ex (ex-info "Error in validate" {:value value})]
       (log/error :exception ex :spec/validate-failed error-message)
       false)
     true)))

;; repo

(s/def :repos/url string?)
