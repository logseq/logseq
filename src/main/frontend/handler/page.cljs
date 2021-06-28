(ns frontend.handler.page
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [datascript.core :as d]
            [frontend.state :as state]
            [frontend.util :as util :refer [profile]]
            [frontend.util.cursor :as cursor]
            [frontend.config :as config]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.handler.notification :as notification]
            [frontend.handler.config :as config-handler]
            [frontend.modules.shortcut.core :as shortcut]
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
    (config/get-journals-directory)
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
  ([title {:keys [redirect? create-first-block?]
           :or {redirect? true
                create-first-block? true}}]
   (let [title (string/trim title)
         pages (util/split-namespace-pages title)
         page (string/lower-case title)
         format (state/get-preferred-format)
         pages (map (fn [page]
                      (-> (block/page-name->map page true)
                          (assoc :block/format format)))
                 pages)
         txs (mapcat
              (fn [page]
                (let [page-entity [:block/uuid (:block/uuid page)]
                      create-title-property? (util/create-title-property? (:block/name page))]
                  (if create-title-property?
                    (let [default-properties (default-properties-block (:block/original-name page) format page-entity)]
                      [page default-properties])
                    [page])))
              pages)]
     (db/transact! txs)
     (when create-first-block?
       (editor-handler/insert-first-page-block-if-not-exists! page))
     (when redirect?
       (route-handler/redirect! {:to :page
                                 :path-params {:name page}})))))

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

(defn- rename-file-aux!
  [repo old-path new-path]
  (fs/rename! repo
              (if (util/electron?)
                old-path
                (str (config/get-repo-dir repo) "/" old-path))
              (if (util/electron?)
                new-path
                (str (config/get-repo-dir repo) "/" new-path))))

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
     (p/let [_ (rename-file-aux! repo old-path new-path)
             _ (when-not (config/local-db? repo)
                 (git/rename repo old-path new-path))]
       (common-handler/check-changed-files-status)
       (ok-handler))
     (p/catch (fn [error]
                (println "file rename failed: " error))))))

;; FIXME: not safe
;; 1. normal pages [[foo]]
;; 2. namespace pages [[foo/bar]]
(defn- replace-old-page!
  [s old-name new-name]
  (let [pattern "[[%s/"]
    (-> s
        (string/replace (util/format "[[%s]]" old-name) (util/format "[[%s]]" new-name))
        (string/replace (util/format pattern old-name) (util/format pattern new-name))
        (string/replace (str "#" old-name) (str "#" new-name)))))

