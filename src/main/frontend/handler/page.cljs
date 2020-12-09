(ns frontend.handler.page
  (:require [clojure.string :as string]

            [datascript.core :as d]
            [frontend.state :as state]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.tools.html-export :as html-export]
            [frontend.config :as config]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.project :as project-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.ui :as ui-handler]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [clojure.walk :as walk]
            [frontend.git :as git]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [goog.object :as gobj]
            [frontend.format.mldoc :as mldoc]
            [frontend.db.queries :as db-queries]
            [frontend.db.utils :as db-utils]
            [frontend.db.react-queries :as react-queries]
            [frontend.db.declares :as declares]))

(defn- get-directory
  [journal?]
  (if journal?
    config/default-journals-directory
    (config/get-pages-directory)))

(defn- get-file-name
  [journal? title]
  (if journal?
    (date/journal-title->default title)
    (util/page-name-sanity (string/lower-case title))))

(defn create!
  ([title]
   (create! title {}))
  ([title {:keys [redirect?]
           :or {redirect? true}}]
   (let [repo (state/get-current-repo)
         dir (util/get-repo-dir repo)
         journal-page? (date/valid-journal-title? title)
         directory (get-directory journal-page?)]
     (when dir
       (p/let [_ (-> (fs/mkdir (str dir "/" directory))
                     (p/catch (fn [_e])))]
         (let [format (name (state/get-preferred-format))
               page (string/lower-case title)
               path (str (get-file-name journal-page? title)
                         "."
                         (if (= format "markdown") "md" format))
               path (str directory "/" path)
               file-path (str "/" path)]
           (p/let [exists? (fs/file-exists? dir file-path)]
             (if exists?
               (notification/show!
                [:p.content
                 (util/format "File %s already exists!" file-path)]
                :error)
               ;; create the file
               (let [content (util/default-content-with-title format title)]
                 (p/let [_ (fs/create-if-not-exists dir file-path content)]
                   (db-queries/reset-file! repo path content)
                   (git-handler/git-add repo path)
                   (when redirect?
                     (route-handler/redirect! {:to :page
                                               :path-params {:name page}})
                     (let [blocks (db-queries/get-page-blocks page)
                           last-block (last blocks)]
                       (when last-block
                         (js/setTimeout
                          #(editor-handler/edit-last-block-for-new-page! last-block 0)
                          100))))))))))))))

(defn page-add-properties!
  [page-name properties]
  (let [page (db-utils/entity [:page/name page-name])
        page-format (db-queries/get-page-format page-name)
        properties-content (db-queries/get-page-properties-content page-name)
        properties-content (if properties-content
                             (string/trim properties-content)
                             (config/properties-wrapper page-format))]
    (let [file (db-utils/entity (:db/id (:page/file page)))
          file-path (:file/path file)
          file-content (react-queries/get-file file-path)
          after-content (subs file-content (inc (count properties-content)))
          new-properties-content (db-queries/add-properties! page-format properties-content properties)
          full-content (str new-properties-content "\n\n" (string/trim after-content))]
      (file-handler/alter-file (state/get-current-repo)
                               file-path
                               full-content
                               {:reset? true
                                :re-render-root? true}))))

