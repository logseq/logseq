(ns frontend.handler.repo
  (:refer-clojure :exclude [clone])
  (:require [frontend.util :as util :refer-macros [profile]]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [frontend.state :as state]

            [frontend.git :as git]
            [cljs-bean.core :as bean]
            [frontend.date :as date]
            [frontend.config :as config]
            [frontend.format :as format]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.common :as common-handler]
            [frontend.ui :as ui]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.dicts :as dicts]
            [frontend.helper :as helper]
            [frontend.spec :as spec]
            [frontend.db.queries :as db-queries]
            [frontend.db.react-queries :as react-queries]
            [frontend.db.declares :as declares]
            [frontend.db.utils :as db-utils]
            [frontend.handler.utils :as h-utils]
            [frontend.utf8 :as utf8]
            [clojure.set :as set]
            [frontend.format.mldoc :as mldoc]))

;; Project settings should be checked in two situations:
;; 1. User changes the config.edn directly in logseq.com (fn: alter-file)
;; 2. Git pulls the new change (fn: load-files)

(defn show-install-error!
  [repo-url title]
  (spec/validate :repos/url repo-url)
  (notification/show!
   [:p.content
    title
    [:span.mr-2
     (util/format
      "Please make sure that you've installed the logseq app for the repo %s on GitHub. "
      repo-url)
     (ui/button
      "Install Logseq on GitHub"
      :href (str "https://github.com/apps/" config/github-app-name "/installations/new"))]]
   :error
   false))

(defn create-config-file-if-not-exists
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (util/get-repo-dir repo-url)
        app-dir config/app-name
        dir (str repo-dir "/" app-dir)]
    (p/let [_ (fs/mkdir-if-not-exists dir)]
      (let [default-content config/config-default-content]
        (p/let [file-exists? (fs/create-if-not-exists repo-dir (str app-dir "/" config/config-file) default-content)]
          (let [path (str app-dir "/" config/config-file)
                old-content (when file-exists?
                              (react-queries/get-file repo-url path))
                content (or old-content default-content)]
            (h-utils/reset-file! repo-url path content)
            (h-utils/reset-config! repo-url content)
            (when-not (= content old-content)
              (git-handler/git-add repo-url path))))))))

(defn create-contents-file
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (util/get-repo-dir repo-url)
        format (state/get-preferred-format)
        path (str (state/get-pages-directory)
                  "/contents."
                  (config/get-file-extension format))
        file-path (str "/" path)
        default-content (util/default-content-with-title format "contents")]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" (state/get-pages-directory)))
            file-exists? (fs/create-if-not-exists repo-dir file-path default-content)]
      (when-not file-exists?
        (h-utils/reset-file! repo-url path default-content)
        (git-handler/git-add repo-url path)))))

(defn create-custom-theme
  [repo-url]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (util/get-repo-dir repo-url)
        path (str config/app-name "/" config/custom-css-file)
        file-path (str "/" path)
        default-content ""]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" config/app-name))
            file-exists? (fs/create-if-not-exists repo-dir file-path default-content)]
      (when-not file-exists?
        (h-utils/reset-file! repo-url path default-content)
        (git-handler/git-add repo-url path)))))

(defn create-dummy-notes-page
  [repo-url content]
  (spec/validate :repos/url repo-url)
  (let [repo-dir (util/get-repo-dir repo-url)
        path (str (config/get-pages-directory) "/how_to_make_dummy_notes.md")
        file-path (str "/" path)]
    (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" (config/get-pages-directory)))
            _file-exists? (fs/create-if-not-exists repo-dir file-path content)]
      (h-utils/reset-file! repo-url path content))))

(defn create-today-journal-if-not-exists
  ([repo-url]
   (create-today-journal-if-not-exists repo-url nil))
  ([repo-url content]
   (spec/validate :repos/url repo-url)
   (when (config/local-db? repo-url)
     (fs/check-directory-permission! repo-url))
   (let [repo-dir (util/get-repo-dir repo-url)
         format (state/get-preferred-format repo-url)
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
         page-exists? (db-utils/entity repo-url [:page/name (string/lower-case title)])
         empty-blocks? (empty? (h-utils/get-page-blocks-no-cache repo-url (string/lower-case title)))]
     (when (or empty-blocks?
               (not page-exists?))
       (p/let [_ (fs/mkdir-if-not-exists (str repo-dir "/" config/default-journals-directory))
               file-exists? (fs/create-if-not-exists repo-dir file-path content)]
         (when-not file-exists?
           (h-utils/reset-file! repo-url path content)
           (ui-handler/re-render-root!)
           (git-handler/git-add repo-url path)))))))

(defn create-default-files!
  [repo-url]
  (spec/validate :repos/url repo-url)
  (create-config-file-if-not-exists repo-url)
  (create-today-journal-if-not-exists repo-url)
  (create-contents-file repo-url)
  (create-custom-theme repo-url))

