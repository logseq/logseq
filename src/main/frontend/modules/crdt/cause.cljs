(ns frontend.modules.crdt.cause
  (:require
   ;; [causal.core :as cause]
   ;;          [causal.collections.shared :as s]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.modules.crdt.outliner :as outliner]))

;; ;;; cb: abbr casual base

;; ;; TODO: cbs persistence (indexeddb/sqlite)
;; ;; graph url -> cause base atom (cause/base)
;; (def cbs (atom {}))

;; ;; cause base for each graph
;; ;; {block-uuid {:block/uuid :block/name :block/parent :block/left :block/content}}

;; (defn get-root-uuid
;;   [cb]
;;   (cause/get-uuid (cause/get-collection cb)))

;; (defn get-cb
;;   [graph]
;;   (get @cbs graph))

;; (defn transact!
;;   [graph tx]
;;   (swap! (get-cb graph) cause/transact tx))

;; (defn ->edn
;;   [graph]
;;   (cause/causal->edn @(get-cb graph)))

;; (defn- transact-blocks!
;;   [graph blocks]
;;   (let [cb (get @cbs graph)]
;;     (doseq [block blocks]
;;       (let [value (if (:db/deleted? block) cause/hide block)]
;;         ;; TODO: is uuid enough to ensure uniqueness across all clients for any graphs?
;;         (swap! cb assoc (:block/uuid blocks) value)))))

;; (defn save-db-changes-to-cb!
;;   "Save datascript changes to the `graph`'s causal base."
;;   [graph {:keys [pages blocks _tx-report]}]
;;   (transact-blocks! graph (concat pages blocks)))

;; (defn apply-remote-tx-to-cb!
;;   "Apply remote transactions to local causal base and update db."
;;   [graph tx]
;;   ;; TODO: make sure `graph` is active to avoid unneeded computation
;;   ;; TODO: do we need to catch up with server's cb state? If so, maybe we can calculate the delta
;;   ;; between local cb and the remote cb?
;;   (when (= graph (state/get-current-repo))
;;     (transact! graph tx)
;;     ;; TODO: update db
;;     (let [tx' (outliner/resolve-conflicts graph tx)]
;;       (db/transact! graph tx'))))

(comment
  (swap! cbs conj "test-graph" (cause/base)))
