(ns frontend.handler.extract
  "Extract helper."
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.format :as format]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.utf8 :as utf8]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(defn- extract-page-list
  [content]
  (when-not (string/blank? content)
    (->> (re-seq #"\[\[([^\]]+)]]" content)
         (map last)
         (remove nil?)
         (map string/lower-case)
         (distinct))))

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
  [repo-url format ast properties file content utf8-content journal?]
  (try
    (let [now (tc/to-long (t/now))
          page (get-page-name file ast)
          [page page-name journal-day] (block/convert-page-if-journal page)
          blocks (->> (block/extract-blocks ast content false format)
                      (block/with-parent-and-left {:block/name (string/lower-case page)}))
          ref-pages (atom #{})
          ref-tags (atom #{})
          blocks (map (fn [block]
                        (let [block-ref-pages (seq (:block/refs block))
                              page-lookup-ref [:block/name (string/lower-case page)]
                              block-path-ref-pages (->> (cons page-lookup-ref (seq (:block/path-refs block)))
                                                        (remove nil?))]
                          (when block-ref-pages
                            (swap! ref-pages set/union (set block-ref-pages)))
                          (-> block
                              (dissoc :ref-pages)
                              (assoc :block/file {:file/path file}
                                     :block/format format
                                     :block/page [:block/name (string/lower-case page)]
                                     :block/refs block-ref-pages
                                     :block/path-refs block-path-ref-pages))))
                   blocks)
          page-entity (let [page-file? (= page (string/lower-case file))
                            alias (:alias properties)
                            alias (if (string? alias) [alias] alias)
                            aliases (and alias (seq (remove #(= page %) alias)))
                            page-list (when-let [list-content (:list properties)]
                                        (extract-page-list list-content))]
                        (cond->
                          (util/remove-nils
                           (assoc
                            (block/page-name->map page false)
                            :block/file {:file/path file}))
                          (seq properties)
                          (assoc :block/properties properties)

                          aliases
                          (assoc :block/alias
                                 (map
                                   (fn [alias]
                                     (let [page-name (string/lower-case alias)
                                           aliases (distinct
                                                    (conj
                                                     (remove #{alias} aliases)
                                                     page))
                                           aliases (when (seq aliases)
                                                     (map
                                                       (fn [alias]
                                                         {:block/name (string/lower-case alias)})
                                                       aliases))]
                                       (if (seq aliases)
                                         {:block/name page-name
                                          :block/alias aliases}
                                         {:block/name page-name})))
                                   aliases))

                          (:tags properties)
                          (assoc :block/tags (let [tags (:tags properties)
                                                   tags (if (string? tags) [tags] tags)
                                                   tags (remove string/blank? tags)]
                                               (swap! ref-tags set/union (set tags))
                                               (map (fn [tag] {:block/name (string/lower-case tag)
                                                              :block/original-name tag})
                                                 tags)))))
          pages (->> (concat
                      [page-entity]
                      @ref-pages
                      (map
                        (fn [page]
                          {:block/original-name page
                           :block/name (string/lower-case page)})
                        @ref-tags))
                     ;; remove block references
                     (remove vector?))
          pages (util/distinct-by :block/name pages)
          block-ids (->>
                     (mapv (fn [block]
                             {:block/uuid (:block/uuid block)})
                           (remove nil? blocks))
                     (remove nil?))
          pages (remove nil? pages)
          pages (map (fn [page] (assoc page :block/uuid (db/new-block-id))) pages)]
      [pages
       block-ids
       (remove nil? blocks)])
    (catch js/Error e
      (log/error :exception e))))

(defn extract-blocks-pages
  ([repo-url file content]
   (extract-blocks-pages repo-url file content (utf8/encode content)))
  ([repo-url file content utf8-content]
   (if (string/blank? content)
     (p/resolved [])
     (p/let [format (format/get-format file)
             _ (println "Parsing start : " file)
             ast (mldoc/->edn-async content (mldoc/default-config format))]
       _ (println "Parsing finished : " file)
       (let [journal? (config/journal? file)
             first-block (ffirst ast)
             properties (let [properties (and (property/properties-ast? first-block)
                                              (->> (last first-block)
                                                   (map (fn [[x y]]
                                                          [x (if (string? y)
                                                               (property/parse-property x y)
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
          file content utf8-content journal?))))))

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

(defn- remove-illegal-refs
  [block block-ids-set refresh?]
  (let [aux-fn (fn [refs]
                 (let [block-refs (if refresh? (set refs)
                                      (set/intersection (set refs) block-ids-set))]
                   (set/union
                    (filter :block/name refs)
                    block-refs)))]
    (-> block
        (update :block/refs aux-fn)
        (update :block/path-refs aux-fn))))

(defn extract-all-blocks-pages
  [repo-url files metadata refresh?]
  (when (seq files)
    (-> (p/all (map
                 (fn [{:file/keys [path content]} contents]
                   (when content
                     ;; TODO: remove `text/scheduled-deadline-dash->star` once migration is done
                     (let [org? (= "org" (string/lower-case (util/get-file-ext path)))]
                       (let [content (if org?
                                       content
                                       (text/scheduled-deadline-dash->star content))
                             utf8-content (utf8/encode content)]
                         (extract-blocks-pages repo-url path content utf8-content)))))
                 files))
        (p/then (fn [result]
                  (let [result (remove empty? result)]
                    (when (seq result)
                      (let [[pages block-ids blocks] (apply map concat result)
                            block-ids (remove (fn [b] (or (nil? b)
                                                         (nil? (:block/uuid b)))) block-ids)
                            pages (with-ref-pages pages blocks)
                            blocks (map (fn [block]
                                          (let [id (:block/uuid block)
                                                properties (get-in metadata [:block/properties id])]
                                            (update block :block/properties merge properties)))
                                     blocks)
                            ;; To prevent "unique constraint" on datascript
                            pages-index (map #(select-keys % [:block/name]) pages)
                            block-ids-set (set (map (fn [{:block/keys [uuid]}] [:block/uuid uuid]) block-ids))
                            blocks (map #(remove-illegal-refs % block-ids-set refresh?) blocks)]
                        (apply concat [pages-index pages block-ids blocks])))))))))

(defn extract-all-block-refs
  [content]
  (map second (re-seq #"\(\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\)\)" content)))
