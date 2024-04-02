(ns frontend.handler.page
  "Provides util handler fns for pages"
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.model :as model]
            [frontend.fs :as fs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.property :as property-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.file-based.nfs :as nfs-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.page :as page-util]
            [frontend.util.url :as url-util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [promesa.core :as p]
            [logseq.common.path :as path]
            [electron.ipc :as ipc]
            [frontend.context.i18n :refer [t]]
            [frontend.persist-db.browser :as db-browser]
            [cljs-bean.core :as bean]
            [datascript.core :as d]
            [frontend.db.conn :as conn]
            [logseq.db :as ldb]
            [logseq.graph-parser.db :as gp-db]
            [frontend.modules.outliner.ui :as ui-outliner-tx]
            [frontend.modules.outliner.op :as outliner-op]))

(def create! page-common-handler/create!)
(def <create! page-common-handler/<create!)
(def <delete! page-common-handler/<delete!)

(defn <unfavorite-page!
  [page-name]
  (p/do!
   (let [repo (state/get-current-repo)]
     (if (config/db-based-graph? repo)
       (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
         (page-common-handler/<unfavorite-page!-v2 page-block-uuid))
       (page-common-handler/unfavorite-page! page-name)))
   (state/update-favorites-updated!)))

(defn <favorite-page!
  [page-name]
  (p/do!
   (let [repo (state/get-current-repo)]
     (if (config/db-based-graph? repo)
       (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
         (page-common-handler/<favorite-page!-v2 page-block-uuid))
       (page-common-handler/favorite-page! page-name)))
   (state/update-favorites-updated!)))

(defn favorited?
  [page-name]
  (let [repo (state/get-current-repo)]
    (if (config/db-based-graph? repo)
      (boolean
       (when-let [page-block-uuid (:block/uuid (db/get-page page-name))]
         (page-common-handler/favorited?-v2 page-block-uuid)))
      (page-common-handler/favorited? page-name))))


