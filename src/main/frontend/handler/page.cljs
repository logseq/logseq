(ns frontend.handler.page
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db-schema :as db-schema]
            [frontend.db.model :as model]
            [frontend.format.block :as block]
            [frontend.fs :as fs]
            [frontend.git :as git]
            [frontend.handler.common :as common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.handler.config :as config-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.property :as property]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

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
  ([page-name]
   (when page-name
     (let [page-name (string/lower-case page-name)]
       (when-let [page (db/entity [:block/name page-name])]
        (:file/path (:block/file page)))))))

(defn- build-title [page]
  (let [original-name (:block/original-name page)]
    (if (string/includes? original-name ",")
      (util/format "\"%s\"" original-name)
      original-name)))

(defn- build-page-tx [format properties page journal?]
  (when (:block/uuid page)
    (let [page-entity [:block/uuid (:block/uuid page)]
          create-title-property? (and (not journal?)
                                      (util/create-title-property? (:block/name page)))
          page (if (seq properties) (assoc page :block/properties properties) page)]
      (cond
        (and (seq properties) create-title-property?)
        [page (editor-handler/default-properties-block (build-title page) format page-entity properties)]

        create-title-property?
        [page (editor-handler/default-properties-block (build-title page) format page-entity)]

        (seq properties)
        [page (editor-handler/properties-block properties format page-entity)]

        :else
        [page]))))

(defn create!
  ([title]
   (create! title {}))
  ([title {:keys [redirect? create-first-block? format properties split-namespace? journal?]
           :or   {redirect?           true
                  create-first-block? true
                  format              nil
                  properties          nil
                  split-namespace?    true}}]
   (let [title (string/trim title)
         title (util/remove-boundary-slashes title)
         page (string/lower-case title)]
     (when-not (db/entity [:block/name page])
       (let [title    (string/trim title)
             pages    (if split-namespace?
                        (util/split-namespace-pages title)
                        [title])
             format   (or format (state/get-preferred-format))
             pages    (map (fn [page]
                             (-> (block/page-name->map page true)
                                 (assoc :block/format format)))
                        pages)
             txs      (->> pages
                           ;; for namespace pages, only last page need properties
                           drop-last
                           (mapcat #(build-page-tx format nil % journal?))
                           (remove nil?))
             last-txs (build-page-tx format properties (last pages) journal?)
             txs      (concat txs last-txs)]

         ;; (util/pprint txs)
         (db/transact! txs)

         (when create-first-block?
           (editor-handler/insert-first-page-block-if-not-exists! page))

         (when-let [page (db/entity [:block/name page])]
           (outliner-file/sync-to-file page))

         (when redirect?
           (route-handler/redirect! {:to          :page
                                     :path-params {:name page}}))
         page)))))

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
                     :block/pre-block? true}]
          (outliner-core/insert-node (outliner-core/block block)
                                     (outliner-core/block page)
                                     false)
          (db/transact! [(assoc page-id :block/properties {key value})])
          (db/refresh! repo {:key :block/change
                             :data [block]})
          (ui-handler/re-render-root!)
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

(defn delete-file!
  [repo page-name]
  (let [file (db/get-page-file page-name)
        file-path (:file/path file)]
    ;; delete file
    (when-not (string/blank? file-path)
      (db/transact! [[:db.fn/retractEntity [:file/path file-path]]])
      (->
       (p/let [_ (or (config/local-db? repo) (git/remove-file repo file-path))
               _ (fs/unlink! repo (config/get-repo-path repo file-path) nil)]
         (common-handler/check-changed-files-status)
         (repo-handler/push-if-auto-enabled! repo))
       (p/catch (fn [err]
                  (js/console.error "error: " err)))))))

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
;; 3. what if there's a tag `#foobar` and we want to replace `#foo` with `#something`?
(defn- replace-old-page!
  [s old-name new-name]
  (let [get-tag (fn [s]
                  (if (string/includes? s " ")
                    (str "#[[" s "]]")
                    (str "#" s)))
        old-tag-pattern (let [old-tag (get-tag old-name)]
                          (re-pattern (str "(?i)" old-tag)))
        old-ref-pattern (re-pattern (util/format "(?i)\\[\\[%s\\]\\]" old-name))
        namespace-prefix-pattern "[[%s/"
        old-namespace-pattern (re-pattern (str "(?i)"
                                               (util/format "\\[\\[%s/" old-name)))]
    (-> s
        (string/replace old-ref-pattern (util/format "[[%s]]" new-name))
        (string/replace old-namespace-pattern (util/format namespace-prefix-pattern new-name))
        (string/replace old-tag-pattern (get-tag new-name)))))

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

(defn- get-new-file-path
  [old-path old-name new-name]
  (let [path-old-name (string/replace old-name "/" ".")
        path-new-name (string/replace new-name "/" ".")
        [search replace] (cond
                           (string/includes? old-path (str "." path-old-name "."))
                           [(str "." path-old-name ".") (str "." path-new-name ".")]

                           (string/includes? old-path (str "/" path-old-name "."))
                           [(str "/" path-old-name ".") (str "/" path-new-name ".")]

                           :else
                           [(str path-old-name ".") (str path-new-name ".")])]
    (string/replace-first old-path search replace)))

