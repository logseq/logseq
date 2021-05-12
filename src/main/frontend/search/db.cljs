(ns frontend.search.db
  (:refer-clojure :exclude [empty?])
  (:require [frontend.text :as text]
            [frontend.db :as db]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            ["fuse.js" :as fuse]
            [clojure.string :as string]))

(defonce indices (atom nil))

(defn empty?
  [repo]
  (nil? (get @indices repo)))

(defn block->index
  [{:block/keys [uuid content format page] :as block}]
  (when-let [result (->> (text/remove-level-spaces content format)
                         (text/remove-id-property! format))]
    {:id (:db/id block)
     :uuid (str uuid)
     :page page
     :content result}))

(defn build-blocks-indice
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
