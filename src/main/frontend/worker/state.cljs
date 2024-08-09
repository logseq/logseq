(ns frontend.worker.state
  "State hub for worker"
  (:require [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [frontend.common.schema-register :include-macros true :as sr]))

(sr/defkeyword :undo/repo->page-block-uuid->undo-ops
  "{repo {<page-block-uuid> [op1 op2 ...]}}")

(sr/defkeyword :undo/repo->page-block-uuid->redo-ops
  "{repo {<page-block-uuid> [op1 op2 ...]}}")

(defonce *state (atom {:worker/object nil

                       :db/latest-transact-time {}
                       :worker/context {}

                       ;; FIXME: this name :config is too general
                       :config {}
                       :git/current-repo nil

                       :rtc/downloading-graph? false

                       :undo/repo->page-block-uuid->undo-ops (atom {})
                       :undo/repo->page-block-uuid->redo-ops (atom {})

                       ;; new implementation
                       :undo/repo->ops (atom {})
                       :redo/repo->ops (atom {})
                       }))

(defonce *rtc-ws-url (atom nil))

(defonce *sqlite (atom nil))
;; repo -> {:db conn :search conn :client-ops conn}
(defonce *sqlite-conns (atom nil))
;; repo -> conn
(defonce *datascript-conns (atom nil))

;; repo -> conn
(defonce *client-ops-conns (atom nil))

;; repo -> pool
(defonce *opfs-pools (atom nil))

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

(defn tx-idle?
  [repo & {:keys [diff]
           :or {diff 1000}}]
  (when repo
    (let [last-input-time (get-in @*state [:db/latest-transact-time repo])]
      (or
       (nil? last-input-time)

       (let [now (common-util/time-ms)]
         (>= (- now last-input-time) diff))))))

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

(defn get-config
  [repo]
  (get-in @*state [:config repo]))

(defn get-current-repo
  []
  (:git/current-repo @*state))

(defn set-new-state!
  [new-state]
  (swap! *state (fn [old-state]
                  (merge old-state new-state))))

(defn set-worker-object!
  [worker]
  (swap! *state assoc :worker/object worker))

(defn get-worker-object
  []
  (:worker/object @*state))

(defn get-date-formatter
  [repo]
  (common-config/get-date-formatter (get-config repo)))

(defn set-rtc-downloading-graph!
  [value]
  (swap! *state assoc :rtc/downloading-graph? value))

(defn rtc-downloading-graph?
  []
  (:rtc/downloading-graph? @*state))
