(ns frontend.handler.repo
  (:refer-clojure :exclude [clone])
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [datascript.core :as d]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.git :as git]
            [frontend.github :as github]
            [cljs-bean.core :as bean]
            [frontend.date :as date]
            [frontend.config :as config]
            [frontend.format :as format]
            [frontend.format.protocol :as protocol]
            [goog.object :as gobj]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.migration :as migration-handler]
            [frontend.handler.project :as project-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.ui :as ui]
            [cljs-time.local :as tl]
            [cljs-time.core :as t]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.dicts :as dicts]
            ;; [clojure.set :as set]
            ))

;; Project settings should be checked in two situations:
;; 1. User changes the config.edn directly in logseq.com (fn: alter-file)
;; 2. Git pulls the new change (fn: load-files)

(defn load-repo-to-db!
  [repo-url diffs first-clone?]
  (let [load-contents (fn [files delete-files delete-blocks re-render?]
                        (file-handler/load-files-contents!
                         repo-url
                         files
                         (fn [contents]
                           (state/set-state! :repo/loading-files? false)
                           (state/set-state! :repo/importing-to-db? true)
                           (let [parsed-files (filter
                                               (fn [[file _]]
                                                 (let [format (format/get-format file)]
                                                   (contains? config/mldoc-support-formats format)))
                                               contents)
                                 blocks-pages (if (seq parsed-files)
                                                (db/extract-all-blocks-pages repo-url parsed-files)
                                                [])]
                             (db/reset-contents-and-blocks! repo-url contents blocks-pages delete-files delete-blocks)
                             (let [config-file (str config/app-name "/" config/config-file)]
                               (when (contains? (set files) config-file)
                                 (when-let [content (get contents config-file)]
                                   (file-handler/restore-config! repo-url content true))))
                             ;; (let [metadata-file (str config/app-name "/" config/metadata-file)]
                             ;;   (when (contains? (set files) metadata-file)
                             ;;     (when-let [content (get contents metadata-file)]
                             ;;       (let [{:keys [tx-data]} (reader/read-string content)]
                             ;;         (db/transact! repo-url tx-data)))))
                             (state/set-state! :repo/importing-to-db? false)
                             (when re-render?
                               (ui-handler/re-render-root!))))))]
    (if first-clone?
      (->
       (p/let [files (file-handler/load-files repo-url)]
         (load-contents files nil nil false))
       (p/catch (fn [error]
                  (println "loading files failed: ")
                  (js/console.dir error)
                  (state/set-state! :repo/loading-files? false))))
      (when (seq diffs)
        (let [filter-diffs (fn [type] (->> (filter (fn [f] (= type (:type f))) diffs)
                                           (map :path)))
              remove-files (filter-diffs "remove")
              modify-files (filter-diffs "modify")
              add-files (filter-diffs "add")
              delete-files (if (seq remove-files)
                             (db/delete-files remove-files))
              delete-blocks (db/delete-blocks repo-url (concat remove-files modify-files))
              delete-pages (if (seq remove-files)
                             (db/delete-pages-by-files remove-files)
                             [])
              add-or-modify-files (util/remove-nils (concat add-files modify-files))]
          (load-contents add-or-modify-files (concat delete-files delete-pages) delete-blocks true))))))

(defn show-install-error!
  [repo-url title]
  (notification/show!
   [:p.content
    title
    [:span.text-gray-700.mr-2
     (util/format
      "Please make sure that you've installed the logseq app for the repo %s on GitHub. "
      repo-url)
     (ui/button
      "Install Logseq on GitHub"
      :href (str "https://github.com/apps/" config/github-app-name "/installations/new"))]]
   :error
   false))

(defn show-diff-error!
  [_repo-url]
  (notification/show!
   [:p
    [:span.text-gray-700.font-bold.mr-2
     "Please resolve the diffs if any."]
    (ui/button
     "Go to diff"
     :href "/diff")]
   :error
   false))

(defn get-new-token
  [repo]
  (when-let [installation-id (-> (filter
                                  (fn [r]
                                    (= (:url r) repo))
                                  (:repos (state/get-me)))
                                 (first)
                                 :installation_id)]
    (util/post (str config/api "refresh_github_token")
               {:installation-ids [installation-id]}
               (fn [result]
                 (let [token (:token (first result))]
                   (state/set-github-token! repo token)))
               (fn [error]
                 (println "Something wrong!")
                 (js/console.dir error)))))

