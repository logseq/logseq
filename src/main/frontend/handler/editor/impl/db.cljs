(ns frontend.handler.editor.impl.db
  "DB-based graph implementation"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.util :as util]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.util.page-ref :as page-ref]))

(defn- remove-non-existed-refs!
  [refs]
  (remove (fn [x] (or
                   (and (vector? x)
                        (= :block/uuid (first x))
                        (nil? (db/entity x)))
                   (nil? x))) refs))

(defn- replace-tag-ref
  [content page-name id]
  (let [id' (str config/page-ref-special-chars id)
        [page wrapped-id] (if (string/includes? page-name " ")
                            (map page-ref/->page-ref [page-name id'])
                            [page-name id'])
        page-name (util/format "#%s" page)
        r (util/format "#%s" wrapped-id)]
    ;; hash tag parsing rules https://github.com/logseq/mldoc/blob/701243eaf9b4157348f235670718f6ad19ebe7f8/test/test_markdown.ml#L631
    ;; Safari doesn't support look behind, don't use
    ;; TODO: parse via mldoc
    (string/replace content
                    (re-pattern (str "(?i)(^|\\s)(" (util/escape-regex-chars page-name) ")(?=[,\\.]*($|\\s))"))
                    ;;    case_insense^    ^lhs   ^_grp2                       look_ahead^         ^_grp3
                    (fn [[_match lhs _grp2 _grp3]]
                      (str lhs r)))))

(defn- replace-page-ref
  [content page-name id]
  (let [id' (str config/page-ref-special-chars id)
        [page wrapped-id] (map page-ref/->page-ref [page-name id'])]
        (util/replace-ignore-case content page wrapped-id)))

(defn- replace-page-ref-with-id
  [content page-name id]
  (-> content
      (replace-page-ref page-name id)
      (replace-tag-ref page-name id)))


(defn- replace-page-refs-with-ids
  [block]
  (let [content (:block/content block)
        content' (if (some :block/name (:block/refs block))
                   (reduce
                    (fn [content {:block/keys [original-name uuid]}]
                      (replace-page-ref-with-id content original-name uuid))
                    content
                    (filter :block/name (:block/refs block)))
                   content)]
    (assoc block :block/content content')))

(defn wrap-parse-block
  [{:block/keys [content left level] :as block}]
  (let [block (or (and (:db/id block) (db/pull (:db/id block))) block)
        block (if (string/blank? content)
                block
                (let [ast (mldoc/->edn (string/trim content) (gp-mldoc/default-config :markdown))
                      first-elem-type (first (ffirst ast))
                      block-with-title? (mldoc/block-with-title? first-elem-type)
                      content' (str (config/get-block-pattern :markdown) (if block-with-title? " " "\n") content)
                      block (merge block
                                   (block/parse-block (assoc block :block/content content')))]
                  (update block :block/refs remove-non-existed-refs!)))
        block (if (and left (not= (:block/left block) left)) (assoc block :block/left left) block)
        result (-> block
                   (dissoc
                    :block.temp/top?
                    :block.temp/bottom?
                    :block/pre-block?
                    :block/unordered?)
                   (assoc :block/content content)
                   (merge (if level {:block/level level} {}))
                   (replace-page-refs-with-ids))]
    result))