(defn- rename-namespace-pages!
  [repo old-name new-name]
  (let [pages (db/get-namespace-pages repo old-name)]
    (doseq [{:block/keys [name original-name file] :as page} pages]
      (let [old-page-title (or original-name name)
            new-page-title (build-new-namespace-page-title old-page-title old-name new-name)
            page-tx {:db/id (:db/id page)
                     :block/original-name new-page-title
                     :block/name (string/lower-case new-page-title)}
            old-path (:file/path file)
            new-path (when old-path
                       (get-new-file-path old-path old-name new-name))
            file-tx (when file
                      {:db/id (:db/id file)
                       :file/path new-path})
            txs (->> [file-tx page-tx] (remove nil?))]
        (db/transact! repo txs)
        (when (and old-path new-path)
          (p/let [_ (rename-file-aux! repo old-path new-path)]
            (println "Renamed " old-path " to " new-path)))))))

(defn favorited?
  [page-name]
  (let [favorites (->> (:favorites (state/get-config))
                       (filter string?)
                       (map string/lower-case)
                       (set))]
    (contains? favorites page-name)))

(defn favorite-page!
  [page-name]
  (when-not (string/blank? page-name)
    (let [favorites (->
                     (cons
                      page-name
                      (or (:favorites (state/get-config)) []))
                     (distinct)
                     (vec))]
      (config-handler/set-config! :favorites favorites))))

