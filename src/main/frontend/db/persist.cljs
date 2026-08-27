(ns frontend.db.persist
  "Handles operations to persisting db to disk or indexedDB"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.persist-db :as persist-db]
            [frontend.util :as util]
            [logseq.common.config :as common-config]
            [promesa.core :as p]))

(defn- local-file-based-graph?
  [s]
  (and (string? s)
       (string/starts-with? s (str common-config/db-version-prefix common-config/file-version-prefix))))

(defn- upload-temp-graph?
  [graph-name]
  (let [graph-name (some-> graph-name str string/lower-case)]
    (or (= "upload-temp" graph-name)
        (= (str (string/lower-case common-config/db-version-prefix) "upload-temp") graph-name))))

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
                                (common-config/canonicalize-db-version-repo name)))))
          electron-disk-graphs (when (util/electron?) (ipc/ipc "getGraphs"))]
    (distinct
     (concat
      repos'
      (->> (some-> electron-disk-graphs bean/->clj)
           (remove upload-temp-graph?)
           (map (fn [repo-name]
                  {:name (common-config/canonicalize-db-version-repo repo-name)})))))))

(defn delete-graph!
  [graph]
  (if (util/electron?)
    (p/do
      (persist-db/<close-db graph)
      (ipc/ipc "deleteGraph" graph))
    (persist-db/<unsafe-delete graph)))
