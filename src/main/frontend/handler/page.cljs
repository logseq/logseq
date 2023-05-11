(ns frontend.handler.page
  "Provides util handler fns for pages"
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.format.block :as block]
            [frontend.fs :as fs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.outliner.core :as outliner-core]
            [frontend.modules.outliner.file :as outliner-file]
            [frontend.modules.outliner.tree :as outliner-tree]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.fs :as fs-util]
            [frontend.util.page-property :as page-property]
            [frontend.util.page :as page-util]
            [frontend.util.property :as property]
            [frontend.util.url :as url-util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.db.schema :as db-schema]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [promesa.core :as p]
            [logseq.common.path :as path]))

;; FIXME: add whiteboard
(defn- get-directory
  [journal?]
  (if journal?
    (config/get-journals-directory)
    (config/get-pages-directory)))

(defn- get-file-name
  [journal? title]
  (when-let [s (if journal?
                 (date/journal-title->default title)
                 ;; legacy in org-mode format, don't escape slashes except bug reported
                 (gp-util/page-name-sanity (string/lower-case title)))]
    ;; Win10 file path has a length limit of 260 chars
    (gp-util/safe-subs s 0 200)))

(defn- build-title [page]
  ;; Don't wrap `\"` anymore, as tiitle property is not effected by `,` now
  ;; The previous extract behavior isn't unwrapping the `'"` either. So no need
  ;; to maintain the compatibility.
  (:block/original-name page))

(defn default-properties-block
  ([title format page]
   (default-properties-block title format page {}))
  ([title format page properties]
   (let [p (common-handler/get-page-default-properties title)
         ps (merge p properties)
         content (page-property/insert-properties format "" ps)
         refs (gp-block/get-page-refs-from-properties properties
                                                      (db/get-db (state/get-current-repo))
                                                      (state/get-date-formatter)
                                                      (state/get-config))]
     {:block/uuid (db/new-block-id)
      :block/pre-block? true
      :block/properties ps
      :block/properties-order (keys ps)
      :block/refs refs
      :block/left page
      :block/format format
      :block/content content
      :block/parent page
      :block/page page})))

(defn- create-title-property?
  [journal? page-name]
  (and (not journal?)
       (= (state/get-filename-format) :legacy) ;; reduce title computation
       (fs-util/create-title-property? page-name)))

(defn- build-page-tx [format properties page journal? whiteboard?]
  (when (:block/uuid page)
    (let [page-entity   [:block/uuid (:block/uuid page)]
          title         (util/get-page-original-name page)
          create-title? (create-title-property? journal? title)
          page          (merge page
                               (when (seq properties) {:block/properties properties})
                               (when whiteboard? {:block/type "whiteboard"}))
          page-empty?   (db/page-empty? (state/get-current-repo) (:block/name page))]
      (cond
        (not page-empty?)
        [page]

        create-title?
        (let [properties-block (default-properties-block (build-title page) format page-entity properties)]
          [page
           properties-block])

        (seq properties)
        [page (editor-handler/properties-block properties format page-entity)]

        :else
        [page]))))

