(ns frontend.handler.page
  "Provides util handler fns for pages"
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [electron.ipc :as ipc]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.db.model :as model]
            [frontend.fs :as fs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.file-based.nfs :as nfs-handler]
            [frontend.handler.graph :as graph-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.outliner.op :as outliner-op]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.persist-db.browser :as db-browser]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.page :as page-util]
            [frontend.util.url :as url-util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.graph-parser.db :as gp-db]
            [logseq.graph-parser.text :as text]
            [promesa.core :as p]
            [frontend.handler.file-based.page-property :as file-page-property]))

(def <create! page-common-handler/<create!)
(def <delete! page-common-handler/<delete!)

(defn <unfavorite-page!
  [page-name]
  (p/do!
   (let [repo (state/get-current-repo)]
     (if (config/db-based-graph? repo)
       (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
         (page-common-handler/<db-unfavorite-page! page-block-uuid))
       (page-common-handler/file-unfavorite-page! page-name)))
   (state/update-favorites-updated!)))

(defn <favorite-page!
  [page-name]
  (p/do!
   (let [repo (state/get-current-repo)]
     (if (config/db-based-graph? repo)
       (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
         (page-common-handler/<db-favorite-page! page-block-uuid))
       (page-common-handler/file-favorite-page! page-name)))
   (state/update-favorites-updated!)))

(defn favorited?
  [page-name]
  (let [repo (state/get-current-repo)]
    (if (config/db-based-graph? repo)
      (boolean
       (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
         (page-common-handler/db-favorited? page-block-uuid)))
      (page-common-handler/file-favorited? page-name))))

(defn get-favorites
  "return page-block entities"
  []
  (when-let [db (conn/get-db)]
    (let [repo (state/get-current-repo)]
      (if (config/db-based-graph? repo)
        (when-let [page (ldb/get-page db common-config/favorites-page-name)]
          (let [blocks (ldb/sort-by-order (:block/_parent page))]
            (keep (fn [block]
                    (when-let [block-db-id (:db/id (:block/link block))]
                      (d/entity db block-db-id))) blocks)))
        (let [page-names (->> (:favorites (state/sub-config))
                              (remove string/blank?)
                              (filter string?)
                              (mapv util/safe-page-name-sanity-lc)
                              (distinct))]
          (keep (fn [page-name] (db/get-page page-name)) page-names))))))

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
                 (common-util/page-name-sanity (string/lower-case title)))]
    ;; Win10 file path has a length limit of 260 chars
    (common-util/safe-subs s 0 200)))

(defn toggle-favorite! []
  ;; NOTE: in journals or settings, current-page is nil
  (when-let [page-name (state/get-current-page)]
    (if (favorited? page-name)
      (<unfavorite-page! page-name)
      (<favorite-page! page-name))))

