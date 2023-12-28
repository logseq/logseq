(ns frontend.worker.file.core
  (:require [clojure.string :as string]
            [frontend.worker.file.util :as wfu]
            [frontend.worker.file.property-util :as property-util]
            [logseq.common.path :as path]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [frontend.worker.date :as worker-date]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- content-with-collapsed-state
  "Only accept nake content (without any indentation)"
  [repo format content collapsed?]
  (cond
    collapsed?
    (property-util/insert-property repo format content :collapsed true)

    ;; Don't check properties. Collapsed is an internal state log as property in file, but not counted into properties
    (false? collapsed?)
    (property-util/remove-property format :collapsed content)

    :else
    content))

(defn transform-content
  [repo db {:block/keys [collapsed? format pre-block? content left page parent properties] :as b} level {:keys [heading-to-list?]} context]
  (let [block-ref-not-saved? (and (seq (:block/_refs (d/entity db (:db/id b))))
                                  (not (string/includes? content (str (:block/uuid b)))))
        heading (:heading properties)
        markdown? (= :markdown format)
        content (or content "")
        pre-block? (or pre-block?
                       (and (= page parent left) ; first block
                            markdown?
                            (string/includes? (first (string/split-lines content)) ":: ")))
        content (cond
                  pre-block?
                  (let [content (string/trim content)]
                    (str content "\n"))

                  :else
                  (let [
                        ;; first block is a heading, Markdown users prefer to remove the `-` before the content
                        markdown-top-heading? (and markdown?
                                                   (= parent page left)
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
                  (property-util/insert-property repo format content :id (str (:block/uuid b)))
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
  [repo db tree opts context]
  (->> (tree->file-content-aux repo db tree opts context) (string/join "\n")))

(def init-level 1)

(defn- transact-file-tx-if-not-exists!
  [conn page-block ok-handler context]
  (when (:block/name page-block)
    (let [format (name (get page-block :block/format (:preferred-format context)))
          date-formatter (:date-formatter context)
          title (string/capitalize (:block/name page-block))
          whiteboard-page? (ldb/whiteboard-page? @conn page-block)
          format (if whiteboard-page? "edn" format)
          journal-page? (worker-date/valid-journal-title? title date-formatter)
          journal-title (worker-date/normalize-journal-title title date-formatter)
          journal-page? (and journal-page? (not (string/blank? journal-title)))
          filename (if journal-page?
                     (worker-date/date->file-name journal-title date-formatter)
                     (-> (or (:block/original-name page-block) (:block/name page-block))
                         (wfu/file-name-sanity nil)))
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
      (d/transact! conn tx)
      (when ok-handler (ok-handler)))))

(defn- remove-transit-ids [block] (dissoc block :db/id :block/file))

(defn save-tree-aux!
  [repo db page-block tree blocks-just-deleted? context]
  (let [page-block (d/pull db '[*] (:db/id page-block))
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (d/entity db file-db-id) :file/path)]
    (if (and (string? file-path) (not-empty file-path))
      (let [new-content (if (contains? (:block/type page-block) "whiteboard")
                          (->
                           (wfu/ugly-pr-str {:blocks tree
                                             :pages (list (remove-transit-ids page-block))})
                           (string/triml))
                          (tree->file-content repo db tree {:init-level init-level} context))]
        (when-not (and (string/blank? new-content) (not blocks-just-deleted?))
          (let [files [[file-path new-content]]]
            (prn :debug :write-file :file-path file-path :content new-content)
            ;; TODO: send files to main thread to save
            ;; (file-handler/alter-files-handler! repo files {} {})
            )))
      ;; In e2e tests, "card" page in db has no :file/path
      (js/console.error "File path from page-block is not valid" page-block tree))))

(defn save-tree!
  [repo conn page-block tree blocks-just-deleted? context]
  {:pre [(map? page-block)]}
  (when repo
    (let [ok-handler #(save-tree-aux! repo @conn page-block tree blocks-just-deleted? context)
          file (or (:block/file page-block)
                   (when-let [page-id (:db/id (:block/page page-block))]
                     (:block/file (d/entity @conn page-id))))]
      (if file
        (ok-handler)
        (transact-file-tx-if-not-exists! conn page-block ok-handler context)))))
