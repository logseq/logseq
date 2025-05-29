(ns frontend.common.file.core
  "Convert blocks to file content. Used for exports and saving file to disk. Shared
  by worker and frontend namespaces"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.property :as gp-property]
            [logseq.outliner.tree :as otree]))

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
  [repo db {:block/keys [collapsed? format pre-block? properties] :as b} level {:keys [heading-to-list?]} context {:keys [db-based?]}]
  (let [title (or (:block/raw-title b) (:block/title b))
        block-ref-not-saved? (and (not db-based?)
                                  (first (:block/_refs (d/entity db (:db/id b))))
                                  (not (string/includes? title (str (:block/uuid b)))))
        heading (:heading properties)
        title (if db-based?
                ;; replace [[uuid]] with block's content
                (db-content/recur-replace-uuid-in-block-title (d/entity db (:db/id b)))
                title)
        content (or title "")
        content (cond
                  pre-block?
                  (let [content (string/trim content)]
                    (str content "\n"))

                  :else
                  (let [[prefix spaces-tabs]
                        (cond
                          (= format :org)
                          [(->>
                            (repeat level "*")
                            (apply str)) ""]

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
                        content (if db-based? content (content-with-collapsed-state repo format content collapsed?))
                        new-content (indented-block-content (string/trim content) spaces-tabs)
                        sep (if (string/blank? new-content)
                              ""
                              " ")]
                    (str prefix sep new-content)))]
    (if block-ref-not-saved?
      (gp-property/insert-property repo format content :id (str (:block/uuid b)))
      content)))

(defn- tree->file-content-aux
  [repo db tree {:keys [init-level link] :as opts} context]
  (let [db-based? (sqlite-util/db-based-graph? repo)
        block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (if (and page? (not link)) nil (transform-content repo db f level opts context {:db-based? db-based?}))
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

(defn- update-block-content
  [db item eid]
  ;; This may not be needed if this becomes a file-graph only context
  (if (entity-plus/db-based-graph? db)
    (db-content/update-block-content db item eid)
    item))

(defn block->content
  "Converts a block including its children (recursively) to plain-text."
  [repo db root-block-uuid tree->file-opts context]
  (assert (uuid? root-block-uuid))
  (let [init-level (or (:init-level tree->file-opts)
                       (if (ldb/page? (d/entity db [:block/uuid root-block-uuid]))
                         0
                         1))
        blocks (->> (d/pull-many db '[*] (keep :db/id (ldb/get-block-and-children db root-block-uuid)))
                    (map #(update-block-content db % (:db/id %))))
        tree (otree/blocks->vec-tree repo db blocks (str root-block-uuid))]
    (tree->file-content repo db tree
                        (assoc tree->file-opts :init-level init-level)
                        context)))