(defn request-app-tokens!
  [ok-handler error-handler]
  (let [repos (:repos (state/get-me))
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
                   (println "Something wrong!")
                   (js/console.dir error)
                   (when error-handler (error-handler)))))))

(defn journal-file-changed?
  [repo-url diffs]
  (contains? (set (map :path diffs))
             (db/get-current-journal-path)))

(defn create-config-file-if-not-exists
  [repo-url]
  (let [repo-dir (util/get-repo-dir repo-url)
        app-dir config/app-name
        dir (str repo-dir "/" app-dir)]
    (p/let [_ (-> (fs/mkdir dir)
                  (p/catch (fn [_e])))]
      (let [default-content config/config-default-content]
        (p/let [file-exists? (fs/create-if-not-exists repo-dir (str app-dir "/" config/config-file) default-content)]
          (let [path (str app-dir "/" config/config-file)
                old-content (when file-exists?
                              (db/get-file repo-url path))
                content (or
                         (and old-content
                              (string/replace old-content "heading" "block"))
                         default-content)]
            (db/reset-file! repo-url path content)
            (db/reset-config! repo-url content)
            (when-not (= content old-content)
              (git-handler/git-add repo-url path))))
        ;; (p/let [file-exists? (fs/create-if-not-exists repo-dir (str app-dir "/" config/metadata-file) default-content)]
        ;;   (let [path (str app-dir "/" config/metadata-file)]
        ;;     (when-not file-exists?
        ;;       (db/reset-file! repo-url path "{:tx-data []}")
        ;;       (git-handler/git-add repo-url path))))
        ))))

(defn create-contents-file
  [repo-url]
  (let [repo-dir (util/get-repo-dir repo-url)
        format (state/get-preferred-format)
        path (str "pages/contents." (if (= (name format) "markdown")
                                      "md"
                                      (name format)))
        file-path (str "/" path)
        default-content (util/default-content-with-title format "contents")]
    (p/let [_ (-> (fs/mkdir (str repo-dir "/pages"))
                  (p/catch (fn [_e])))
            file-exists? (fs/create-if-not-exists repo-dir file-path default-content)]
      (when-not file-exists?
        (db/reset-file! repo-url path default-content)
        (git-handler/git-add repo-url path)))))

(defn create-dummy-notes-page
  [repo-url content]
  (let [repo-dir (util/get-repo-dir repo-url)
        path (str config/default-pages-directory "/how_to_make_dummy_notes.md")
        file-path (str "/" path)]
    (p/let [_ (-> (fs/mkdir (str repo-dir "/" config/default-pages-directory))
                  (p/catch (fn [_e])))
            _file-exists? (fs/create-if-not-exists repo-dir file-path content)]
      (db/reset-file! repo-url path content))))

(defn create-today-journal-if-not-exists
  ([repo-url]
   (create-today-journal-if-not-exists repo-url nil))
  ([repo-url content]
   (let [repo-dir (util/get-repo-dir repo-url)
         format (state/get-preferred-format)
         title (date/today)
         file-name (date/journal-title->default title)
         default-content (util/default-content-with-title format title false)
         template (state/get-journal-template)
         template (if (and template
                           (not (string/blank? template)))
                    template)
         content (cond
                   content
                   content
                   template
                   (str default-content template)

                   :else
                   (util/default-content-with-title format title true))
         path (str config/default-journals-directory "/" file-name "."
                   (config/get-file-extension format))
         file-path (str "/" path)
         page-exists? (db/entity repo-url [:page/name (string/lower-case title)])]
     (when-not page-exists?
       (p/let [_ (-> (fs/mkdir (str repo-dir "/" config/default-journals-directory))
                     (p/catch (fn [_e])))
               file-exists? (fs/create-if-not-exists repo-dir file-path content)]
         ;; TODO: why file exists but page not created
         (p/let [resolved-content (if file-exists?
                                    (file-handler/load-file repo-url path)
                                    (p/resolved content))]
           (let [content (if (string/blank? (string/trim resolved-content))
                           content
                           resolved-content)]
             (db/reset-file! repo-url path content)
             (ui-handler/re-render-root!)
             (git-handler/git-add repo-url path))))))))

(defn create-default-files!
  [repo-url]
  (when-let [name (get-in @state/state [:me :name])]
    (create-config-file-if-not-exists repo-url)
    (create-today-journal-if-not-exists repo-url)
    (create-contents-file repo-url)))

