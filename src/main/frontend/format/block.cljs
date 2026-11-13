(ns frontend.format.block
  "Block code needed by app but not graph-parser. This should be the only frontend
   namespace that has references to legacy file attributes like :block/pre-block?
   as they are being removed from graph-parser output"
  (:require [clojure.string :as string]
            [frontend.common.cache :as common.cache]
            [frontend.context.i18n :refer [t]]
            [frontend.format :as format]
            [frontend.format.mldoc :as mldoc]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.db-input :as db-input]
            [logseq.graph-parser.property :as gp-property]))

(defn extract-blocks
  "Wrapper around logseq.graph-parser.block/extract-blocks that adds in system state
and handles unexpected failure."
  [blocks content format {:keys [page-name]}]
  (try
    (db-input/extract-blocks blocks content format
                             {:repo (state/get-current-repo)
                              :user-config (state/get-config)
                              :date-formatter (state/get-date-formatter)
                              :page-name page-name})
    (catch :default e
      (log/error :exception e)
      (state/pub-event! [:capture-error {:error e
                                         :payload {:type "Extract-blocks"}}])
      (notification/show! (t :block/extraction-error) :error)
      [])))

(defn parse-block
  [block]
  (db-input/parse-block block {:repo (state/get-current-repo)
                               :user-config (state/get-config)
                               :date-formatter (state/get-date-formatter)
                               :extract-blocks extract-blocks}))

(defonce *blocks-ast-cache (volatile! (common.cache/empty-lru 5000)))

(defn- markdown-heading-level
  [content]
  (when-let [heading (some->> content
                              string/triml
                              (re-find #"^(#{1,6})\s+"))]
    (count (second heading))))

(defn- parse-title-and-body-helper
  [_format raw-content content]
  (let [parse-config (mldoc/get-default-config :markdown)
        ast (->> (format/to-edn content parse-config)
                 (map first))
        heading (when (gp-block/heading-block? (first ast))
                  (second (first ast)))
        title (:title heading)
        heading-level (markdown-heading-level raw-content)
        body (vec (if title (rest ast) ast))
        body (drop-while gp-property/properties-ast? body)]
    (cond->
     (if (seq body) {:block.temp/ast-body body} {})
      title
      (assoc :block.temp/ast-title title
             :block.temp/heading heading-level))))

(def ^:private cached-parse-title-and-body-helper
  (common.cache/cache-fn
   *blocks-ast-cache
   (fn [format raw-content content]
     [[format raw-content content] [format raw-content content]])
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
     (let [raw-content content
           content (str common-config/block-pattern " " (string/triml content))]
       (cached-parse-title-and-body-helper format raw-content content)))))

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