(defn page-remove-property!
  [page-name k]
  (when-let [properties-content (string/trim (db-queries/get-page-properties-content page-name))]
    (let [page (db-utils/entity [:page/name page-name])
          file (db-utils/entity (:db/id (:page/file page)))
          file-path (:file/path file)
          file-content (react-queries/get-file file-path)
          after-content (subs file-content (count properties-content))
          page-format (db-queries/get-page-format page-name)
          new-properties-content (let [lines (string/split-lines properties-content)
                                       prefix (case page-format
                                                :org (str "#+" (string/upper-case k) ": ")
                                                :markdown (str (string/lower-case k) ": ")
                                                "")
                                       exists? (atom false)
                                       lines (remove #(util/starts-with? % prefix) lines)]
                                   (string/join "\n" lines))
          full-content (str new-properties-content "\n\n" (string/trim after-content))]
      (file-handler/alter-file (state/get-current-repo)
                               file-path
                               full-content
                               {:reset? true
                                :re-render-root? true}))))

(defn published-success-handler
  [page-name]
  (fn [result]
    (let [permalink (:permalink result)]
      (page-add-properties! page-name {"permalink" permalink})
      (let [win (js/window.open (str
                                 config/website
                                 "/"
                                 (state/get-current-project)
                                 "/"
                                 permalink))]
        (.focus win)))))

(defn published-failed-handler
  [error]
  (notification/show!
   "Publish failed, please give it another try."
   :error))

(defn get-plugins
  [blocks]
  (let [plugins (atom {})
        add-plugin #(swap! plugins assoc % true)]
    (walk/postwalk
     (fn [x]
       (if (and (vector? x)
                (>= (count x) 2))
         (let [[type option] x]
           (case type
             "Src" (when (:language option)
                     (add-plugin "highlight"))
             "Export" (when (= option "latex")
                        (add-plugin "latex"))
             "Latex_Fragment" (add-plugin "latex")
             "Math" (add-plugin "latex")
             "Latex_Environment" (add-plugin "latex")
             nil)
           x)
         x))
     (map :block/body blocks))
    @plugins))

(defn publish-page-as-slide!
  ([page-name project-add-modal]
   (publish-page-as-slide! page-name (db-queries/get-page-blocks page-name) project-add-modal))
  ([page-name blocks project-add-modal]
   (project-handler/exists-or-create!
    (fn [project]
      (page-add-properties! page-name {"published" true
                                       "slide" true})
      (let [properties (db-queries/get-page-properties page-name)
            plugins (get-plugins blocks)
            data {:project project
                  :title page-name
                  :permalink (:permalink properties)
                  :html (html-export/export-page page-name blocks notification/show!)
                  :tags (:tags properties)
                  :settings (merge
                             (assoc properties
                                    :slide true
                                    :published true)
                             plugins)
                  :repo (state/get-current-repo)}]
        (util/post (str config/api "pages")
                   data
                   (published-success-handler page-name)
                   published-failed-handler)))
    project-add-modal)))

(defn publish-page!
  [page-name project-add-modal]
  (project-handler/exists-or-create!
   (fn [project]
     (let [properties (db-queries/get-page-properties page-name)
           slide? (let [slide (:slide properties)]
                    (or (true? slide)
                        (= "true" slide)))
           blocks (db-queries/get-page-blocks page-name)
           plugins (get-plugins blocks)]
       (if slide?
         (publish-page-as-slide! page-name blocks project-add-modal)
         (do
           (page-add-properties! page-name {"published" true})
           (let [data {:project project
                       :title page-name
                       :permalink (:permalink properties)
                       :html (html-export/export-page page-name blocks notification/show!)
                       :tags (:tags properties)
                       :settings (merge properties plugins)
                       :repo (state/get-current-repo)}]
             (util/post (str config/api "pages")
                        data
                        (published-success-handler page-name)
                        published-failed-handler))))))
   project-add-modal))

(defn unpublished-success-handler
  [page-name]
  (fn [result]
    (notification/show!
     "Un-publish successfully!"
     :success)))

(defn unpublished-failed-handler
  [error]
  (notification/show!
   "Un-publish failed, please give it another try."
   :error))

(defn unpublish-page!
  [page-name]
  (page-add-properties! page-name {"published" false})
  (let [properties (db-queries/get-page-properties page-name)
        permalink (:permalink properties)
        project (state/get-current-project)]
    (if (and project permalink)
      (util/delete (str config/api project "/" permalink)
                   (unpublished-success-handler page-name)
                   unpublished-failed-handler)
      (notification/show!
       "Can't find the permalink of this page!"
       :error))))

(defn delete!
  [page-name ok-handler]
  (when page-name
    (when-let [repo (state/get-current-repo)]
      (let [page-name (string/lower-case page-name)]
        (let [file (db-queries/get-page-file page-name)
              file-path (:file/path file)]
          ;; delete file
          (when file-path
            (db-queries/transact! [[:db.fn/retractEntity [:file/path file-path]]])
            (when-let [files-conn (declares/get-files-conn repo)]
              (d/transact! files-conn [[:db.fn/retractEntity [:file/path file-path]]]))

            (let [blocks (db-queries/get-page-blocks page-name)
                  tx-data (mapv
                           (fn [block]
                             [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                           blocks)]
              (db-queries/transact! tx-data)
              ;; remove file
              (->
               (p/let [_ (git/remove-file repo file-path)
                       _ (fs/unlink (str (util/get-repo-dir repo)
                                         "/"
                                         file-path)
                                    nil)]
                 (common-handler/check-changed-files-status)
                 (repo-handler/push-if-auto-enabled! repo))
               (p/catch (fn [err]
                          (prn "error: " err))))))

          (db-queries/transact! [[:db.fn/retractEntity [:page/name page-name]]])

          (ok-handler))))))

(defn- compute-new-file-path
  [old-path new-page-name]
  (let [result (string/split old-path "/")
        file-name (util/page-name-sanity new-page-name)
        ext (last (string/split (last result) "."))
        new-file (str file-name "." ext)
        parts (concat (butlast result) [new-file])]
    (string/join "/" parts)))

(defn rename-file!
  [file new-name ok-handler]
  (let [repo (state/get-current-repo)
        old-path (:file/path file)
        new-path (compute-new-file-path old-path new-name)]
    (->
     (p/let [_ (fs/rename (str (util/get-repo-dir repo) "/" old-path)
                          (str (util/get-repo-dir repo) "/" new-path))]
       ;; update db
       (db-queries/transact! repo [{:db/id (:db/id file)
                            :file/path new-path}])

       ;; update files db
       (let [conn (declares/get-files-conn repo)]
         (when-let [file (d/entity (d/db conn) [:file/path old-path])]
           (d/transact! conn [{:db/id (:db/id file)
                               :file/path new-path}])))

       (p/let [_ (git/rename repo old-path new-path)]
         (common-handler/check-changed-files-status)
         (ok-handler)))
     (p/catch (fn [error]
                (println "file rename failed: " error))))))

(defn rename!
  [old-name new-name]
  (when (and old-name new-name
             (not= (string/lower-case old-name) (string/lower-case new-name)))
    (when-let [repo (state/get-current-repo)]
      (if (db-utils/entity [:page/name (string/lower-case new-name)])
        (notification/show! "Page already exists!" :error)
        (when-let [page (db-utils/entity [:page/name (string/lower-case old-name)])]
          (let [old-original-name (:page/original-name page)
                file (:page/file page)
                journal? (:page/journal? page)]
            (d/transact! (declares/get-conn repo false)
                         [{:db/id (:db/id page)
                           :page/name (string/lower-case new-name)
                           :page/original-name new-name}])

            (when (and file (not journal?))
              (rename-file! file new-name
                            (fn []
                              (page-add-properties! (string/lower-case new-name) {:title new-name}))))

            ;; update all files which have references to this page
            (let [files (db-queries/get-files-that-referenced-page (:db/id page))]
              (doseq [file-path files]
                (let [file-content (react-queries/get-file file-path)
                      ;; FIXME: not safe
                      new-content (string/replace file-content
                                                  (util/format "[[%s]]" old-original-name)
                                                  (util/format "[[%s]]" new-name))]
                  (file-handler/alter-file repo
                                           file-path
                                           new-content
                                           {:reset? true
                                            :re-render-root? false})))))

          ;; TODO: update browser history, remove the current one

          ;; Redirect to the new page
          (route-handler/redirect! {:to :page
                                    :path-params {:name (string/lower-case new-name)}})

          (notification/show! "Page renamed successfully!" :success)

          (repo-handler/push-if-auto-enabled! repo)

          (ui-handler/re-render-root!))))))

(defn rename-when-alter-title-property!
  [page path format original-content content]
  (when (and page (contains? config/mldoc-support-formats format))
    (let [old-name page
          new-name (let [ast (mldoc/->edn content (mldoc/default-config format))]
                     (db-utils/get-page-name path ast))]
      (when (not= old-name new-name)
        (rename! old-name new-name)))))

(defn handle-add-page-to-contents!
  [page-name]
  (let [last-block (last (db-queries/get-page-blocks (state/get-current-repo) "contents"))
        last-empty? (>= 3 (count (:block/content last-block)))
        heading-pattern (config/get-block-pattern (state/get-preferred-format))
        pre-str (str heading-pattern heading-pattern)
        new-content (if last-empty? (str pre-str " [[" page-name "]]") (str (:block/content last-block) pre-str " [[" page-name "]]"))]
    (editor-handler/insert-new-block-aux!
     last-block
     new-content
     {:create-new-block? false
      :ok-handler
      (fn [[_first-block last-block _new-block-content]]
        (notification/show! "Added to contents!" :success)
        (editor-handler/clear-when-saved!))
      :with-level? true
      :new-level 2
      :current-page "Contents"})))

(defn load-more-journals!
  []
  (let [current-length (:journals-length @state/state)]
    (when (< current-length (db-queries/get-journals-length))
      (state/update-state! :journals-length inc))))

(defn update-public-attribute!
  [page-name value]
  (page-add-properties! page-name {:public value}))

(defn get-page-ref-text
  [page]
  (when-let [edit-block (state/get-edit-block)]
    (let [page-name (string/lower-case page)
          edit-block-file-path (-> (:db/id (:block/file edit-block))
                                   (db-utils/entity)
                                   :file/path)]
      (if (and edit-block-file-path
               (state/org-mode-file-link? (state/get-current-repo)))
        (if-let [ref-file-path (:file/path (:page/file (db-utils/entity [:page/name page-name])))]
          (util/format "[[file:%s][%s]]"
                       (util/get-relative-path edit-block-file-path ref-file-path)
                       page)
          (let [journal? (date/valid-journal-title? page)
                ref-file-path (str (get-directory journal?)
                                   "/"
                                   (get-file-name journal? page)
                                   ".org")]
            (create! page {:redirect? false})
            (util/format "[[file:%s][%s]]"
                         (util/get-relative-path edit-block-file-path ref-file-path)
                         page)))
        (util/format "[[%s]]" page)))))

(defn init-commands!
  []
  (commands/init-commands! get-page-ref-text))
