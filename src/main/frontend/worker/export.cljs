(ns frontend.worker.export
  "Export data"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [frontend.handler.export.common-impl :as common-impl]
            [frontend.handler.export.text-impl :as export-text]
            [logseq.common.export.file :as common-file]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.outliner.tree :as otree]))

(def get-all-page->content common-file/get-all-page->content)

(defn- block-content
  [db root-block-uuid opts content-config]
  (common-file/block->content db root-block-uuid opts content-config))

(defn- remove-collapsed-descendants
  [tree]
  (mapv
   (fn [node]
     (let [children (:block/children node)]
       (cond
         (and (:block/collapsed? node) (seq children))
         (dissoc node :block/children)

         (seq children)
         (assoc node :block/children (remove-collapsed-descendants children))

         :else
         node)))
   tree))

(defn- content->ast
  [content]
  (when content
    (->> (gp-mldoc/->db-edn content :markdown)
         (mapv common-impl/remove-block-ast-pos)
         (remove common-impl/Properties-block-ast?)
         vec)))

(defn- block-children-content
  [db root-block-uuid {:keys [init-level open-blocks-only? include-properties?]
                       :or {init-level 1}} content-config]
  (let [block (first (ldb/get-block-and-children db root-block-uuid))
        link (:block/link block)
        block' (or link block)
        root-id (:block/uuid block')
        blocks (ldb/get-block-and-children db root-id)
        tree (otree/blocks->vec-tree db blocks root-id {:link link})
        tree (if open-blocks-only?
               (remove-collapsed-descendants tree)
               tree)]
    (common-file/tree->file-content db tree
                                    {:init-level init-level
                                     :include-properties? include-properties?
                                     :link link}
                                    content-config)))

(defn- block-ast
  [db block-uuid content-config]
  (let [block (some-> (first (ldb/get-block-and-children db block-uuid)) (into {}))
        content (common-file/tree->file-content db [block] {:init-level 1} content-config)]
    (content->ast content)))

(defn- block-children-ast
  [db block-uuid content-config]
  (content->ast (block-children-content db block-uuid nil content-config)))

(defn- page-ast
  [db page-name content-config]
  (when-let [page (ldb/get-page db page-name)]
    (content->ast (block-content db (:block/uuid page) nil content-config))))

(defn- root-blocks-content
  [db root-block-uuids opts content-config]
  (->> root-block-uuids
       (mapv #(block-content db % opts content-config))
       (mapv string/trim-newline)
       (string/join "\n")))

(defn get-blocks-export-data
  [db root-block-uuids-or-page-uuid opts content-config]
  (let [root-block-uuids (if (coll? root-block-uuids-or-page-uuid)
                           root-block-uuids-or-page-uuid
                           [root-block-uuids-or-page-uuid])
        blocks (mapv #(d/entity db [:block/uuid %]) root-block-uuids)
        all-pages? (every? ldb/page? blocks)
        single-page? (and (= 1 (count blocks)) all-pages?)
        content (cond
                  single-page?
                  (block-content db (first root-block-uuids) opts content-config)

                  all-pages?
                  (->> blocks (map :block/title) (string/join "\n"))

                  :else
                  (root-blocks-content db root-block-uuids opts content-config))
        first-block (first blocks)]
    {:content content
     :format (get first-block :block/format :markdown)
     :title (if (and (uuid? root-block-uuids-or-page-uuid) first-block)
              (:block/title first-block)
              "untitled")}))

(defn export-blocks-as-format
  [db root-block-uuids-or-page-uuid format-type options content-config]
  (let [remove-options (set (:remove-options options))
        include-properties? (not (contains? remove-options :property))
        open-blocks-only? (boolean (get-in options [:other-options :open-blocks-only]))
        {:keys [content format]} (get-blocks-export-data
                                        db
                                        root-block-uuids-or-page-uuid
                                        {:open-blocks-only? open-blocks-only?
                                         :include-properties? include-properties?}
                                        content-config)]
    (binding [common-impl/*block-ast-resolver* #(block-ast db % content-config)
              common-impl/*block-children-ast-resolver* #(block-children-ast db % content-config)
              common-impl/*page-ast-resolver* #(page-ast db % content-config)]
      (case format-type
        :markdown (export-text/export-helper content format options)
        (throw (ex-info "Unsupported worker export format"
                        {:format-type format-type
                         :message "Use :thread-api/export-get-blocks-data and format outside the DB worker."}))))))

(defn get-debug-datoms
  [conn]
  (some->> (d/datoms @conn :eavt)
           (keep (fn [{:keys [e a v t]}]
                   (cond
                     (and (= a :block/title) (common-util/url? v))
                     (d/datom e a "https://logseq.com/debug" t)

                     (and (contains? #{:block/title :block/name} a)
                          (let [entity (d/entity @conn e)]
                            (and (not (:db/ident entity))
                                 (not (ldb/journal? entity))
                                 (not (:logseq.property/built-in? entity))
                                 (not (= :logseq.property/query (:db/ident (:logseq.property/created-from-property entity)))))))
                     (d/datom e a (str "debug " e " " (apply str (repeat (count v) "x"))) t)

                     :else
                     (d/datom e a v t))))))
