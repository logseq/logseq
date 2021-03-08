(ns frontend.handler.page
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [datascript.core :as d]
            [frontend.state :as state]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.project :as project-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.handler.notification :as notification]
            [frontend.handler.config :as config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [clojure.walk :as walk]
            [frontend.git :as git]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [frontend.format.mldoc :as mldoc]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [cljs.reader :as reader]
            [goog.object :as gobj]))

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
   (let [title (and title (string/trim title))
         repo (state/get-current-repo)
         dir (config/get-repo-dir repo)
         journal-page? (date/valid-journal-title? title)
         directory (get-directory journal-page?)]
     (when dir
       (p/let [_ (-> (fs/mkdir! (str dir "/" directory))
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
               ;; Create the file
               (let [content (util/default-content-with-title format title)]
                 ;; Write to the db first, then write to the filesystem,
                 ;; otherwise, the main electron ipc will notify that there's
                 ;; a new file created.
                 ;; Question: what if the fs write failed?
                 (p/let [_ (file-handler/reset-file! repo path content)
                         _ (fs/create-if-not-exists repo dir file-path content)
                         _ (git-handler/git-add repo path)]
                   (when redirect?
                     (route-handler/redirect! {:to :page
                                               :path-params {:name page}})

                     ;; Edit the first block
                     (let [blocks (db/get-page-blocks page)
                           last-block (last blocks)]
                       (when last-block
                         (js/setTimeout
                          #(editor-handler/edit-last-block-for-new-page! last-block 0)
                          100))))))))))))))

(defn page-add-properties!
  [page-name properties]
  (let [page (db/entity [:page/name page-name])
        page-title (:or (:page/original-name page) (:page/name page))
        file (:page/file page)]
    (if file
      (let [page-format (db/get-page-format page-name)
            properties-content (db/get-page-properties-content page-name)
            properties-content (if properties-content
                                 (string/trim properties-content)
                                 (config/properties-wrapper page-format))
            file (db/entity (:db/id (:page/file page)))
            file-path (:file/path file)
            file-content (db/get-file file-path)
            after-content (subs file-content (inc (count properties-content)))
            new-properties-content (db/add-properties! page-format properties-content properties)
            full-content (str new-properties-content "\n\n" (string/trim after-content))]
        (file-handler/alter-file (state/get-current-repo)
                                 file-path
                                 full-content
                                 {:reset? true
                                  :re-render-root? true}))
      (p/let [_ (create! page-name)]
        (page-add-properties! page-name properties)))))