(defn- extract-blocks-pages
  [repo-url file content utf8-content]
  (if (string/blank? content)
    []
    (let [journal? (util/starts-with? file "journals/")
          format (format/get-format file)
          ast (mldoc/->edn content
                (mldoc/default-config format))
          first-block (first ast)
          properties (let [properties (and (seq first-block)
                                        (= "Properties" (ffirst first-block))
                                        (last (first first-block)))]
                       (if (and properties (seq properties))
                         properties))]
      (h-utils/extract-pages-and-blocks
        repo-url
        format ast properties
        file content utf8-content journal?
        (fn [blocks ast]
          [[(db-utils/get-page-name file ast) blocks]])))))


(defn- extract-all-blocks-pages
  [repo-url files]
  (when (seq files)
    (let [result (->> files
                      (map
                        (fn [{:file/keys [path content]} contents]
                          (println "Parsing : " path)
                          (when content
                            (let [utf8-content (utf8/encode content)]
                              (extract-blocks-pages repo-url path content utf8-content)))))
                      (remove empty?))]
      (when (seq result)
        (let [[pages block-ids blocks] (apply map concat result)
              block-ids-set (set block-ids)
              blocks (map (fn [b]
                            (-> b
                                (update :block/ref-blocks #(set/intersection (set %) block-ids-set))
                                (update :block/embed-blocks #(set/intersection (set %) block-ids-set)))) blocks)]
          (apply concat [pages block-ids blocks]))))))

(defn- parse-files-and-load-to-db!
  [repo-url files {:keys [first-clone? delete-files delete-blocks re-render? re-render-opts] :as opts}]
  (state/set-loading-files! false)
  (state/set-importing-to-db! true)
  (let [file-paths (map :file/path files)
        parsed-files (filter
                      (fn [file]
                        (let [format (format/get-format (:file/path file))]
                          (contains? config/mldoc-support-formats format)))
                      files)
        blocks-pages (if (seq parsed-files)
                       (extract-all-blocks-pages repo-url parsed-files)
                       [])]
    (db-queries/reset-contents-and-blocks! repo-url files blocks-pages delete-files delete-blocks)
    (let [config-file (str config/app-name "/" config/config-file)]
      (if (contains? (set file-paths) config-file)
        (when-let [content (some #(when (= (:file/path %) config-file)
                                    (:file/content %)) files)]
          (file-handler/restore-config! repo-url content true))))
    (when first-clone? (create-default-files! repo-url))
    (when re-render?
      (ui-handler/re-render-root! re-render-opts))
    (state/set-importing-to-db! false)))

(defn- delete-pages-by-files
  [files]
  (let [pages (->> (mapv db-queries/get-file-page files)
                   (remove nil?))]
    (when (seq pages)
      (mapv (fn [page] [:db.fn/retractEntity [:page/name page]])
        (map string/lower-case pages)))))

(defn load-repo-to-db!
  [repo-url {:keys [first-clone? diffs nfs-files]}]
  (spec/validate :repos/url repo-url)
  (let [load-contents (fn [files option]
                        (file-handler/load-files-contents!
                         repo-url
                         files
                         (fn [files-contents]
                           (parse-files-and-load-to-db! repo-url files-contents option))))]
    (cond
      (and (not (seq diffs)) (seq nfs-files))
      (parse-files-and-load-to-db! repo-url nfs-files {:first-clone? true})

      first-clone?
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
              delete-files (if (seq remove-files)
                             (db-queries/delete-files remove-files))
              delete-blocks (db-queries/delete-blocks repo-url (concat remove-files modify-files))
              delete-pages (if (seq remove-files)
                             (delete-pages-by-files remove-files)
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
                                         (assoc options :re-render-opts {:clear-all-query-state? true}))
            (load-contents add-or-modify-files options)))))))

(defn load-db-and-journals!
  [repo-url diffs first-clone?]
  (spec/validate :repos/url repo-url)
  (when (or diffs first-clone?)
    (load-repo-to-db! repo-url {:first-clone? first-clone?
                                :diffs diffs})))

(defn- rebuild-page-blocks-children
  "For performance reason, we can update the :block/children value after every operation,
  but it's hard to make sure that it's correct, also it needs more time to implement it.
  We can improve it if the performance is really an issue."
  [repo page]
  (let [blocks (->>
                 (h-utils/get-page-blocks-no-cache repo page {:pull-keys '[:db/id :block/uuid :block/level :block/pre-block? :block/meta]})
                 (remove :block/pre-block?)
                 (map #(select-keys % [:db/id :block/uuid :block/level]))
                 (reverse))
        original-blocks blocks]
    (loop [blocks blocks
           tx []
           children {}
           last-level 10000]
      (if (seq blocks)
        (let [[{:block/keys [uuid level] :as block} & others] blocks
              [tx children] (cond
                              (< level last-level)          ; parent
                              (let [cur-children (get children last-level)
                                    tx (if (seq cur-children)
                                         (vec
                                           (concat
                                             tx
                                             (map
                                               (fn [child]
                                                 [:db/add (:db/id block) :block/children [:block/uuid child]])
                                               cur-children)))
                                         tx)
                                    children (-> children
                                                 (dissoc last-level)
                                                 (update level conj uuid))]
                                [tx children])

                              (> level last-level)          ; child of sibling
                              (let [children (update children level conj uuid)]
                                [tx children])

                              :else                         ; sibling
                              (let [children (update children last-level conj uuid)]
                                [tx children]))]
          (recur others tx children level))
        ;; TODO: add top-level children to the "Page" block (we might remove the Page from db schema)
        (when (seq tx)
          (let [delete-tx (map (fn [block]
                                 [:db/retract (:db/id block) :block/children])
                            original-blocks)]
            (->> (concat delete-tx tx)
                 (remove nil?))))))))

(defn transact-react-and-alter-file!
  [repo tx transact-option files]
  (spec/validate :repos/url repo)
  (let [files (remove nil? files)
        pages (->> (map db-queries/get-file-page (map first files))
                   (remove nil?))]
    (h-utils/transact-react!
      repo
      tx
      transact-option)
    (when (seq pages)
      (let [children-tx (mapcat #(rebuild-page-blocks-children repo %) pages)]
        (when (seq children-tx)
          (db-queries/transact! repo children-tx))))
    (when (seq files)
      (file-handler/alter-files repo files))))

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
         (declares/get-conn repo-url true)
         (db-queries/cloned? repo-url))
    (p/let [remote-latest-commit (common-handler/get-remote-ref repo-url)
            local-latest-commit (common-handler/get-ref repo-url)
            descendent? (git/descendent? repo-url local-latest-commit remote-latest-commit)]
      (when (or (= local-latest-commit remote-latest-commit)
                (nil? local-latest-commit)
                (not descendent?)
                force-pull?)
        (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir repo-url))]
          (when (empty? files)
            (let [status (db-queries/get-key-value repo-url :git/status)]
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
                 (p/let [token (helper/get-github-token repo-url)
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
                                                  (git-handler/set-git-error! repo-url error))))))
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
                                                        :commit-message "Merge push without diffed files"}))))))))
                 (p/catch
                  (fn [error]
                    (cond
                      (string/includes? (str error) "404")
                      (do (log/error :git/pull-error error)
                          (show-install-error! repo-url (util/format "Failed to fetch %s." repo-url)))

                      (string/includes? (str error) "401")
                      (let [remain-times (dec try-times)]
                        (if (> remain-times 0)
                          (let [new-opts (merge opts {:try-times remain-times})]
                            (pull repo-url new-opts))
                          (let [error-msg
                                (util/format "Failed to fetch %s. It may be caused by token expiration or missing." repo-url)]
                            (log/error :git/pull-error error)
                            (notification/show! error-msg :error false))))

                      :else
                      (log/error :git/pull-error error)))))))))))))

