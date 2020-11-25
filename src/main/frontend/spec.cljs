(ns frontend.spec
  (:require [cljs.spec.alpha :as s]
            [frontend.config :as config]
            [expound.alpha :as expound]))

;; disable in production
(when config/dev? (s/check-asserts true))

(set! s/*explain-out* expound/printer)

(defn validate
  "This function won't crash the current thread, just log error."
  [spec value]
  (if (s/explain-data spec value)
    (let [error-message (expound/expound-str spec value)
          ex (ex-info "Error in validate" nil)]
      (log/error :exception ex :spec/validate-failed error-message)
      false)
    true))

;; repo

(s/def :repos/id string?)
(s/def :repos/url string?)
(s/def :repos/branch string?)
(s/def :repos/installation_id string?)
(s/def :repos/token string?)
(s/def :repos/expires_at string?)
(s/def :repos/repo (s/keys :req-un [:repos/id :repos/url :repos/branch :repos/installation_id]
                           :opt-un [:repos/token :repos/expires_at]))

; Didn't know how to impl `require token` version in :me key.
(s/def :repos/repo-require-token (s/keys :req-un [:repos/id :repos/url :repos/branch :repos/installation_id
                                                  :repos/token :repos/expires_at]))

(s/def :me/repos (s/* :repos/repo))


;; project

(s/def :projects/name string?)
(s/def :projects/repo string?)
(s/def :projects/project (s/keys :req-un [:projects/name :projects/repo]))
(s/def :me/projects (s/* :projects/project))

;; me

(s/def :me/name string?)
(s/def :me/email string?)
(s/def :me/avatar string?)
(s/def :me/preferred_format string?)
(s/def :me/preferred_workflow string?)
(s/def :me/cors_proxy (s/or :nil nil?
                            :string string?))

;; state

(s/def :state/me (s/keys :req-un [:me/name :me/email :me/avatar :me/repos :me/projects :me/preferred_format
                                  :me/preferred_workflow :me/cors_proxy]))


(comment
  (validate :user/repo 1))