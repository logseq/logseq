(ns frontend.flows
  "This ns contains some event flows."
  (:require [frontend.mobile.flows :as mobile-flows]
            [frontend.mobile.util :as mobile-util]
            [frontend.rfx :as rfx]
            [missionary.core :as m]))

(defn sub-flow
  [sub]
  (m/observe
   (fn [emit!]
     (let [listener-id (random-uuid)
           emit-current! #(emit! (get-in (rfx/snapshot) sub))]
       (emit-current!)
       (rfx/listen! listener-id (fn [_db] (emit-current!)))))))

;; Public Flows
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def current-repo-flow
  "Like get-current-repo."
  (m/eduction
   (dedupe)
   (sub-flow [:git/current-repo])))

(def current-login-user-flow
  (m/eduction
   (dedupe)
   (sub-flow [:auth/current-login-user])))

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
    (sub-flow [:network/online?])))
