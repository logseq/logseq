(ns frontend.search.db
  (:refer-clojure :exclude [empty?])
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.util :as util]
            [frontend.util.drawer :as drawer]
            [frontend.util.property :as property]
            ["fuse.js" :as fuse]))

(defonce indices (atom nil))

(defn empty?
  [repo]
  (nil? (get @indices repo)))

(defn block->content
  "Convert a block to the display contents for searching"
  [{:block/keys [content format]}]
  (->> (text/remove-level-spaces content format)
       (drawer/remove-logbook)
       (property/remove-built-in-properties format)))

(defn block->index
  "Convert a block to the index for searching"
  [{:block/keys [uuid page] :as block}]
  (when-let [result (->> (block->content block)
                         (util/search-normalize))]
    {:id (:db/id block)
     :uuid (str uuid)
     :page page
     :content result}))

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

(defn make-pages-indice!
  []
  (when-let [repo (state/get-current-repo)]
    (let [pages (->> (db/get-pages (state/get-current-repo))
                     (remove string/blank?)
                     (map (fn [p] {:name p}))
                     (bean/->js))
          indice (fuse. pages
                        (clj->js {:keys ["name"]
                                  :shouldSort true
                                  :tokenize true
                                  :minMatchCharLength 1
                                  :distance 1000
                                  :threshold 0.35
                                  }))]
      (swap! indices assoc-in [repo :pages] indice)
      indice)))
