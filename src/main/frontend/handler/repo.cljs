(ns frontend.handler.repo
  (:refer-clojure :exclude [clone])
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.dicts :as dicts]
            [frontend.encrypt :as encrypt]
            [frontend.format :as format]
            [frontend.fs :as fs]
            [frontend.fs.nfs :as nfs]
            [frontend.git :as git]
            [frontend.handler.common :as common-handler]
            [frontend.handler.extract :as extract-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.metadata :as metadata-handler]
            [frontend.idb :as idb]
            [frontend.search :as search]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [shadow.resource :as rc]
            [clojure.set :as set]))

;; Project settings should be checked in two situations:
;; 1. User changes the config.edn directly in logseq.com (fn: alter-file)
;; 2. Git pulls the new change (fn: load-files)

(defn create-config-file-if-not-exists
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        app-dir config/app-name
        dir (str repo-dir "/" app-dir)]
    (p/let [_ (fs/mkdir-if-not-exists dir)]
      (let [default-content config/config-default-content
            path (str app-dir "/" config/config-file)]
        (p/let [file-exists? (fs/create-if-not-exists repo-url repo-dir (str app-dir "/" config/config-file) default-content)]
          (when-not file-exists?
            (file-handler/reset-file! repo-url path default-content)
            (common-handler/reset-config! repo-url default-content)))))))

(defn create-contents-file
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        format (state/get-preferred-format)
        path (str (state/get-pages-directory)
                  "/contents."
                  (config/get-file-extension format))
        file-path (str "/" path)
        default-content (case (name format)
                          "org" (rc/inline "contents.org")
                          "markdown" (rc/inline "contents.md")
                          "")]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" (state/get-pages-directory)))
            file-exists? (fs/create-if-not-exists repo-url repo-dir file-path default-content)]
      (when-not file-exists?
        (file-handler/reset-file! repo-url path default-content)))))

(defn create-custom-theme
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        path (str config/app-name "/" config/custom-css-file)
        file-path (str "/" path)
        default-content ""]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name))
            file-exists? (fs/create-if-not-exists repo-url repo-dir file-path default-content)]
      (when-not file-exists?
        (file-handler/reset-file! repo-url path default-content)))))

(defn create-dummy-notes-page
  [repo-url content]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (config/get-repo-dir repo-url)
        path (str (config/get-pages-directory) "/how_to_make_dummy_notes.md")
        file-path (str "/" path)]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" (config/get-pages-directory)))
            _file-exists? (fs/create-if-not-exists repo-url repo-dir file-path content)]
      (file-handler/reset-file! repo-url path content))))

(defn create-today-journal-if-not-exists
  ([repo-url]
   (create-today-journal-if-not-exists repo-url nil))
  ([repo-url {:keys [content write-file?]
              :or {write-file? true}}]
   (spec/validate :repos/url repo-url)
   (when (state/enable-journals? repo-url)
     (let [repo-dir (config/get-repo-dir repo-url)
           format (state/get-preferred-format repo-url)
           title (date/today)
           file-name (date/journal-title->default title)
           default-content (util/default-content-with-title format)
           template (state/get-default-journal-template)
           template (when (and template
                             (not (string/blank? template)))
                      template)
           content (cond
                     content
                     content

                     template
                     (str default-content template)

                     :else
                     default-content)
           path (str (config/get-journals-directory) "/" file-name "."
                     (config/get-file-extension format))
           file-path (str "/" path)
           page-exists? (db/entity repo-url [:block/name (string/lower-case title)])
           empty-blocks? (db/page-empty? repo-url (string/lower-case title))]
       (when (or empty-blocks? (not page-exists?))
         (p/let [_ (nfs/check-directory-permission! repo-url)
                 _ (fs/mkdir-if-not-exists (str repo-dir "/" (config/get-journals-directory)))
                 file-exists? (fs/file-exists? repo-dir file-path)]
           (when-not file-exists?
             (p/let [_ (file-handler/reset-file! repo-url path content)]
               (if write-file?
                 (p/let [_ (fs/create-if-not-exists repo-url repo-dir file-path content)]
                   (when-not (state/editing?)
                     (ui-handler/re-render-root!))
                   (git-handler/git-add repo-url path))
                 (when-not (state/editing?)
                   (ui-handler/re-render-root!)))))))))))

