(ns frontend.common.file.core
  "Save file to disk. Used by both file and DB graphs and shared
   by worker and frontend namespaces"
  (:require [clojure.string :as string]
            [frontend.common.file.util :as wfu]
            [logseq.graph-parser.property :as gp-property]
            [logseq.common.path :as path]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [frontend.common.date :as common-date]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.tree :as otree]))

(defonce *writes (atom {}))
(defonce *request-id (atom 0))

(defn conj-page-write!
  [page-id]
  (let [request-id (swap! *request-id inc)]
    (swap! *writes assoc request-id page-id)
    request-id))

(defn dissoc-request!
  [request-id]
  (when-let [page-id (get @*writes request-id)]
    (let [old-page-request-ids (keep (fn [[r p]]
                                       (when (and (= p page-id) (<= r request-id))
                                         r)) @*writes)]
      (when (seq old-page-request-ids)
        (swap! *writes (fn [x] (apply dissoc x old-page-request-ids)))))))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- content-with-collapsed-state
  "Only accept nake content (without any indentation)"
  [repo format content collapsed?]
  (cond
    collapsed?
    (gp-property/insert-property repo format content :collapsed true)

    ;; Don't check properties. Collapsed is an internal state log as property in file, but not counted into properties
    (false? collapsed?)
    (gp-property/remove-property format :collapsed content)

    :else
    content))

(defn- transform-content
  [repo db {:block/keys [collapsed? format pre-block? title page properties] :as b} level {:keys [heading-to-list?]} context]
  (let [block-ref-not-saved? (and (seq (:block/_refs (d/entity db (:db/id b))))
                                  (not (string/includes? title (str (:block/uuid b))))
                                  (not (sqlite-util/db-based-graph? repo)))
        heading (:heading properties)
        markdown? (= :markdown format)
        content (or title "")
        page-first-child? (= (:db/id b) (ldb/get-first-child db (:db/id page)))
        pre-block? (or pre-block?
                       (and page-first-child?
                            markdown?
                            (string/includes? (first (string/split-lines content)) ":: ")))
        content (cond
                  pre-block?
                  (let [content (string/trim content)]
                    (str content "\n"))

                  :else
                  (let [;; first block is a heading, Markdown users prefer to remove the `-` before the content
                        markdown-top-heading? (and markdown?
                                                   page-first-child?
                                                   heading)
                        [prefix spaces-tabs]
                        (cond
                          (= format :org)
                          [(->>
                            (repeat level "*")
                            (apply str)) ""]

                          markdown-top-heading?
                          ["" ""]

                          :else
                          (let [level (if (and heading-to-list? heading)
                                        (if (> heading 1)
                                          (dec heading)
                                          heading)
                                        level)
                                spaces-tabs (->>
                                             (repeat (dec level) (:export-bullet-indentation context))
                                             (apply str))]
                            [(str spaces-tabs "-") (str spaces-tabs "  ")]))
                        content (if heading-to-list?
                                  (-> (string/replace content #"^\s?#+\s+" "")
                                      (string/replace #"^\s?#+\s?$" ""))
                                  content)
                        content (content-with-collapsed-state repo format content collapsed?)
                        new-content (indented-block-content (string/trim content) spaces-tabs)
                        sep (if (or markdown-top-heading?
                                    (string/blank? new-content))
                              ""
                              " ")]
                    (str prefix sep new-content)))
        content (if block-ref-not-saved?
                  (gp-property/insert-property repo format content :id (str (:block/uuid b)))
                  content)]
    content))

(defn- tree->file-content-aux
  [repo db tree {:keys [init-level] :as opts} context]
  (let [block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (if page? nil (transform-content repo db f level opts context))
              new-content
              (if-let [children (seq (:block/children f))]
                     (cons content (tree->file-content-aux repo db children {:init-level (inc level)} context))
                     [content])]
          (conj! block-contents new-content)
          (recur r level))))))

