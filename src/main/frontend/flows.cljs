(ns frontend.flows
  "This ns contains some event flows."
  (:require [malli.core :as ma]
            [missionary.core :as m]))

;; Some Input Atoms
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def *current-repo (atom nil))

(def ^:private current-login-user-schema
  [:or
   [:= :logout]
   [:map
    [:email :string]
    [:sub :string]
    [:cognito:username :string]]])

(def ^:private current-login-user-validator (ma/validator current-login-user-schema))
(def *current-login-user (atom nil :validator current-login-user-validator))

;; Public Flows
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def current-repo-flow
  "Like get-current-repo."
  (m/eduction
   (dedupe)
   (m/watch *current-repo)))

(def current-login-user-flow
  (m/eduction
   (dedupe)
   (m/watch *current-login-user)))