(defn create-default-files!
  ([repo-url]
   (create-default-files! repo-url false))
  ([repo-url encrypted?]
   (spec/validate :repos/url repo-url)
   (let [repo-dir (config/get-repo-dir repo-url)]
     (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name))
             _ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name "/" config/recycle-dir))
             _ (fs/mkdir-if-not-exists (str repo-dir "/" (config/get-journals-directory)))]
       (file-handler/create-metadata-file repo-url encrypted?)
       ;; TODO: move to frontend.handler.file
       (create-config-file-if-not-exists repo-url)
       (create-contents-file repo-url)
       (create-custom-theme repo-url)
       (state/pub-event! [:page/create-today-journal repo-url])))))

(defn- remove-non-exists-refs!
  [data all-block-ids]
  (let [block-ids (->> (->> (map :block/uuid data)
                        (remove nil?)
                        (set))
                       (set/union (set all-block-ids)))
        keep-block-ref-f (fn [refs]
                           (filter (fn [ref]
                                     (if (and (vector? ref)
                                              (= :block/uuid (first ref)))
                                       (contains? block-ids (second ref))
                                       ref)) refs))]
    (map (fn [item]
           (if (and (map? item)
                    (:block/uuid item))
             (update item :block/refs keep-block-ref-f)
             item)) data)))

