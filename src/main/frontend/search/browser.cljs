(ns frontend.search.browser
  (:require [frontend.search.protocol :as protocol]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [frontend.search.db :as search-db :refer [indices]]
            [clojure.string :as string]
            [promesa.core :as p]
            [goog.object :as gobj]
            [frontend.db :as db]
            [medley.core :as medley]))

;; fuse.js

(defn search-blocks
  [repo q {:keys [limit]
            :or {limit 20}
            :as option}]
  (let [indice (or (get-in @indices [repo :blocks])
                   (search-db/make-blocks-indice! repo))
        result (.search indice q (clj->js {:limit limit}))
        result (bean/->clj result)]
    (->>
     (map
       (fn [{:keys [item matches] :as block}]
         (let [{:keys [content uuid]} item]
           {:block/uuid uuid
            :block/content content
            :block/page (:block/page (db/entity [:block/uuid (medley/uuid (str uuid))]))
            :search/matches matches}))
       result)
     (remove nil?))))

(defrecord Browser [repo]
  protocol/Engine
  (query [this q option]
    (p/promise (search-blocks repo q option)))
  (rebuild-blocks-indice! [this]
    (let [indice (search-db/make-blocks-indice! repo)]
      (p/promise indice)))
  (transact-blocks! [this {:keys [blocks-to-remove-set
                                  blocks-to-add]}]
    (swap! search-db/indices update-in [repo :blocks]
           (fn [indice]
             (when indice
               (doseq [block-id blocks-to-remove-set]
                 (.remove indice
                          (fn [block]
                            (= block-id (gobj/get block "id")))))
               (when (seq blocks-to-add)
                 (doseq [block blocks-to-add]
                   (.add indice (bean/->js block)))))
             indice)))
  (truncate-blocks! [this]
    (swap! indices assoc-in [repo :blocks] nil))
  (remove-db! [this]
    nil))
