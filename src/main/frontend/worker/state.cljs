(ns frontend.worker.state
  "State hub for worker"
  (:require [frontend.worker.platform :as platform]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(defonce *main-thread (atom nil))
(defonce *deleted-block-uuid->db-id (atom {}))

(defn <invoke-main-thread
  [qkw & args]
  (if-let [main-thread @*main-thread]
    (apply main-thread qkw args)
    (p/rejected (ex-info "main thread is not available in db-worker"
                         {:method qkw}))))

(defonce *state (atom {:db/latest-transact-time {}
                       :worker/context {}

                       ;; FIXME: this name :config is too general
                       :config {}
                       :git/current-repo nil

                       :auth/id-token nil
                       :auth/access-token nil
                       :auth/refresh-token nil
                       :auth/oauth-token-url nil
                       :auth/oauth-domain nil
                       :auth/oauth-client-id nil

                       :user/info nil
                       ;; thread atoms, these atoms' value are syncing from ui-thread
                       :thread-atom/online-event (atom nil)
                       :thread-atom/search-input-idle-status (atom {})}))

(def ^:private db-sync-config-auth-keys
  #{:auth-token :oauth-token-url :oauth-domain :oauth-client-id})

(defn non-auth-db-sync-config
  [config]
  (apply dissoc (or config {}) db-sync-config-auth-keys))

(defonce *db-sync-config (atom {:ws-url nil}))
(defonce *db-sync-client (atom nil))

(defonce *sqlite (atom nil))
;; repo -> {:db conn :search conn :client-ops conn}
(defonce *sqlite-conns (atom {}))
;; repo -> conn
(defonce *datascript-conns (atom nil))

;; repo -> conn
(defonce *client-ops-conns (atom nil))

;; repo -> pool
(defonce *opfs-pools (atom nil))

;;; ================================================================
(defn get-sqlite-conn
  ([repo] (get-sqlite-conn repo :db))
  ([repo which-db]
   (assert (contains? #{:db :search :client-ops} which-db) which-db)
   (get-in @*sqlite-conns [repo which-db])))

(defn get-datascript-conn
  [repo]
  (get @*datascript-conns repo))

(defn get-client-ops-conn
  [repo]
  (get @*client-ops-conns repo))

(defn get-opfs-pool
  [repo]
  (get @*opfs-pools repo))

(defn set-db-latest-tx-time!
  [repo]
  (swap! *state assoc-in [:db/latest-transact-time repo] (common-util/time-ms)))

(defn get-context
  []
  (:worker/context @*state))

(defn set-context!
  [context]
  (swap! *state assoc :worker/context context))

(defn update-context!
  [context]
  (swap! *state update :worker/context
         (fn [c]
           (merge c context))))

(defn get-current-repo
  []
  (:git/current-repo @*state))

(defn set-new-state!
  [new-state]
  (swap! *state (fn [old-state]
                  (merge old-state new-state))))

(defn get-id-token
  []
  (:auth/id-token @*state))

(defn- node-runtime?
  []
  (try
    (= :node (get-in (platform/current) [:env :runtime]))
    (catch :default _
      false)))

(defn- node-online?
  []
  (try
    (let [online? (some-> js/globalThis .-navigator .-onLine)]
      (if (boolean? online?)
        online?
        true))
    (catch :default _
      true)))

(defn online?
  []
  (if (node-runtime?)
    (node-online?)
    @(:thread-atom/online-event @*state)))

(comment
  (defn mobile?
    []
    (:mobile? (get-context))))

;;; ========================== mobile log ======================================
(defonce *log (atom []))
(defn log-append!
  [record]
  (swap! *log conj record)
  (when (> (count @*log) 1000)
    (reset! *log (subvec @*log 800))))