(defn push
  [repo-url {:keys [commit-message merge-push-no-diff? custom-commit?]
             :or {custom-commit false
                  commit-message "Logseq auto save"
                  merge-push-no-diff? false}}]
  (spec/validate :repos/url repo-url)
  (let [status (db-queries/get-key-value repo-url :git/status)]
    (if (and
         (db-queries/cloned? repo-url)
         (state/input-idle? repo-url)
         (or (not= status :pushing)
             custom-commit?))
      (-> (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir (state/get-current-repo)))]
            (when (or (seq files) merge-push-no-diff?)
              ;; auto commit if there are any un-committed changes
              (let [commit-message (if (string/blank? commit-message)
                                     "Logseq auto save"
                                     commit-message)]
                (p/let [commit-oid (git/commit repo-url commit-message)
                        token (helper/get-github-token repo-url)
                        status (db-queries/get-key-value repo-url :git/status)]
                  (when (and token (or (not= status :pushing)
                                       custom-commit?))
                    (git-handler/set-git-status! repo-url :pushing)
                    (util/p-handle
                     (git/push repo-url token merge-push-no-diff?)
                     (fn [result]
                       (git-handler/set-git-status! repo-url nil)
                       (git-handler/set-git-error! repo-url nil)
                       (common-handler/check-changed-files-status repo-url))
                     (fn [error]
                       (log/error :git/push-error error)
                       (js/console.error error)
                       (common-handler/check-changed-files-status repo-url)
                       (do
                         (git-handler/set-git-status! repo-url :push-failed)
                         (git-handler/set-git-error! repo-url error)
                         (when (state/online?)
                           (pull repo-url {:force-pull? true
                                           :show-diff? true}))))))))))
          (p/catch (fn [error]
                     (log/error :git/get-changed-files-error error)
                     (git-handler/set-git-status! repo-url :push-failed)
                     (git-handler/set-git-error! repo-url error)
                     (js/console.dir error)))))))

