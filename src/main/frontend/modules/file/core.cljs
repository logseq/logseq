(ns frontend.modules.file.core
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.file :as file-handler]
            [frontend.modules.file.uprint :as up]
            [frontend.state :as state]
            [frontend.util.fs :as fs-util]
            [frontend.util.property :as property]
            [logseq.common.path :as path]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- content-with-collapsed-state
  "Only accept nake content (without any indentation)"
  [format content collapsed?]
  (cond
    collapsed?
    (property/insert-property format content :collapsed true)

    ;; Don't check properties. Collapsed is an internal state log as property in file, but not counted into properties
    (false? collapsed?)
    (property/remove-property format :collapsed content)

    :else
    content))

(defn transform-content
  [{:block/keys [collapsed? format pre-block? content left page parent properties] :as b} level {:keys [heading-to-list?]}]
  (let [block-ref-not-saved? (and (seq (:block/_refs (db/entity (:db/id b))))
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
                                             (repeat (dec level) (state/get-export-bullet-indentation))
                                             (apply str))]
                            [(str spaces-tabs "-") (str spaces-tabs "  ")]))
                        content (if heading-to-list?
                                  (-> (string/replace content #"^\s?#+\s+" "")
                                      (string/replace #"^\s?#+\s?$" ""))
                                  content)
                        content (content-with-collapsed-state format content collapsed?)
                        new-content (indented-block-content (string/trim content) spaces-tabs)
                        sep (if (or markdown-top-heading?
                                    (string/blank? new-content))
                              ""
                              " ")]
                    (str prefix sep new-content)))
        content (if block-ref-not-saved?
                  (property/insert-property format content :id (str (:block/uuid b)))
                  content)]
    content))


(defn- tree->file-content-aux
  [tree {:keys [init-level] :as opts}]
  (let [block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (if page? nil (transform-content f level opts))
              new-content
              (if-let [children (seq (:block/children f))]
                     (cons content (tree->file-content-aux children {:init-level (inc level)}))
                     [content])]
          (conj! block-contents new-content)
          (recur r level))))))

(defn tree->file-content
  [tree opts]
  (->> (tree->file-content-aux tree opts) (string/join "\n")))


(def init-level 1)

(defn- transact-file-tx-if-not-exists!
  [page-block ok-handler]
  (when (and (state/get-current-repo)
             (:block/name page-block))
    (let [format (name (get page-block :block/format
                            (state/get-preferred-format)))
          title (string/capitalize (:block/name page-block))
          whiteboard-page? (model/whiteboard-page? page-block)
          format (if whiteboard-page? "edn" format)
          journal-page? (date/valid-journal-title? title)
          journal-title (date/normalize-journal-title title)
          journal-page? (and journal-page? (not (string/blank? journal-title)))
          filename (if journal-page?
                     (date/date->file-name journal-title)
                     (-> (or (:block/original-name page-block) (:block/name page-block))
                         (fs-util/file-name-sanity)))
          sub-dir (cond
                    journal-page?    (config/get-journals-directory)
                    whiteboard-page? (config/get-whiteboards-directory)
                    :else            (config/get-pages-directory))
          ext (if (= format "markdown") "md" format)
          file-rpath (path/path-join sub-dir (str filename "." ext))
          file {:file/path file-rpath}
          tx [{:file/path file-rpath}
              {:block/name (:block/name page-block)
               :block/file file}]]
      (db/transact! tx)
      (when ok-handler (ok-handler)))))

(defn- remove-transit-ids [block] (dissoc block :db/id :block/file))

(defn save-tree-aux!
  [page-block tree blocks-just-deleted?]
  (let [page-block (db/pull (:db/id page-block))
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (db-utils/entity file-db-id) :file/path)]
    (if (and (string? file-path) (not-empty file-path))
      (let [new-content (if (= "whiteboard" (:block/type page-block))
                          (->
                           (up/ugly-pr-str {:blocks tree
                                            :pages (list (remove-transit-ids page-block))})
                           (string/triml))
                          (tree->file-content tree {:init-level init-level}))]
        (if (and (string/blank? new-content)
                 (not blocks-just-deleted?))
          (state/pub-event! [:capture-error {:error (js/Error. "Empty content")
                                             :payload {}}])
          (let [files [[file-path new-content]]
                repo (state/get-current-repo)]
            (file-handler/alter-files-handler! repo files {} {}))))
      ;; In e2e tests, "card" page in db has no :file/path
      (js/console.error "File path from page-block is not valid" page-block tree))))

(defn save-tree!
  [page-block tree blocks-just-deleted?]
  {:pre [(map? page-block)]}
  (let [ok-handler #(save-tree-aux! page-block tree blocks-just-deleted?)
        file (or (:block/file page-block)
                 (when-let [page (:db/id (:block/page page-block))]
                   (:block/file (db-utils/entity page))))]
    (if file
      (ok-handler)
      (transact-file-tx-if-not-exists! page-block ok-handler))))
