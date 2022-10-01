(ns ^:no-doc frontend.search.db
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util]
            ["fuse.js" :as fuse]))

;; Notice: When breaking changes happen, bump version in src/electron/electron/search.cljs

(defonce indices (atom nil))

(defn block->index
  "Convert a block to the index for searching"
  [{:block/keys [uuid page content] :as block}]
  (when-let [content (util/search-normalize content (state/enable-search-remove-accents?))]
    (when-not (> (count content) (state/block-content-max-length (state/get-current-repo)))
      {:id (:db/id block)
       :uuid (str uuid)
       :page page
       :content content})))

(defn build-blocks-indice
  ;; TODO: Remove repo effects fns further up the call stack. db fns need standardization on taking connection
  #_:clj-kondo/ignore
  [repo]
  (->> (db/get-all-block-contents)
       (map block->index)
       (remove nil?)
       (bean/->js)))

(defn make-blocks-indice!
  [repo]
  (let [blocks (build-blocks-indice repo)
        indice (fuse. blocks
                      (clj->js {:keys ["uuid" "content" "page"]
                                :shouldSort true
                                :tokenize true
                                :minMatchCharLength 1
                                :distance 1000
                                :threshold 0.35}))]
    (swap! indices assoc-in [repo :blocks] indice)
    indice))

(defn original-page-name->index
  [p] {:name (util/search-normalize p (state/enable-search-remove-accents?))
       :original-name p})

(defn make-pages-indice!
  "Build a page indice from scratch.
   Incremental page indice is implemented in frontend.search.sync-search-indice!"
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