(defn tree->file-content
  "Used by both file and DB graphs for export and for file-graph specific features"
  [repo db tree opts context]
  (->> (tree->file-content-aux repo db tree opts context) (string/join "\n")))

(def init-level 1)

(defn- transact-file-tx-if-not-exists!
  [conn page-block ok-handler context]
  (when (:block/name page-block)
    (let [format (name (get page-block :block/format (:preferred-format context)))
          date-formatter (:date-formatter context)
          title (string/capitalize (:block/name page-block))
          whiteboard-page? (ldb/whiteboard? page-block)
          format (if whiteboard-page? "edn" format)
          journal-page? (common-date/valid-journal-title? title date-formatter)
          journal-title (common-date/normalize-journal-title title date-formatter)
          journal-page? (and journal-page? (not (string/blank? journal-title)))
          filename (if journal-page?
                     (common-date/date->file-name journal-title (:journal-file-name-format context))
                     (-> (or (:block/title page-block) (:block/name page-block))
                         wfu/file-name-sanity))
          sub-dir (cond
                    journal-page?    (:journals-directory context)
                    whiteboard-page? (:whiteboards-directory context)
                    :else            (:pages-directory context))
          ext (if (= format "markdown") "md" format)
          file-rpath (path/path-join sub-dir (str filename "." ext))
          file {:file/path file-rpath}
          tx [{:file/path file-rpath}
              {:block/name (:block/name page-block)
               :block/file file}]]
      (ldb/transact! conn tx)
      (when ok-handler (ok-handler)))))

(defn- remove-transit-ids [block] (dissoc block :db/id :block/file))

(defn- save-tree-aux!
  [repo db page-block tree blocks-just-deleted? context request-id]
  (let [page-block (d/pull db '[*] (:db/id page-block))
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (d/entity db file-db-id) :file/path)
        result (if (and (string? file-path) (not-empty file-path))
                 (let [new-content (if (ldb/whiteboard? page-block)
                                     (->
                                      (wfu/ugly-pr-str {:blocks tree
                                                        :pages (list (remove-transit-ids page-block))})
                                      (string/triml))
                                     (tree->file-content repo db tree {:init-level init-level} context))]
                   (when-not (and (string/blank? new-content) (not blocks-just-deleted?))
                     (let [files [[file-path new-content]]]
                       (when (seq files)
                         (let [page-id (:db/id page-block)]
                           (wfu/post-message :write-files {:request-id request-id
                                                           :page-id page-id
                                                           :repo repo
                                                           :files files})
                           :sent)))))
                 ;; In e2e tests, "card" page in db has no :file/path
                 (js/console.error "File path from page-block is not valid" page-block tree))]
    (when-not (= :sent result)          ; page may not exists now
      (dissoc-request! request-id))))

(defn save-tree!
  [repo conn page-block tree blocks-just-deleted? context request-id]
  {:pre [(map? page-block)]}
  (when repo
    (let [ok-handler #(save-tree-aux! repo @conn page-block tree blocks-just-deleted? context request-id)
          file (or (:block/file page-block)
                   (when-let [page-id (:db/id (:block/page page-block))]
                     (:block/file (d/entity @conn page-id))))]
      (if file
        (ok-handler)
        (transact-file-tx-if-not-exists! conn page-block ok-handler context)))))

(defn block->content
  "Converts a block including its children (recursively) to plain-text."
  [repo db root-block-uuid tree->file-opts context]
  (assert (uuid? root-block-uuid))
  (let [init-level (or (:init-level tree->file-opts)
                       (if (ldb/page? (d/entity db [:block/uuid root-block-uuid]))
                         0
                         1))
        blocks (->> (d/pull-many db '[*] (keep :db/id (ldb/get-block-and-children db root-block-uuid)))
                    (map #(db-content/update-block-content db % (:db/id %))))
        tree (otree/blocks->vec-tree repo db blocks (str root-block-uuid))]
    (tree->file-content repo db tree
                        (assoc tree->file-opts :init-level init-level)
                        context)))