(defn create!
  "Create page.
   :redirect?           - when true, redirect to the created page, otherwise return sanitized page name.
   :split-namespace?    - when true, split hierarchical namespace into levels.
   :create-first-block? - when true, create an empty block if the page is empty.
   :uuid                - when set, use this uuid instead of generating a new one."
  ([title]
   (create! title {}))
  ([title {:keys [redirect? create-first-block? format properties split-namespace? journal? uuid whiteboard?]
           :or   {redirect?           true
                  create-first-block? true
                  format              nil
                  properties          nil
                  split-namespace?    true
                  uuid                nil}}]
   (let [title      (-> (string/trim title)
                        (text/page-ref-un-brackets!)
                        ;; remove `#` from tags
                        (string/replace #"^#+" ""))
         title      (gp-util/remove-boundary-slashes title)
         page-name  (util/page-name-sanity-lc title)
         repo       (state/get-current-repo)
         with-uuid? (if (uuid? uuid) uuid true)] ;; FIXME: prettier validation
     (when (db/page-empty? repo page-name)
       (let [pages    (if split-namespace?
                        (gp-util/split-namespace-pages title)
                        [title])
             format   (or format (state/get-preferred-format))
             pages    (map (fn [page]
                             ;; only apply uuid to the deepest hierarchy of page to create if provided.
                             (-> (block/page-name->map page (if (= page title) with-uuid? true))
                                 (assoc :block/format format)))
                           pages)
             txs      (->> pages
                           ;; for namespace pages, only last page need properties
                           drop-last
                           (mapcat #(build-page-tx format nil % journal? whiteboard?))
                           (remove nil?)
                           (remove (fn [m]
                                     (some? (db/entity [:block/name (:block/name m)])))))
             last-txs (build-page-tx format properties (last pages) journal? whiteboard?)
             txs      (concat txs last-txs)]
         (when (seq txs)
           (db/transact! txs)))

       (when create-first-block?
         (when (or
                (db/page-empty? repo (:db/id (db/entity [:block/name page-name])))
                (create-title-property? journal? page-name))
           (editor-handler/api-insert-new-block! "" {:page page-name}))))

     (when redirect?
       (route-handler/redirect-to-page! page-name))
     page-name)))

(defn delete-file!
  [repo page-name unlink-file?]
  (let [file (db/get-page-file page-name)
        file-path (:file/path file)]
    ;; delete file
    (when-not (string/blank? file-path)
      (db/transact! [[:db.fn/retractEntity [:file/path file-path]]])
      (when unlink-file?
        (-> (fs/unlink! repo (config/get-repo-fpath repo file-path) nil)
            (p/catch (fn [error] (js/console.error error))))))))

(defn- compute-new-file-path
  "Construct the full path given old full path and the file sanitized body.
   Ext. included in the `old-path`."
  [old-path new-file-name-body]
  (let [result (string/split old-path "/")
        ext (last (string/split (last result) "."))
        new-file (str new-file-name-body "." ext)
        parts (concat (butlast result) [new-file])]
    (util/string-join-path parts)))

(defn rename-file!
  "emit file-rename events to :file/rename-event-chan
   force-fs? - when true, rename file event the db transact is failed."
  ([file new-file-name-body ok-handler]
   (rename-file! file new-file-name-body ok-handler false))
  ([file new-file-name-body ok-handler force-fs?]
   (let [repo (state/get-current-repo)
         file (db/pull (:db/id file))
         old-path (:file/path file)
         new-path (compute-new-file-path old-path new-file-name-body)
         transact #(db/transact! repo [{:db/id (:db/id file)
                                        :file/path new-path}])]
    ;; update db
     (if force-fs?
       (try (transact) ;; capture error and continue FS rename if failed
            (catch :default e
              (log/error :rename-file e)))
       (transact)) ;; interrupted if failed

     (->
      (p/let [_ (state/offer-file-rename-event-chan! {:repo repo
                                                      :old-path old-path
                                                      :new-path new-path})
              _ (fs/rename! repo old-path new-path)]
        (ok-handler))
      (p/catch (fn [error]
                 (println "file rename failed: " error)))))))

(defn- replace-page-ref!
  "Unsanitized names"
  [content old-name new-name]
  (let [[original-old-name original-new-name] (map string/trim [old-name new-name])
        [old-ref new-ref] (map page-ref/->page-ref [old-name new-name])
        [old-name new-name] (map #(if (string/includes? % "/")
                                    (string/replace % "/" ".")
                                    %)
                                 [original-old-name original-new-name])
        old-org-ref (and (= :org (state/get-preferred-format))
                         (:org-mode/insert-file-link? (state/get-config))
                         (re-find
                          (re-pattern
                           (util/format
                            "\\[\\[file:\\.*/.*%s\\.org\\]\\[(.*?)\\]\\]" old-name))
                          content))]
    (-> (if old-org-ref
          (let [[old-full-ref old-label] old-org-ref
                new-label (if (= old-label original-old-name)
                            original-new-name
                            old-label)
                new-full-ref (-> (string/replace old-full-ref old-name new-name)
                                 (string/replace (str "[" old-label "]")
                                                 (str "[" new-label "]")))]
            (string/replace content old-full-ref new-full-ref))
          content)
        (string/replace old-ref new-ref))))

