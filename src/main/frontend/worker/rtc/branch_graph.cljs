(ns frontend.worker.rtc.branch-graph
  "Fns to migrate rtc graphs when client-graph-schema and server-graph-schema not matching
  * when to upload/download to/from remote graph?
    suppose we have client-schema=X and server-schema=Y.
    there're several different schema-version graphs on server at the same time.
    - if X = Y, nothing need to do with migration
    - if X > Y, client-graph is newer than server-graph, we need to upload this client-graph
    - if X < Y, client-app need to upgrade, otherwise, this client will keep rtc with server-graph-X
    - if X < Y, and client-app upgraded, now it should download the server-graph-Y"
  (:require [logseq.db.frontend.schema :as db-schema]))

(defn compare-schemas
  "Return one of [:create-branch :download nil].
  when nil, nothing need to do"
  [server-graph-schema app-schema client-graph-schema]
  (let [[server-graph-schema app-schema client-graph-schema]
        (map db-schema/major-version [server-graph-schema app-schema client-graph-schema])]
    (cond
      (= server-graph-schema client-graph-schema)
      nil

      (> server-graph-schema client-graph-schema)
      (cond
        ;; client will do some migrations on local-graph,
        ;; so do nothing for now
        (< server-graph-schema app-schema) nil
        ;; client-app-schema < server-graph-schema,
        ;; so app need to be upgraded, do nothing for now
        (> server-graph-schema app-schema) nil
        (= server-graph-schema app-schema) :download)

      (< server-graph-schema client-graph-schema)
      (cond
        ;; this remote-graph branch is creating now,
        ;; disallow upload a new schema-version graph for now
        (>= server-graph-schema app-schema) nil
        (< server-graph-schema app-schema) :create-branch))))
