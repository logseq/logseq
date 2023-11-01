(ns ^:no-doc frontend.search.db
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util]
            ["fuse.js" :as fuse]))

;; Notice: When breaking changes happen, bump version in src/electron/electron/search.cljs

(defonce indices (atom nil))

(defn- max-len
  []
  (state/block-content-max-length (state/get-current-repo)))

(defn block->index
  "Convert a block to the index for searching"
  [{:block/keys [uuid page content] :as block}]
  (when-not (> (count content) (max-len))
    (when-not (string/blank? content)
      {:id (:db/id block)
       :uuid (str uuid)
       :page page
       :content content})))

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
         :content (str "$pfts_f6ld>$ " original-name " $<pfts_f6ld$ " content)}))))

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

(defn process-block-avet [avet]
  (some->> avet :v db/get-single-block-contents block->index bean/->js))

(defn make-blocks-indice-non-blocking!
  ([repo] (make-blocks-indice-non-blocking! 1000))
  ([repo chunk-size]
   (let [avets (db/get-all-block-avets)
         chunks (partition-all chunk-size avets)
         acc (atom [])
         process-chunks (fn process-recur [[curr & more]]
                          (js/console.log "process-recur")
                          (when-not (empty? curr)
                            (->> (map process-block-avet curr)
                                 (remove nil?)
                                 (doall)
                                 (swap! acc concat)))
                          (if (empty? more)
                            (make-blocks-indice! repo @acc)
                            (js/setTimeout #(process-recur more) 0)))]
     (js/console.log "process-make-blocks-indice-non-blocking!" (count avets))
     (process-chunks chunks))))

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
                                  :minMatchCharLength 1}))]
      (swap! indices assoc-in [repo :pages] indice)
      indice)))
