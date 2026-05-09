(ns frontend.handler.events.rtc
  "RTC events"
  (:require [frontend.common.crypt :as crypt]
            [frontend.common.missionary :as c.m]
            [frontend.components.e2ee :as e2ee]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.events :as events]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [promesa.core :as p]))

(defn- rtc-collaborators-dialog?
  []
  (= :rtc-collaborators (state/get-modal-id)))

(defn- close-e2ee-blocking-ui!
  []
  (when-not (rtc-collaborators-dialog?)
    (shui/dialog-close-all!))
  (shui/popup-hide! :download-rtc-graph))

(defmethod events/handle :rtc/decrypt-user-e2ee-private-key [[_ encrypted-private-key]]
  (let [private-key-promise (p/deferred)
        refresh-token (str (state/get-auth-refresh-token))]
    (close-e2ee-blocking-ui!)
    (->
     (p/let [{:keys [password]} (state/<invoke-db-worker :thread-api/get-e2ee-password refresh-token)
             private-key (crypt/<decrypt-private-key password encrypted-private-key)]
       (p/resolve! private-key-promise private-key))
     (p/catch
      (fn [error]
        (log/error :read-e2ee-password-failed error)
        (shui/dialog-open!
         #(e2ee/e2ee-password-to-decrypt-private-key encrypted-private-key private-key-promise)
         {:auto-width? true
          :content-props {:onPointerDownOutside #(.preventDefault %)}
          :on-close (fn []
                      (p/reject! private-key-promise (ex-info "input E2EE password cancelled" {}))
                      (shui/dialog-close!))}))))
    private-key-promise))

(defmethod events/handle :rtc/request-e2ee-password [[_ {:keys [reason]}]]
  (let [password-promise (p/deferred)
        decrypt-reason? (= :decrypt-user-rsa-private-key reason)]
    (close-e2ee-blocking-ui!)
    (shui/dialog-open!
     #(if decrypt-reason?
        (e2ee/e2ee-request-password password-promise)
        (e2ee/e2ee-request-new-password password-promise))
     {:auto-width? true
      :content-props {:onPointerDownOutside #(.preventDefault %)}
      :on-close (fn []
                  (p/reject! password-promise (ex-info "cancelled" {}))
                  (shui/dialog-close!))})
    password-promise))

(defmethod events/handle :rtc/storage-exceed-limit [[_]]
  (notification/show! (t :sync/storage-exceed-limit) :warning false))

(defmethod events/handle :rtc/graph-count-exceed-limit [[_]]
  (notification/show! (t :sync/graph-count-exceed-limit) :warning false))

(defn- sync-app-state!
  []
  (let [state-flow
        (->> (m/watch state/state)
             (m/eduction
              (map (fn [app-state]
                     (cond-> (select-keys app-state [:git/current-repo :config
                                                     :auth/id-token :auth/access-token :auth/refresh-token
                                                     :auth/oauth-token-url :auth/oauth-domain :auth/oauth-client-id
                                                     :user/info])
                       (seq config/OAUTH-DOMAIN)
                       (assoc :auth/oauth-domain config/OAUTH-DOMAIN)

                       (seq config/COGNITO-CLIENT-ID)
                       (assoc :auth/oauth-client-id config/COGNITO-CLIENT-ID))))
              (dedupe)))
        <init-sync-done? (p/deferred)
        task (m/reduce
              (constantly nil)
              (m/ap
                (let [m (m/?> (m/relieve state-flow))]
                  (when (:git/current-repo m)
                    (c.m/<? (state/<invoke-db-worker :thread-api/sync-app-state m)))
                  (p/resolve! <init-sync-done?))))]
    (c.m/run-task* task)
    <init-sync-done?))

(defmethod events/handle :rtc/sync-app-state [[_]]
  (sync-app-state!))
