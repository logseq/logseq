(ns frontend.handler.extract
  "Extract helper."
  (:require [frontend.util :as util]
            [frontend.db :as db]
            [lambdaisland.glogi :as log]
            [clojure.set :as set]
            [frontend.utf8 :as utf8]
            [frontend.date :as date]
            [frontend.text :as text]
            [clojure.string :as string]
            [frontend.format.mldoc :as mldoc]
            [frontend.format.block :as block]
            [frontend.format :as format]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

(defn- extract-page-list
  [content]
  (when-not (string/blank? content)
    (->> (re-seq #"\[\[([^\]]+)]]" content)
         (map last)
         (remove nil?)
         (map string/lower-case)
         (distinct))))

(defn- remove-indentation-spaces
  [s level]
  (let [level (inc level)
        lines (string/split-lines s)
        [f & r] lines
        body (map (fn [line]
                    (if (string/blank? (util/safe-subs line 0 level))
                      (util/safe-subs line level)
                      line))
                  r)
        content (cons f body)]
    (string/join "\n" content)))

(defn- get-block-content
  [utf8-content block format]
  (let [meta (:block/meta block)
        content (if-let [end-pos (:end-pos meta)]
                  (utf8/substring utf8-content
                                  (:start-pos meta)
                                  end-pos)
                  (utf8/substring utf8-content
                                  (:start-pos meta)))]
    (when content
      (let [content (text/remove-level-spaces content format)]
        (if (or (:block/pre-block? block)
                (= (:block/format block) :org))
          content
          (remove-indentation-spaces content (:block/level block)))))))

;; TODO: performance improvement
(defn- extract-pages-and-blocks
  [repo-url format ast properties file content utf8-content journal?]
  (try
    (let [now (tc/to-long (t/now))
          page (db/get-page-name file ast)
          [page page-name journal-day] (block/convert-page-if-journal page)
          blocks (->> (block/extract-blocks ast content false format)
                      (block/with-parent-and-left [:block/name (string/lower-case page)]))
          ref-pages (atom #{})
          ref-tags (atom #{})
          blocks (map (fn [block]
                        (let [block-ref-pages (seq (:block/refs block))
                              block-path-ref-pages (seq (:block/path-refs block))
                              content (get-block-content utf8-content block format)
                              content (if (= format :org)
                                        content
                                        (text/->new-properties content))]
                          (when block-ref-pages
                            (swap! ref-pages set/union (set block-ref-pages)))
                          (-> block
                              (dissoc :ref-pages)
                              (assoc :block/content content
                                     :block/file [:file/path file]
                                     :block/format format
                                     :block/page [:block/name (string/lower-case page)]
                                     :block/refs block-ref-pages
                                     :block/path-refs block-path-ref-pages))))
                   blocks)
          page-entity (let [page-file? (= page (string/lower-case file))
                            aliases (and (:alias properties)
                                         (seq (remove #(= page %)
                                                      (:alias properties))))
                            page-list (when-let [list-content (:list properties)]
                                        (extract-page-list list-content))]
                        (cond->
                          (util/remove-nils
                           (assoc
                            (block/page-name->map page false)
                            :block/file [:file/path file]))
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
                                           aliases (if (seq aliases)
                                                     (map
                                                       (fn [alias]
                                                         {:block/name alias})
                                                       aliases))]
                                       (if (seq aliases)
                                         {:block/name page-name
                                          :block/alias aliases}
                                         {:block/name page-name})))
                                   aliases))

                          (:tags properties)
                          (assoc :block/tags (let [tags (->> (:tags properties)
                                                             (remove string/blank?))]
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
          block-ids (mapv (fn [block]
                            {:block/uuid (:block/uuid block)})
                          (remove nil? blocks))
          pages (remove nil? pages)
          pages (map (fn [page] (assoc page :block/uuid (db/new-block-id))) pages)]
      [pages
       block-ids
       (remove nil? blocks)])
    (catch js/Error e
      (log/error :extract-pages-and-blocks/failed e))))

(defn extract-blocks-pages
  [repo-url file content utf8-content]
  (if (string/blank? content)
    []
    (let [journal? (util/journal? file)
          format (format/get-format file)
          ast (mldoc/->edn content
                           (mldoc/default-config format))
          first-block (first ast)
          properties (let [properties (and (seq first-block)
                                           (= "Properties" (ffirst first-block))
                                           (last (first first-block)))]
                       (if (and properties (seq properties))
                         properties))]
      (extract-pages-and-blocks
       repo-url
       format ast properties
       file content utf8-content journal?))))

(defn extract-all-blocks-pages
  [repo-url files metadata]
  (when (seq files)
    (let [result (->> files
                      (map
                       (fn [{:file/keys [path content]} contents]
                         (println "Parsing : " path)
                         (when content
                           (let [utf8-content (utf8/encode content)]
                             (extract-blocks-pages repo-url path content utf8-content)))))
                      (remove empty?))]
      (when (seq result)
        (let [[pages block-ids blocks] (apply map concat result)
              ref-pages (->> (mapcat :block/refs blocks)
                             (filter :block/name))
              pages (->> (util/distinct-by :block/name (concat pages ref-pages))
                         (map (fn [page]
                                (if (:block/uuid page)
                                  page
                                  (assoc page :block/uuid (db/new-block-id))))))
              blocks (map (fn [block]
                            (let [id (:block/uuid block)
                                  properties (get-in metadata [:block/properties id])]
                              (update block :block/properties merge properties)))
                          blocks)
              ;; To prevent "unique constraint" on datascript
              pages-index (map #(select-keys % [:block/name]) pages)
              pages (util/distinct-by :block/name pages)
              block-ids-set (set (map (fn [{:block/keys [uuid]}] [:block/uuid uuid]) block-ids))
              blocks (map (fn [b]
                            (update b :block/refs
                                    (fn [refs]
                                      (set/union
                                       (filter :block/name refs)
                                       (set/intersection (set refs) block-ids-set))))) blocks)]
          (apply concat [pages-index pages block-ids blocks]))))))
