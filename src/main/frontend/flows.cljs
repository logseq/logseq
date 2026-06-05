(ns frontend.flows
  "Shared reactive app values backed by atoms."
  (:require [frontend.mobile.flows :as mobile-flows]
            [frontend.mobile.util :as mobile-util]
            [frontend.rfx :as rfx]))

(defonce ^:private *sub-atoms
  (atom {}))

(defn sub-atom
  [sub]
  (or (get @*sub-atoms sub)
      (let [state* (atom (get-in (rfx/snapshot) sub))
            listener-id (random-uuid)]
        (rfx/listen!
         listener-id
         (fn [_db]
           (let [value (get-in (rfx/snapshot) sub)]
             (when-not (= @state* value)
               (reset! state* value)))))
        (swap! *sub-atoms assoc sub state*)
        state*)))

(def current-repo
  "Like get-current-repo."
  (sub-atom [:git/current-repo]))

(def current-login-user
  (sub-atom [:auth/current-login-user]))

(def document-visibility-state
  (let [document (some-> js/globalThis .-document)
        state* (atom (some-> document .-visibilityState))
        callback-fn #(reset! state* (some-> document .-visibilityState))]
    (some-> document (.addEventListener "visibilitychange" callback-fn))
    state*))

(def network-online?
  (if (mobile-util/native-platform?)
    (let [state* (atom (:connected (js->clj @mobile-flows/*mobile-network-status :keywordize-keys true)))]
      (add-watch mobile-flows/*mobile-network-status ::network-online
                 (fn [_ _ _ status]
                   (reset! state* (:connected (js->clj status :keywordize-keys true)))))
      state*)
    (sub-atom [:network/online?])))
