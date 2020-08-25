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
            [frontend.history :as history]
            [frontend.format.protocol :as protocol]
            [goog.object :as gobj]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.project :as project-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.ui :as ui]
            [cljs-time.local :as tl]
            [cljs-time.core :as t]
            [cljs.reader :as reader]
            [clojure.string :as string]
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
              add-or-modify-files (util/remove-nils (concat add-files modify-files))]
          (load-contents add-or-modify-files delete-files delete-blocks true))))))

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

(defn- default-month-journal-content
  [format]
  (let [{:keys [year month day]} (date/get-date)
        last-day (date/get-month-last-day)
        logged? (state/logged?)]
    (->> (map
           (fn [day]
             (let [d (date/format (t/date-time year month day))
                   today? (= d (date/journal-name))]
               (util/format
                "%s %s\n"
                (config/get-block-pattern format)
                d)))
           (range 1 (inc last-day)))
         (apply str))))

(defn create-today-journal-if-not-exists
  [repo-url]
  (let [repo-dir (util/get-repo-dir repo-url)
        format (state/get-preferred-format)
        title (date/today)
        content (util/default-content-with-title format title)
        path (str config/default-journals-directory "/" title "."
                  (config/get-file-extension format))
        file-path (str "/" path)]
    (p/let [_ (-> (fs/mkdir (str repo-dir "/" config/default-journals-directory))
                  (p/catch (fn [_e])))
            file-exists? (fs/create-if-not-exists repo-dir file-path content)]
      (when (not file-exists?)
        (db/reset-file! repo-url path content)
        (ui-handler/re-render-root!)
        (git-handler/git-add repo-url path)))))

(defn create-month-journal-if-not-exists
  [repo-url]
  (let [repo-dir (util/get-repo-dir repo-url)
        format (state/get-preferred-format)
        path (date/current-journal-path format)
        file-path (str "/" path)
        default-content (default-month-journal-content format)]
    (p/let [_ (-> (fs/mkdir (str repo-dir "/" config/default-journals-directory))
                  (p/catch (fn [_e])))
            file-exists? (fs/create-if-not-exists repo-dir file-path default-content)]
      (when (and (not file-exists?)
                 (= :monthly (state/get-journal-basis)))
        (db/reset-file! repo-url path default-content)
        (ui-handler/re-render-root!)
        (git-handler/git-add repo-url path)))))

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

