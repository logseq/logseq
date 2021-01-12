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
          blocks (block/extract-blocks ast (utf8/length utf8-content) utf8-content)
          pages (pages-fn blocks ast)
          ref-pages (atom #{})
          ref-tags (atom #{})
          blocks (doall
                  (mapcat
                   (fn [[page blocks]]
                     (if page
                       (map (fn [block]
                              (let [block-ref-pages (seq (:block/ref-pages block))]
                                (when block-ref-pages
                                  (swap! ref-pages set/union (set block-ref-pages)))
                                (-> block
                                    (dissoc :ref-pages)
                                    (assoc :block/content (db/get-block-content utf8-content block)
                                           :block/file [:file/path file]
                                           :block/format format
                                           :block/page [:page/name (string/lower-case page)]
                                           :block/ref-pages (mapv
                                                             (fn [page]
                                                               (block/page-with-journal page))
                                                             block-ref-pages)))))
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
                        {:page/name (string/lower-case page)
                         :page/original-name page
                         :page/file [:file/path file]
                         :page/journal? journal?
                         :page/journal-day (if journal?
                                             (date/journal-title->int (string/capitalize page))
                                             0)
                         :page/created-at journal-date-long
                         :page/last-modified-at journal-date-long})
                        (seq properties)
                        (assoc :page/properties properties)

                        aliases
                        (assoc :page/alias
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
                                                     {:page/name alias})
                                                   aliases))]
                                    (if (seq aliases)
                                      {:page/name page-name
                                       :page/alias aliases}
                                      {:page/name page-name})))
                                aliases))

                        (:tags properties)
                        (assoc :page/tags (let [tags (:tags properties)]
                                            (swap! ref-tags set/union (set tags))
                                            (map (fn [tag] {:page/name (string/lower-case tag)
                                                            :page/original-name tag})
                                                 tags))))))
                  (->> (map first pages)
                       (remove nil?))))
          pages (concat
                 pages
                 (map
                  (fn [page]
                    {:page/original-name page
                     :page/name (string/lower-case page)})
                  @ref-tags)
                 (map
                  (fn [page]
                    {:page/original-name page
                     :page/name (string/lower-case page)})
                  @ref-pages))
          block-ids (mapv (fn [block]
                            {:block/uuid (:block/uuid block)})
                          (remove nil? blocks))]
      [(remove nil? pages)
       block-ids
       (remove nil? blocks)])
    (catch js/Error e
      (js/console.log e))))

(defn extract-blocks-pages
  [repo-url file content utf8-content]
  (if (string/blank? content)
    []
    (let [journal? (util/starts-with? file "journals/")
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
              block-ids-set (set block-ids)
              ;; To prevent "unique constraint" on datascript
              pages-index (map #(select-keys % [:page/name]) pages)
              blocks (map (fn [b]
                            (-> b
                                (update :block/ref-blocks #(set/intersection (set %) block-ids-set))
                                (update :block/embed-blocks #(set/intersection (set %) block-ids-set)))) blocks)]
          (apply concat [pages-index pages block-ids blocks]))))))
