(ns frontend.handler.common
  (:require [goog.object :as gobj]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.text :as text]
            [frontend.git :as git]
            [frontend.db :as db]
            [lambdaisland.glogi :as log]
            [cljs.reader :as reader]))

(defn get-ref
  [repo-url]
  (git/resolve-ref repo-url "HEAD"))

(defn get-remote-ref
  [repo-url]
  (let [branch (state/get-default-branch repo-url)]
    ;; TODO: what if the remote is not named "origin", check the api from isomorphic-git
    (git/resolve-ref repo-url (str "refs/remotes/origin/" branch))))

(defn check-changed-files-status
  ([]
   (check-changed-files-status (state/get-current-repo)))
  ([repo]
   (when (and
          repo
          (db/cloned? repo)
          (gobj/get js/window "workerThread")
          (gobj/get js/window.workerThread "getChangedFiles"))
     (->
      (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir repo))
              files (bean/->clj files)]
        (->
         (p/let [remote-latest-commit (get-remote-ref repo)
                 local-latest-commit (get-ref repo)]
           (p/let [descendent? (git/descendent? repo local-latest-commit remote-latest-commit)
                   diffs (git/get-diffs repo local-latest-commit remote-latest-commit)]
             (let [files (if descendent?
                           (->> (concat (map :path diffs) files)
                                distinct)
                           files)]
               (state/set-changed-files! repo files))))
         (p/catch (fn [error]
                    (log/warn :git/ref-not-found {:error error})))))
      (p/catch (fn [error]
                 (js/console.dir error)))))))

(defn copy-to-clipboard-without-id-property!
  [content]
  (util/copy-to-clipboard! (text/remove-id-property content)))

(defn config-with-document-mode
  [config]
  (assoc config
         :document/mode? (state/sub [:document/mode?])))

(comment
  (let [repo (state/get-current-repo)]
    (p/let [remote-oid (get-remote-ref repo)
            local-oid (get-ref repo)
            diffs (git/get-diffs repo local-oid remote-oid)]
      (println {:local-oid local-oid
                :remote-oid remote-oid
                :diffs diffs})))
  )

(defn get-config
  [repo-url]
  (db/get-file repo-url (str config/app-name "/" config/config-file)))

(defn reset-config!
  [repo-url content]
  (when-let [content (or content (get-config repo-url))]
    (let [config (try
                   (reader/read-string content)
                   (catch js/Error e
                     (println "Parsing config file failed: ")
                     (js/console.dir e)
                     {}))]
      (state/set-config! repo-url config)
      config)))