(defn- replace-tag-ref!
  [content old-name new-name]
  (let [old-tag (util/format "#%s" old-name)
        new-tag (if (re-find #"[\s\t]+" new-name)
                  (util/format "#[[%s]]" new-name)
                  (str "#" new-name))]
    ;; hash tag parsing rules https://github.com/logseq/mldoc/blob/701243eaf9b4157348f235670718f6ad19ebe7f8/test/test_markdown.ml#L631
    ;; Safari doesn't support look behind, don't use
    ;; TODO: parse via mldoc
    (string/replace content
                    (re-pattern (str "(?i)(^|\\s)(" (util/escape-regex-chars old-tag) ")(?=[,\\.]*($|\\s))"))
                    ;;    case_insense^    ^lhs   ^_grp2                       look_ahead^         ^_grp3
                    (fn [[_match lhs _grp2 _grp3]]
                      (str lhs new-tag)))))

(defn- replace-property-ref!
  [content old-name new-name format]
  (let [new-name (keyword (string/replace (string/lower-case new-name) #"\s+" "-"))
        org-format? (= :org format)
        old-property (if org-format? (gp-property/colons-org old-name) (str old-name gp-property/colons))
        new-property (if org-format? (gp-property/colons-org (name new-name)) (str (name new-name) gp-property/colons))]
    (util/replace-ignore-case content old-property new-property)))

(defn- replace-old-page!
  "Unsanitized names"
  [content old-name new-name format]
  (when (and (string? content) (string? old-name) (string? new-name))
    (-> content
        (replace-page-ref! old-name new-name)
        (replace-tag-ref! old-name new-name)
        (replace-property-ref! old-name new-name format))))

(defn- walk-replace-old-page!
  "Unsanitized names"
  [form old-name new-name format]
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
                       (replace-old-page! f old-name new-name format))

                     (and (keyword f) (= (name f) old-name))
                     (keyword (string/replace (string/lower-case new-name) #"\s+" "-"))

                     :else
                     f))
                 form))

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
    (let [old-favorites (:favorites (state/get-config))
          new-favorites (->> old-favorites
                             (remove #(= (string/lower-case %) (string/lower-case page-name)))
                             (vec))]
      (when-not (= old-favorites new-favorites)
        (config-handler/set-config! :favorites new-favorites)))))

(defn toggle-favorite! []
  ;; NOTE: in journals or settings, current-page is nil
  (when-let [page-name (state/get-current-page)]
   (let [favorites  (:favorites (state/sub-config))
         favorited? (contains? (set (map string/lower-case favorites))
                               (string/lower-case page-name))]
    (if favorited?
      (unfavorite-page! page-name)
      (favorite-page! page-name)))))

