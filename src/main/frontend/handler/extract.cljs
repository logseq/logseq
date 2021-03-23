(ns frontend.handler.extract
  "Extract helper."
  (:require [frontend.util :as util]
            [frontend.db :as db]
            [lambdaisland.glogi :as log]
            [clojure.set :as set]
            [frontend.utf8 :as utf8]
            [frontend.date :as date]
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

;; TODO: performance improvement
(defn- extract-pages-and-blocks
  [repo-url format ast properties file content utf8-content journal? pages-fn]
  (try
    (let [now (tc/to-long (t/now))
          blocks (block/extract-blocks ast (utf8/length utf8-content) utf8-content false)
          pages (pages-fn blocks ast)
          ref-pages (atom #{})
          ref-tags (atom #{})
          blocks (doall
                  (mapcat
                   (fn [[page blocks]]
                     (if page
                       (map (fn [block]
                              (let [block-ref-pages (seq (:block/refs block))
                                    block-path-ref-pages (seq (:block/path-refs block))]
                                (when block-ref-pages
                                  (swap! ref-pages set/union (set block-ref-pages)))
                                (-> block
                                    (dissoc :ref-pages)
                                    (assoc :block/content (db/get-block-content utf8-content block)
                                           :block/file [:file/path file]
                                           :block/format format
                                           :block/page [:block/name (string/lower-case page)]
                                           :block/refs block-ref-pages
                                           :block/path-refs block-path-ref-pages))))
                         blocks)))
                   (remove nil? pages)))
          pages (doall
                 (map
                   (fn [page]
                     (let [page-file? (= page (string/lower-case file))
                           aliases (and (:alias properties)
                                        (seq (remove #(= page %)
                                                     (:alias properties))))
                           journal-date-long (if journal?
                                               (date/journal-title->long (string/capitalize page)))
                           page-list (when-let [list-content (:list properties)]
                                       (extract-page-list list-content))]
                       (cond->
                         (util/remove-nils
                          {:block/name (string/lower-case page)
                           :block/original-name page
                           :block/file [:file/path file]
                           :block/journal? journal?
                           :block/journal-day (if journal?
                                                (date/journal-title->int page)
                                                0)})
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
                                                tags))))))
                   (->> (map first pages)
                        (remove string/blank?))))
          pages (->> (concat
                      pages
                      @ref-pages
                      (map
                        (fn [page]
                          {:block/original-name page
                           :block/name (string/lower-case page)})
                        @ref-tags))
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
       file content utf8-content journal?
       (fn [blocks ast]
         [[(db/get-page-name file ast) blocks]])))))

(defn extract-all-blocks-pages
  [repo-url files]
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
              pages (util/distinct-by :block/name pages)
              block-ids-set (set (map (fn [{:block/keys [uuid]}] [:block/uuid uuid]) block-ids))
              blocks (map (fn [b]
                            (update b :block/refs #(set/intersection (set %) block-ids-set))) blocks)]
          (apply concat [pages block-ids blocks]))))))
