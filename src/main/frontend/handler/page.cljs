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
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.handler.notification :as notification]
            [frontend.handler.config :as config-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [clojure.walk :as walk]
            [frontend.git :as git]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [frontend.format.block :as block]
            [cljs.reader :as reader]
            [goog.object :as gobj]
            [clojure.data :as data]))

(defn- get-directory
  [journal?]
  (if journal?
    config/default-journals-directory
    (config/get-pages-directory)))

(defn- get-file-name
  [journal? title]
  (when-let [s (if journal?
                 (date/journal-title->default title)
                 (util/page-name-sanity (string/lower-case title)))]
    ;; Win10 file path has a length limit of 260 chars
    (util/safe-subs s 0 200)))

(defn create!
  ([title]
   (create! title {}))
  ([title {:keys [redirect?]
           :or {redirect? true}}]
   (let [title (string/trim title)
         page (string/lower-case title)]
     (let [tx (block/page-name->map title true)]
       (db/transact! [tx]))
     (when redirect?
      (route-handler/redirect! {:to :page
                                :path-params {:name page}})))))

(defn page-add-properties!
  [page-name properties]
  (let [page (db/entity [:block/name page-name])
        page-title (:or (:block/original-name page) (:block/name page))
        file (:block/file page)]
    (if file
      (let [page-format (db/get-page-format page-name)
            properties-content (db/get-page-properties-content page-name)
            properties-content (if properties-content
                                 (string/trim properties-content)
                                 (config/properties-wrapper page-format))
            file (db/entity (:db/id (:block/file page)))
            file-path (:file/path file)
            file-content (db/get-file file-path)
            after-content (if (string/blank? properties-content)
                            file-content
                            (subs file-content (inc (count properties-content))))
            properties-content (if properties-content
                                 (string/trim properties-content)
                                 (config/properties-wrapper page-format))
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
    (let [page (db/entity [:block/name page-name])
          file (db/entity (:db/id (:block/file page)))
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

          (db/transact! [[:db.fn/retractEntity [:block/name page-name]]])

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

;; FIXME: not safe
(defn- replace-old-page!
  [s old-name new-name]
  (-> s
      (string/replace (util/format "[[%s]]" old-name) (util/format "[[%s]]" new-name))
      (string/replace (str "#" old-name) (str "#" new-name))))

(defn- walk-replace-old-page!
  [form old-name new-name]
  (walk/postwalk (fn [f] (if (string? f)
                          (if (= f old-name)
                            new-name
                            (replace-old-page! f old-name new-name))
                           f)) form))

(defn rename!
  [old-name new-name]
  (let [new-name (string/trim new-name)]
    (when-not (string/blank? new-name)
      (when (and old-name new-name)
        (let [name-changed? (not= (string/lower-case (string/trim old-name))
                                  (string/lower-case (string/trim new-name)))]
          (when-let [repo (state/get-current-repo)]
            (when-let [page (db/entity [:block/name (string/lower-case old-name)])]
              (let [old-original-name (:block/original-name page)
                    file (:block/file page)
                    journal? (:block/journal? page)]
                (d/transact! (db/get-conn repo false)
                             [{:db/id (:db/id page)
                               :block/uuid (:block/uuid page)
                               :block/name (string/lower-case new-name)
                               :block/original-name new-name}])

                (when (and file (not journal?) name-changed?)
                  (rename-file! file new-name (fn [] nil)))

                ;; update all files which have references to this page
                (let [blocks (db/get-page-referenced-blocks-no-cache (:db/id page))
                      page-ids (->> (map :block/page blocks)
                                    (remove nil?)
                                    (set))
                      tx (->> (map (fn [{:block/keys [uuid title content properties] :as block}]
                                     (let [title (let [title' (walk-replace-old-page! title old-original-name new-name)]
                                                   (when-not (= title' title)
                                                     title'))
                                           content (let [content' (replace-old-page! content old-original-name new-name)]
                                                     (when-not (= content' content)
                                                       content'))
                                           properties (let [properties' (walk-replace-old-page! properties old-original-name new-name)]
                                                        (when-not (= properties' properties)
                                                          properties'))]
                                       (when (or title content properties)
                                         (util/remove-nils-non-nested
                                          {:block/uuid uuid
                                           :block/title title
                                           :block/content content
                                           :block/properties properties})))) blocks)
                              (remove nil?))]
                  (db/transact! repo tx)
                  (doseq [page-id page-ids]
                    (outliner-file/sync-to-file page-id))))

              ;; TODO: update browser history, remove the current one

              ;; Redirect to the new page
              (route-handler/redirect! {:to :page
                                        :path-params {:name (string/lower-case new-name)}})

              (notification/show! "Page renamed successfully!" :success)

              (repo-handler/push-if-auto-enabled! repo)

              (ui-handler/re-render-root!))))))))

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
     {}
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

(defn has-more-journals?
  []
  (let [current-length (:journals-length @state/state)]
    (< current-length (db/get-journals-length))))

(defn load-more-journals!
  []
  (when (has-more-journals?)
    (state/update-state! :journals-length inc)))

(defn update-public-attribute!
  [page-name value]
  (page-add-properties! page-name {:public value}))

(defn get-page-ref-text
  [page]
  (let [edit-block-file-path (some-> (state/get-edit-block)
                                     (get-in [:block/file :db/id])
                                     db/entity
                                     :file/path)
        page-name (string/lower-case page)]
    (if (and edit-block-file-path
             (state/org-mode-file-link? (state/get-current-repo)))
      (if-let [ref-file-path (:file/path (:file/file (db/entity [:file/name page-name])))]
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
      (util/format "[[%s]]" page))))

(defn init-commands!
  []
  (commands/init-commands! get-page-ref-text))

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
    (db/entity [:block/name page-name])))

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
