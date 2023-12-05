(ns frontend.handler.page
  "Provides util handler fns for pages"
  (:require [cljs.reader :as reader]
            [clojure.string :as string]
            [frontend.commands :as commands]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.fs :as fs]
            [frontend.handler.common :as common-handler]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.db-based.page :as db-page-handler]
            [frontend.handler.file-based.page :as file-page-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.web.nfs :as web-nfs]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.page :as page-util]
            [frontend.util.url :as url-util]
            [goog.functions :refer [debounce]]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [logseq.db.frontend.property :as db-property]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [promesa.core :as p]
            [logseq.common.path :as path]
            [frontend.handler.property.util :as pu]
            [electron.ipc :as ipc]
            [frontend.context.i18n :refer [t]]))

(def create! page-common-handler/create!)
(def delete! page-common-handler/delete!)
(def unfavorite-page! page-common-handler/unfavorite-page!)
(def favorite-page! page-common-handler/favorite-page!)

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

(defn toggle-favorite! []
  ;; NOTE: in journals or settings, current-page is nil
  (when-let [page-name (state/get-current-page)]
    (let [favorites  (:favorites (state/sub-config))
          favorited? (contains? (set (map string/lower-case favorites))
                                (string/lower-case page-name))]
      (if favorited?
        (unfavorite-page! page-name)
        (favorite-page! page-name)))))

(defn rename!
  ([old-name new-name] (rename! old-name new-name true))
  ([old-name new-name redirect?] (rename! old-name new-name redirect? true))
  ([old-name new-name redirect? persist-op?]
   (if (config/db-based-graph? (state/get-current-repo))
     (db-page-handler/rename! old-name new-name redirect? persist-op?)
     (file-page-handler/rename! old-name new-name redirect?))))

(defn reorder-favorites!
  [favorites]
  (config-handler/set-config! :favorites favorites))

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
  (property-handler/add-page-property! page-name :public value))

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
                       (db/built-in-pages-names (string/upper-case name))
                       (db-property/built-in-properties-keys-str name)))))
       (common-handler/fix-pages-timestamps)))

(defn get-filters
  [page-name]
  (let [properties (db/get-page-properties page-name)]
    (if (config/db-based-graph? (state/get-current-repo))
      (pu/lookup properties :filters)
      (let [properties-str (or (:filters properties) "{}")]
        (try (reader/read-string properties-str)
             (catch :default e
               (log/error :syntax/filters e)))))))

(defn save-filter!
  [page-name filter-state]
  (property-handler/add-page-property! page-name :filters filter-state))

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
        edit-content (state/get-edit-content)
        action (state/get-editor-action)
        hashtag? (= action :page-search-hashtag)
        q (or
           (editor-handler/get-selected-text)
           (when hashtag?
             (gp-util/safe-subs edit-content pos current-pos))
           (when (> (count edit-content) current-pos)
             (gp-util/safe-subs edit-content pos current-pos)))
        db-based? (config/db-based-graph? (state/get-current-repo))]
    (if hashtag?
      (fn [chosen e]
        (util/stop e)
        (state/clear-editor-action!)
        (let [class? (string/starts-with? chosen (t :new-class))
              chosen (-> chosen
                         (string/replace-first (str (t :new-class) " ") "")
                         (string/replace-first (str (t :new-page) " ") ""))
              wrapped? (= page-ref/left-brackets (gp-util/safe-subs edit-content (- pos 2) pos))
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
          (when db-based?
            (let [tag (string/trim chosen)
                  edit-block (state/get-edit-block)]
              (when (and (not (string/blank? tag)) (:block/uuid edit-block))
                (let [tag-entity (db/entity [:block/name (util/page-name-sanity-lc tag)])]
                  (when-not tag-entity
                    (create! tag {:redirect? false
                                  :create-first-block? false
                                  :class? class?}))
                  (when class?
                    (let [repo (state/get-current-repo)
                          tag-entity (or tag-entity (db/entity [:block/name (util/page-name-sanity-lc tag)]))
                          tx-data [[:db/add [:block/uuid (:block/uuid edit-block)] :block/tags (:db/id tag-entity)]
                                   [:db/add [:block/uuid (:block/uuid edit-block)] :block/refs (:db/id tag-entity)]]]
                      (db/transact! repo tx-data {:outliner-op :save-block})))))))

          (editor-handler/insert-command! id
                                          (str "#" wrapped-tag)
                                          format
                                          {:last-pattern last-pattern
                                           :end-pattern (when wrapped? page-ref/right-brackets)
                                           :command :page-ref})

          (when input (.focus input))))
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
               (not (:graph/loading? @state/state))
               (not (state/loading-files? repo))
               (not (state/whiteboard-route?)))
      (state/set-today! (date/today))
      (when (or (config/db-based-graph? repo)
                (config/local-file-based-graph? repo)
                (and (= "local" repo) (not (mobile-util/native-platform?))))
        (let [title (date/today)
              today-page (util/page-name-sanity-lc title)
              format (state/get-preferred-format repo)
              template (state/get-default-journal-template)
              create-f (fn []
                         (create! title {:redirect? false
                                         :split-namespace? false
                                         :create-first-block? (not template)
                                         :journal? true})
                         (state/pub-event! [:journal/insert-template today-page])
                         (ui-handler/re-render-root!)
                         (plugin-handler/hook-plugin-app :today-journal-created {:title today-page}))]
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
      (ipc/ipc "openFileInFolder" file-fpath))
    (notification/show! "No file found" :warning)))

(defn copy-page-url
  ([] (copy-page-url (page-util/get-current-page-name)))
  ([page-name]
   (if page-name
     (util/copy-to-clipboard!
      (url-util/get-logseq-graph-page-url nil (state/get-current-repo) page-name))
     (notification/show! "No page found to copy" :warning))))
