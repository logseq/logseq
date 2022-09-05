(ns frontend.modules.file.core
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.utils :as db-utils]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [frontend.state :as state]
            [frontend.handler.file :as file-handler]))

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
  [{:block/keys [collapsed? format pre-block? unordered content heading-level left page parent]} level {:keys [heading-to-list?]}]
  (let [content (or content "")
        pre-block? (or pre-block?
                       (and (= page parent left) ; first block
                            (= :markdown format)
                            (string/includes? (first (string/split-lines content)) ":: ")))
        markdown? (= format :markdown)
        content (cond
                  pre-block?
                  (let [content (string/trim content)]
                    (str content "\n"))

                  :else
                  (let [markdown-top-heading? (and markdown?
                                                   (= parent page)
                                                   (not unordered)
                                                   heading-level)
                        [prefix spaces-tabs]
                        (cond
                          (= format :org)
                          [(->>
                            (repeat level "*")
                            (apply str)) ""]

                          markdown-top-heading?
                          ["" ""]

                          :else
                          (let [level (if (and heading-to-list? heading-level)
                                        (if (> heading-level 1)
                                          (dec heading-level)
                                          heading-level)
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
                    (str prefix sep new-content)))]
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
  [page ok-handler]
  (when-let [repo (state/get-current-repo)]
    (when (:block/name page)
      (let [format (name (get page :block/format
                              (state/get-preferred-format)))
            title (string/capitalize (:block/name page))
            journal-page? (date/valid-journal-title? title)
            filename (if journal-page?
                       (date/date->file-name journal-page?)
                       (-> (or (:block/original-name page) (:block/name page))
                           (util/file-name-sanity)))
            sub-dir (if journal-page?
                      (config/get-journals-directory)
                      (config/get-pages-directory))
            ext (if (= format "markdown") "md" format)
            file-path (config/get-page-file-path repo sub-dir filename ext)
            file {:file/path file-path}
            tx [{:file/path file-path}
                {:block/name (:block/name page)
                 :block/file file}]]
        (db/transact! tx)
        (when ok-handler (ok-handler))))))

(defn save-tree-aux!
  [page-block tree]
  (let [page-block (db/pull (:db/id page-block))
        new-content (tree->file-content tree {:init-level init-level})
        file-db-id (-> page-block :block/file :db/id)
        file-path (-> (db-utils/entity file-db-id) :file/path)
        _ (assert (string? file-path) "File path should satisfy string?")
        ;; FIXME: name conflicts between multiple graphs
        files [[file-path new-content]]
        repo (state/get-current-repo)]
    (file-handler/alter-files-handler! repo files {} {})))

(defn save-tree
  [page-block tree]
  {:pre [(map? page-block)]}
  (let [ok-handler #(save-tree-aux! page-block tree)
        file (or (:block/file page-block)
                 (when-let [page (:db/id (:block/page page-block))]
                   (:block/file (db-utils/entity page))))]
    (if file
      (ok-handler)
      (transact-file-tx-if-not-exists! page-block ok-handler))))