(defn delete!
  [page-name ok-handler & {:keys [delete-file?]
                           :or {delete-file? true}}]
  (route-handler/redirect-to-home!)
  (when page-name
    (when-let [repo (state/get-current-repo)]
      (let [page-name (util/page-name-sanity-lc page-name)
            blocks (db/get-page-blocks-no-cache page-name)
            tx-data (mapv
                     (fn [block]
                       [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                     blocks)
            page (db/entity [:block/name page-name])]
        (db/transact! tx-data)

        (delete-file! repo page-name delete-file?)

        ;; if other page alias this pagename,
        ;; then just remove some attrs of this entity instead of retractEntity
        (when-not (:block/_namespace page)
          (if (model/get-alias-source-page (state/get-current-repo) page-name)
            (when-let [id (:db/id (db/entity [:block/name page-name]))]
              (let [txs (mapv (fn [attribute]
                                [:db/retract id attribute])
                              db-schema/retract-page-attributes)]
                (db/transact! txs)))
            (db/transact! [[:db.fn/retractEntity [:block/name page-name]]])))

        (unfavorite-page! page-name)

        (when (fn? ok-handler) (ok-handler))
        (ui-handler/re-render-root!)))))

(defn- rename-update-block-refs!
  [refs from-id to-id]
  (->> refs
       (remove #{{:db/id from-id}})
       (cons {:db/id to-id})
       (distinct)
       (vec)))

(defn- rename-update-refs!
  "Unsanitized only"
  [page old-original-name new-name]
  ;; update all pages which have references to this page
  (let [repo (state/get-current-repo)
        to-page (db/entity [:block/name (util/page-name-sanity-lc new-name)])
        blocks (:block/_refs (db/entity (:db/id page)))
        page-ids (->> (map (fn [b]
                             {:db/id (:db/id (:block/page b))}) blocks)
                      (set))
        tx       (->> (map (fn [{:block/keys [uuid content properties format] :as block}]
                             (let [content    (let [content' (replace-old-page! content old-original-name new-name format)]
                                                (when-not (= content' content)
                                                  content'))
                                   properties (let [properties' (walk-replace-old-page! properties old-original-name new-name format)]
                                                (when-not (= properties' properties)
                                                  properties'))]
                               (when (or content properties)
                                 (util/remove-nils-non-nested
                                  {:block/uuid       uuid
                                   :block/content    content
                                   :block/properties properties
                                   :block/properties-order (when (seq properties)
                                                             (map first properties))
                                   :block/refs (->> (rename-update-block-refs! (:block/refs block) (:db/id page) (:db/id to-page))
                                                    (map :db/id)
                                                    (set))})))) blocks)
                      (remove nil?))]
    (db/transact! repo tx)
    (doseq [page-id page-ids]
      (outliner-file/sync-to-file page-id))))

(defn- rename-update-namespace!
  "update :block/namespace of the renamed block"
  [page old-original-name new-name]
  (let [old-namespace? (text/namespace-page? old-original-name)
        new-namespace? (text/namespace-page? new-name)
        update-namespace! (fn [] (let [namespace (first (gp-util/split-last "/" new-name))]
                                   (when namespace
                                     (create! namespace {:redirect? false}) ;; create parent page if not exist, creation of namespace ref is handled in `create!`
                                     (let [namespace-block (db/pull [:block/name (gp-util/page-name-sanity-lc namespace)])
                                           repo                (state/get-current-repo)
                                           page-txs [{:db/id (:db/id page)
                                                      :block/namespace (:db/id namespace-block)}]]
                                       (d/transact! (db/get-db repo false) page-txs)))))
        remove-namespace! (fn []
                            (db/transact! [[:db/retract (:db/id page) :block/namespace]]))]

    (when old-namespace?
      (if new-namespace?
        (update-namespace!)
        (remove-namespace!)))

    (when-not old-namespace?
      (when new-namespace?
        (update-namespace!)))))

(defn- rename-page-aux
  "Only accepts unsanitized page names"
  [old-name new-name redirect?]
  (let [old-page-name       (util/page-name-sanity-lc old-name)
        new-file-name-body  (fs-util/file-name-sanity new-name) ;; w/o file extension
        new-page-name       (util/page-name-sanity-lc new-name)
        repo                (state/get-current-repo)
        page                (db/pull [:block/name old-page-name])]
    (when (and repo page)
      (let [old-original-name   (:block/original-name page)
            file                (:block/file page)
            journal?            (:block/journal? page)
            properties-block    (:data (outliner-tree/-get-down (outliner-core/block page)))
            properties-content  (:block/content properties-block)
            properties-block-tx (when (and properties-block
                                           properties-content
                                           (string/includes? (util/page-name-sanity-lc properties-content)
                                                             old-page-name))
                                  (let [front-matter? (and (property/front-matter? properties-content)
                                                           (= :markdown (:block/format properties-block)))]
                                    {:db/id         (:db/id properties-block)
                                     :block/content (property/insert-property (:block/format properties-block)
                                                                              properties-content
                                                                              :title
                                                                              new-name
                                                                              front-matter?)}))
            page-txs            [{:db/id               (:db/id page)
                                  :block/uuid          (:block/uuid page)
                                  :block/name          new-page-name
                                  :block/original-name new-name}]
            page-txs            (if properties-block-tx (conj page-txs properties-block-tx) page-txs)]

        (d/transact! (db/get-db repo false) page-txs)

        (when (fs-util/create-title-property? new-page-name)
          (page-property/add-property! new-page-name :title new-name))

        (when (and file (not journal?))
          (rename-file! file new-file-name-body (fn [] nil)))


        (let [home (get (state/get-config) :default-home {})]
          (when (= old-page-name (util/page-name-sanity-lc (get home :page "")))
            (config-handler/set-config! :default-home (assoc home :page new-name))))

        (rename-update-refs! page old-original-name new-name)

        (rename-update-namespace! page old-original-name new-name)

        (outliner-file/sync-to-file page))

      ;; Redirect to the newly renamed page
      (when redirect?
        (route-handler/redirect! {:to          (if (model/whiteboard-page? page) :whiteboard :page)
                                  :push        false
                                  :path-params {:name new-page-name}}))

      (when (favorited? old-page-name)
        (p/do!
         (unfavorite-page! old-page-name)
         (favorite-page! new-page-name)))

      (recent-handler/update-or-add-renamed-page repo old-page-name new-page-name)

      (ui-handler/re-render-root!))))

(defn- rename-nested-pages
  "Unsanitized names only"
  [old-ns-name new-ns-name]
  (let [repo            (state/get-current-repo)
        nested-page-str (page-ref/->page-ref (util/page-name-sanity-lc old-ns-name))
        ns-prefix-format-str (str page-ref/left-brackets "%s/")
        ns-prefix       (util/format ns-prefix-format-str (util/page-name-sanity-lc old-ns-name))
        nested-pages    (db/get-pages-by-name-partition repo nested-page-str)
        nested-pages-ns (db/get-pages-by-name-partition repo ns-prefix)]
    (when nested-pages
      ;; rename page "[[obsidian]] is a tool" to "[[logseq]] is a tool"
      (doseq [{:block/keys [name original-name]} nested-pages]
        (let [old-page-title (or original-name name)
              new-page-title (string/replace
                              old-page-title
                              (page-ref/->page-ref old-ns-name)
                              (page-ref/->page-ref new-ns-name))]
          (when (and old-page-title new-page-title)
            (p/do!
             (rename-page-aux old-page-title new-page-title false)
             (println "Renamed " old-page-title " to " new-page-title))))))
    (when nested-pages-ns
      ;; rename page "[[obsidian/page1]] is a tool" to "[[logseq/page1]] is a tool"
      (doseq [{:block/keys [name original-name]} nested-pages-ns]
        (let [old-page-title (or original-name name)
              new-page-title (string/replace
                              old-page-title
                              (util/format ns-prefix-format-str old-ns-name)
                              (util/format ns-prefix-format-str new-ns-name))]
          (when (and old-page-title new-page-title)
            (p/do!
             (rename-page-aux old-page-title new-page-title false)
             (println "Renamed " old-page-title " to " new-page-title))))))))

(defn- rename-namespace-pages!
  "Original names (unsanitized only)"
  [repo old-name new-name]
  (let [pages (db/get-namespace-pages repo old-name)
        page (db/pull [:block/name (util/page-name-sanity-lc old-name)])
        pages (cons page pages)]
    (doseq [{:block/keys [name original-name]} pages]
      (let [old-page-title (or original-name name)
            ;; only replace one time, for the case that the namespace is a sub-string of the sub-namespace page name
            ;; Example: has pages [[work]] [[work/worklog]],
            ;; we want to rename [[work/worklog]] to [[work1/worklog]] when rename [[work]] to [[work1]],
            ;; but don't rename [[work/worklog]] to [[work1/work1log]]
            new-page-title (string/replace-first old-page-title old-name new-name)
            redirect? (= name (:block/name page))]
        (when (and old-page-title new-page-title)
          (p/let [_ (rename-page-aux old-page-title new-page-title redirect?)]
            (println "Renamed " old-page-title " to " new-page-title)))))))

(defn merge-pages!
  "Only accepts sanitized page names"
  [from-page-name to-page-name]
  (when (and (db/page-exists? from-page-name)
             (db/page-exists? to-page-name)
             (not= from-page-name to-page-name))
    (let [to-page (db/entity [:block/name to-page-name])
          to-id (:db/id to-page)
          from-page (db/entity [:block/name from-page-name])
          from-id (:db/id from-page)
          from-first-child (some->> (db/pull from-id)
                                    (outliner-core/block)
                                    (outliner-tree/-get-down)
                                    (outliner-core/get-data))
          to-last-direct-child-id (model/get-block-last-direct-child (db/get-db) to-id false)
          repo (state/get-current-repo)
          conn (conn/get-db repo false)
          datoms (d/datoms @conn :avet :block/page from-id)
          block-eids (mapv :e datoms)
          blocks (db-utils/pull-many repo '[:db/id :block/page :block/refs :block/path-refs :block/left :block/parent] block-eids)
          tx-data (map (fn [block]
                         (let [id (:db/id block)]
                           (cond->
                            {:db/id id
                             :block/page {:db/id to-id}
                             :block/refs (rename-update-block-refs! (:block/refs block) from-id to-id)}

                             (and from-first-child (= id (:db/id from-first-child)))
                             (assoc :block/left {:db/id (or to-last-direct-child-id to-id)})

                             (= (:block/parent block) {:db/id from-id})
                             (assoc :block/parent {:db/id to-id})))) blocks)]
      (d/transact! conn tx-data)
      (outliner-file/sync-to-file {:db/id to-id})

      (rename-update-refs! from-page
                           (util/get-page-original-name from-page)
                           (util/get-page-original-name to-page))

      (rename-update-namespace! from-page
                                (util/get-page-original-name from-page)
                                (util/get-page-original-name to-page)))


    (delete! from-page-name nil)

    (route-handler/redirect! {:to          :page
                              :push        false
                              :path-params {:name to-page-name}})))

(defn rename!
  "Accepts unsanitized page names"
  ([old-name new-name] (rename! old-name new-name true))
  ([old-name new-name redirect?]
    (let [repo          (state/get-current-repo)
          old-name      (string/trim old-name)
          new-name      (string/trim new-name)
          old-page-name (util/page-name-sanity-lc old-name)
          new-page-name (util/page-name-sanity-lc new-name)
          name-changed? (not= old-name new-name)]
      (if (and old-name
              new-name
              (not (string/blank? new-name))
              name-changed?)
        (do
          (cond
            (= old-page-name new-page-name)
            (rename-page-aux old-name new-name redirect?)

            (db/pull [:block/name new-page-name])
            (merge-pages! old-page-name new-page-name)

            :else
            (rename-namespace-pages! repo old-name new-name))
          (rename-nested-pages old-name new-name))
        (when (string/blank? new-name)
          (notification/show! "Please use a valid name, empty name is not allowed!" :error)))
      (ui-handler/re-render-root!))))

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
                       distinct
                       vec)]
        (config-handler/set-config! :favorites favorites)))))

(defn has-more-journals?
  []
  (let [current-length (:journals-length @state/state)]
    (< current-length (db/get-journals-length))))

(defn load-more-journals!
  []
  (when (has-more-journals?)
    (state/set-journals-length! (+ (:journals-length @state/state) 7))))

(defn update-public-attribute!
  [page-name value]
  (page-property/add-property! page-name :public value))

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
              ref-file-path (str
                             (if (or (util/electron?) (mobile-util/native-platform?))
                               (-> (config/get-repo-dir (state/get-current-repo))
                                   js/decodeURI
                                   (string/replace #"/+$" "")
                                   (str "/"))
                               "")
                             (get-directory journal?)
                             "/"
                             (get-file-name journal? page)
                             ".org")]
          (create! page {:redirect? false})
          (util/format "[[file:%s][%s]]"
                       (util/get-relative-path edit-block-file-path ref-file-path)
                       page)))
      (page-ref/->page-ref page))))

(defn init-commands!
  []
  (commands/init-commands! get-page-ref-text))

(def rebuild-slash-commands-list!
  (debounce init-commands! 1500))

(defn template-exists?
  [title]
  (when title
    (let [templates (keys (db/get-all-templates))]
      (when (seq templates)
        (let [templates (map string/lower-case templates)]
          (contains? (set templates) (string/lower-case title)))))))

(defn ls-dir-files!
  ([ok-handler] (ls-dir-files! ok-handler nil))
  ([ok-handler opts]
   (web-nfs/ls-dir-files-with-handler!
    (fn [e]
      (init-commands!)
      (when ok-handler
        (ok-handler e)))
    opts)))

(defn get-all-pages
  [repo]
  (->> (db/get-all-pages repo)
       (remove (fn [p]
                 (let [name (:block/name p)]
                   (or (util/uuid-string? name)
                       (gp-config/draw? name)
                       (db/built-in-pages-names (string/upper-case name))))))
       (common-handler/fix-pages-timestamps)))

(defn get-filters
  [page-name]
  (let [properties (db/get-page-properties page-name)
        properties-str (get properties :filters "{}")]
    (try (reader/read-string properties-str)
         (catch :default e
           (log/error :syntax/filters e)))))

(defn save-filter!
  [page-name filter-state]
  (page-property/add-property! page-name :filters filter-state))

;; Editor
(defn page-not-exists-handler
  [input id q current-pos]
  (state/clear-editor-action!)
  (if (state/org-mode-file-link? (state/get-current-repo))
    (let [page-ref-text (get-page-ref-text q)
          value (gobj/get input "value")
          old-page-ref (page-ref/->page-ref q)
          new-value (string/replace value
                                    old-page-ref
                                    page-ref-text)]
      (state/set-edit-content! id new-value)
      (let [new-pos (+ current-pos
                       (- (count page-ref-text)
                          (count old-page-ref))
                       2)]
        (cursor/move-cursor-to input new-pos)))
    (let [current-selected (util/get-selected-text)]
      (cursor/move-cursor-forward input (+ 2 (count current-selected))))))

(defn on-chosen-handler
  [input id _q pos format]
  (let [current-pos (cursor/pos input)
        edit-content (state/sub [:editor/content id])
        action (state/get-editor-action)
        hashtag? (= action :page-search-hashtag)
        q (or
           (editor-handler/get-selected-text)
           (when hashtag?
             (gp-util/safe-subs edit-content pos current-pos))
           (when (> (count edit-content) current-pos)
             (gp-util/safe-subs edit-content pos current-pos)))]
    (if hashtag?
      (fn [chosen _click?]
        (state/clear-editor-action!)
        (let [wrapped? (= page-ref/left-brackets (gp-util/safe-subs edit-content (- pos 2) pos))
              prefix (str (t :new-page) ": ")
              chosen (if (string/starts-with? chosen prefix) ;; FIXME: What if a page named "New page: XXX"?
                       (string/replace-first chosen prefix "")
                       chosen)
              chosen (if (and (util/safe-re-find #"\s+" chosen) (not wrapped?))
                       (page-ref/->page-ref chosen)
                       chosen)
              q (if (editor-handler/get-selected-text) "" q)
              last-pattern (if wrapped?
                             q
                             (if (= \# (first q))
                               (subs q 1)
                               q))
              last-pattern (str "#" (when wrapped? page-ref/left-brackets) last-pattern)]
          (editor-handler/insert-command! id
                                          (str "#" (when wrapped? page-ref/left-brackets) chosen)
                                          format
                                          {:last-pattern last-pattern
                                           :end-pattern (when wrapped? page-ref/right-brackets)
                                           :command :page-ref})))
      (fn [chosen _click?]
        (state/clear-editor-action!)
        (let [prefix (str (t :new-page) ": ")
              chosen (if (string/starts-with? chosen prefix)
                       (string/replace-first chosen prefix "")
                       chosen)
              page-ref-text (get-page-ref-text chosen)]
          (editor-handler/insert-command! id
                                          page-ref-text
                                          format
                                          {:last-pattern (str page-ref/left-brackets (if (editor-handler/get-selected-text) "" q))
                                           :end-pattern page-ref/right-brackets
                                           :postfix-fn   (fn [s] (util/replace-first page-ref/right-brackets s ""))
                                           :command :page-ref}))))))

(defn create-today-journal!
  []
  (when-let [repo (state/get-current-repo)]
    (when (and (state/enable-journals? repo)
               (not (state/loading-files? repo))
               (not (state/whiteboard-route?)))
      (state/set-today! (date/today))
      (when (or (config/local-db? repo)
                (and (= "local" repo) (not (mobile-util/native-platform?))))
        (let [title (date/today)
              today-page (util/page-name-sanity-lc title)
              format (state/get-preferred-format repo)
              file-name (date/journal-title->default title)
              file-rpath (str (config/get-journals-directory) "/" file-name "."
                              (config/get-file-extension format))
              repo-dir (config/get-repo-dir repo)
              template (state/get-default-journal-template)]
          (p/let [file-exists? (fs/file-exists? repo-dir file-rpath)
                  file-content (when file-exists?
                                 (fs/read-file repo-dir file-rpath))]
            (when (and (db/page-empty? repo today-page)
                       (or (not file-exists?)
                           (and file-exists? (string/blank? file-content))))
              (create! title {:redirect? false
                              :split-namespace? false
                              :create-first-block? (not template)
                              :journal? true})
              (state/pub-event! [:journal/insert-template today-page])
              (ui-handler/re-render-root!)
              (plugin-handler/hook-plugin-app :today-journal-created {:title today-page}))))))))

(defn open-today-in-sidebar
  []
  (when-let [page (db/entity [:block/name (util/page-name-sanity-lc (date/today))])]
    (state/sidebar-add-block!
     (state/get-current-repo)
     (:db/id page)
     :page)))

(defn open-file-in-default-app []
  (if-let [file-rpath (and (util/electron?) (page-util/get-page-file-rpath))]
    (let [repo-dir (config/get-repo-dir (state/get-current-repo))
          file-fpath (path/path-join repo-dir file-rpath)]
      (js/window.apis.openPath file-fpath))
    (notification/show! "No file found" :warning)))

(defn copy-current-file
  "FIXME: clarify usage, copy file or copy file path"
  []
  (if-let [file-rpath (and (util/electron?) (page-util/get-page-file-rpath))]
    (let [repo-dir (config/get-repo-dir (state/get-current-repo))
          file-fpath (path/path-join repo-dir file-rpath)]
      (util/copy-to-clipboard! file-fpath))
    (notification/show! "No file found" :warning)))

(defn open-file-in-directory []
  (if-let [file-rpath (and (util/electron?) (page-util/get-page-file-rpath))]
    (let [repo-dir (config/get-repo-dir (state/get-current-repo))
          file-fpath (path/path-join repo-dir file-rpath)]
      (js/window.apis.showItemInFolder file-fpath))
    (notification/show! "No file found" :warning)))

(defn copy-page-url
  ([] (copy-page-url (page-util/get-current-page-name)))
  ([page-name]
   (if page-name
     (util/copy-to-clipboard!
      (url-util/get-logseq-graph-page-url nil (state/get-current-repo) page-name))
     (notification/show! "No page found to copy" :warning))))