(defn- walk-replace-old-page!
  [form old-name new-name]
  (walk/postwalk (fn [f]
                   (cond
                     (and (vector? f)
                          (contains? #{"Search" "Label"} (first f))
                          (string/starts-with? (second f) (str old-name "/")))
                     [(first f) (string/replace-first (second f)
                                                      (str old-name "/")
                                                      (str new-name "/"))]

                     (string? f)
                     (if (= f old-name)
                       new-name
                       (replace-old-page! f old-name new-name))

                     :else
                     f))
                 form))

(defn- build-new-namespace-page-title
  [old-page-title old-name new-name]
  (string/replace-first old-page-title old-name new-name))

;; FIXME: get namespace pages instead of files for compatibility with the
;; database-only version.
(defn- rename-namespace-pages!
  [repo old-name new-name]
  (doseq [datom (db/get-namespace-files repo old-name)]
    (let [old-path (:v datom)
          path-old-name (string/replace old-name "/" ".")
          path-new-name (string/replace new-name "/" ".")
          [search replace] (cond
                             (string/includes? old-path (str "." path-old-name "."))
                             [(str "." path-old-name ".") (str "." path-new-name ".")]

                             (string/includes? old-path (str "/" path-old-name "."))
                             [(str "/" path-old-name ".") (str "/" path-new-name ".")]

                             :else
                             [(str path-old-name ".") (str path-new-name ".")])
          new-path (string/replace-first old-path search replace)
          tx {:db/id (:e datom)
              :file/path new-path}
          page (db/entity (db/get-file-page-id old-path))
          page-tx (when page
                    (let [old-page-title (or (:block/original-name page)
                                             (:block/name page))
                          new-page-title (build-new-namespace-page-title old-page-title old-name new-name)]
                      {:db/id (:db/id page)
                       :block/original-name new-page-title
                       :block/name (string/lower-case new-page-title)}))
          txs (->> [tx page-tx] (remove nil?))]
      (db/transact! repo txs)
      (p/let [_ (rename-file-aux! repo old-path new-path)]
        (println "Renamed " old-path " to " new-path ".")))))

(defn rename!
  [old-name new-name]
  (let [new-name (string/trim new-name)]
    (when-not (string/blank? new-name)
      (when (and old-name new-name)
        (let [name-changed? (not= (string/lower-case (string/trim old-name))
                                  (string/lower-case (string/trim new-name)))]
          (when name-changed?
            (if (db/pull [:block/name (string/lower-case new-name)])
              (notification/show! "Page already exists!" :error)
              (when-let [repo (state/get-current-repo)]
                (when-let [page (db/pull [:block/name (string/lower-case old-name)])]
                  (let [old-original-name (:block/original-name page)
                        file (:block/file page)
                        journal? (:block/journal? page)
                        properties-block (:data (outliner-tree/-get-down (outliner-core/block page)))
                        properties-block-tx (when (and properties-block
                                                       (string/includes? (string/lower-case (:block/content properties-block))
                                                                         (string/lower-case old-name)))
                                              (let [front-matter? (and (property/front-matter? (:block/content properties-block))
                                                                       (= :markdown (:block/format properties-block)))]
                                                {:db/id (:db/id properties-block)
                                                 :block/content (property/insert-property (:block/format properties-block)
                                                                                          (:block/content properties-block)
                                                                                          :title
                                                                                          new-name
                                                                                          front-matter?)}))
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

                  (rename-namespace-pages! repo old-name new-name)

                  ;; TODO: update browser history, remove the current one

                  ;; Redirect to the new page
                  (route-handler/redirect! {:to :page
                                            :path-params {:name (string/lower-case new-name)}})

                  (notification/show! "Page renamed successfully!" :success)

                  (repo-handler/push-if-auto-enabled! repo)

                  (ui-handler/re-render-root!))))))))))

(defn handle-add-page-to-contents!
  [page-name]
  (let [content (str "[[" page-name "]]")]
    (editor-handler/api-insert-new-block!
     content
     {:page "Contents"})
    (notification/show! (util/format "Added to %s!" (state/get-favorites-name)) :success)
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
      (if-let [ref-file-path (:file/path (db/get-page-file page-name))]
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
     (init-commands!)
     (shortcut/refresh!))))

;; TODO: add use :file/last-modified-at
(defn get-pages-with-modified-at
  [repo]
  (->> (db/get-modified-pages repo)
       (remove util/file-page?)
       (remove util/uuid-string?)))

(defn get-filters
  [page-name]
  (let [properties (db/get-page-properties page-name)
        properties-str (get properties :filters "{}")]
    (try (reader/read-string properties-str)
         (catch js/Error e
           (log/error :syntax/filters e)))))

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
        (cursor/move-cursor-to input new-pos)))
    (cursor/move-cursor-forward input 2)))

(defn on-chosen-handler
  [input id q pos format]
  (let [current-pos (cursor/pos input)
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
              chosen (if (and (util/safe-re-find #"\s+" chosen) (not wrapped?))
                       (util/format "[[%s]]" chosen)
                       chosen)
              q (if @editor-handler/*selected-text "" q)
              [last-pattern forward-pos] (if wrapped?
                                           [q 3]
                                           (if (= \# (first q))
                                             [(subs q 1) 1]
                                             [q 2]))
              last-pattern (str "#" (when wrapped? "[[") last-pattern)]
          (editor-handler/insert-command! id
                                          (str "#" (when wrapped? "[[") chosen)
                                          format
                                          {:last-pattern last-pattern
                                           :forward-pos forward-pos})))
      (fn [chosen _click?]
        (state/set-editor-show-page-search! false)
        (let [page-ref-text (get-page-ref-text chosen)]
          (editor-handler/insert-command! id
                                          page-ref-text
                                          format
                                          {:last-pattern (str "[[" (if @editor-handler/*selected-text "" q))
                                           :postfix-fn   (fn [s] (util/replace-first "]]" s ""))}))))))
