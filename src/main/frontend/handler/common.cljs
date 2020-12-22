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
            [cljs.reader :as reader]
            [frontend.spec :as spec]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [frontend.config :as config]))

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

(defn request-app-tokens!
  [ok-handler error-handler]
  (let [repos (state/get-repos)
        installation-ids (->> (map :installation_id repos)
                           (remove nil?)
                           (distinct))]
    (when (or (seq repos)
            (seq installation-ids))
      (util/post (str config/api "refresh_github_token")
        {:installation-ids installation-ids
         :repos repos}
        (fn [result]
          (state/set-github-installation-tokens! result)
          (when ok-handler (ok-handler)))
        (fn [error]
          (log/error :token/http-request-failed error)
          (js/console.dir error)
          (when error-handler (error-handler)))))))

(defn- get-github-token*
  [repo]
  (spec/validate :repos/url repo)
  (when repo
    (let [{:keys [token expires_at] :as token-state}
          (state/get-github-token repo)]
      (spec/validate :repos/repo token-state)
      (if (and (map? token-state)
            (string? expires_at))
        (let [expires-at (tf/parse (tf/formatters :date-time-no-ms) expires_at)
              now (t/now)
              expired? (t/after? now expires-at)]
          {:exist? true
           :expired? expired?
           :token token})
        {:exist? false}))))

(defn get-github-token
  ([]
   (get-github-token  (state/get-current-repo)))
  ([repo]
   (when-not (config/local-db? repo)
     (js/Promise.
       (fn [resolve reject]
         (let [{:keys [expired? token exist?]} (get-github-token* repo)
               valid-token? (and exist? (not expired?))]
           (if valid-token?
             (resolve token)
             (request-app-tokens!
               (fn []
                 (let [{:keys [expired? token exist?] :as token-m} (get-github-token* repo)
                       valid-token? (and exist? (not expired?))]
                   (if valid-token?
                     (resolve token)
                     (do (log/error :token/failed-get-token token-m)
                         (reject)))))
               nil))))))))
