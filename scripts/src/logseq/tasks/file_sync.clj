(ns logseq.tasks.file-sync
  (:require [clojure.string :as str]
            [cheshire.core :as json]
            [babashka.fs :as fs]
            [babashka.curl :as curl]
            [clojure.data :as data]
            [clojure.test :as t :refer [deftest is]])
  (:import (java.net URLDecoder)))

(def root-dir
  "Root directory for graph that is being tested"
  (atom nil))

(defn- read-config
  "file-sync-config.json file is populated by user right clicking on a file-sync
  request in Network tab, choosing Copy > Copy as fetch and then saving second
  argument to fetch as json"
  []
  (-> "file-sync-config.json" slurp json/parse-string))

(defn- post
  [url headers]
  (println "-> POST" url)
  (let [resp (curl/post url (merge headers {:throw false}))]
    (if (not= 200 (:status resp))
      (throw (ex-info (str "Response failed with: " (select-keys resp [:status :body])) (select-keys resp [:status :body])))
      resp)))

(defn- api-get-all-files
  []
  (let [{:strs [headers body]} (read-config)
        resp (post "https://api.logseq.com/file-sync/get_all_files"
                   {:headers (select-keys headers ["authorization"])
                    ;; TODO: Add Dir: pages to body
                    :body body})
        body (json/parse-string (:body resp) keyword)]
    (->> body
         :Objects
         (map (comp #(URLDecoder/decode %) fs/file-name :Key)))))

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

(defn run-action [action-map]
  (println "Run" (pr-str action-map))
  (run-action* action-map))

(defn- ensure-pages-dir-is-synced!
  [dir]
  ;; TODO: Remove pages assumption
  (let [actual (set (map fs/file-name (fs/list-dir (fs/file dir "pages"))))
        expected (set (api-get-all-files))]
    (assert (= actual expected)
            (str "Pages are not synced yet: "
                 (butlast (data/diff actual expected))))))

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
  [dir]
  ;; Approximate polling time before file changes are picked up by client
  (println "Wait 10s for logseq to pick up changes...")
  (Thread/sleep 10000)
  (try-fn-n-times (fn []
                    (try (ensure-pages-dir-is-synced! dir)
                      true
                      (catch Throwable e
                        (println (.getMessage e))
                        false)))
                  10))

(deftest file-changes
  (let [actions (mapv
                 #(assoc-in % [:args :dir] @root-dir)
                 [{:action :create-file
                   :args {:file "pages/test.create-page.md"
                          :blocks ["hello world"]}}
                  {:action :move-file
                   :args {:file "pages/test.create-page.md"
                          :new-file "pages/test.create-page-new.md"}}
                  {:action :delete-file
                   :args {:file "pages/test.create-page-new.md"}}])]

    (doseq [action-map actions]
      (run-action action-map)
      (is (files-are-in-sync? @root-dir) (str "Test " (select-keys action-map [:action]))))))

(defn integration-tests
  "Run file-sync integration tests on graph directory"
  [dir & _args]
  (ensure-pages-dir-is-synced! dir)
  (reset! root-dir dir)
  (t/run-tests 'logseq.tasks.file-sync))
