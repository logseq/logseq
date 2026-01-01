(ns logseq.tasks.file-sync
  "Run integration tests on file-sync service. Instructions:

* Login to electron app and toggle file-sync on
* Set up file-sync-auth.json file per #'read-config
* Run `bb file-sync:integration-tests`
* Wait for test results. Each action takes 10-20s and prints results as it goes"
  (:require [clojure.string :as str]
            [cheshire.core :as json]
            [clojure.pprint :as pp]
            [babashka.fs :as fs]
            [babashka.curl :as curl]
            [clojure.data :as data]
            [clojure.test :as t :refer [deftest is]]
            [clj-commons.digest :as digest]
            [logseq.tasks.file-sync-actions :as file-sync-actions])
  (:import (java.net URLDecoder)))

;; Root directory for graph that is being tested
(defonce root-dir (atom nil))

;; Graph id for given graph
(defonce root-graph-id (atom nil))

(defn- read-config*
  []
  (-> "file-sync-auth.json" slurp json/parse-string))

(def read-config
  "file-sync-auth.json file is populated by user right clicking on
  logseq.com/auth_callback request in Network tab, choosing Copy > 'Copy
  response' and saving"
  ;; Only want to read this once
  (memoize read-config*))

(defn- post
  [url headers]
  (println "-> POST" url)
  (let [resp (curl/post url (merge headers {:throw false}))]
    (if (not= 200 (:status resp))
      (throw (ex-info (str "Response failed with: " (select-keys resp [:status :body])) (select-keys resp [:status :body])))
      resp)))

(defn- build-headers
  []
  (let [{:strs [id_token]} (read-config)]
    {"authorization" (str "Bearer " id_token)}))

(defn- api-get-all-files
  [graph-id subdir]
  (let [body (json/generate-string {"GraphUUID" graph-id
                                    "Dir" subdir})
        resp (post "https://api-dev.logseq.com/file-sync/get_all_files"
                   {:headers (build-headers)
                    :body body})
        body (json/parse-string (:body resp) keyword)]
    (->> body
         :Objects
         (map (juxt (comp #(URLDecoder/decode %) fs/file-name :Key) :checksum)))))

(defn- get-local-all-files
  [dir subdir]
  (let [files (map fs/file (fs/list-dir (fs/file dir subdir)))
        f (juxt fs/file-name digest/md5)]
    (map f files)))


(defn- api-post-get-graphs
  []
  (let [resp (post "https://api-dev.logseq.com/file-sync/list_graphs"
                   {:headers (build-headers)})
        body (json/parse-string (:body resp) keyword)]
    (->> body
         :Graphs
         (map (juxt :GraphName :GraphUUID))
         (into {}))))

(defmulti run-action* :action)

(defmethod run-action* :create-file
  [{{:keys [file blocks dir]} :args}]
  (spit (fs/file dir file)
        (->> blocks
             (map #(str "- " %))
             (str/join "\n"))))

(defmethod run-action* :delete-file
  [{{:keys [file dir]} :args}]
  (fs/delete (fs/file dir file)))

(defmethod run-action* :move-file
  [{{:keys [file dir new-file]} :args}]
  (fs/move (fs/file dir file)
           (fs/file dir new-file)))

(defmethod run-action* :update-file
  [{{:keys [file blocks dir]} :args}]
  (let [origin-content (slurp (fs/file dir file))
        new-content (str (str/trim-newline origin-content) "\n"
                         (->> blocks
                              (map #(str "- " %))
                              (str/join "\n")))]
    (spit (fs/file dir file) new-content)))

(defn run-action [action-map]
  (println "===\nRUN")
  (pp/pprint ((juxt :action #(get-in % [:args :file])) action-map))
  (println "===")
  (run-action* action-map))

(defn- ensure-dir-is-synced!
  [dir graph-id subdir]
  (let [actual (set (get-local-all-files dir subdir))
        expected (set (api-get-all-files graph-id subdir))]
    (assert (= actual expected)
            (let [[local-only remote-only _] (data/diff actual expected)]
              (format "Files in '%s' are not synced yet:\nLocal only files: %s\nRemote only files: %s"
                      subdir
                      local-only
                      remote-only)))))

(defn- try-fn-n-times
  "Tries a fn for max-attempts times, returning true if fn returns true.
  Otherwise returns false. Sleeps for 2 seconds between attempts by default"
  [f max-attempts & {:keys [sleep-duration] :or {sleep-duration 2000}}]
  (loop [attempt 1]
    (println "Try" attempt)
    (let [ret (f)]
      (cond
        (true? ret)
        true
        (= attempt max-attempts)
        false
        :else
        (do
          (Thread/sleep sleep-duration)
          (recur (inc attempt)))))))

(defn- files-are-in-sync?
  [dir graph-id subdir]
  (try (ensure-dir-is-synced! dir graph-id subdir)
       true
       (catch Throwable e
         (println (.getMessage e))
         false)))

(defn- wait&files-are-in-sync?
  [dir graph-id subdir & [msg]]
  ;; Approximate polling time before file changes are picked up by client
  (if msg
    (println msg)
    (println "Wait 10s for logseq to pick up changes..."))
  (Thread/sleep 10000)
  (try-fn-n-times #(files-are-in-sync? dir graph-id subdir) 10))

(defn- clear-dir-pages
  [subdir]
  (fs/delete-tree (str @root-dir "/" subdir))
  (fs/create-dir (str @root-dir "/" subdir)))

(deftest rand-file-changes
  (let [subdir "pages"
        actions (:generated-action (file-sync-actions/generate-rand-actions 30))
        actions (mapv
                 #(assoc-in % [:args :dir] @root-dir)
                 actions)
        partitioned-actions (partition-all 3 actions)]
    (clear-dir-pages subdir)
    (wait&files-are-in-sync? @root-dir @root-graph-id subdir
                             (format "clear dir [%s], and ensure it's in sync" subdir))
    (doseq [actions partitioned-actions]
      (doseq [action actions]
        (run-action action)
        (Thread/sleep 1000))
      (is (wait&files-are-in-sync? @root-dir @root-graph-id subdir)
          (str "Test " (mapv (juxt :action #(get-in % [:args :file])) actions))))))

(defn setup-vars
  []
  (let [{:strs [dir]} (read-config)
        graph-names-to-ids (api-post-get-graphs)
        graph-id (get graph-names-to-ids (fs/file-name dir))]
    (assert dir "No graph id for given dir")
    (reset! root-dir dir)
    (reset! root-graph-id graph-id)))

(defn integration-tests
  "Run file-sync integration tests on graph directory
  requirements:

  * file-sync-auth.json, and it looks like:
  ```
  {\"id_token\":\"<id-token>\",
    \"dir\": \"/Users/me/Documents/untitled folder 31\"}
  ```

  * you also need to open logseq-app(or yarn electron-watch),
    and open <dir> and start file-sync"
  [& _args]
  (setup-vars)
  (t/run-tests 'logseq.tasks.file-sync))
