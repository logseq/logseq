(ns frontend.flows
  "This ns contains some event flows."
  (:require [frontend.mobile.flows :as mobile-flows]
            [frontend.mobile.util :as mobile-util]
            [malli.core :as ma]
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

(def *network-online? (atom nil))

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

(def document-visibility-state-flow
  (->> (m/observe
        (fn ctor [emit!]
          (let [callback-fn #(emit! js/document.visibilityState)]
            (.addEventListener ^js js/document "visibilitychange" callback-fn)
            (callback-fn)
            (fn dtor [] (.removeEventListener ^js js/document "visibilitychange" callback-fn)))))
       (m/eduction (dedupe))
       (m/relieve)))

(def network-online-event-flow
  (if (mobile-util/native-platform?)
    (m/eduction (map :connected) mobile-flows/mobile-network-status-flow)
    (m/watch *network-online?)))