(defn persist-repo!
  [repo]
  (when-let [files-conn (db/get-files-conn repo)]
    (db/persist repo @files-conn true))
  (when-let [db (db/get-conn repo)]
    (db/persist repo db false)))

(defn load-db-and-journals!
  [repo-url diffs first-clone?]
  (when (or diffs first-clone?)
    (p/let [_ (load-repo-to-db! repo-url diffs first-clone?)]
      (when first-clone?
        (create-default-files! repo-url))

      (when first-clone?
        (migration-handler/show!)))))

(defn transact-react-and-alter-file!
  [repo tx transact-option files]
  (let [files (remove nil? files)
        pages (->> (map db/get-file-page (map first files))
                   (remove nil?))]
    (db/transact-react!
     repo
     tx
     transact-option)
    (when (seq pages)
      (let [children-tx (mapcat #(db/rebuild-page-blocks-children repo %) pages)]
        (when (seq children-tx)
          (db/transact! repo children-tx)))))
  (when (seq files)
    (file-handler/alter-files repo files)))

(defn persist-repo-metadata!
  [repo]
  (let [files (db/get-files repo)]
    (when (seq files)
      (let [data (db/get-sync-metadata repo)
            data-str (pr-str data)]
        (file-handler/alter-file repo
                                 (str config/app-name "/" config/metadata-file)
                                 data-str
                                 {:reset? false})))))

(defn periodically-persist-app-metadata
  [repo-url]
  (js/setInterval #(persist-repo-metadata! repo-url)
                  (* 5 60 1000)))

(declare push)

(defn pull
  [repo-url token {:keys [fallback? force-pull?]
                   :or {fallback? false
                        force-pull? false}}]
  (when (and
         (db/get-conn repo-url true)
         (db/cloned? repo-url)
         token)
    (let [status (db/get-key-value repo-url :git/status)]
      (when (or
             force-pull?
             (and
              ;; (not= status :push-failed)
              (not= status :pushing)
              (empty? (state/get-changed-files repo-url))
              (not (state/get-edit-input-id))
              (not (state/in-draw-mode?))))
        (git-handler/set-git-status! repo-url :pulling)
        (let [latest-commit (db/get-key-value repo-url :git/latest-commit)]
          (->
           (p/let [result (git/fetch repo-url token)]
             (let [{:keys [fetchHead]} (bean/->clj result)]
               (when fetchHead
                 (git-handler/set-remote-latest-commit! repo-url fetchHead))
               (-> (git/merge repo-url)
                   (p/then (fn [result]
                             (-> (git/checkout repo-url)
                                 (p/then (fn [result]
                                           (git-handler/set-git-status! repo-url nil)
                                           (git-handler/set-git-last-pulled-at! repo-url)
                                           (when (and latest-commit fetchHead
                                                      (not= latest-commit fetchHead))
                                             (p/let [diffs (git/get-diffs repo-url latest-commit fetchHead)]
                                               (when (seq diffs)
                                                 (load-db-and-journals! repo-url diffs false)
                                                 (git-handler/set-latest-commit! repo-url fetchHead)
                                                 (when (seq (state/get-changed-files repo-url))
                                                   ;; FIXME: no need to create a new commit
                                                   (push repo-url {:diff-push? true})))))))
                                 (p/catch (fn [error]
                                            (git-handler/set-git-status! repo-url :checkout-failed)
                                            (git-handler/set-git-error! repo-url error))))))
                   (p/catch (fn [error]
                              (git-handler/set-git-status! repo-url :merge-failed)
                              (git-handler/set-git-error! repo-url error)
                              (notification/show!
                               [:p.content
                                "Failed to merge, please "
                                [:span.text-gray-700.font-bold
                                 "resolve any diffs first."]]
                               :error)
                              (route-handler/redirect! {:to :diff}))))))
           (p/catch (fn [error]
                      (println "Pull error:" (str error))
                      (js/console.error error)
                      ;; token might be expired, request new token

                      (cond
                        (and (or (string/includes? (str error) "401")
                                 (string/includes? (str error) "404"))
                             (not fallback?))
                        (request-app-tokens!
                         (fn []
                           (pull repo-url (state/get-github-token repo-url) {:fallback? true}))
                         nil)

                        (or (string/includes? (str error) "401")
                            (string/includes? (str error) "404"))
                        (show-install-error! repo-url (util/format "Failed to fetch %s." repo-url))

                        :else
                        nil)))))))))

(defn check-changed-files-status
  [f]
  (when (gobj/get js/window.workerThread "getChangedFiles")
    (->
     (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir (state/get-current-repo)))]
       (let [files (bean/->clj files)]
         (when (empty? files)
           ;; FIXME: getChangedFiles not return right result
           (state/reset-changed-files! files))))
     (p/catch (fn [error]
                (js/console.dir error))))))

