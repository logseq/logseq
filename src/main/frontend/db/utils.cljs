(ns frontend.db.utils
  "Some utils are required by other namespace in frontend.db package."
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [frontend.db.conn :as conn]
            [logseq.db.frontend.content :as db-content]))

;; transit serialization

(defn seq-flatten [col]
  (flatten (seq col)))

(defn group-by-page
  [blocks]
  (if (:block/page (first blocks))
    (some->> blocks
             (group-by :block/page))
    blocks))

(defn entity
  "This function will return nil if passed `eid` is an integer and
  the entity doesn't exist in db.
  `repo-or-db`: a repo string or a db,
  `eid`: same as d/entity."
  ([eid]
   (entity (state/get-current-repo) eid))
  ([repo-or-db eid]
   (when eid
     (assert (or (number? eid)
                 (sequential? eid)
                 (keyword? eid)
                 (uuid? eid))
             (do
               (js/console.trace)
               (str "Invalid entity eid: " (pr-str eid))))
     (let [eid (if (uuid? eid) [:block/uuid eid] eid)]
       (when-let [db (if (string? repo-or-db)
                     ;; repo
                      (let [repo (or repo-or-db (state/get-current-repo))]
                        (conn/get-db repo))
                     ;; db
                      repo-or-db)]
        (d/entity db eid))))))

(defn update-block-content
  "Replace `[[internal-id]]` with `[[page name]]`"
  [item eid]
  (if-let [db (conn/get-db)]
    (db-content/update-block-content db item eid)
    item))

(defn pull
  ([eid]
   (pull (state/get-current-repo) '[*] eid))
  ([selector eid]
   (pull (state/get-current-repo) selector eid))
  ([repo selector eid]
   (when-let [db (conn/get-db repo)]
     (let [result (d/pull db selector eid)]
       (update-block-content result eid)))))

(defn pull-many
  ([eids]
   (pull-many '[*] eids))
  ([selector eids]
   (pull-many (state/get-current-repo) selector eids))
  ([repo selector eids]
   (when-let [db (conn/get-db repo)]
     (let [selector (if (some #{:db/id} selector) selector (conj selector :db/id))]
       (->> (d/pull-many db selector eids)
            (map #(update-block-content % (:db/id %))))))))

(defn q
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (apply d/q query (conn/get-db repo) inputs)))
