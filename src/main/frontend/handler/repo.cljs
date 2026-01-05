(ns frontend.handler.repo
  "System-component-like ns that manages user's repos/graphs"
  (:refer-clojure :exclude [clone])
  (:require [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.persist :as db-persist]
            [frontend.db.restore :as db-restore]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo-config :as repo-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.undo-redo :as undo-redo]
            [frontend.util :as util]
            [frontend.util.text :as text-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

;; Project settings should be checked in two situations:
;; 1. User changes the config.edn directly in logseq.com (fn: alter-file)
;; 2. Git pulls the new change (fn: load-files)

(defn remove-repo!
  [{:keys [url] :as repo} & {:keys [switch-graph?]
                             :or {switch-graph? true}}]
  (let [current-repo (state/get-current-repo)]
    (p/do!
     (db/remove-conn! url)
     (db-persist/delete-graph! url)
     (search/remove-db! url)
     (state/delete-repo! repo)
     (when switch-graph?
       (if (= current-repo url)
         (do
           (state/set-current-repo! nil)
           (when-let [graph (:url (first (state/get-repos)))]
             (notification/show! (str "Removed graph "
                                      (pr-str (text-util/get-graph-name-from-path url))
                                      ". Redirecting to graph "
                                      (pr-str (text-util/get-graph-name-from-path graph)))
                                 :success)
             (state/pub-event! [:graph/switch graph {:persist? false}])))
         (notification/show! (str "Removed graph " (pr-str (text-util/get-graph-name-from-path url))) :success))))))

(defn start-repo-db-if-not-exists!
  [repo & {:as opts}]
  (state/set-current-repo! repo)
  (db/start-db-conn! repo (assoc opts
                                 :db-graph? true
                                 :listen-handler (fn [conn]
                                                   (undo-redo/listen-db-changes! repo conn)))))

(defn restore-and-setup-repo!
  "Restore the db of a graph from the persisted data, and setup. Create a new
  conn, or replace the conn in state with a new one."
  [repo & {:as opts}]
  (p/do!
   (state/set-db-restoring! true)
   (db-restore/restore-graph! repo opts)
   (repo-config-handler/restore-repo-config! repo)
   (when (config/global-config-enabled?)
     (global-config-handler/restore-global-config!))
    ;; Don't have to unlisten the old listener, as it will be destroyed with the conn
   (when-not (true? (:ignore-style? opts))
     (ui-handler/add-style-if-exists!))
   (when-not config/publishing?
     (state/set-db-restoring! false))))

(defn get-repos
  []
  (p/let [dbs (db-persist/get-all-graphs)]
    (map (fn [db]
           (let [graph-name (:name db)]
             {:url graph-name
              :metadata (:metadata db)
              :root (config/get-local-dir graph-name)
              :nfs? true}))
         dbs)))

(defn combine-local-&-remote-graphs
  [local-repos remote-repos]
  (when-let [repos' (seq (concat (map (fn [{:keys [sync-meta metadata] :as repo}]
                                        (let [graph-id (some-> (or (:kv/value metadata)
                                                                   (second sync-meta)) str)]
                                          (if graph-id (assoc repo :GraphUUID graph-id) repo)))
                                      local-repos)
                                 (some->> remote-repos
                                          (map #(assoc % :remote? true)))))]
    (let [app-major-schema-version (str (:major (db-schema/parse-schema-version db-schema/version)))
          repos' (group-by :url repos')
          repos'' (mapcat (fn [[k vs]]
                            (if (some? k)
                              (let [remote-repos (filter :remote? vs)
                                    version-matched-remote-repo
                                    (first
                                     (filter
                                      #(= app-major-schema-version (:GraphSchemaVersion %))
                                      remote-repos))]
                                [(merge (first vs) (second vs) version-matched-remote-repo)])
                              vs))
                          repos')]
      (sort-by (fn [repo]
                 (let [graph-name (or (:GraphName repo)
                                      (last (string/split (:root repo) #"/")))]
                   [(:remote? repo) (string/lower-case graph-name)])) repos''))))

(defn refresh-repos!
  []
  (p/let [repos (get-repos)
          repos' (combine-local-&-remote-graphs
                  repos
                  (state/get-rtc-graphs))]
    (state/set-repos! repos')
    repos'))

(defn graph-ready!
  ;; FIXME: Call electron that the graph is loaded, an ugly implementation for redirect to page when graph is restored
  [graph]
  (when (util/electron?)
    (ipc/ipc "graphReady" graph)))

(defn graph-already-exists?
  "Checks to see if given db graph name already exists"
  [graph-name]
  (let [full-graph-name (string/lower-case (str config/db-version-prefix graph-name))]
    (some #(= (some-> (:url %) string/lower-case) full-graph-name) (state/get-repos))))

(defn- create-db [full-graph-name {:keys [file-graph-import?]}]
  (->
   (p/let [config (common-config/create-config-for-db-graph config/config-default-content)
           _ (persist-db/<new full-graph-name
                              (cond-> {:config config
                                       :graph-git-sha config/revision}
                                file-graph-import? (assoc :import-type :file-graph)))
           _ (start-repo-db-if-not-exists! full-graph-name)
           _ (state/add-repo! {:url full-graph-name :root (config/get-local-dir full-graph-name)})
           _ (restore-and-setup-repo! full-graph-name {:file-graph-import? file-graph-import?})
           _ (when-not file-graph-import? (route-handler/redirect-to-home!))
           _ (repo-config-handler/set-repo-config-state! full-graph-name config/config-default-content)
          ;; TODO: handle global graph
           _ (state/pub-event! [:init/commands])
           _ (when-not file-graph-import? (state/pub-event! [:page/create (date/today) {:redirect? false}]))]
     (state/pub-event! [:shortcut/refresh])
     (route-handler/redirect-to-home!)
     (ui-handler/re-render-root!)
     (graph-handler/settle-metadata-to-local! {:created-at (js/Date.now)})
     (prn "New db created: " full-graph-name)
     full-graph-name)
   (p/catch (fn [error]
              (notification/show! "Create graph failed." :error)
              (js/console.error error)))))

(defn new-db!
  "Handler for creating a new database graph"
  ([graph] (new-db! graph {}))
  ([graph opts]
   (let [full-graph-name (str config/db-version-prefix graph)]
     (if (graph-already-exists? graph)
       (state/pub-event! [:notification/show
                          {:content (str "The graph '" graph "' already exists. Please try again with another name.")
                           :status :error}])
       (create-db full-graph-name opts)))))

(defn gc-graph!
  [graph]
  (p/do!
   (state/<invoke-db-worker :thread-api/gc-graph graph)
   (state/pub-event! [:notification/show
                      {:content "Graph gc successfully!"
                       :status :success}])))