(defn unfavorite-page!
  [page-name]
  (when-not (string/blank? page-name)
    (let [favorites (->> (:favorites (state/get-config))
                         (remove #(= (string/lower-case %) (string/lower-case page-name)))
                         (vec))]
      (config-handler/set-config! :favorites favorites))))

(defn delete!
  [page-name ok-handler]
  (when page-name
    (when-let [repo (state/get-current-repo)]
      (let [page-name (string/lower-case page-name)
            blocks (db/get-page-blocks page-name)
            tx-data (mapv
                     (fn [block]
                       [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                     blocks)]
        (db/transact! tx-data)

        (delete-file! repo page-name)

        ;; if other page alias this pagename,
        ;; then just remove some attrs of this entity instead of retractEntity
        (if (model/get-alias-source-page (state/get-current-repo) page-name)
          (when-let [id (:db/id (db/entity [:block/name page-name]))]
            (let [txs (mapv (fn [attribute]
                              [:db/retract id attribute])
                            db-schema/retract-page-attributes)]
              (db/transact! txs)))
          (db/transact! [[:db.fn/retractEntity [:block/name page-name]]]))

        (unfavorite-page! page-name)

        (ok-handler)))))

(defn- rename-page-aux [old-name new-name]
  (when-let [repo (state/get-current-repo)]
    (when-let [page (db/pull [:block/name (string/lower-case old-name)])]
      (let [old-original-name   (:block/original-name page)
            file                (:block/file page)
            journal?            (:block/journal? page)
            properties-block    (:data (outliner-tree/-get-down (outliner-core/block page)))
            properties-block-tx (when (and properties-block
                                           (string/includes? (string/lower-case (:block/content properties-block))
                                                             (string/lower-case old-name)))
                                  (let [front-matter? (and (property/front-matter? (:block/content properties-block))
                                                           (= :markdown (:block/format properties-block)))]
                                    {:db/id         (:db/id properties-block)
                                     :block/content (property/insert-property (:block/format properties-block)
                                                                              (:block/content properties-block)
                                                                              :title
                                                                              new-name
                                                                              front-matter?)}))
            page-txs            [{:db/id               (:db/id page)
                                  :block/uuid          (:block/uuid page)
                                  :block/name          (string/lower-case new-name)
                                  :block/original-name new-name}]
            page-txs            (if properties-block-tx (conj page-txs properties-block-tx) page-txs)]

        (d/transact! (db/get-conn repo false) page-txs)

        (when (not= (util/page-name-sanity new-name) new-name)
          (page-add-property! new-name :title new-name))

        (when (and file (not journal?))
          (rename-file! file new-name (fn [] nil)))

        ;; update all files which have references to this page
        (let [blocks   (db/get-page-referenced-blocks-no-cache (:db/id page))
              page-ids (->> (map :block/page blocks)
                            (remove nil?)
                            (set))
              tx       (->> (map (fn [{:block/keys [uuid title content properties] :as block}]
                                   (let [title      (let [title' (walk-replace-old-page! title old-original-name new-name)]
                                                      (when-not (= title' title)
                                                        title'))
                                         content    (let [content' (replace-old-page! content old-original-name new-name)]
                                                      (when-not (= content' content)
                                                        content'))
                                         properties (let [properties' (walk-replace-old-page! properties old-original-name new-name)]
                                                      (when-not (= properties' properties)
                                                        properties'))]
                                     (when (or title content properties)
                                       (util/remove-nils-non-nested
                                        {:block/uuid       uuid
                                         :block/title      title
                                         :block/content    content
                                         :block/properties properties})))) blocks)
                            (remove nil?))]
          (db/transact! repo tx)
          (doseq [page-id page-ids]
            (outliner-file/sync-to-file page-id)))

        (outliner-file/sync-to-file page))

      (rename-namespace-pages! repo old-name new-name)

      ;; TODO: update browser history, remove the current one

      ;; Redirect to the new page
      (route-handler/redirect! {:to          :page
                                :push        false
                                :path-params {:name (string/lower-case new-name)}})

      (notification/show! "Page renamed successfully!" :success)

      (repo-handler/push-if-auto-enabled! repo)

      (when (favorited? old-name)
        (p/let [_ (unfavorite-page! old-name)]
          (favorite-page! new-name)))

      (ui-handler/re-render-root!))))

(defn rename!
  [old-name new-name]
  (let [old-name      (string/trim old-name)
        new-name      (string/trim new-name)
        name-changed? (not= old-name new-name)]
    (when (and old-name
               new-name
               (not (string/blank? new-name))
               name-changed?)
      (cond
        (= (string/lower-case old-name) (string/lower-case new-name))
        (rename-page-aux old-name new-name)

        (db/pull [:block/name (string/lower-case new-name)])
        (notification/show! "Page already exists!" :error)

        :else
        (rename-page-aux old-name new-name)))))

(defn- split-col-by-element
  [col element]
  (let [col (vec col)
        idx (.indexOf col element)]
    [(subvec col 0 (inc idx))
     (subvec col (inc idx))]))

(defn reorder-favorites!
  [{:keys [to up?]}]
  (let [favorites (:favorites (state/get-config))
        from (get @state/state :favorites/dragging)]
    (when (and from to (not= from to))
      (let [[prev next] (split-col-by-element favorites to)
            [prev next] (mapv #(remove (fn [e] (= from e)) %) [prev next])
            favorites (->>
                       (if up?
                         (concat (drop-last prev) [from (last prev)] next)
                         (concat prev [from] next))
                       (remove nil?)
                       (distinct))]
        (config-handler/set-config! :favorites favorites)))))

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
  (let [edit-block-file-path (model/get-block-file-path (state/get-edit-block))
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
        new-pages (take 15 (distinct (cons page pages)))]
    (db/set-key-value repo :recent/pages new-pages)))

(defn template-exists?
  [title]
  (when title
    (let [templates (keys (db/get-all-templates))]
      (when (seq templates)
        (let [templates (map string/lower-case templates)]
          (contains? (set templates) (string/lower-case title)))))))

(defn ls-dir-files!
  [ok-handler]
  (web-nfs/ls-dir-files-with-handler!
   (fn []
     (init-commands!)
     (when ok-handler (ok-handler)))))

(defn get-all-pages
  [repo]
  (->> (db/get-all-pages repo)
       (remove (fn [p]
                 (let [name (:block/name p)]
                   (or (util/uuid-string? name)
                       (db/built-in-pages-names (string/upper-case name))))))
       (common-handler/fix-pages-timestamps)))

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
                                           :end-pattern "]]"
                                           :forward-pos forward-pos})))
      (fn [chosen _click?]
        (state/set-editor-show-page-search! false)
        (let [page-ref-text (get-page-ref-text chosen)]
          (editor-handler/insert-command! id
                                          page-ref-text
                                          format
                                          {:last-pattern (str "[[" (if @editor-handler/*selected-text "" q))
                                           :end-pattern "]]"
                                           :postfix-fn   (fn [s] (util/replace-first "]]" s ""))
                                           :forward-pos 3}))))))

(defn create-today-journal!
  []
  (when-let [repo (state/get-current-repo)]
    (when (state/enable-journals? repo)
      (state/set-today! (date/today))
      (when (or (db/cloned? repo)
                (or (config/local-db? repo)
                    (= "local" repo)))
        (let [title (date/today)
              today-page (string/lower-case title)
              template (state/get-default-journal-template)
              format (state/get-preferred-format repo)
              file-name (date/journal-title->default title)
              path (str (config/get-journals-directory) "/" file-name "."
                        (config/get-file-extension format))
              file-path (str "/" path)
              repo-dir (config/get-repo-dir repo)]
          (p/let [file-exists? (fs/file-exists? repo-dir file-path)]
            (when (and (db/page-empty? repo today-page)
                       (not file-exists?))
              (create! title {:redirect? false
                              :split-namespace? false
                              :create-first-block? (not template)
                              :journal? true})
              (when template
                (let [page (db/pull [:block/name today-page])]
                  (editor-handler/insert-template!
                   nil
                   template
                   {:get-pos-fn (fn []
                                  [page false false false])
                    :page-block page})
                  (ui-handler/re-render-root!))))))))))

(defn open-today-in-sidebar
  []
  (when-let [page (db/entity [:block/name (string/lower-case (date/today))])]
    (state/sidebar-add-block!
     (state/get-current-repo)
     (:db/id page)
     :page
     page)))