(defn create-default-files!
  [repo-url]
  (when-let [name (get-in @state/state [:me :name])]
    (github/get-repo-permission
     (state/get-github-token)
     repo-url
     name
     (fn [permission]
       (let [permission (:permission permission)
             write-permission (contains? #{"admin" "write"} permission)]
         ;; (db/set-key-value repo-url :git/write-permission? write-permission)
         (create-config-file-if-not-exists repo-url)
         (if (= :monthly (state/get-journal-basis))
           (create-month-journal-if-not-exists repo-url)
           (create-today-journal-if-not-exists repo-url))
         (create-contents-file repo-url)))
     (fn []))))

(defn load-db-and-journals!
  [repo-url diffs first-clone?]
  (when (or diffs first-clone?)
    (p/let [_ (load-repo-to-db! repo-url diffs first-clone?)]
      (when first-clone?
        (create-default-files! repo-url))

      (history/clear-specific-history! [:git/repo repo-url])
      (history/add-history!
       [:git/repo repo-url]
       {:db (when-let [conn (db/get-conn repo-url false)]
              (d/db conn))
        :files-db (when-let [file-conn (db/get-files-conn repo-url)]
                    (d/db file-conn))}))))

(defn db-listen-to-tx!
  [repo db-conn]
  (when-let [files-conn (db/get-files-conn repo)]
    (d/listen! files-conn :persistence
               (fn [tx-report]
                 (when (seq (:tx-data tx-report))
                   (when-let [db (:db-after tx-report)]
                     (js/setTimeout #(db/persist repo db true) 0))))))
  (d/listen! db-conn :persistence
             (fn [tx-report]
               (when (seq (:tx-data tx-report))
                 (when-let [db (:db-after tx-report)]
                   (js/setTimeout #(db/persist repo db false) 0))))))

(defn transact-react-and-alter-file!
  [repo tx transact-option files]
  (db/transact-react!
   repo
   tx
   transact-option)
  (doseq [[file-path new-content] files]
    (file-handler/alter-file repo file-path new-content {:reset? false
                                                         :re-render-root? false})))

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

(defn pull
  [repo-url token]
  (when (db/get-conn repo-url true)
    (let [status (db/get-key-value repo-url :git/status)]
      (when (and
             ;; (not= status :push-failed)
             (not= status :pushing)
             (empty? (state/get-changed-files repo-url))
             (not (state/get-edit-input-id))
             (not (state/in-draw-mode?)))
        (git-handler/set-git-status! repo-url :pulling)
        (let [latest-commit (db/get-key-value repo-url :git/latest-commit)]
          (p/let [result (git/fetch repo-url token)]
            (let [{:keys [fetchHead]} (bean/->clj result)]
              (git-handler/set-latest-commit! repo-url fetchHead)
              (-> (git/merge repo-url)
                  (p/then (fn [result]
                            (-> (git/checkout repo-url)
                                (p/then (fn [result]
                                          (git-handler/set-git-status! repo-url nil)
                                          (git-handler/set-git-last-pulled-at! repo-url)
                                          (when (and latest-commit fetchHead
                                                     (not= latest-commit fetchHead))
                                            (p/let [diffs (git/get-diffs repo-url latest-commit fetchHead)]
                                              (load-db-and-journals! repo-url diffs false)))))
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
                             (route-handler/redirect! {:to :diff})))))))))))

(defn check-changed-files-status
  [f]
  (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir (state/get-current-repo)))]
    (let [files (bean/->clj files)]
      (state/reset-changed-files! files))))

(defn push
  ([repo-url]
   (push repo-url "Logseq auto save"))
  ([repo-url commit-message]
   (let [status (db/get-key-value repo-url :git/status)]
     (when (and
            ;; (not= status :push-failed)
            ;; (db/get-key-value repo-url :git/write-permission?)
            (not (state/get-edit-input-id))
            ;; getChangedFiles is not very reliable
            (seq (state/get-changed-files repo-url))
            )
       (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir (state/get-current-repo)))]
         (when (seq files)
           ;; auto commit if there are any un-committed changes
           (let [commit-message (if (string/blank? commit-message)
                                  "Logseq auto save"
                                  commit-message)]
             (p/let [_ (git/commit repo-url commit-message)]
               (git-handler/set-git-status! repo-url :pushing)
               (let [token (state/get-github-token)]
                 (util/p-handle
                  (git/push repo-url token)
                  (fn []
                    (git-handler/set-git-status! repo-url nil)
                    (git-handler/set-git-error! repo-url nil)
                    (git-handler/set-latest-commit-if-exists! repo-url)
                    (state/clear-changed-files! repo-url))
                  (fn [error]
                    (if (and (string? error)
                             (= error "Failed to fetch"))
                      (println "Failed to fetch")
                      (do
                        (println "Failed to push")
                        (js/console.dir error)
                        (git-handler/set-git-status! repo-url :push-failed)
                        (git-handler/set-git-error! repo-url error)
                        (notification/show!
                         [:p.content
                          "Failed to push, please "
                          [:span.text-gray-700.font-bold.mr-2
                           "resolve any diff first."]
                          (ui/button
                            "Go to diff"
                            :href "/diff")]
                         :error
                         false)
                        (p/let [result (git/fetch repo-url (state/get-github-token))
                                {:keys [fetchHead]} (bean/->clj result)]
                          (git-handler/set-latest-commit! repo-url fetchHead)))))))))))))))

(defn pull-current-repo
  []
  (when-let [repo (state/get-current-repo)]
    (when-let [token (state/get-github-token)]
      (pull repo token))))

(defn clone
  [repo-url]
  (when-let [token (state/get-github-token)]
    (util/p-handle
     (do
       (state/set-cloning? true)
       (git/clone repo-url token))
     (fn []
       (state/set-git-clone-repo! "")
       (state/set-current-repo! repo-url)
       (db/start-db-conn! (:me @state/state)
                          repo-url
                          db-listen-to-tx!)
       (db/mark-repo-as-cloned repo-url)
       (git-handler/set-latest-commit-if-exists! repo-url))
     (fn [e]
       (println "Clone failed, error: ")
       (js/console.error e)
       (state/set-cloning? false)
       (git-handler/set-git-status! repo-url :clone-failed)
       (git-handler/set-git-error! repo-url e)

       (notification/show!
        [:div
         [:p {:style {:margin-top 0}}
          "Please make sure that your Github Personal Token has the right scopes. "]

         [:ol
          [:li {:style {:color "#555"}}
           [:p {:style {:margin 0}}
            "Follow this link to learn how to set the scopes: "]
           [:a {:href "https://logseq.com/blog/faq#How_to_create_a_Github_personal_access_token-3f-"
                :target "_blank"
                :style {:color "#045591"}}
            "How to create a Github personal access token?"]]
          [:li {:style {:color "#555"}}
           "Go to "
           [:a {:href "/settings"
                :style {:color "#045591"}}
            "Settings"]
           " and change your Github Personal Token."]

          [:li {:style {:color "#555"}}
           "Refresh the browser."]]]

        :error
        false)))))

(defn set-config-content!
  [repo path new-config]
  (let [new-content (util/pp-str new-config)]
    (file-handler/alter-file repo path new-content {:reset? false
                                                    :re-render-root? false})))

(defn set-config!
  [k v]
  (when-let [repo (state/get-current-repo)]
    (let [path (str config/app-name "/" config/config-file)]
      (when-let [config (db/get-file path)]
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
              _ (db/start-db-conn! nil
                                   repo
                                   db-listen-to-tx!)
              _ (create-month-journal-if-not-exists repo)
              _ (create-config-file-if-not-exists repo)
              _ (create-contents-file repo)]
        (state/set-db-restoring! false)))
    (js/setTimeout setup-local-repo-if-not-exists! 100)))

(defn periodically-pull
  [repo-url pull-now?]
  (when-let [token (state/get-github-token)]
    (when pull-now? (pull repo-url token))
    (js/setInterval #(pull repo-url token)
                    (* (config/git-pull-secs) 1000))))

(defn periodically-push-tasks
  [repo-url]
  (let [token (state/get-github-token)
        push (fn []
               (push repo-url))]
    (js/setInterval push
                    (* (config/git-push-secs) 1000))))

(defn periodically-pull-and-push
  [repo-url {:keys [pull-now?]
             :or {pull-now? true}}]
  (periodically-pull repo-url pull-now?)
  (when (and
         (or (not config/dev?)
             (= repo-url "https://github.com/tiensonqin/empty-repo"))
         (not (false? (:git-auto-push (state/get-config repo-url)))))
    (periodically-push-tasks repo-url)))

(defn clone-and-pull
  [repo-url]
  (util/post (str config/api "repos")
             {:url repo-url}
             (fn [result]
               (swap! state/state
                      update-in [:me :repos]
                      (fn [repos]
                        (util/distinct-by :url (conj repos result)))))
             (fn [error]
               (println "Something wrong!")
               (js/console.dir error)))
  (p/let [_ (clone repo-url)
          _ (git-handler/git-set-username-email! repo-url (:me @state/state))]
    (load-db-and-journals! repo-url nil true)
    (periodically-pull-and-push repo-url {:pull-now? false})
    ;; (periodically-persist-app-metadata repo-url)
    ))

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
    (push repo commit-message)))

(defn read-repair-journals!
  [repo-url]
  (let [repo-dir (util/get-repo-dir repo-url)
        format (state/get-preferred-format)]
    ;; add missing dates if monthly basis
    (if (= :monthly (state/get-journal-basis))
      (let [path (date/current-journal-path format)
            content (db/get-file repo-url path)]
        (when content
          (let [lines (set (string/split content #"\n"))
                default-content (default-month-journal-content format)
                default-lines (string/split default-content #"\n")
                missing-dates (remove (fn [line] (contains? lines line)) default-lines)
                missing-dates-content (if (seq missing-dates)
                                        (string/join "\n" missing-dates))
                content (str content "\n" missing-dates-content)]
            (db/reset-file! repo-url path content)
            (ui-handler/re-render-root!)
            (git-handler/git-add repo-url path))))

      ;; daily basis, create the specific day journal file
      ;; (create-today-journal-if-not-exists repo-url)
      )))
