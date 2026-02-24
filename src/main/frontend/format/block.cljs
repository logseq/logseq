(ns frontend.format.block
  "Block code needed by app but not graph-parser. This should be the only frontend
   namespace that has references to legacy file attributes like :block/pre-block?
   as they are being removed from graph-parser output"
  (:require [cljs.cache :as cache]
            [clojure.string :as string]
            [frontend.common.cache :as common.cache]
            [frontend.db :as db]
            [frontend.format :as format]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]))

(defn extract-blocks
  "Wrapper around logseq.graph-parser.block/extract-blocks that adds in system state
and handles unexpected failure."
  [blocks content format {:keys [page-name]}]
  (let [repo (state/get-current-repo)]
    (try
      (let [blocks (gp-block/extract-blocks blocks content format
                                            {:user-config (state/get-config)
                                             :block-pattern common-config/block-pattern
                                             :db (db/get-db repo)
                                             :date-formatter (state/get-date-formatter)
                                             :page-name page-name
                                             :db-graph-mode? true})]
        (map (fn [block]
               (cond-> (dissoc block :block/format :block/properties :block/macros :block/properties-order)
                 (:block/properties block)
                 (merge (update-keys (:block/properties block)
                                     (fn [k]
                                       (or ({:heading :logseq.property/heading} k)
                                           (throw (ex-info (str "Don't know how to save graph-parser property " (pr-str k)) {}))))))))
             blocks))
      (catch :default e
        (log/error :exception e)
        (state/pub-event! [:capture-error {:error e
                                           :payload {:type "Extract-blocks"}}])
        (notification/show! "An unexpected error occurred during block extraction." :error)
        []))))

(defn parse-block
  [{:block/keys [uuid title format] :as block}]
  (when-not (string/blank? title)
    (let [block (dissoc block :block/pre-block?)
          format (or format :markdown)
          parse-config (mldoc/get-default-config format)
          ;; Disable extraction for display-type blocks as there isn't a reason to have
          ;; it enabled yet and can cause visible bugs when '#' is used
          blocks (if (:logseq.property.node/display-type block)
                   [block]
                   (let [ast (format/to-edn title parse-config)]
                     (extract-blocks ast title format {})))
          new-block (first blocks)
          block (cond-> (merge block new-block)
                  true
                  (dissoc :block/format))
          block (dissoc block :block.temp/ast-body :block/level)]
      (if uuid (assoc block :block/uuid uuid) block))))

(defonce *blocks-ast-cache (volatile! (cache/lru-cache-factory {} :threshold 5000)))

(defn- parse-title-and-body-helper
  [_format content]
  (let [parse-config (mldoc/get-default-config :markdown)
        ast (->> (format/to-edn content parse-config)
                 (map first))
        title (when (gp-block/heading-block? (first ast))
                (:title (second (first ast))))
        body (vec (if title (rest ast) ast))
        body (drop-while gp-property/properties-ast? body)]
    (cond->
     (if (seq body) {:block.temp/ast-body body} {})
      title
      (assoc :block.temp/ast-title title))))

(def ^:private cached-parse-title-and-body-helper
  (common.cache/cache-fn
   *blocks-ast-cache
   (fn [format content]
     [[format content] [format content]])
   parse-title-and-body-helper))

(defn parse-title-and-body
  ([block]
   (when (map? block)
     (merge block
            (parse-title-and-body (:block/uuid block)
                                  (get block :block/format :markdown)
                                  (:block/title block)))))
  ([_block-uuid format content]
   (when-not (string/blank? content)
     (let [content (str common-config/block-pattern " " (string/triml content))]
       (cached-parse-title-and-body-helper format content)))))

(defn break-line-paragraph?
  [[typ break-lines]]
  (and (= typ "Paragraph")
       (every? #(= % ["Break_Line"]) break-lines)))

(defn trim-paragraph-special-break-lines
  [ast]
  (let [[typ paras] ast]
    (if (= typ "Paragraph")
      (let [indexed-paras (map-indexed vector paras)]
        [typ (->> (filter
                   #(let [[index value] %]
                      (not (and (> index 0)
                                (= value ["Break_Line"])
                                (contains? #{"Timestamp" "Macro"}
                                           (first (nth paras (dec index)))))))
                   indexed-paras)
                  (map #(last %)))])
      ast)))

(defn trim-break-lines!
  [ast]
  (drop-while break-line-paragraph?
              (map trim-paragraph-special-break-lines ast)))