(defn get-favorites
  "return page-block entities"
  []
  (when-let [db (conn/get-db)]
    (let [repo (state/get-current-repo)]
      (if (config/db-based-graph? repo)
        (when-let [page-id (ldb/get-first-page-by-name db common-config/favorites-page-name)]
          (let [page (d/entity db page-id)
                blocks (ldb/sort-by-left
                        (ldb/get-page-blocks db page-id {})
                        page)]
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
    (let [favorited? (favorited? page-name)]
      (if favorited?
        (<unfavorite-page! page-name)
        (<favorite-page! page-name)))))

(defn rename!
  [page-uuid-or-old-name new-name & {:as _opts}]
  (when-let [^js worker @db-browser/*worker]
    (p/let [repo (state/get-current-repo)
            page-uuid (cond
                        (uuid? page-uuid-or-old-name)
                        page-uuid-or-old-name
                        (common-util/uuid-string? page-uuid-or-old-name)
                        page-uuid-or-old-name
                        :else
                        (:block/uuid (db/entity (ldb/get-first-page-by-name (db/get-db) page-uuid-or-old-name))))
            result (.page-rename worker repo (str page-uuid) new-name)
            result' (:result (bean/->clj result))]
      (case (if (string? result') (keyword result') result')
        :built-in-page
        (notification/show! "Built-in page's name cannot be modified" :warning)
        :invalid-empty-name
        (notification/show! "Please use a valid name, empty name is not allowed!" :warning)
        :rename-page-exists
        (notification/show! "Another page with the new name exists already" :warning)
        nil))))

(defn <reorder-favorites!
  [favorites]
  (let [conn (conn/get-db false)
        db @conn]
    (when-let [page-id (db/get-page common-config/favorites-page-name)]
      (let [favorites-page-entity (d/entity db page-id)
            favorite-page-block-db-id-coll
            (keep (fn [page-name]
                    (:db/id (db/get-page page-name)))
                  favorites)
            current-blocks (ldb/sort-by-left (ldb/get-page-blocks @conn common-config/favorites-page-name {})
                                             favorites-page-entity)]
        (p/do!
         (ui-outliner-tx/transact!
          {}
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
  [page value]
  (property-handler/add-page-property! page :logseq.property/public value))

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
        (ok-handler e)))
    opts)))

(defn get-all-pages
  [repo]
  (let [graph-specific-hidden?
        (if (config/db-based-graph? repo)
          (fn [_p] false)
          (fn [p]
            (gp-db/built-in-pages-names (string/upper-case (:block/name p)))))]
    (->> (db/get-all-pages repo)
        (remove (fn [p]
                  (let [name (:block/name p)]
                    (or (util/uuid-string? name)
                        (common-config/draw? name)
                        (graph-specific-hidden? p)))))
        (common-handler/fix-pages-timestamps))))

(defn get-filters
  [page]
  (if (config/db-based-graph? (state/get-current-repo))
    (:logseq.property/filters page)
    (let [properties (:block/properties page)
          properties-str (or (:filters properties) "{}")]
      (try (reader/read-string properties-str)
           (catch :default e
             (log/error :syntax/filters e))))))

(defn save-filter!
  [page filter-state]
  (property-handler/add-page-property! page :logseq.property/filters filter-state))

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

(defn add-tag [repo block-id tag & {:keys [tag-entity]}]
  (let [tag-entity (or tag-entity (db/get-page tag))
        tx-data [[:db/add (:db/id tag-entity) :block/type "class"]
                 [:db/add [:block/uuid block-id] :block/tags (:db/id tag-entity)]
                 ;; TODO: Should classes counted as refs
                 [:db/add [:block/uuid block-id] :block/refs (:db/id tag-entity)]]]
    (db/transact! repo tx-data {:outliner-op :save-block})))

(defn on-chosen-handler
  [input id _q pos format]
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
      (fn [chosen e]
        (util/stop e)
        (state/clear-editor-action!)
        (let [class? (and db-based? hashtag?)
              chosen (-> chosen
                         (string/replace-first (str (t :new-class) " ") "")
                         (string/replace-first (str (t :new-page) " ") ""))
              wrapped? (= page-ref/left-brackets (common-util/safe-subs edit-content (- pos 2) pos))
              wrapped-tag (if (and (util/safe-re-find #"\s+" chosen) (not wrapped?))
                            (page-ref/->page-ref chosen)
                            chosen)
              q (if (editor-handler/get-selected-text) "" q)
              last-pattern (if wrapped?
                             q
                             (if (= \# (first q))
                               (subs q 1)
                               q))
              last-pattern (str "#" (when wrapped? page-ref/left-brackets) last-pattern)]
          (p/do!
           (when db-based?
             (let [tag (string/trim chosen)
                   edit-block (state/get-edit-block)]
               (when (and (not (string/blank? tag)) (:block/uuid edit-block))
                 (p/let [tag-entity (db/get-page tag)
                         _ (when-not tag-entity
                             (<create! tag {:redirect? false
                                            :create-first-block? false
                                            :class? class?}))
                         tag-entity (db/get-page tag)]
                   (when class?
                     (add-tag (state/get-current-repo) (:block/uuid edit-block) tag {:tag-entity tag-entity}))))))
           (editor-handler/insert-command! id
                                           (if class? "" (str "#" wrapped-tag))
                                           format
                                           {:last-pattern last-pattern
                                            :end-pattern (when wrapped? page-ref/right-brackets)
                                            :command :page-ref})

           (when input (.focus input)))))
      (fn [chosen e]
        (util/stop e)
        (state/clear-editor-action!)
        (let [page-ref-text (get-page-ref-text chosen)]
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
               ;; FIXME: There are a lot of long-running actions we don't want interrupted by this fn.
               ;; We should implement an app-wide check rather than list them all here
               (not (:graph/loading? @state/state))
               (not (:graph/importing @state/state))
               (not (state/loading-files? repo))
               (not (state/whiteboard-route?))
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
                                           :create-first-block? (not template)
                                           :journal? true
                                           :today-journal? true})
                          (state/pub-event! [:journal/insert-template today-page])
                          (ui-handler/re-render-root!)
                          (plugin-handler/hook-plugin-app :today-journal-created {:title today-page})))]
          (when (db/page-empty? repo today-page)
            (if (config/db-based-graph? repo)
              (let [page-exists (db/get-page today-page)]
                (when-not page-exists
                  (create-f)))
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
  ([] (copy-page-url (page-util/get-current-page-name)))
  ([page-name]
   (if page-name
     (util/copy-to-clipboard!
      (url-util/get-logseq-graph-page-url nil (state/get-current-repo) page-name))
     (notification/show! "No page found to copy" :warning))))

(defn toggle-properties!
  [page-entity]
  (db/transact! [[:db/add (:db/id page-entity) :logseq.property/hide-properties?
                  (not (:logseq.property/hide-properties? page-entity))]]))
