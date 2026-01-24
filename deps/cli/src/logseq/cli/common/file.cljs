(ns logseq.cli.common.file
  "Convert blocks to file content. Used for frontend exports and CLI"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.outliner.tree :as otree]))

(defn- indented-block-content
  [content spaces-tabs]
  (let [lines (string/split-lines content)]
    (string/join (str "\n" spaces-tabs) lines)))

(defn- transform-content
  [db b level {:keys [heading-to-list?]} context]
  (let [heading (:logseq.property/heading b)
        ;; replace [[uuid]] with block's content
        title (db-content/recur-replace-uuid-in-block-title (d/entity db (:db/id b)))
        content (or title "")
        content (let [[prefix spaces-tabs]
                      (let [level (if (and heading-to-list? heading)
                                    (if (> heading 1)
                                      (dec heading)
                                      heading)
                                    level)
                            spaces-tabs (->>
                                         (repeat (dec level) (:export-bullet-indentation context))
                                         (apply str))]
                        [(str spaces-tabs "-") (str spaces-tabs "  ")])
                      content (if heading-to-list?
                                (-> (string/replace content #"^\s?#+\s+" "")
                                    (string/replace #"^\s?#+\s?$" ""))
                                content)
                      new-content (indented-block-content (string/trim content) spaces-tabs)
                      sep (if (string/blank? new-content)
                            ""
                            " ")]
                  (str prefix sep new-content))]
    content))

(defn- tree->file-content-aux
  [db tree {:keys [init-level link] :as opts} context]
  (let [block-contents (transient [])]
    (loop [[f & r] tree level init-level]
      (if (nil? f)
        (->> block-contents persistent! flatten (remove nil?))
        (let [page? (nil? (:block/page f))
              content (if (and page? (not link)) nil (transform-content db f level opts context))
              new-content
              (if-let [children (seq (:block/children f))]
                (cons content (tree->file-content-aux db children {:init-level (inc level)} context))
                [content])]
          #_:clj-kondo/ignore
          (conj! block-contents new-content)
          (recur r level))))))

(defn tree->file-content
  [db tree opts context]
  (->> (tree->file-content-aux db tree opts context) (string/join "\n")))

(defn block->content
  "Converts a block including its children (recursively) to plain-text."
  [db root-block-uuid tree->file-opts context]
  (assert (uuid? root-block-uuid))
  (let [init-level (or (:init-level tree->file-opts)
                       (if (ldb/page? (d/entity db [:block/uuid root-block-uuid]))
                         0
                         1))
        blocks (->> (d/pull-many db '[*] (keep :db/id (ldb/get-block-and-children db root-block-uuid)))
                    (map #(db-content/update-block-content db % (:db/id %))))
        tree (otree/blocks->vec-tree db blocks (str root-block-uuid))]
    (tree->file-content db tree
                        (assoc tree->file-opts :init-level init-level)
                        context)))

(defn get-all-page->content
  "Exports a graph's pages as tuples of page name and page content"
  [db options]
  (let [filter-fn (fn [ent]
                    (or (not (:logseq.property/built-in? ent))
                        (contains? sqlite-create-graph/built-in-pages-names (:block/title ent))))]
    (->> (d/datoms db :avet :block/name)
         (map #(d/entity db (:e %)))
         (filter filter-fn)
         (map (fn [e]
                [(:block/title e)
                 (block->content db (:block/uuid e) {} options)])))))