(defn push-if-auto-enabled!
  [repo]
  (spec/validate :repos/url repo)
  (when (state/get-git-auto-push? repo)
    (push repo nil)))

(defn pull-current-repo
  []
  (when-let [repo (state/get-current-repo)]
    (pull repo {:force-pull? true})))

(defn- clone
  [repo-url]
  (spec/validate :repos/url repo-url)
  (p/let [token (helper/get-github-token repo-url)]
    (when token
      (util/p-handle
       (do
         (state/set-cloning! true)
         (git/clone repo-url token))
       (fn [result]
         (state/set-current-repo! repo-url)
         (db-queries/start-db-conn! (state/get-me) repo-url)
         (db-queries/mark-repo-as-cloned! repo-url))
       (fn [e]
         (println "Clone failed, error: ")
         (js/console.error e)
         (state/set-cloning! false)
         (git-handler/set-git-status! repo-url :clone-failed)
         (git-handler/set-git-error! repo-url e)
         (show-install-error! repo-url (util/format "Failed to clone %s." repo-url)))))))

(defn set-config-content!
  [repo path new-config]
  (let [new-content (util/pp-str new-config)]
    (file-handler/alter-file repo path new-content {:reset? false
                                                    :re-render-root? false})))

(defn set-config!
  [k v]
  (when-let [repo (state/get-current-repo)]
    (let [path (str config/app-name "/" config/config-file)]
      (when-let [config (db-queries/get-file-no-sub path)]
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
  (spec/validate :repos/repo repo)
  (let [delete-db-f (fn []
                      (declares/remove-conn! url)
                      (declares/remove-db! url)
                      (declares/remove-files-db! url)
                      (fs/rmdir (util/get-repo-dir url))
                      (state/delete-repo! repo))]
    (if (config/local-db? url)
      (do
        (delete-db-f)
        ;; clear handles
)
      (util/delete (str config/api "repos/" id)
                   delete-db-f
                   (fn [error]
                     (prn "Delete repo failed, error: " error))))))

(defn start-repo-db-if-not-exists!
  [repo option]
  (state/set-current-repo! repo)
  (db-queries/start-db-conn! nil repo option))

(defn setup-local-repo-if-not-exists!
  []
  (if js/window.pfs
    (let [repo config/local-repo]
      (p/do! (fs/mkdir-if-not-exists (str "/" repo))
             (state/set-current-repo! repo)
             (db-queries/start-db-conn! nil repo)
             (when-not config/publishing?
               (let [dummy-notes (get-in dicts/dicts [:en :tutorial/dummy-notes])]
                 (create-dummy-notes-page repo dummy-notes)))
             (when-not config/publishing?
               (let [tutorial (get-in dicts/dicts [:en :tutorial/text])
                     tutorial (string/replace-first tutorial "$today" (date/today))]
                 (create-today-journal-if-not-exists repo tutorial)))
             (create-config-file-if-not-exists repo)
             (create-contents-file repo)
             (create-custom-theme repo)
             (state/set-db-restoring! false)))
    (js/setTimeout setup-local-repo-if-not-exists! 100)))

(defn periodically-pull-current-repo
  []
  (js/setInterval
   (fn []
     (p/let [repo-url (state/get-current-repo)
             token (helper/get-github-token repo-url)]
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
  (spec/validate :repos/branch branch)
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
          (p/let [config-exists? (fs/file-exists?
                                  (util/get-repo-dir url)
                                  ".git/config")]
            (if (and config-exists?
                     (db-queries/cloned? repo))
              (do
                (git-handler/git-set-username-email! repo me)
                (pull repo nil))
              (do
                (clone-and-load-db repo))))))

      (periodically-pull-current-repo)
      (periodically-push-current-repo))
    (js/setTimeout (fn []
                     (clone-and-pull-repos me))
                   500)))

(defn rebuild-index!
  [{:keys [id url] :as repo}]
  (spec/validate :repos/repo repo)
  (declares/remove-conn! url)
  (react-queries/clear-query-state!)
  (-> (p/do! (declares/remove-db! url)
             (declares/remove-files-db! url)
             (fs/rmdir (util/get-repo-dir url))
             (clone-and-load-db url))
      (p/catch (fn [error]
                 (prn "Delete repo failed, error: " error)))))

(defn git-commit-and-push!
  [commit-message]
  (when-let [repo (state/get-current-repo)]
    (push repo {:commit-message commit-message
                :custom-commit? true})))
