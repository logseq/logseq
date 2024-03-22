(ns ^:no-doc frontend.search.db
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util]
            ["fuse.js" :as fuse]
            [frontend.util.property :as property]))

;; Notice: When breaking changes happen, bump version in src/electron/electron/search.cljs

(defonce indices (atom nil))

(defn- max-len
  []
  (state/block-content-max-length (state/get-current-repo)))

(defn- sanitize
  [content]
  (some-> content
          (util/search-normalize (state/enable-search-remove-accents?))))

(defn- strict-block->index
  "Convert a block to the index for searching.

   Applies full text preprocessing to the content, including removing built-in properties"
  [{:block/keys [uuid page content format] :as block
    :or {format :markdown}}]
  (when-not (> (count content) (max-len))
    (let [content (property/remove-built-in-properties format content)]
      (when-not (string/blank? content)
        {:id (:db/id block)
         :uuid (str uuid)
         :page page
         :content (sanitize content)}))))

(defn- loose-block->index
  "Convert a block to the index for searching

   For speed, applies no preprocessing to the content"
  [{:block/keys [uuid page content] :as block}]
  (when-not (string/blank? content)
    {:id (:db/id block)
     :uuid (str uuid)
     :page page
     :content content}))

(defonce block->index (if (util/electron?)
                        strict-block->index
                        loose-block->index))

(defn page->index
  "Convert a page name to the index for searching (page content level)
   Generate index based on the DB content AT THE POINT OF TIME"
  [{:block/keys [uuid original-name] :as page}]
  (when-let [content (some-> (:block/file page)
                             (:file/content))]
    (when-not (string/blank? original-name)
      (when-not (> (count content) (* (max-len) 10))
        {:id   (:db/id page)
         :uuid (str uuid)
         ;; Add page name to the index
         :content (sanitize (str "$pfts_f6ld>$ " original-name " $<pfts_f6ld$ " content))}))))

(defn build-blocks-indice
  ;; TODO: Remove repo effects fns further up the call stack. db fns need standardization on taking connection
  #_:clj-kondo/ignore
  [repo]
  (->> (db/get-all-block-contents)
       (map block->index)
       (remove nil?)
       (bean/->js)))

(defn build-pages-indice
  [repo]
  (->> (db/get-all-pages repo)
       (map #(db/entity (:db/id %))) ;; get full file-content
       (map page->index)
       (remove nil?)
       (bean/->js)))

(defn make-blocks-indice!
  ([repo] (make-blocks-indice! repo (build-blocks-indice repo)))
  ([repo blocks]
   (let [indice (fuse. blocks
                       (clj->js {:keys ["uuid" "content" "page"]
                                 :shouldSort true
                                 :tokenize true
                                 :minMatchCharLength 1
                                 :distance 1000
                                 :threshold 0.35}))]
     (swap! indices assoc-in [repo :blocks] indice)
     indice)))

(defn original-page-name->index
  [p]
  (when p
    {:name (util/search-normalize p (state/enable-search-remove-accents?))
     :original-name p}))

(defn make-pages-title-indice!
  "Build a page title indice from scratch.
   Incremental page title indice is implemented in frontend.search.sync-search-indice!
   Rename from the page indice since 10.25.2022, since this is only used for page title search.
   From now on, page indice is talking about page content search."
  []
  (when-let [repo (state/get-current-repo)]
    (let [pages (->> (db/get-pages (state/get-current-repo))
                     (remove string/blank?)
                     (map original-page-name->index)
                     (bean/->js))
          indice (fuse. pages
                        (clj->js {:keys ["name"]
                                  :shouldSort true
                                  :tokenize true
                                  :distance 1024
                                  :threshold 0.5 ;; search for 50% match from the start
                                  :minMatchCharLength 1}))]
      (swap! indices assoc-in [repo :pages] indice)
      indice)))
