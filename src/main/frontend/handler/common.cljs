(ns frontend.handler.common
  (:require [cljs-bean.core :as bean]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [dommy.core :as d]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.git :as git]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [goog.object :as gobj]
            ["ignore" :as Ignore]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

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
      (p/let [files (js/window.workerThread.getChangedFiles (config/get-repo-dir repo))
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
  [format content]
  (util/copy-to-clipboard! (property/remove-id-property format content)))

(defn config-with-document-mode
  [config]
  (assoc config
         :document/mode? (state/sub [:document/mode?])))

(defn ignore-files
  [pattern paths]
  (-> (Ignore)
      (.add pattern)
      (.filter (bean/->js paths))
      (bean/->clj)))

(defn- hidden?
  [path patterns]
  (let [path (if (and (string? path)
                      (= \/ (first path)))
               (subs path 1)
               path)]
    (some (fn [pattern]
            (let [pattern (if (and (string? pattern)
                                   (not= \/ (first pattern)))
                            (str "/" pattern)
                            pattern)]
              (string/starts-with? (str "/" path) pattern))) patterns)))

(defn remove-hidden-files
  [files config get-path-fn]
  (if-let [patterns (seq (:hidden config))]
    (remove (fn [file]
              (let [path (get-path-fn file)]
                (hidden? path patterns))) files)
    files))

(comment
  (let [repo (state/get-current-repo)]
    (p/let [remote-oid (get-remote-ref repo)
            local-oid (get-ref repo)
            diffs (git/get-diffs repo local-oid remote-oid)]
      (println {:local-oid local-oid
                :remote-oid remote-oid
                :diffs diffs}))))

(defn get-config
  [repo-url]
  (db/get-file repo-url (config/get-config-path)))

(defn safe-read-string
  [content error-message]
  (try
    (reader/read-string content)
    (catch js/Error e
      (println error-message)
      (js/console.dir e)
      {})))

(defn reset-config!
  [repo-url content]
  (when-let [content (or content (get-config repo-url))]
    (let [config (safe-read-string content "Parsing config file failed: ")]
      (state/set-config! repo-url config)
      config)))

(defn read-metadata!
  [repo-url content]
  (try
   (reader/read-string content)
   (catch js/Error e
     (println "Parsing metadata file failed: ")
     (js/console.dir e)
     {})))

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

(defn get-page-default-properties
  [page-name]
  {:title page-name
   ;; :date (date/get-date-time-string)
   })

(defn fix-pages-timestamps
  [pages]
  (map (fn [{:block/keys [name created-at updated-at journal-day] :as p}]
         (cond->
           p

           (nil? created-at)
           (assoc :block/created-at
                  (if journal-day
                    (date/journal-day->ts journal-day)
                    (util/time-ms)))

           (nil? updated-at)
           (assoc :block/updated-at
                  ;; Not exact true
                  (if journal-day
                    (date/journal-day->ts journal-day)
                    (util/time-ms)))))
    pages))

(defn show-custom-context-menu! [e context-menu-content]
  (util/stop e)
  (let [client-x (gobj/get e "clientX")
        client-y (gobj/get e "clientY")
        scroll-y (util/cur-doc-top)]
    (state/show-custom-context-menu! context-menu-content)
    (when-let [context-menu (d/by-id "custom-context-menu")]
      (d/set-style! context-menu
                    :left (str client-x "px")
                    :top (str (+ scroll-y client-y) "px")))))