(defn page-remove-property!
  [page-name k]
  (when-let [properties-content (string/trim (db/get-page-properties-content page-name))]
    (let [page (db/entity [:page/name page-name])
          file (db/entity (:db/id (:page/file page)))
          file-path (:file/path file)
          file-content (db/get-file file-path)
          after-content (subs file-content (count properties-content))
          page-format (db/get-page-format page-name)
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
  ([page-name project-add-modal export-page-html]
   (publish-page-as-slide! page-name (db/get-page-blocks page-name) project-add-modal export-page-html))
  ([page-name blocks project-add-modal export-page-html]
   (project-handler/exists-or-create!
    (fn [project]
      (config-handler/set-config! [:project :name] project)
      (page-add-properties! page-name {"published" true
                                       "slide" true})
      (let [properties (db/get-page-properties page-name)
            plugins (get-plugins blocks)
            data {:project project
                  :title page-name
                  :permalink (:permalink properties)
                  :html (export-page-html page-name blocks notification/show!)
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
  [page-name project-add-modal export-page-html]
  (project-handler/exists-or-create!
   (fn [project]
     (let [properties (db/get-page-properties page-name)
           slide? (let [slide (:slide properties)]
                    (or (true? slide)
                        (= "true" slide)))
           blocks (db/get-page-blocks page-name)
           plugins (get-plugins blocks)]
       (p/let [_ (config-handler/set-config! [:project :name] project)]
         (if slide?
           (publish-page-as-slide! page-name blocks project-add-modal)
           (do
             (page-add-properties! page-name {"published" true})
             (let [data {:project project
                         :title page-name
                         :permalink (:permalink properties)
                         :html (export-page-html page-name blocks notification/show!)
                         :tags (:tags properties)
                         :settings (merge properties plugins)
                         :repo (state/get-current-repo)}]
               (util/post (str config/api "pages")
                          data
                          (published-success-handler page-name)
                          published-failed-handler))))
         (state/close-modal!))))
   project-add-modal))

(defn unpublished-success-handler
  [page-name]
  (fn [result]
    (state/close-modal!)
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
  (let [properties (db/get-page-properties page-name)
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
        (let [file (db/get-page-file page-name)
              file-path (:file/path file)]
          ;; delete file
          (when-not (string/blank? file-path)
            (db/transact! [[:db.fn/retractEntity [:file/path file-path]]])
            (when-let [files-conn (db/get-files-conn repo)]
              (d/transact! files-conn [[:db.fn/retractEntity [:file/path file-path]]]))

            (let [blocks (db/get-page-blocks page-name)
                  tx-data (mapv
                           (fn [block]
                             [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                           blocks)]
              (db/transact! tx-data)
              ;; remove file
              (->
               (p/let [_ (or (config/local-db? repo) (git/remove-file repo file-path))
                       _ (fs/unlink! (config/get-repo-path repo file-path) nil)]
                 (common-handler/check-changed-files-status)
                 (repo-handler/push-if-auto-enabled! repo))
               (p/catch (fn [err]
                          (js/console.error "error: " err))))))

          (db/transact! [[:db.fn/retractEntity [:page/name page-name]]])

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
    ;; update db
    (db/transact! repo [{:db/id (:db/id file)
                         :file/path new-path}])

    ;; update files db
    (let [conn (db/get-files-conn repo)]
      (when-let [file (d/entity (d/db conn) [:file/path old-path])]
        (d/transact! conn [{:db/id (:db/id file)
                            :file/path new-path}])))

    (->
     (p/let [_ (fs/rename! repo
                           (if (util/electron?)
                             old-path
                             (str (config/get-repo-dir repo) "/" old-path))
                           (if (util/electron?)
                             new-path
                             (str (config/get-repo-dir repo) "/" new-path)))
             _ (when-not (config/local-db? repo)
                 (git/rename repo old-path new-path))]
       (common-handler/check-changed-files-status)
       (ok-handler))
     (p/catch (fn [error]
                (println "file rename failed: " error))))))

(defn rename!
  [old-name new-name]
  (when (and old-name new-name
             (not= (string/lower-case old-name) (string/lower-case new-name)))
    (when-let [repo (state/get-current-repo)]
      (if (db/entity [:page/name (string/lower-case new-name)])
        (notification/show! "Page already exists!" :error)
        (when-let [page (db/entity [:page/name (string/lower-case old-name)])]
          (let [old-original-name (:page/original-name page)
                file (:page/file page)
                journal? (:page/journal? page)]
            (d/transact! (db/get-conn repo false)
                         [{:db/id (:db/id page)
                           :page/name (string/lower-case new-name)
                           :page/original-name new-name}])

            (when (and file (not journal?))
              (rename-file! file new-name
                            (fn []
                              (page-add-properties! (string/lower-case new-name) {:title new-name}))))

            ;; update all files which have references to this page
            (let [files (db/get-files-that-referenced-page (:db/id page))]
              (doseq [file-path files]
                (let [file-content (db/get-file file-path)
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
                     (db/get-page-name path ast))
          journal? (date/valid-journal-title? old-name)]
      (if (not= old-name new-name)
        (if journal?
          [true old-name]
          (do
            (rename! old-name new-name)
            [false new-name]))
        [journal? old-name]))))

(defn handle-add-page-to-contents!
  [page-name]
  (let [last-block (last (db/get-page-blocks (state/get-current-repo) "contents"))
        last-empty? (>= 3 (count (:block/content last-block)))
        heading-pattern (config/get-block-pattern (state/get-preferred-format))
        pre-str (str heading-pattern heading-pattern)
        new-content (if last-empty?
                      (str pre-str " [[" page-name "]]")
                      (str (string/trimr (:block/content last-block))
                           "\n"
                           pre-str " [[" page-name "]]"))]
    (editor-handler/insert-new-block-aux!
     last-block
     new-content
     {:create-new-block? false
      :ok-handler
      (fn [_]
        (notification/show! "Added to contents!" :success)
        (editor-handler/clear-when-saved!))
      :with-level? true
      :new-level 2
      :current-page "Contents"})))

(defn load-more-journals!
  []
  (let [current-length (:journals-length @state/state)]
    (when (< current-length (db/get-journals-length))
      (state/update-state! :journals-length inc))))

(defn update-public-attribute!
  [page-name value]
  (page-add-properties! page-name {:public value}))

(defn get-page-ref-text
  [page]
  (when-let [edit-block (state/get-edit-block)]
    (let [page-name (string/lower-case page)
          edit-block-file-path (-> (:db/id (:block/file edit-block))
                                   (db/entity)
                                   :file/path)]
      (if (and edit-block-file-path
               (state/org-mode-file-link? (state/get-current-repo)))
        (if-let [ref-file-path (:file/path (:page/file (db/entity [:page/name page-name])))]
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

(defn delete-page-from-logseq
  [project permalink]
  (let [url (util/format "%s%s/%s" config/api project permalink)]
    (js/Promise.
     (fn [resolve reject]
       (util/delete url
                    (fn [result]
                      (resolve result))
                    (fn [error]
                      (log/error :page/http-delete-failed error)
                      (reject error)))))))

(defn get-page-list-by-project-name
  [project]
  (js/Promise.
   (fn [resolve _]
     (if-not (string? project)
       (resolve :project-name-is-invalid)
       (let [url (util/format "%sprojects/%s/pages" config/api project)]
         (util/fetch url
                     (fn [result]
                       (log/debug :page/get-page-list result)
                       (let [data (:result result)]
                         (if (sequential? data)
                           (do (state/set-published-pages data)
                               (resolve data))
                           (log/error :page/http-get-list-result-malformed result))))
                     (fn [error]
                       (log/error :page/http-get-list-failed error)
                       (resolve error))))))))

(defn update-state-and-notify
  [page-name]
  (page-add-properties! page-name {:published false})
  (notification/show! (util/format "Remove Page \"%s\" from Logseq server success" page-name) :success))

(defn add-page-to-recent!
  [repo page]
  (let [pages (or (db/get-key-value repo :recent/pages)
                  '())
        new-pages (take 12 (distinct (cons page pages)))]
    (db/set-key-value repo :recent/pages new-pages)))

(defn template-exists?
  [title]
  (when title
    (let [templates (keys (db/get-all-templates))]
      (when (seq templates)
        (let [templates (map string/lower-case templates)]
          (contains? (set templates) (string/lower-case title)))))))

(defn ls-dir-files!
  []
  (web-nfs/ls-dir-files-with-handler!
    (fn []
      (init-commands!))))


;; TODO: add use :file/last-modified-at
(defn get-pages-with-modified-at
  [repo]
  (->> (db/get-modified-pages repo)
       (remove util/file-page?)))

(defn save-filter!
  [page-name filter-state]
  (if (empty? filter-state)
    (page-remove-property! page-name "filters")
    (page-add-properties! page-name {"filters" filter-state})))

(defn get-filter
  [page-name]
  (let [properties (db/get-page-properties page-name)]
    (atom (reader/read-string (get-in properties [:filters] "{}")))))

(defn page-exists?
  [page-name]
  (when page-name
    (db/entity [:page/name page-name])))

;; Editor
(defn page-not-exists-handler
  [input id q current-pos]
  (state/set-editor-show-page-search! false)
  (if (state/org-mode-file-link? (state/get-current-repo))
    (let [page-ref-text (get-page-ref-text q)
          value (gobj/get input "value")
          old-page-ref (util/format "[[%s]]" q)
          new-value (string/replace value
                                    old-page-ref
                                    page-ref-text)]
      (state/set-edit-content! id new-value)
      (let [new-pos (+ current-pos
                       (- (count page-ref-text)
                          (count old-page-ref))
                       2)]
        (util/move-cursor-to input new-pos)))
    (util/cursor-move-forward input 2)))

(defn on-chosen-handler
  [input id q pos format]
  (let [current-pos (:pos (util/get-caret-pos input))
        edit-content (state/sub [:editor/content id])
        edit-block (state/sub :editor/block)
        q (or
           @editor-handler/*selected-text
           (when (state/sub :editor/show-page-search-hashtag?)
             (util/safe-subs edit-content pos current-pos))
           (when (> (count edit-content) current-pos)
             (util/safe-subs edit-content pos current-pos)))]
    (if (state/sub :editor/show-page-search-hashtag?)
      (fn [chosen _click?]
        (state/set-editor-show-page-search! false)
        (let [chosen (if (re-find #"\s+" chosen)
                       (util/format "[[%s]]" chosen)
                       chosen)]
          (editor-handler/insert-command! id
                                          (str "#" chosen)
                                          format
                                          {:last-pattern (let [q (if @editor-handler/*selected-text "" q)]
                                                           (if (and q (string/starts-with? q "#"))
                                                             q
                                                             (str "#" q)))})))
      (fn [chosen _click?]
        (state/set-editor-show-page-search! false)
        (let [page-ref-text (get-page-ref-text chosen)]
          (editor-handler/insert-command! id
                                          page-ref-text
                                          format
                                          {:last-pattern (str "[[" (if @editor-handler/*selected-text "" q))
                                           :postfix-fn   (fn [s] (util/replace-first "]]" s ""))}))))))