(defn push
  [repo-url {:keys [commit-message fallback? diff-push?]
             :or {commit-message "Logseq auto save"
                  fallback? false
                  diff-push? false}}]
  (let [status (db/get-key-value repo-url :git/status)]
    (when (and
           (db/cloned? repo-url)
           (not= status :pulling)
           (not (state/get-edit-input-id)))
      (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir (state/get-current-repo)))]
        (when (or (seq files) fallback? diff-push?)
          ;; auto commit if there are any un-committed changes
          (let [commit-message (if (string/blank? commit-message)
                                 "Logseq auto save"
                                 commit-message)]
            (p/let [_ (git/commit repo-url commit-message)]
              (git-handler/set-latest-commit-if-exists! repo-url)
              (git-handler/set-git-status! repo-url :pushing)
              (when-let [token (state/get-github-token repo-url)]
                (util/p-handle
                 (git/push repo-url token)
                 (fn [result]
                   (git-handler/set-git-status! repo-url nil)
                   (git-handler/set-git-error! repo-url nil)
                   (state/clear-changed-files! repo-url))
                 (fn [error]
                   (js/console.error error)
                   (let [permission? (or (string/includes? (str error) "401")
                                         (string/includes? (str error) "404"))]
                     (cond
                       (and permission? (not fallback?))
                       (request-app-tokens!
                        (fn []
                          (push repo-url
                                {:commit-message commit-message
                                 :fallback? true}))
                        nil)

                       :else
                       (do
                         (git-handler/set-git-status! repo-url :push-failed)
                         (git-handler/set-git-error! repo-url error)
                         (if permission?
                           (show-install-error! repo-url (util/format "Failed to push to %s. " repo-url))
                           (pull repo-url token {:force-pull? true})))))))))))))))

(defn pull-current-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [token (state/get-github-token repo)]
      (pull repo token nil))))

(defn clone
  ([repo-url]
   (clone repo-url false))
  ([repo-url fallback?]
   (when-let [token (state/get-github-token repo-url)]
     (util/p-handle
      (do
        (state/set-cloning? true)
        (git/clone repo-url token))
      (fn [result]
        (state/set-git-clone-repo! "")
        (state/set-current-repo! repo-url)
        (db/start-db-conn! (:me @state/state) repo-url)
        (db/mark-repo-as-cloned repo-url)
        (git-handler/set-latest-commit-if-exists! repo-url)
        (git-handler/set-remote-latest-commit-if-exists! repo-url))
      (fn [e]
        (if (and (not fallback?)
                 (or (string/includes? (str e) "401")
                     (string/includes? (str e) "404")))
          (request-app-tokens!
           (fn []
             (clone repo-url true))
           nil)
          (do
            (println "Clone failed, error: ")
            (js/console.error e)
            (state/set-cloning? false)
            (git-handler/set-git-status! repo-url :clone-failed)
            (git-handler/set-git-error! repo-url e)

            (show-install-error! repo-url (util/format "Failed to clone %s." repo-url)))))))))

(defn set-config-content!
  [repo path new-config]
  (let [new-content (util/pp-str new-config)]
    (file-handler/alter-file repo path new-content {:reset? false
                                                    :re-render-root? false})))

(defn set-config!
  [k v]
  (when-let [repo (state/get-current-repo)]
    (let [path (str config/app-name "/" config/config-file)]
      (when-let [config (db/get-file-no-sub path)]
        (let [config (try
                       (reader/read-string config)
                       (catch js/Error e
                         (println "Parsing config file failed: ")
                         (js/console.dir e)
                         {}))
              ks (if (vector? k) k [k])
              new-config (assoc-in config ks v)]
          (state/set-config! repo new-config)
          (set-config-content! repo path new-config))))))

