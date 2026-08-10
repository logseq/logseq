(ns frontend.handler.db-based.rtc-flows
  "Reactive RTC atoms."
  (:require [frontend.flows :as flows]
            [frontend.mobile.flows :as mobile-flows]
            [logseq.common.util :as common-util]))

(def rtc-log
  (let [state* (atom nil)
        source (flows/sub-atom [:rtc/log])]
    (add-watch source ::rtc-log
               (fn [_ _ _ log]
                 (when-not (and (= :skip (:sub-type log))
                                (= :rtc.log/apply-remote-update (:type log)))
                   (reset! state* log))))
    state*))

(def rtc-download-log
  (let [state* (atom nil)]
    (add-watch rtc-log ::rtc-download-log
               (fn [_ _ _ log]
                 (when (keyword-identical? :rtc.log/download (:type log))
                   (reset! state* log))))
    state*))

(def rtc-upload-log
  (let [state* (atom nil)]
    (add-watch rtc-log ::rtc-upload-log
               (fn [_ _ _ log]
                 (when (keyword-identical? :rtc.log/upload (:type log))
                   (reset! state* log))))
    state*))

(def rtc-misc-log
  (let [state* (atom nil)]
    (add-watch rtc-log ::rtc-misc-log
               (fn [_ _ _ log]
                 (when-not (contains? #{:rtc.log/download :rtc.log/upload} (:type log))
                   (reset! state* log))))
    state*))

(def rtc-state
  (flows/sub-atom [:rtc/state]))

(def rtc-try-restart
  "Updates when it's time to restart rtc loop.
conditions:
- user logged in
- no rtc loop running now
- last rtc stop-reason is websocket message timeout
- online
- throttle 5000ms"
  (let [state* (atom nil)
        last-emitted-at (atom 0)
        update! (fn []
                  (let [{:keys [rtc-lock last-stop-exception-ex-data graph-uuid]} @rtc-state
                        login-user @flows/current-login-user
                        online? @flows/network-online?
                        now (common-util/time-ms)]
                    (when (and online?
                               (some? (:email login-user))
                               (some? graph-uuid)
                               (not rtc-lock)
                               (= :rtc.exception/ws-timeout (:type last-stop-exception-ex-data))
                               (>= (- now @last-emitted-at) 5000))
                      (reset! last-emitted-at now)
                      (reset! state* {:graph-uuid graph-uuid :t now}))))]
    (doseq [[watch-key atom'] {::rtc-try-restart-state rtc-state
                               ::rtc-try-restart-online flows/network-online?
                               ::rtc-try-restart-user flows/current-login-user}]
      (add-watch atom' watch-key (fn [_ _ _ _] (update!))))
    state*))

(def logout
  (let [state* (atom nil)]
    (add-watch flows/current-login-user ::logout
               (fn [_ _ _ user]
                 (when (= :logout user)
                   (reset! state* :logout))))
    state*))

(def ^:private *rtc-start-trigger (atom nil))

(defn trigger-rtc-start
  [repo]
  (assert (some? repo))
  (reset! *rtc-start-trigger repo))

(defn- document-visible->restart-event
  [visibility]
  (when (= "visible" visibility)
    :document-visible&rtc-not-running))

(defn- network-online->restart-event
  [online?]
  (when online?
    :network-online&rtc-not-running))

(defn- mobile-app-active->restart-event
  [app-active?]
  (when app-active?
    :mobile-app-active&rtc-not-running))

(def trigger-start-rtc
  (let [state* (atom nil)
        timeout-id (atom nil)
        emit! (fn [event]
                (when @flows/current-login-user
                  (when-let [id @timeout-id]
                    (js/clearTimeout id))
                  (reset! timeout-id (js/setTimeout #(reset! state* event) 50))))]
    (add-watch flows/current-login-user ::trigger-start-rtc-login
               (fn [_ _ _ user]
                 (when (:email user)
                   (emit! [:login]))))
    (add-watch flows/current-repo ::trigger-start-rtc-repo
               (fn [_ _ _ repo]
                 (when repo
                   (emit! [:graph-switch repo]))))
    (add-watch *rtc-start-trigger ::trigger-start-rtc-manual
               (fn [_ _ _ repo]
                 (when repo
                   (emit! [:trigger-rtc repo]))))
    (add-watch flows/document-visibility-state ::trigger-start-rtc-visible
               (fn [_ _ _ visibility]
                 (when-let [event (document-visible->restart-event visibility)]
                   (emit! [event]))))
    (add-watch flows/network-online? ::trigger-start-rtc-online
               (fn [_ _ _ online?]
                 (when-let [event (network-online->restart-event online?)]
                   (emit! [event]))))
    (add-watch mobile-flows/*mobile-app-state ::trigger-start-rtc-mobile-active
               (fn [_ _ _ app-active?]
                 (when-let [event (mobile-app-active->restart-event app-active?)]
                   (emit! [event]))))
    state*))
