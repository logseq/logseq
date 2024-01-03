(ns frontend.format.block
  "Block code needed by app but not graph-parser"
  (:require [cljs-time.format :as tf]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.format :as format]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.property :as gp-property]
            [frontend.handler.db-based.property.util :as db-pu]
            [lambdaisland.glogi :as log]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [frontend.format.mldoc :as mldoc]))

(defn- update-extracted-block-properties
  "Updates DB graph blocks to ensure that built-in properties are using uuids
  for property ids"
  [blocks]
  (let [repo (state/get-current-repo)
        update-properties (fn [props]
                            (update-keys props #(if (contains? db-property/built-in-properties-keys %)
                                                  (db-pu/get-built-in-property-uuid repo %)
                                                  %)))]
    (if (config/db-based-graph? repo)
     (->> blocks
          (map (fn [b]
                 (if (:block/properties b)
                   (-> b
                       (dissoc :block/properties-order)
                       (update :block/properties update-properties))
                   b)))
          (map (fn [b]
                 (if (:block/macros b)
                   (update b :block/macros
                           (fn [macros]
                             (map #(-> %
                                       (assoc :block/uuid (d/squuid))
                                       (update :block/properties update-properties)) macros)))
                   b))))
     blocks)))

(defn extract-blocks
  "Wrapper around logseq.graph-parser.block/extract-blocks that adds in system state
and handles unexpected failure."
  [blocks content format {:keys [with-id? page-name]
                          :or {with-id? true}}]
  (try
    (update-extracted-block-properties
     (gp-block/extract-blocks blocks content with-id? format
                              {:user-config (state/get-config)
                               :block-pattern (config/get-block-pattern format)
                               :db (db/get-db (state/get-current-repo))
                               :date-formatter (state/get-date-formatter)
                               :page-name page-name}))
    (catch :default e
      (log/error :exception e)
      (state/pub-event! [:capture-error {:error e
                                         :payload {:type "Extract-blocks"}}])
      (notification/show! "An unexpected error occurred during block extraction." :error)
      [])))

(defn page-name->map
  "Wrapper around logseq.graph-parser.block/page-name->map that adds in db"
  ([original-page-name with-id?]
   (page-name->map original-page-name with-id? true))
  ([original-page-name with-id? with-timestamp?]
   (gp-block/page-name->map original-page-name with-id? (db/get-db (state/get-current-repo)) with-timestamp? (state/get-date-formatter))))

(defn- normalize-as-percentage
  [block]
  (some->> block
           str
           (re-matches #"(-?\d+\.?\d*)%")
           second
           (#(/ % 100))))

(defn- normalize-as-date
  [block]
  (some->> block
           str
           date/normalize-date
           (tf/unparse date/custom-formatter)))

(defn normalize-block
  "Normalizes supported formats such as dates and percentages.
   Be careful, this function may harm query sort performance!
   - nlp-date? - Enable NLP parsing on date items.
       Requires heavy computation (see `normalize-as-date` for details)"
  [block nlp-date?]
  (->> [normalize-as-percentage (when nlp-date? normalize-as-date) identity]
       (remove nil?)
       (map #(% (if (set? block) (first block) block)))
       (remove nil?)
       (first)))

(defn parse-block
  ([block]
   (parse-block block nil))
  ([{:block/keys [uuid content format] :as block} {:keys [with-id?]
                                                   :or {with-id? true}}]
   (when-not (string/blank? content)
     (let [block (dissoc block :block/pre-block?)
           format (or format :markdown)
           parse-config (mldoc/get-default-config format)
           ast (format/to-edn content format parse-config)
           blocks (extract-blocks ast content format {:with-id? with-id?})
           new-block (first blocks)
           block (cond->
                  (merge block new-block)
                   (> (count blocks) 1)
                   (assoc :block/warning :multiple-blocks))
           block (dissoc block :block/title :block/body :block/level)]
       (if uuid (assoc block :block/uuid uuid) block)))))

(defn parse-title-and-body
  ([block]
   (when (map? block)
     (merge block
            (parse-title-and-body (:block/uuid block)
                                  (:block/format block)
                                  (:block/pre-block? block)
                                  (:block/content block)))))
  ([block-uuid format pre-block? content]
   (when-not (string/blank? content)
     (let [content (if pre-block? content
                       (str (config/get-block-pattern format) " " (string/triml content)))]
       (if-let [result (state/get-block-ast block-uuid content)]
         result
         (let [parse-config (mldoc/get-default-config format)
               ast (->> (format/to-edn content format parse-config)
                        (map first))
               title (when (gp-block/heading-block? (first ast))
                       (:title (second (first ast))))
               body (vec (if title (rest ast) ast))
               body (drop-while gp-property/properties-ast? body)
               result (cond->
                       (if (seq body) {:block/body body} {})
                        title
                        (assoc :block/title title))]
           (state/add-block-ast-cache! block-uuid content result)
           result))))))

(defn macro-subs
  [macro-content arguments]
  (loop [s macro-content
         args arguments
         n 1]
    (if (seq args)
      (recur
       (string/replace s (str "$" n) (first args))
       (rest args)
       (inc n))
      s)))

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
