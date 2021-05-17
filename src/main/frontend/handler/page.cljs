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
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.commands :as commands]
            [frontend.date :as date]
            [clojure.walk :as walk]
            [frontend.git :as git]
            [frontend.fs :as fs]
            [frontend.util.property :as property]
            [promesa.core :as p]
            [lambdaisland.glogi :as log]
            [frontend.format.block :as block]
            [cljs.reader :as reader]
            [goog.object :as gobj]
            [clojure.data :as data]))

(defn- get-directory
  [journal?]
  (if journal?
    (config/default-journals-directory)
    (config/get-pages-directory)))

(defn- get-file-name
  [journal? title]
  (when-let [s (if journal?
                 (date/journal-title->default title)
                 (util/page-name-sanity (string/lower-case title)))]
    ;; Win10 file path has a length limit of 260 chars
    (util/safe-subs s 0 200)))

(defn get-page-file-path
  ([] (get-page-file-path (state/get-current-page)))
  ([page-name] (when-let [page (db/entity [:block/name page-name])]
                 (:file/path (:block/file page)))))

(defn default-properties-block
  [title format page]
  (let [properties (common-handler/get-page-default-properties title)
        content (property/build-properties-str format properties)]
    {:block/pre-block? true
     :block/uuid (db/new-block-id)
     :block/properties properties
     :block/left page
     :block/format format
     :block/content content
     :block/parent page
     :block/unordered true
     :block/page page}))

(defn create!
  ([title]
   (create! title {}))
  ([title {:keys [redirect?]
           :or {redirect? true}}]
   (let [title (string/trim title)
         page (string/lower-case title)
         tx (block/page-name->map title true)
         format (state/get-preferred-format)
         page-entity [:block/uuid (:block/uuid tx)]
         create-title-property? (util/include-windows-reserved-chars? title)
         default-properties (default-properties-block title format page-entity)
         empty-block {:block/uuid (db/new-block-id)
                      :block/left [:block/uuid (:block/uuid default-properties)]
                      :block/format format
                      :block/content ""
                      :block/parent page-entity
                      :block/unordered true
                      :block/page page-entity}
         txs (if create-title-property?
               [tx default-properties empty-block]
               [tx])]
     (db/transact! txs)
     (when redirect?
      (route-handler/redirect! {:to :page
                                :path-params {:name page}})
      (when create-title-property?
        (js/setTimeout (fn []
                        (editor-handler/edit-block! empty-block 0 format (:block/uuid empty-block))) 50))))))

(defn page-add-property!
  [page-name key value]
  (when-let [page (db/pull [:block/name (string/lower-case page-name)])]
    (let [repo (state/get-current-repo)
          key (keyword key)
          pre-block (db/get-pre-block repo (:db/id page))
          format (state/get-preferred-format)
          page-id {:db/id (:db/id page)}
          org? (= format :org)
          value (if (contains? #{:filters} key) (pr-str value) value)]
      (if pre-block
        (let [properties (:block/properties pre-block)
              new-properties (assoc properties key value)
              content (:block/content pre-block)
              front-matter? (property/front-matter? content)
              new-content (property/insert-property format content key value front-matter?)
              block {:db/id (:db/id pre-block)
                     :block/properties new-properties
                     :block/content new-content
                     :block/page page-id}
              tx [(assoc page-id :block/properties new-properties)
                  block]]
          ;; (util/pprint tx)
          (db/transact! tx)
          (db/refresh! repo {:key :block/change
                             :data [block]}))
        (let [block {:block/uuid (db/new-block-id)
                     :block/left page-id
                     :block/parent page-id
                     :block/page page-id
                     :block/title []
                     :block/content (if org?
                                      (str "#+" (string/upper-case (name key)) ": " value)
                                      (str (name key) ":: " value))
                     :block/format format
                     :block/properties {key value}
                     :block/file (:block/file page)
                     :block/pre-block? true}]
          (outliner-core/insert-node (outliner-core/block block)
                                     (outliner-core/block page)
                                     false)
          (db/transact! [(assoc page-id :block/properties {key value})])
          (db/refresh! repo {:key :block/change
                             :data [block]})
          ;; (ui-handler/re-render-root!)
          ))
      (outliner-file/sync-to-file page-id))))

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
        file (db/pull (:db/id file))
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
            (when-let [page (db/pull [:block/name (string/lower-case old-name)])]
              (let [old-original-name (:block/original-name page)
                    file (:block/file page)
                    journal? (:block/journal? page)
                    properties-block (:data (outliner-tree/-get-down (outliner-core/block page)))
                    properties-block-tx (when (and properties-block
                                                   (string/includes? (string/lower-case (:block/content properties-block))
                                                                     (string/lower-case old-name)))
                                          {:db/id (:db/id properties-block)
                                           :block/content (property/insert-property (:block/format properties-block)
                                                                                 (:block/content properties-block)
                                                                                 :title
                                                                                 new-name)})
                    page-txs [{:db/id (:db/id page)
                               :block/uuid (:block/uuid page)
                               :block/name (string/lower-case new-name)
                               :block/original-name new-name}]
                    page-txs (if properties-block-tx (conj page-txs properties-block-tx) page-txs)]

                (d/transact! (db/get-conn repo false) page-txs)

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
                    (outliner-file/sync-to-file page-id)))

                (outliner-file/sync-to-file page))

              ;; TODO: update browser history, remove the current one

              ;; Redirect to the new page
              (route-handler/redirect! {:to :page
                                        :path-params {:name (string/lower-case new-name)}})

              (notification/show! "Page renamed successfully!" :success)

              (repo-handler/push-if-auto-enabled! repo)

              (ui-handler/re-render-root!))))))))

(defn handle-add-page-to-contents!
  [page-name]
  (let [content (str "[[" page-name "]]")]
    (editor-handler/api-insert-new-block!
     content
     {:page "Contents"
      :sibling? true})
    (notification/show! "Added to contents!" :success)
    (editor-handler/clear-when-saved!)))

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
  (page-add-property! page-name :public value))

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

(defn get-filters
  [page-name]
  (let [properties (db/get-page-properties page-name)]
    (reader/read-string (get properties :filters "{}"))))

(defn save-filter!
  [page-name filter-state]
  (page-add-property! page-name :filters filter-state))

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
        (let [wrapped? (= "[[" (util/safe-subs edit-content (- pos 2) pos))
              chosen (if (and (re-find #"\s+" chosen) (not wrapped?))
                       (util/format "[[%s]]" chosen)
                       chosen)]
          (editor-handler/insert-command! id
                                          (str "#" (when wrapped? "[[") chosen)
                                          format
                                          {:last-pattern (let [q (if @editor-handler/*selected-text "" q)]
                                                           (str "#" (when wrapped? "[[") q))
                                           :forward-pos (if wrapped? 3 2)})))
      (fn [chosen _click?]
        (state/set-editor-show-page-search! false)
        (let [page-ref-text (get-page-ref-text chosen)]
          (editor-handler/insert-command! id
                                          page-ref-text
                                          format
                                          {:last-pattern (str "[[" (if @editor-handler/*selected-text "" q))
                                           :postfix-fn   (fn [s] (util/replace-first "]]" s ""))}))))))
