(ns frontend.ai.search-mixer
  "Mixer for hybrid search"
  (:require ["fuse.js" :as fuse]))

(defn assoc-default-fuse-score
  "If a search result doesn't contain :fuse-score, then add it with worst score"
  [search-results] 
  (map (fn [result] 
         (if (get result :fuse-score)
           result
           (assoc result :fuse-score 1)))
       search-results))

(defn assoc-default-semantic-score
  "If a search result doesn't contain :semantic-score, then add it with worst score"
  [search-results worst-score]
  (map (fn [result]
         (if (get result :semantic-score)
           result
           (assoc result :semantic-score worst-score)))
       search-results))

(defn transform-semantic-results
  "semantic-results:
     ({:key \"184269\",
  :id 17,
  :data
  {:snippet \"hey you good to see \",
   :page 181513,
   :id 184269,
   :uuid \"e8eac1ad-1090-4c53-a7ac-02091b3151e2\"},
  :score 0.825903720991852})
     return:
     ({
         :key <key to return>
         :semantic-score <score>
         <other records>
     })"
  [semantic-results]
  (map (fn [result]
         (assoc (:data result)
                :key (:uuid (:data result))
                :semantic-score (max (- 1 (:score result)) 0)))
       semantic-results))

(defn assoc-fuse-score
  "Use fuse.js to rank search results
  search-results: 
  ({
      :key <key to return>
      :content <string>
  })
  return:
  ({
      :key <key to return>
      :fuse-score <score>
      <other records>
  })"
  [search-results query]
  (let [indice (fuse. (clj->js search-results)
                      (clj->js {:keys ["key" "content"]
                                :shouldSort false
                                :tokenize true
                                :minMatchCharLength 2
                                :distance 1000
                                :includeScore true
                                :threshold 1.0}))
        fuse-list (js->clj (.search indice query (clj->js {:limit 10})))
        score-map (into {}
                        (map (fn [r] [(get-in r ["item" "key"]) (get r "score")])
                             fuse-list))]
    (map (fn [item]
           (assoc item
                  :fuse-score (or (score-map (get item :key)) 1.0)))
         search-results)))

(defn transform-search-results [results]
  (let [blocks       (map (fn [block]
                            {:key (:block/uuid block)
                             :content (:block/content block)})
                          (:blocks results))

        pages-content (map (fn [page-content]
                             {:key (:block/uuid page-content)
                              :content (:block/snippet page-content)})
                           (:pages-content results))

        pages        (map (fn [page]
                            {:key (str "page:" page)
                             :content page})
                          (:pages results))

        files        (map (fn [file]
                            {:key (str "file:" file)
                             :content file})
                          (:files results))]

    (concat blocks pages-content pages files)))

(defn get-worst-semantic-score
  [semantic-results]
  (let [scores (map :semantic-score semantic-results)
        scores (conj scores 0)]
    (apply max scores)))

(defn sort-scores-search-results
  "search-results: 
  ({
      :key <key to return>
      :fuse-score <score>
          - A bittap score, A score of 0indicates a perfect match, while a score of 1 indicates a complete mismatch.
      :semantic-score <score>
          - A cosine similarity score, 0 indicates a complete mismatch (orthogonal), 1 indicates a perfect match.
  })
  return:
   :combined-score <score>
      - A combined score, 0 indicates a perfect match, 1 indicates a complete mismatch.
   Sorted list of keys"
  [search-results]
  (let [combined-results (map (fn [result]
                                (let [combined-score (/ (+ (:fuse-score result) (:semantic-score result)) 2)]
                                  (assoc result :combined-score combined-score)))
                              search-results)
        sorted-results (sort-by :combined-score < combined-results)] ; sort in ascending order
    sorted-results))

(defn merge-duplicated-search-results
  "For search results with the same key, merge them into one result "
  [search-results]
  (let [grouped-results (group-by :key search-results)]
    (map (fn [[_, items]]
           (reduce (fn [acc item]
                     (merge-with (fn [old new]
                                   (if (number? old)
                                     (min old new)
                                     new))
                                 acc item))
                   items))
         grouped-results)))

(defn- merge-search-results'
  "Merge fuse.js search results with semantic search results and remove duplicates"
  [trad-results semantic-results] 
 (-> trad-results
     (concat semantic-results)
     (merge-duplicated-search-results)
     (assoc-default-fuse-score)
     (assoc-default-semantic-score (get-worst-semantic-score semantic-results))
     (sort-scores-search-results)))
  
(defn merge-search-results
  [trad-results semantic-results query]
  (let [trad-results (transform-search-results trad-results)
        fuse-score-results (assoc-fuse-score trad-results query)
        semantic-results (transform-semantic-results semantic-results)]
    (merge-search-results' fuse-score-results semantic-results)))
