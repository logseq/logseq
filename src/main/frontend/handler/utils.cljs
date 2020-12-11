(ns frontend.handler.utils
  (:require [frontend.db.queries :as db-queries]
            [frontend.db.react-queries :as react-queries]
            [frontend.db.utils :as db-utils]
            [frontend.format :as format]
            [frontend.utf8 :as utf8]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.format.mldoc :as mldoc]
            [frontend.format.block :as block]
            [frontend.date :as date]
            [frontend.config :as config]
            [clojure.set :as set]))

(defn- remove-key
  [repo-url key]
  (db-queries/retract-by-key repo-url key)
  (react-queries/set-new-result! [repo-url :kv key] nil))

(defn set-key-value
  [repo-url key value]
  (if value
    (db-queries/transact-react! repo-url [(db-utils/kv key value)]
      {:key [:kv key]})
    (remove-key repo-url key)))

(defn with-block-refs-count
  [repo blocks]
  (let [refs (db-queries/get-block-refs-count repo)]
    (map (fn [block]
           (assoc block :block/block-refs-count
                        (get refs (:db/id block))))
      blocks)))

(defn delete-file-blocks!
  [repo-url path]
  (let [blocks (db-queries/get-file-blocks repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks)))

(defn extract-pages-and-blocks
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
                                      (assoc :block/content (db-utils/get-block-content utf8-content block)
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
                            other-alias (and (:alias properties)
                                          (seq (remove #(= page %)
                                                 (:alias properties))))
                            other-alias (distinct
                                          (remove nil? other-alias))
                            journal-date-long (if journal?
                                                (date/journal-title->long (string/capitalize page)))
                            page-list (when-let [list-content (:list properties)]
                                        (db-utils/extract-page-list list-content))]
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

                          other-alias
                          (assoc :page/alias
                                 (map
                                   (fn [alias]
                                     (let [alias (string/lower-case alias)
                                           aliases (->>
                                                     (distinct
                                                       (conj
                                                         (remove #{alias} other-alias)
                                                         page))
                                                     (remove nil?))
                                           aliases (if (seq aliases)
                                                     (map
                                                       (fn [alias]
                                                         {:page/name alias})
                                                       aliases))]
                                       (if (seq aliases)
                                         {:page/name alias
                                          :page/alias aliases}
                                         {:page/name alias})))
                                   other-alias))

                          (or (:tags properties) (:roam_tags properties))
                          (assoc :page/tags (let [tags (:tags properties)
                                                  roam-tags (:roam_tags properties)
                                                  tags (if (string? tags)
                                                         (string/split tags #",")
                                                         tags)
                                                  tags (->> (concat tags roam-tags)
                                                            (remove nil?)
                                                            (distinct))
                                                  tags (util/->tags tags)]
                                              (swap! ref-tags set/union (set (map :tag/name tags)))
                                              tags)))))
                    (->> (map first pages)
                         (remove nil?))))
          pages (concat
                  pages
                  (map
                    (fn [page]
                      {:page/original-name page
                       :page/name page})
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
          [[(db-utils/get-page-name file ast) blocks]])))))

;; TODO: compare blocks
(defn reset-file!
  [repo-url file content]
  (let [new? (nil? (db-utils/entity [:file/path file]))]
    (db-queries/set-file-content! repo-url file content)
    (let [format (format/get-format file)
          utf8-content (utf8/encode content)
          file-content [{:file/path file}]
          tx (if (contains? config/mldoc-support-formats format)
               (let [delete-blocks (delete-file-blocks! repo-url file)
                     [pages block-ids blocks] (extract-blocks-pages repo-url file content utf8-content)]
                 (concat file-content delete-blocks pages block-ids blocks))
               file-content)
          tx (concat tx [(let [t (tc/to-long (t/now))]
                           (cond->
                             {:file/path file
                              :file/last-modified-at t}
                             new?
                             (assoc :file/created-at t)))])]
      (db-queries/transact! repo-url tx))))