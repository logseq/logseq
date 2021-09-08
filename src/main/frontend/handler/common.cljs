(ns frontend.handler.common
  (:require [goog.object :as gobj]
            [cljs-bean.core :as bean]
            [frontend.db-schema :as db-schema]
            [frontend.format.mldoc :as mldoc]
            [frontend.util.marker :as marker]
            [frontend.util.clock :as clock]
            [frontend.encrypt :as e]
            [frontend.util.drawer :as drawer]
            [frontend.format.block :as block]
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



(defn with-marker-time
  [content block format new-marker old-marker]
  (if (and (state/enable-timetracking?) new-marker)
    (try
      (let [logbook-exists? (and (:block/body block) (drawer/get-logbook (:block/body block)))
            new-marker (string/trim (string/lower-case (name new-marker)))
            old-marker (when old-marker (string/trim (string/lower-case (name old-marker))))
            new-content (cond
                          (or (and (nil? old-marker) (or (= new-marker "doing")
                                                         (= new-marker "now")))
                              (and (= old-marker "todo") (= new-marker "doing"))
                              (and (= old-marker "later") (= new-marker "now"))
                              (and (= old-marker new-marker "now") (not logbook-exists?))
                              (and (= old-marker new-marker "doing") (not logbook-exists?)))
                          (clock/clock-in format content)

                          (or
                           (and (= old-marker "doing") (= new-marker "todo"))
                           (and (= old-marker "now") (= new-marker "later"))
                           (and (contains? #{"now" "doing"} old-marker)
                                (= new-marker "done")))
                          (clock/clock-out format content)

                          :else
                          content)]
        new-content)
      (catch js/Error _e
        content))
    content))


(defn- with-timetracking
  [block value]
  (if (and (state/enable-timetracking?)
           (not= (:block/content block) value))
    (let [new-marker (first (util/safe-re-find marker/bare-marker-pattern (or value "")))
          new-value (with-marker-time value block (:block/format block)
                      new-marker
                      (:block/marker block))]
      new-value)
    value))

(defn- attach-page-properties-if-exists!
  [block]
  (if (and (:block/pre-block? block)
           (seq (:block/properties block)))
    (let [page-properties (:block/properties block)
          str->page (fn [n] (block/page-name->map n true))
          refs (->> page-properties
                    (filter (fn [[_ v]] (coll? v)))
                    (vals)
                    (apply concat)
                    (set)
                    (map str->page)
                    (concat (:block/refs block))
                    (util/distinct-by :block/name))
          {:keys [tags alias]} page-properties
          page-tx (let [id (:db/id (:block/page block))
                        retract-attributes (when id
                                             (mapv (fn [attribute]
                                                     [:db/retract id attribute])
                                                   [:block/properties :block/tags :block/alias]))
                        tx (cond-> {:db/id id
                                    :block/properties page-properties}
                             (seq tags)
                             (assoc :block/tags (map str->page tags))
                             (seq alias)
                             (assoc :block/alias (map str->page alias)))]
                    (conj retract-attributes tx))]
      (assoc block
             :block/refs refs
             :db/other-tx page-tx))
    block))

(defn- remove-non-existed-refs!
  [refs]
  (remove (fn [x] (and (vector? x)
                       (= :block/uuid (first x))
                       (nil? (db/entity x)))) refs))

(defn wrap-parse-block
  [{:block/keys [content format parent left page uuid pre-block? level] :as block}]
  (let [block (or (and (:db/id block) (db/pull (:db/id block))) block)
        properties (:block/properties block)
        real-content (:block/content block)
        content (if (and (seq properties) real-content (not= real-content content))
                  (property/with-built-in-properties properties content format)
                  content)
        content (->> content
                     (drawer/remove-logbook)
                     (drawer/with-logbook block))
        content (with-timetracking block content)
        first-block? (= left page)
        ast (mldoc/->edn (string/trim content) (mldoc/default-config format))
        first-elem-type (first (ffirst ast))
        first-elem-meta (second (ffirst ast))
        properties? (contains? #{"Property_Drawer" "Properties"} first-elem-type)
        markdown-heading? (and (= format :markdown)
                               (= "Heading" first-elem-type)
                               (nil? (:size first-elem-meta)))
        block-with-title? (mldoc/block-with-title? first-elem-type)
        content (string/triml content)
        content (string/replace content (util/format "((%s))" (str uuid)) "")
        [content content'] (cond
                             (and first-block? properties?)
                             [content content]

                             markdown-heading?
                             [content content]

                             :else
                             (let [content' (str (config/get-block-pattern format) (if block-with-title? " " "\n") content)]
                               [content content']))
        block (assoc block
                     :block/content content'
                     :block/format format)
        block (apply dissoc block (remove #{:block/pre-block?} db-schema/retract-attributes))
        block (block/parse-block block)
        block (if (and first-block? (:block/pre-block? block))
                block
                (dissoc block :block/pre-block?))
        block (update block :block/refs remove-non-existed-refs!)
        block (attach-page-properties-if-exists! block)
        new-properties (merge
                        (select-keys properties (property/built-in-properties))
                        (:block/properties block))]
    (-> block
        (dissoc :block/top?
                :block/bottom?)
        (assoc :block/content content
               :block/properties new-properties)
        (merge (if level {:block/level level} {})))))