(defn remove-repo!
  [{:keys [id url] :as repo}]
  (util/delete (str config/api "repos/" id)
               (fn []
                 (db/remove-conn! url)
                 (db/remove-db! url)
                 (db/remove-files-db! url)
                 (fs/rmdir (util/get-repo-dir url))
                 (state/delete-repo! repo)
                 (state/clear-changed-files! repo))
               (fn [error]
                 (prn "Delete repo failed, error: " error))))

(defn setup-local-repo-if-not-exists!
  []
  (if js/window.pfs
    (let [repo config/local-repo]
      (p/let [result (-> (fs/mkdir (str "/" repo))
                         (p/catch (fn [_e] nil)))
              _ (state/set-current-repo! repo)
              _ (db/start-db-conn! nil repo)
              _ (when-not config/publishing?
                  (let [dummy-notes (get-in dicts/dicts [:en :tutorial/dummy-notes])]
                    (create-dummy-notes-page repo dummy-notes)))
              _ (when-not config/publishing?
                  (let [tutorial (get-in dicts/dicts [:en :tutorial/text])
                        tutorial (string/replace-first tutorial "$today" (date/today))]
                    (create-today-journal-if-not-exists repo tutorial)))
              _ (create-config-file-if-not-exists repo)
              _ (create-contents-file repo)]
        (state/set-db-restoring! false)))
    (js/setTimeout setup-local-repo-if-not-exists! 100)))

(defn periodically-pull
  [repo-url pull-now?]
  (when-let [token (state/get-github-token repo-url)]
    (when pull-now? (pull repo-url token nil))
    (js/setInterval #(pull repo-url token nil)
                    (* (config/git-pull-secs) 1000))))

(defn periodically-push-tasks
  [repo-url]
  (let [token (state/get-github-token repo-url)
        push (fn []
               (push repo-url nil))]
    (js/setInterval push
                    (* (config/git-push-secs) 1000))))

(defn periodically-pull-and-push
  [repo-url {:keys [pull-now?]
             :or {pull-now? true}}]
  (periodically-pull repo-url pull-now?)
  (when (and (not (false? (:git-auto-push (state/get-config repo-url))))
             ;; (not config/dev?)
             )
    (periodically-push-tasks repo-url)))

(defn create-repo!
  [repo-url branch]
  (util/post (str config/api "repos")
             {:url repo-url
              :branch branch}
             (fn [result]
               (if (:installation_id result)
                 (set! (.-href js/window.location) config/website)
                 (set! (.-href js/window.location) (str "https://github.com/apps/" config/github-app-name "/installations/new"))))
             (fn [error]
               (println "Something wrong!")
               (js/console.dir error))))

(defn clone-and-pull
  [repo-url]
  (->
   (p/let [_ (clone repo-url)
           _ (git-handler/git-set-username-email! repo-url (:me @state/state))]
     (load-db-and-journals! repo-url nil true)
     (periodically-pull-and-push repo-url {:pull-now? false})
     ;; (periodically-persist-app-metadata repo-url)
     )
   (p/catch (fn [error]
              (js/console.error error)))))

(defn clone-and-pull-repos
  [me]
  (if (and js/window.git js/window.pfs)
    (doseq [{:keys [id url]} (:repos me)]
      (let [repo url]
        (p/let [config-exists? (fs/file-exists?
                                (util/get-repo-dir url)
                                ".git/config")]
          (if (and config-exists?
                   (db/cloned? repo))
            (do
              (git-handler/git-set-username-email! repo me)
              (periodically-pull-and-push repo {:pull-now? true})
              ;; (periodically-persist-app-metadata repo)
              )
            (clone-and-pull repo)))))
    (js/setTimeout (fn []
                     (clone-and-pull-repos me))
                   500)))

(defn rebuild-index!
  [{:keys [id url] :as repo}]
  (db/remove-conn! url)
  (db/clear-query-state!)
  (state/clear-changed-files! url)
  (-> (p/let [_ (db/remove-db! url)
              _ (db/remove-files-db! url)]
        (fs/rmdir (util/get-repo-dir url)))
      (p/catch (fn [error]
                 (prn "Delete repo failed, error: " error)))
      (p/finally (fn []
                   (clone-and-pull url)))))

(defn git-commit-and-push!
  [commit-message]
  (when-let [repo (state/get-current-repo)]
    (push repo {:commit-message commit-message
                :fallback? false})))

(defn read-repair-journals!
  [repo-url]
  ;; TODO: check file corrupts
  )