(defn rename!
  [page-uuid-or-old-name new-name & {:as _opts}]
  (when @db-browser/*worker
    (p/let [page-uuid (cond
                        (uuid? page-uuid-or-old-name)
                        page-uuid-or-old-name
                        (common-util/uuid-string? page-uuid-or-old-name)
                        page-uuid-or-old-name
                        :else
                        (:block/uuid (db/get-page page-uuid-or-old-name)))
            result (ui-outliner-tx/transact!
                    {:outliner-op :rename-page}
                    (outliner-op/rename-page! page-uuid new-name))
            result' (ldb/read-transit-str result)]
      (case (if (string? result') (keyword result') result')
        :invalid-empty-name
        (notification/show! "Please use a valid name, empty name is not allowed!" :warning)
        :rename-page-exists
        (notification/show! "Another page with the new name exists already" :warning)
        nil))))

(defn <reorder-favorites!
  [favorites]
  (let [conn (conn/get-db false)]
    (when-let [favorites-page (db/get-page common-config/favorites-page-name)]
      (let [favorite-page-block-db-id-coll
            (keep (fn [page-uuid]
                    (:db/id (db/get-page page-uuid)))
                  favorites)
            current-blocks (ldb/sort-by-order (ldb/get-page-blocks @conn (:db/id favorites-page)))]
        (p/do!
         (ui-outliner-tx/transact!
          {:outliner-op :reorder-favorites}
          (doseq [[page-block-db-id block] (zipmap favorite-page-block-db-id-coll current-blocks)]
            (when (not= page-block-db-id (:db/id (:block/link block)))
              (outliner-op/save-block! (assoc block :block/link page-block-db-id)))))
         (state/update-favorites-updated!))))))

(defn has-more-journals?
  []
  (let [current-length (:journals-length @state/state)]
    (< current-length (db/get-journals-length))))

(defn load-more-journals!
  []
  (when (has-more-journals?)
    (state/set-journals-length! (+ (:journals-length @state/state) 7))))

(defn update-public-attribute!
  [repo page value]
  (if (config/db-based-graph? repo)
    (db-property-handler/set-block-property! [:block/uuid (:block/uuid page)] :logseq.property/publishing-public? value)
    (file-page-property/add-property! page :public value)))

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
          (<create! page {:redirect? false})
          (util/format "[[file:%s][%s]]"
                       (util/get-relative-path edit-block-file-path ref-file-path)
                       page)))
      (page-ref/->page-ref page))))

(defn init-commands!
  []
  (commands/init-commands! get-page-ref-text))

(def rebuild-slash-commands-list!
  (debounce init-commands! 1500))

(defn <template-exists?
  [title]
  (when title
    (p/let [result (db-async/<get-all-templates (state/get-current-repo))
            templates (keys result)]
      (when (seq templates)
        (let [templates (map string/lower-case templates)]
          (contains? (set templates) (string/lower-case title)))))))

(defn ls-dir-files!
  ([ok-handler] (ls-dir-files! ok-handler nil))
  ([ok-handler opts]
   (nfs-handler/ls-dir-files-with-handler!
    (fn [e]
      (init-commands!)
      (when ok-handler
        (ok-handler e))
      (graph-handler/settle-metadata-to-local! {:created-at (js/Date.now)}))
    opts)))

(defn get-all-pages
  [repo]
  (let [db-based? (config/db-based-graph? repo)
        graph-specific-hidden?
        (if db-based?
          (fn [p]
            (and (ldb/property? p) (ldb/built-in? p)))
          (fn [p]
            (gp-db/built-in-pages-names (string/upper-case (:block/name p)))))]
    (cond->>
     (->> (db/get-all-pages repo)
          (remove graph-specific-hidden?))
      (not db-based?)
      (common-handler/fix-pages-timestamps))))

(defn get-filters
  [page]
  (if (config/db-based-graph? (state/get-current-repo))
    (let [included-pages (:logseq.property.linked-references/includes page)
          excluded-pages (:logseq.property.linked-references/excludes page)]
      {:included included-pages
       :excluded excluded-pages})
    (let [k :filters
          properties (:block/properties page)
          properties-str (or (get properties k) "{}")]
      (try (let [result (reader/read-string properties-str)]
             (when (seq result)
               (let [excluded-pages (->> (filter #(false? (second %)) result)
                                         (keep first)
                                         (keep db/get-page))
                     included-pages (->> (filter #(true? (second %)) result)
                                         (keep first)
                                         (keep db/get-page))]
                 {:included included-pages
                  :excluded excluded-pages})))
           (catch :default e
             (log/error :syntax/filters e))))))

(defn file-based-save-filter!
  [page filter-state]
  (property-handler/add-page-property! page :filters filter-state))

(defn db-based-save-filter!
  [page filter-page-id {:keys [include? add?]}]
  (let [repo (state/get-current-repo)
        property-id (if include?
                      :logseq.property.linked-references/includes
                      :logseq.property.linked-references/excludes)]
    (if add?
      (property-handler/set-block-property! repo (:db/id page) property-id filter-page-id)
      (db-property-handler/delete-property-value! (:db/id page) property-id filter-page-id))))

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

(defn- tag-on-chosen-handler
  [input id pos format current-pos edit-content q db-based?]
  (fn [chosen-result ^js e]
    (util/stop e)
    (state/clear-editor-action!)
    (let [chosen-result (if (:block/uuid chosen-result)
                          (db/entity [:block/uuid (:block/uuid chosen-result)])
                          chosen-result)
          target (first (:block/_alias chosen-result))
          chosen-result (if (and target (not (ldb/class? chosen-result)) (ldb/class? target)) target chosen-result)
          chosen (:block/title chosen-result)
          class? (and db-based?
                      (or (string/includes? chosen (str (t :new-tag) " "))
                          (ldb/class? chosen-result)))
          inline-tag? (and class? (= (.-identifier e) "auto-complete/meta-complete"))
          chosen (-> chosen
                     (string/replace-first (str (t :new-tag) " ") "")
                     (string/replace-first (str (t :new-page) " ") ""))
          wrapped? (= page-ref/left-brackets (common-util/safe-subs edit-content (- pos 2) pos))
          chosen-last-part (if (text/namespace-page? chosen)
                             (text/get-namespace-last-part chosen)
                             chosen)
          wrapped-tag (if (and (util/safe-re-find #"\s+" chosen-last-part) (not wrapped?))
                        (page-ref/->page-ref chosen-last-part)
                        chosen-last-part)
          q (if (editor-handler/get-selected-text) "" q)
          last-pattern (if wrapped?
                         q
                         (if (= \# (first q))
                           (subs q 1)
                           q))
          last-pattern (str "#" (when wrapped? page-ref/left-brackets) last-pattern)
          tag-in-page-auto-complete? (= page-ref/right-brackets (common-util/safe-subs edit-content current-pos (+ current-pos 2)))]
      (p/do!
       (editor-handler/insert-command! id
                                       (if (and class? (not inline-tag?)) "" (str "#" wrapped-tag))
                                       format
                                       {:last-pattern last-pattern
                                        :end-pattern (when wrapped? page-ref/right-brackets)
                                        :command :page-ref})
       (when (and db-based? (not tag-in-page-auto-complete?))
         (db-page-handler/tag-on-chosen-handler chosen chosen-result class? edit-content current-pos last-pattern))
       (when input (.focus input))))))

(defn- page-on-chosen-handler
  [id format q db-based?]
  (fn [chosen-result e]
    (util/stop e)
    (state/clear-editor-action!)
    (p/let [chosen-result (if (:block/uuid chosen-result)
                            (db/entity [:block/uuid (:block/uuid chosen-result)])
                            chosen-result)
            chosen (:block/title chosen-result)
            chosen' (string/replace-first chosen (str (t :new-page) " ") "")
            [chosen' chosen-result] (or (when (and (:nlp-date? chosen-result) (not (de/entity? chosen-result)))
                                          (when-let [result (date/nld-parse chosen')]
                                            (let [d (doto (goog.date.DateTime.) (.setTime (.getTime result)))
                                                  gd (goog.date.Date. (.getFullYear d) (.getMonth d) (.getDate d))
                                                  page (date/js-date->journal-title gd)]
                                              [page (db/get-page page)])))
                                        [chosen' chosen-result])
            ref-text (if (and (de/entity? chosen-result) (not (ldb/page? chosen-result)))
                       (page-ref/->page-ref (:block/uuid chosen-result))
                       (get-page-ref-text chosen'))
            result (when db-based?
                     (when-not (de/entity? chosen-result)
                       (<create! chosen'
                                 {:redirect? false
                                  :create-first-block? false
                                  :split-namespace? true})))
            ref-text' (if result
                        (let [title (:block/title result)]
                          (page-ref/->page-ref title))
                        ref-text)]
      (p/do!
       (editor-handler/insert-command! id
                                       ref-text'
                                       format
                                       {:last-pattern (str page-ref/left-brackets (if (editor-handler/get-selected-text) "" q))
                                        :end-pattern page-ref/right-brackets
                                        :postfix-fn   (fn [s] (util/replace-first page-ref/right-brackets s ""))
                                        :command :page-ref})
       (p/let [chosen-result (or result chosen-result)]
         (when (de/entity? chosen-result)
           (state/conj-block-ref! chosen-result)))))))

(defn on-chosen-handler
  [input id pos format]
  (let [current-pos (cursor/pos input)
        edit-content (state/get-edit-content)
        action (state/get-editor-action)
        hashtag? (= action :page-search-hashtag)
        q (or
           (editor-handler/get-selected-text)
           (when hashtag?
             (common-util/safe-subs edit-content pos current-pos))
           (when (> (count edit-content) current-pos)
             (common-util/safe-subs edit-content pos current-pos)))
        db-based? (config/db-based-graph? (state/get-current-repo))]
    (if hashtag?
      (tag-on-chosen-handler input id pos format current-pos edit-content q db-based?)
      (page-on-chosen-handler id format q db-based?))))

(defn create-today-journal!
  []
  (when-let [repo (state/get-current-repo)]
    (when (and (state/enable-journals? repo)
               ;; FIXME: There are a lot of long-running actions we don't want interrupted by this fn.
               ;; We should implement an app-wide check rather than list them all here
               (not (:graph/loading? @state/state))
               (not (:graph/importing @state/state))
               (not (state/loading-files? repo))
               (not config/publishing?))
      (state/set-today! (date/today))
      (when (or (config/db-based-graph? repo)
                (config/local-file-based-graph? repo)
                (and (= config/demo-repo repo) (not (mobile-util/native-platform?))))
        (let [title (date/today)
              today-page (util/page-name-sanity-lc title)
              format (state/get-preferred-format repo)
              template (state/get-default-journal-template)
              create-f (fn []
                         (p/do!
                          (<create! title {:redirect? false
                                           :split-namespace? false
                                           :create-first-block? (not template)
                                           :today-journal? true})
                          (state/pub-event! [:journal/insert-template today-page])
                          (ui-handler/re-render-root!)
                          (plugin-handler/hook-plugin-app :today-journal-created {:title today-page})))]
          (when (db/page-empty? repo today-page)
            (if (config/db-based-graph? repo)
              (when-not (model/get-journal-page title)
                (create-f))
              (p/let [file-name (date/journal-title->default title)
                      file-rpath (str (config/get-journals-directory) "/" file-name "."
                                      (config/get-file-extension format))
                      repo-dir (config/get-repo-dir repo)
                      file-exists? (fs/file-exists? repo-dir file-rpath)
                      file-content (when file-exists?
                                     (fs/read-file repo-dir file-rpath))]
                (when (or (not file-exists?)
                          (and file-exists? (string/blank? file-content)))
                  (create-f))))))))))

(defn open-today-in-sidebar
  []
  (when-let [page (db/get-page (date/today))]
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
      (ipc/ipc "openFileInFolder" file-fpath))
    (notification/show! "No file found" :warning)))

(defn copy-page-url
  ([]
   (let [id (if (config/db-based-graph? (state/get-current-repo))
              (page-util/get-current-page-uuid)
              (page-util/get-current-page-name))]
     (copy-page-url id)))
  ([page-uuid]
   (if page-uuid
     (util/copy-to-clipboard!
      (url-util/get-logseq-graph-page-url nil (state/get-current-repo) (str page-uuid)))
     (notification/show! "No page found to copy" :warning))))
