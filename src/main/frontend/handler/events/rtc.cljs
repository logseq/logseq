(ns frontend.handler.events.rtc
  "RTC events"
  (:require-macros [frontend.handler.events.macros :refer [defevent!]])
  (:require [frontend.common.crypt :as crypt]
            [frontend.components.e2ee :as e2ee]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.flows :as flows]
            [frontend.handler.events :as events]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.common.util :as common-util]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- rtc-collaborators-dialog?
  []
  (= :rtc-collaborators (state/get-dialog-id)))

(defn- close-e2ee-blocking-ui!
  []
  (when-not (rtc-collaborators-dialog?)
    (shui/dialog-close-all!))
  (shui/popup-hide! :download-rtc-graph))

(defevent! :rtc/decrypt-user-e2ee-private-key [[_ encrypted-private-key]]
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

(defevent! :rtc/request-e2ee-password [[_ {:keys [reason]}]]
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

(defevent! :rtc/storage-exceed-limit [[_]]
  (notification/show! (t :sync/storage-exceed-limit) :warning false))

(defevent! :rtc/graph-count-exceed-limit [[_]]
  (notification/show! (t :sync/graph-count-exceed-limit) :warning false))

(defonce ^:private *sync-app-state-cancel! (atom nil))

(defn- sync-app-state!
  []
  (when-let [cancel! @*sync-app-state-cancel!]
    (cancel!))
  (let [state-atoms {:git/current-repo flows/current-repo
                     :config (flows/sub-atom [:config])
                     :auth/id-token (flows/sub-atom [:auth/id-token])
                     :auth/access-token (flows/sub-atom [:auth/access-token])
                     :auth/refresh-token (flows/sub-atom [:auth/refresh-token])
                     :auth/oauth-token-url (flows/sub-atom [:auth/oauth-token-url])
                     :auth/oauth-domain (flows/sub-atom [:auth/oauth-domain])
                     :auth/oauth-client-id (flows/sub-atom [:auth/oauth-client-id])
                     :user/info (flows/sub-atom [:user/info])}
        <init-sync-done? (p/deferred)
        last-state (atom ::not-set)
        app-state (fn []
                    (cond-> (common-util/remove-nils-non-nested
                             (update-vals state-atoms deref))
                      (seq config/OAUTH-DOMAIN)
                      (assoc :auth/oauth-domain config/OAUTH-DOMAIN)

                      (seq config/COGNITO-CLIENT-ID)
                      (assoc :auth/oauth-client-id config/COGNITO-CLIENT-ID)))
        sync! (fn []
                (let [m (app-state)]
                  (when-not (= @last-state m)
                    (reset! last-state m)
                    (p/let [_ (when (:git/current-repo m)
                                (state/<invoke-db-worker :thread-api/sync-app-state m))]
                      (p/resolve! <init-sync-done?)))))]
    (doseq [[k atom'] state-atoms]
      (add-watch atom' [::sync-app-state k] (fn [_ _ _ _] (sync!))))
    (sync!)
    (reset! *sync-app-state-cancel!
            (fn []
              (doseq [[k atom'] state-atoms]
                (remove-watch atom' [::sync-app-state k]))))
    <init-sync-done?))

(defevent! :rtc/sync-app-state [[_]]
  (sync-app-state!))