(defn- reset-contents-and-blocks!
  [repo-url files blocks-pages delete-files delete-blocks refresh?]
  (db/transact-files-db! repo-url files)
  (let [files (map #(select-keys % [:file/path :file/last-modified-at]) files)
        all-data (-> (concat delete-files delete-blocks files blocks-pages)
                     (util/remove-nils))
        all-data (if refresh?
                   (remove-non-exists-refs! all-data (db-model/get-all-block-uuids))
                   (remove-non-exists-refs! all-data nil))]
    (db/transact! repo-url all-data)))

(defn- load-pages-metadata!
  [repo file-paths files]
  (try
    (let [file (config/get-pages-metadata-path)]
      (when (contains? (set file-paths) file)
        (when-let [content (some #(when (= (:file/path %) file) (:file/content %)) files)]
          (let [metadata (common-handler/safe-read-string content "Parsing pages metadata file failed: ")
                pages (db/get-all-pages repo)
                pages (zipmap (map :block/name pages) pages)
                metadata (->>
                          (filter (fn [{:block/keys [name created-at updated-at]}]
                                    (when-let [page (get pages name)]
                                      (and
                                       (or
                                        (nil? (:block/created-at page))
                                        (>= created-at (:block/created-at page)))
                                       (or
                                        (nil? (:block/updated-at page))
                                        (>= updated-at (:block/created-at page)))))) metadata)
                          (remove nil?))]
            (when (seq metadata)
              (db/transact! repo metadata))))))
    (catch js/Error e
      (log/error :exception e))))

(defn- parse-files-and-create-default-files-inner!
  [repo-url files delete-files delete-blocks file-paths first-clone? db-encrypted? re-render? re-render-opts metadata opts]
  (p/let [refresh? (:refresh? opts)
          parsed-files (filter
                        (fn [file]
                          (let [format (format/get-format (:file/path file))]
                            (contains? config/mldoc-support-formats format)))
                        files)
          blocks-pages (if (seq parsed-files)
                         (extract-handler/extract-all-blocks-pages repo-url parsed-files metadata refresh?)
                         [])]
    (let [config-file (config/get-config-path)]
      (when (contains? (set file-paths) config-file)
        (when-let [content (some #(when (= (:file/path %) config-file)
                                    (:file/content %)) files)]
          (file-handler/restore-config! repo-url content true))))
    (reset-contents-and-blocks! repo-url files blocks-pages delete-files delete-blocks refresh?)
    (load-pages-metadata! repo-url file-paths files)
    (when first-clone?
      (if (and (not db-encrypted?) (state/enable-encryption? repo-url))
        (state/pub-event! [:modal/encryption-setup-dialog repo-url
                           #(create-default-files! repo-url %)])
        (create-default-files! repo-url db-encrypted?)))
    (when re-render?
      (ui-handler/re-render-root! re-render-opts))
    (state/set-importing-to-db! false)
    (state/pub-event! [:graph/added repo-url])))

(defn- parse-files-and-create-default-files!
  [repo-url files delete-files delete-blocks file-paths first-clone? db-encrypted? re-render? re-render-opts metadata opts]
  (if db-encrypted?
    (p/let [files (p/all
                   (map (fn [file]
                          (p/let [content (encrypt/decrypt (:file/content file))]
                            (assoc file :file/content content)))
                        files))]
      (parse-files-and-create-default-files-inner! repo-url files delete-files delete-blocks file-paths first-clone? db-encrypted? re-render? re-render-opts metadata opts))
    (parse-files-and-create-default-files-inner! repo-url files delete-files delete-blocks file-paths first-clone? db-encrypted? re-render? re-render-opts metadata opts)))

(defn parse-files-and-load-to-db!
  [repo-url files {:keys [first-clone? delete-files delete-blocks re-render? re-render-opts refresh?] :as opts
                   :or {re-render? true}}]
  (state/set-loading-files! false)
  (when-not refresh? (state/set-importing-to-db! true))
  (let [file-paths (map :file/path files)]
    (let [metadata-file (config/get-metadata-path)
          metadata-content (some #(when (= (:file/path %) metadata-file)
                                    (:file/content %)) files)
          metadata (when metadata-content
                     (common-handler/read-metadata! repo-url metadata-content))
          db-encrypted? (:db/encrypted? metadata)
          db-encrypted-secret (if db-encrypted? (:db/encrypted-secret metadata) nil)]
      (if db-encrypted?
        (let [close-fn #(parse-files-and-create-default-files! repo-url files delete-files delete-blocks file-paths first-clone? db-encrypted? re-render? re-render-opts metadata opts)]
          (state/set-state! :encryption/graph-parsing? true)
          (state/pub-event! [:modal/encryption-input-secret-dialog repo-url
                             db-encrypted-secret
                             close-fn]))
        (parse-files-and-create-default-files! repo-url files delete-files delete-blocks file-paths first-clone? db-encrypted? re-render? re-render-opts metadata opts)))))

(defn load-repo-to-db!
  [repo-url {:keys [first-clone? diffs nfs-files refresh?]
             :as opts}]
  (spec/validate :repos/url repo-url)
  (when (= :repos (state/get-current-route))
    (route-handler/redirect-to-home!))
  (let [config (or (state/get-config repo-url)
                   (some-> (first (filter #(= (config/get-config-path repo-url) (:file/path %)) nfs-files))
                           :file/content
                           (common-handler/safe-read-string "Parsing config file failed: ")))
        relate-path-fn (fn [m k]
                         (some-> (get m k)
                                 (string/replace (str (config/get-local-dir repo-url) "/") "")))
        nfs-files (common-handler/remove-hidden-files nfs-files config #(relate-path-fn % :file/path))
        diffs (common-handler/remove-hidden-files diffs config #(relate-path-fn % :path))
        load-contents (fn [files option]
                        (file-handler/load-files-contents!
                         repo-url
                         files
                         (fn [files-contents]
                           (parse-files-and-load-to-db! repo-url files-contents (assoc option :refresh? refresh?)))))]
    (cond
      (and (not (seq diffs)) nfs-files)
      (parse-files-and-load-to-db! repo-url nfs-files {:first-clone? true})

      (and first-clone? (not nfs-files))
      (->
       (p/let [files (file-handler/load-files repo-url)]
         (load-contents files {:first-clone? first-clone?}))
       (p/catch (fn [error]
                  (println "loading files failed: ")
                  (js/console.dir error)
                  ;; Empty repo
                  (create-default-files! repo-url)
                  (state/set-loading-files! false))))

      :else
      (when (seq diffs)
        (let [filter-diffs (fn [type] (->> (filter (fn [f] (= type (:type f))) diffs)
                                           (map :path)))
              remove-files (filter-diffs "remove")
              modify-files (filter-diffs "modify")
              add-files (filter-diffs "add")
              delete-files (when (seq remove-files)
                             (db/delete-files remove-files))
              delete-blocks (db/delete-blocks repo-url remove-files true)
              delete-blocks (->>
                             (concat
                              delete-blocks
                              (db/delete-blocks repo-url modify-files false))
                             (remove nil?))
              delete-pages (if (seq remove-files)
                             (db/delete-pages-by-files remove-files)
                             [])
              add-or-modify-files (some->>
                                   (concat modify-files add-files)
                                   (util/remove-nils))
              options {:first-clone? first-clone?
                       :delete-files (concat delete-files delete-pages)
                       :delete-blocks delete-blocks
                       :re-render? true}]
          (if (seq nfs-files)
            (parse-files-and-load-to-db! repo-url nfs-files
                                         (assoc options
                                                :refresh? refresh?
                                                :re-render-opts {:clear-all-query-state? true}))
            (load-contents add-or-modify-files options)))))))

(defn load-db-and-journals!
  [repo-url diffs first-clone?]
  (spec/validate :repos/url repo-url)
  (when (or diffs first-clone?)
    (load-repo-to-db! repo-url {:first-clone? first-clone?
                                :diffs diffs})))

(declare push)

(defn get-diff-result
  [repo-url]
  (p/let [remote-latest-commit (common-handler/get-remote-ref repo-url)
          local-latest-commit (common-handler/get-ref repo-url)]
    (git/get-diffs repo-url local-latest-commit remote-latest-commit)))

(defn pull
  [repo-url {:keys [force-pull? show-diff? try-times]
             :or {force-pull? false
                  show-diff? false
                  try-times 2}
             :as opts}]
  (spec/validate :repos/url repo-url)
  (when (and
         (db/get-conn repo-url true)
         (db/cloned? repo-url))
    (p/let [remote-latest-commit (common-handler/get-remote-ref repo-url)
            local-latest-commit (common-handler/get-ref repo-url)
            descendent? (git/descendent? repo-url local-latest-commit remote-latest-commit)]
      (when (or (= local-latest-commit remote-latest-commit)
                (nil? local-latest-commit)
                (not descendent?)
                force-pull?)
        (p/let [files (js/window.workerThread.getChangedFiles (config/get-repo-dir repo-url))]
          (when (empty? files)
            (let [status (db/get-key-value repo-url :git/status)]
              (when (or
                     force-pull?
                     (and
                      (not= status :pushing)
                      (not (state/get-edit-input-id))
                      (not (state/in-draw-mode?))
                      ;; don't pull if git conflicts not resolved yet
                      (or
                       show-diff?
                       (and (not show-diff?)
                            (empty? @state/diffs)))))
                (git-handler/set-git-status! repo-url :pulling)
                (->
                 (p/let [token (common-handler/get-github-token repo-url)
                         result (git/fetch repo-url token)]
                   (let [{:keys [fetchHead]} (bean/->clj result)]
                     (-> (git/merge repo-url)
                         (p/then (fn [result]
                                   (-> (git/checkout repo-url)
                                       (p/then (fn [result]
                                                 (git-handler/set-git-status! repo-url nil)
                                                 (git-handler/set-git-last-pulled-at! repo-url)
                                                 (when (and local-latest-commit fetchHead
                                                            (not= local-latest-commit fetchHead))
                                                   (p/let [diffs (git/get-diffs repo-url local-latest-commit fetchHead)]
                                                     (when (seq diffs)
                                                       (load-db-and-journals! repo-url diffs false))))
                                                 (common-handler/check-changed-files-status repo-url)))
                                       (p/catch (fn [error]
                                                  (git-handler/set-git-status! repo-url :checkout-failed)
                                                  (git-handler/set-git-error! repo-url error)
                                                  (when force-pull?
                                                    (notification/show!
                                                     (str "Failed to checkout: " error)
                                                     :error
                                                     false)))))))
                         (p/catch (fn [error]
                                    (println "Git pull error:")
                                    (js/console.error error)
                                    (git-handler/set-git-status! repo-url :merge-failed)
                                    (git-handler/set-git-error! repo-url error)
                                    (p/let [result (get-diff-result repo-url)]
                                      (if (seq result)
                                        (do
                                          (notification/show!
                                           [:p.content
                                            "Failed to merge, please "
                                            [:span.font-bold
                                             "resolve any diffs first."]]
                                           :error)
                                          (route-handler/redirect! {:to :diff}))
                                        (push repo-url {:merge-push-no-diff? true
                                                        :custom-commit? force-pull?
                                                        :commit-message "Merge push without diffed files"}))))))))
                 (p/catch
                  (fn [error]
                    (cond
                      (string/includes? (str error) "404")
                      (do (log/error :git/pull-error error)
                          (state/pub-event! [:repo/install-error repo-url (util/format "Failed to fetch %s." repo-url)]))

                      (string/includes? (str error) "401")
                      (let [remain-times (dec try-times)]
                        (if (> remain-times 0)
                          (let [new-opts (merge opts {:try-times remain-times})]
                            (pull repo-url new-opts))
                          (let [error-msg
                                (util/format "Failed to fetch %s. It may be caused by token expiration or missing." repo-url)]
                            (git-handler/set-git-status! repo-url :fetch-failed)
                            (log/error :repo/pull-error error)
                            (notification/show! error-msg :error false))))

                      :else
                      (log/error :git/pull-error error)))))))))))))

(defn push
  [repo-url {:keys [commit-message merge-push-no-diff? custom-commit?]
             :or {custom-commit? false
                  merge-push-no-diff? false}}]
  (spec/validate :repos/url repo-url)
  (let [status (db/get-key-value repo-url :git/status)
        commit-message (if (string/blank? commit-message)
                         "Logseq auto save"
                         commit-message)]
    (when (and
           (db/cloned? repo-url)
           (state/input-idle? repo-url)
           (or (not= status :pushing)
               custom-commit?))
      (->
       (p/let [files (git/add-all repo-url)
               changed-files? (some? (seq files))
               should-commit? (or changed-files? merge-push-no-diff?)

               _commit (when should-commit?
                         (git/commit repo-url commit-message))

               token (common-handler/get-github-token repo-url)
               status (db/get-key-value repo-url :git/status)]
         (when (and token
                    (or custom-commit?
                        (and (not= status :pushing)
                             changed-files?)))
           (git-handler/set-git-status! repo-url :pushing)
           (->
            (git/push repo-url token merge-push-no-diff?)
            (p/then (fn []
                      (git-handler/set-git-status! repo-url nil)
                      (git-handler/set-git-error! repo-url nil)
                      (common-handler/check-changed-files-status repo-url))))))
       (p/catch (fn [error]
                  (log/error :repo/push-error error)
                  (git-handler/set-git-status! repo-url :push-failed)
                  (git-handler/set-git-error! repo-url error)

                  (when custom-commit?
                    (p/rejected error))))))))

(defn push-if-auto-enabled!
  [repo]
  (spec/validate :repos/url repo)
  (when (state/get-git-auto-push? repo)
    (push repo nil)))

(defn pull-current-repo
  []
  (when-let [repo (state/get-current-repo)]
    (-> (pull repo {:force-pull? true})
        (p/catch (fn [error]
                   (notification/show! error :error false))))))

(defn- clone
  [repo-url]
  (spec/validate :repos/url repo-url)
  (p/let [token (common-handler/get-github-token repo-url)]
    (when token
      (util/p-handle
       (do
         (state/set-cloning! true)
         (git/clone repo-url token))
       (fn [result]
         (state/set-current-repo! repo-url)
         (db/start-db-conn! (state/get-me) repo-url)
         (db/mark-repo-as-cloned! repo-url))
       (fn [e]
         (println "Clone failed, error: ")
         (js/console.error e)
         (state/set-cloning! false)
         (git-handler/set-git-status! repo-url :clone-failed)
         (git-handler/set-git-error! repo-url e)
         (state/pub-event! [:repo/install-error repo-url (util/format "Failed to clone %s." repo-url)]))))))

(defn remove-repo!
  [{:keys [id url] :as repo}]
  ;; (spec/validate :repos/repo repo)
  (let [delete-db-f (fn []
                      (db/remove-conn! url)
                      (db/remove-db! url)
                      (search/remove-db! url)
                      (state/delete-repo! repo))]
    (if (or (config/local-db? url) (= url "local"))
      (p/let [_ (idb/clear-local-db! url)] ; clear file handles
        (delete-db-f))
      (util/delete (str config/api "repos/" id)
                   delete-db-f
                   (fn [error]
                     (prn "Delete repo failed, error: " error))))))

(defn start-repo-db-if-not-exists!
  [repo option]
  (state/set-current-repo! repo)
  (db/start-db-conn! nil repo option))

(defn setup-local-repo-if-not-exists!
  []
  (if js/window.pfs
    (let [repo config/local-repo]
      (p/do! (fs/mkdir-if-not-exists (str "/" repo))
             (state/set-current-repo! repo)
             (db/start-db-conn! nil repo)
             (when-not config/publishing?
               (let [dummy-notes (get-in dicts/dicts [:en :tutorial/dummy-notes])]
                 (create-dummy-notes-page repo dummy-notes)))
             (when-not config/publishing?
               (let [tutorial (get-in dicts/dicts [:en :tutorial/text])
                     tutorial (string/replace-first tutorial "$today" (date/today))]
                 (create-today-journal-if-not-exists repo {:content tutorial})))
             (create-config-file-if-not-exists repo)
             (create-contents-file repo)
             (create-custom-theme repo)
             (state/set-db-restoring! false)
             (ui-handler/re-render-root!)))
    (js/setTimeout setup-local-repo-if-not-exists! 100)))

(defn periodically-pull-current-repo
  []
  (js/setInterval
   (fn []
     (p/let [repo-url (state/get-current-repo)
             token (common-handler/get-github-token repo-url)]
       (when token
         (pull repo-url nil))))
   (* (config/git-pull-secs) 1000)))

(defn periodically-push-current-repo
  []
  (js/setInterval #(push-if-auto-enabled! (state/get-current-repo))
                  (* (config/git-push-secs) 1000)))

(defn create-repo!
  [repo-url branch]
  (spec/validate :repos/url repo-url)
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

(defn- clone-and-load-db
  [repo-url]
  (spec/validate :repos/url repo-url)
  (->
   (p/let [_ (clone repo-url)
           _ (git-handler/git-set-username-email! repo-url (state/get-me))]
     (load-db-and-journals! repo-url nil true))
   (p/catch (fn [error]
              (js/console.error error)))))

(defn clone-and-pull-repos
  [me]
  (spec/validate :state/me me)
  (if (and js/window.git js/window.pfs)
    (do
      (doseq [{:keys [id url]} (:repos me)]
        (let [repo url]
          (if (db/cloned? repo)
            (p/do!
             (git-handler/git-set-username-email! repo me)
             (pull repo nil))
            (p/do!
             (clone-and-load-db repo)))))

      (periodically-pull-current-repo)
      (periodically-push-current-repo))
    (js/setTimeout (fn []
                     (clone-and-pull-repos me))
                   500)))

(defn rebuild-index!
  [url]
  (when url
    (search/reset-indice! url)
    (db/remove-conn! url)
    (db/clear-query-state!)
    (-> (p/do! (db/remove-db! url)
               (clone-and-load-db url))
        (p/catch (fn [error]
                   (prn "Delete repo failed, error: " error))))))

(defn re-index!
  [nfs-rebuild-index! ok-handler]
  (route-handler/redirect-to-home!)
  (when-let [repo (state/get-current-repo)]
    (let [local? (config/local-db? repo)]
      (if local?
        (p/let [_ (metadata-handler/set-pages-metadata! repo)]
          (nfs-rebuild-index! repo ok-handler))
        (rebuild-index! repo))
      (js/setTimeout
       (fn []
         (route-handler/redirect! {:to :home}))
       500))))

(defn git-commit-and-push!
  [commit-message]
  (when-let [repo (state/get-current-repo)]
    (push repo {:commit-message commit-message
                :custom-commit? true})))

(defn get-repo-name
  [url]
  (last (string/split url #"/")))

(defn auto-push!
  []
  (git-commit-and-push! "Logseq auto save"))
