(ns frontend.db.persist
  "Handles operations to persisting db to disk or indexedDB"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.persist-db :as persist-db]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [promesa.core :as p]))

(defn local-file-based-graph?
  [s]
  (and (string? s)
       (string/starts-with? s common-config/file-version-prefix)))

(defn- upload-temp-graph?
  [graph-name]
  (let [graph-name (some-> graph-name str string/lower-case)]
    (or (= "upload-temp" graph-name)
        (= (str (string/lower-case config/db-version-prefix) "upload-temp") graph-name))))

(defn get-all-graphs
  []
  (p/let [repos (persist-db/<list-db)
          repos' (->> repos
                      (remove (fn [{:keys [name]}]
                                (or (local-file-based-graph? name)
                                    (upload-temp-graph? name))))
                      (map
                       (fn [{:keys [name] :as repo}]
                         (assoc repo :name
                                (str config/db-version-prefix name)))))
          electron-disk-graphs (when (util/electron?) (ipc/ipc "getGraphs"))]
    (distinct
     (concat
      repos'
      (map (fn [repo-name] {:name repo-name})
           (remove upload-temp-graph?
                   (some-> electron-disk-graphs bean/->clj)))))))

(defn delete-graph!
  [graph]
  (p/let [_ (persist-db/<unsafe-delete graph)]
    (when (util/electron?)
      (ipc/ipc "deleteGraph" graph))))
