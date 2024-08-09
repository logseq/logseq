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
            [lambdaisland.glogi :as log]
            [frontend.format.mldoc :as mldoc]))

(defn extract-blocks
  "Wrapper around logseq.graph-parser.block/extract-blocks that adds in system state
and handles unexpected failure."
  [blocks content format {:keys [page-name parse-block]}]
  (let [repo (state/get-current-repo)]
    (try
      (let [blocks (gp-block/extract-blocks blocks content format
                                            {:user-config (state/get-config)
                                             :parse-block parse-block
                                             :block-pattern (config/get-block-pattern format)
                                             :db (db/get-db repo)
                                             :date-formatter (state/get-date-formatter)
                                             :page-name page-name
                                             :db-graph-mode? (config/db-based-graph? repo)})]
        (if (config/db-based-graph? repo)
          (map (fn [block]
                (cond-> (dissoc block :block/properties)
                  (:block/properties block)
                  (merge (update-keys (:block/properties block)
                                      (fn [k]
                                        (or ({:heading :logseq.property/heading} k)
                                            (throw (ex-info (str "Don't know how to save graph-parser property " (pr-str k)) {}))))))))
              blocks)
          blocks))
      (catch :default e
        (log/error :exception e)
        (state/pub-event! [:capture-error {:error e
                                           :payload {:type "Extract-blocks"}}])
        (notification/show! "An unexpected error occurred during block extraction." :error)
        []))))

(defn page-name->map
  "Wrapper around logseq.graph-parser.block/page-name->map that adds in db"
  ([original-page-name]
   (page-name->map original-page-name true))
  ([original-page-name with-timestamp?]
   (gp-block/page-name->map original-page-name (db/get-db (state/get-current-repo)) with-timestamp? (state/get-date-formatter))))

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
  [{:block/keys [uuid title format] :as block}]
  (when-not (string/blank? title)
    (let [block (dissoc block :block/pre-block?)
          format (or format :markdown)
          parse-config (mldoc/get-default-config format)
          ast (format/to-edn title format parse-config)
          blocks (extract-blocks ast title format {:parse-block block})
          new-block (first blocks)
          block (cond->
                 (merge block new-block)
                  (> (count blocks) 1)
                  (assoc :block/warning :multiple-blocks))
          block (dissoc block :block.temp/ast-body :block/level)]
      (if uuid (assoc block :block/uuid uuid) block))))

(defn parse-title-and-body
  ([block]
   (when (map? block)
     (merge block
            (parse-title-and-body (:block/uuid block)
                                  (:block/format block)
                                  (:block/pre-block? block)
                                  (:block/title block)))))
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
                       (if (seq body) {:block.temp/ast-body body} {})
                        title
                        (assoc :block.temp/ast-title title))]
           (state/add-block-ast-cache! block-uuid content result)
           result))))))

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
