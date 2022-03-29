(ns frontend.handler.extract
  "Extract helper."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.format :as format]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [lambdaisland.glogi :as log]))

(defn get-page-name
  [file ast]
  ;; headline
  (let [ast (map first ast)]
    (if (string/includes? file "pages/contents.")
      "Contents"
      (let [first-block (last (first (filter block/heading-block? ast)))
            property-name (when (and (contains? #{"Properties" "Property_Drawer"} (ffirst ast))
                                     (not (string/blank? (:title (last (first ast))))))
                            (:title (last (first ast))))
            first-block-name (let [title (last (first (:title first-block)))]
                               (and first-block
                                    (string? title)
                                    title))
            file-name (when-let [file-name (last (string/split file #"/"))]
                        (let [result (first (util/split-last "." file-name))]
                          (if (config/mldoc-support? (string/lower-case (util/get-file-ext file)))
                            (string/replace result "." "/")
                            result)))]
        (or property-name
            (if (= (state/page-name-order) "heading")
              (or first-block-name file-name)
              (or file-name first-block-name)))))))


;; TODO: performance improvement
(defn- extract-pages-and-blocks
  #_:clj-kondo/ignore
  [repo-url format ast properties file content]
  (try
    (let [page (get-page-name file ast)
          [_original-page-name page-name _journal-day] (block/convert-page-if-journal page)
          blocks (->> (block/extract-blocks ast content false format)
                      (block/with-parent-and-left {:block/name page-name}))
          ref-pages (atom #{})
          ref-tags (atom #{})
          blocks (map (fn [block]
                        (let [block-ref-pages (seq (:block/refs block))
                              page-lookup-ref [:block/name page-name]
                              block-path-ref-pages (->> (cons page-lookup-ref (seq (:block/path-refs block)))
                                                        (remove nil?))]
                          (when block-ref-pages
                            (swap! ref-pages set/union (set block-ref-pages)))
                          (-> block
                              (dissoc :ref-pages)
                              (assoc :block/format format
                                     :block/page [:block/name page-name]
                                     :block/refs block-ref-pages
                                     :block/path-refs block-path-ref-pages))))
                   blocks)
          page-entity (let [alias (:alias properties)
                            alias (if (string? alias) [alias] alias)
                            aliases (and alias
                                         (seq (remove #(or (= page-name (util/page-name-sanity-lc %))
                                                           (string/blank? %)) ;; disable blank alias
                                                      alias)))
                            aliases (->>
                                     (map
                                       (fn [alias]
                                         (let [page-name (util/page-name-sanity-lc alias)
                                               aliases (distinct
                                                        (conj
                                                         (remove #{alias} aliases)
                                                         page))
                                               aliases (when (seq aliases)
                                                         (map
                                                           (fn [alias]
                                                             {:block/name (util/page-name-sanity-lc alias)})
                                                           aliases))]
                                           (if (seq aliases)
                                             {:block/name page-name
                                              :block/alias aliases}
                                             {:block/name page-name})))
                                       aliases)
                                     (remove nil?))]
                        (cond->
                          (util/remove-nils
                           (assoc
                            (block/page-name->map page false)
                            :block/file {:file/path (util/path-normalize file)}))
                          (seq properties)
                          (assoc :block/properties properties)

                          (seq aliases)
                          (assoc :block/alias aliases)

                          (:tags properties)
                          (assoc :block/tags (let [tags (:tags properties)
                                                   tags (if (string? tags) [tags] tags)
                                                   tags (remove string/blank? tags)]
                                               (swap! ref-tags set/union (set tags))
                                               (map (fn [tag] {:block/name (util/page-name-sanity-lc tag)
                                                               :block/original-name tag})
                                                 tags)))))
          namespace-pages (let [page (:block/original-name page-entity)]
                            (when (text/namespace-page? page)
                              (->> (util/split-namespace-pages page)
                                   (map (fn [page]
                                          (-> (block/page-name->map page true)
                                              (assoc :block/format format)))))))
          pages (->> (concat
                      [page-entity]
                      @ref-pages
                      (map
                        (fn [page]
                          {:block/original-name page
                           :block/name (util/page-name-sanity-lc page)})
                        @ref-tags)
                      namespace-pages)
                     ;; remove block references
                     (remove vector?)
                     (remove nil?))
          pages (util/distinct-by :block/name pages)
          pages (remove nil? pages)
          pages (map (fn [page] (assoc page :block/uuid (db/new-block-id))) pages)
          blocks (->> (remove nil? blocks)
                      (map (fn [b] (dissoc b :block/title :block/body :block/level :block/children :block/meta))))]
      [pages blocks])
    (catch js/Error e
      (log/error :exception e))))

(defn extract-blocks-pages
  [repo-url file content]
  (if (string/blank? content)
    []
    (let [format (format/get-format file)
          _ (println "Parsing start: " file)
          ast (mldoc/->edn content (mldoc/default-config format
                                                         ;; {:parse_outline_only? true}
                                                         ))]
      (println "Parsing finished : " file)
      (let [first-block (ffirst ast)
            properties (let [properties (and (property/properties-ast? first-block)
                                             (->> (last first-block)
                                                  (map (fn [[x y]]
                                                         [x (if (string? y)
                                                              (text/parse-property format x y)
                                                              y)]))
                                                  (into {})
                                                  (walk/keywordize-keys)))]
                         (when (and properties (seq properties))
                           (if (:filters properties)
                             (update properties :filters
                                     (fn [v]
                                       (string/replace (or v "") "\\" "")))
                             properties)))]
        (extract-pages-and-blocks
         repo-url
         format ast properties
         file content)))))

(defn with-block-uuid
  [pages]
  (->> (util/distinct-by :block/name pages)
       (map (fn [page]
              (if (:block/uuid page)
                page
                (assoc page :block/uuid (db/new-block-id)))))))

(defn with-ref-pages
  [pages blocks]
  (let [ref-pages (->> (mapcat :block/refs blocks)
                       (filter :block/name))]
    (->> (concat pages ref-pages)
         (group-by :block/name)
         vals
         (map (partial apply merge))
         (with-block-uuid))))

(defn extract-all-block-refs
  [content]
  (map second (re-seq #"\(\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\)\)" content)))
