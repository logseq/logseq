(ns frontend.extensions.zotero.extractor
  (:require [clojure.string :as str]
            [frontend.util :as util]
            [frontend.extensions.zotero.schema :as schema]
            [frontend.extensions.zotero.api :as api]))

(defn item-type [item] (-> item :data :item-type))

(defmulti extract item-type)

;;;;;;;;;;;;;;;;;;;;
;; journalArticle ;;
;;;;;;;;;;;;;;;;;;;;
(defn citation-key [item]
  (let [extra (-> item :data :extra)
        citation (->> extra
                      (str/split-lines)
                      (filterv (fn [s] (str/includes? s "Citation Key: ")))
                      first)]
    (when citation
      (str "@" (str/trim (str/replace citation "Citation Key: " ""))))))

(defn title [item] (-> item :data :title))

(defn page-name [item]
  (let [citation-key (citation-key item)
        title        (title item)]
    (or citation-key title)))

(defn authors [item]
  (let [creators (-> item :data :creators)
        authors
        (into []
              (comp
               (filter (fn [m] (= "author" (:creator-type m))))
               (map (fn [{:keys [first-name last-name]}]
                      (util/format "[[%s %s]]" first-name last-name))))
              creators)]
    (str/join ", " authors)))

(defn tags [item]
  (let [tags
        (->> (-> item :data :tags)
             (mapv (fn [{:keys [tag]}] (util/format "[[%s]]" tag))))]
    (str/join ", " tags)))

(defn properties [item]
  (let [fields    (schema/fields "journalArticle")
        authors   (authors item)
        tags      (tags item)
        data      (-> item :data
                      (select-keys fields)
                      (assoc :authors authors
                             :tags tags)
                      (dissoc :creators :extra))]
    (->> data
         (remove (comp str/blank? second))
         (into {}))))

(defmethod extract "journalArticle"
  [item]
  (let [page-name  (page-name item)
        properties (properties item)]
    {:page-name page-name
     :properties properties}))

(comment
  (def test-item {:key     "JAHCZRNB",
     :version 37,
     :library
     {:type "user",
      :id   8234867,
      :name "weihua-lu",
      :links
      {:alternate {:href "https://www.zotero.org/weihua-lu", :type "text/html"}}},
     :links
     {:self
      {:href "https://api.zotero.org/users/8234867/items/JAHCZRNB",
       :type "application/json"},
      :alternate
      {:href "https://www.zotero.org/weihua-lu/items/JAHCZRNB", :type "text/html"},
      :attachment
      {:href            "https://api.zotero.org/users/8234867/items/PX7ERZ5D",
       :type            "application/json",
       :attachment-type "application/pdf",
       :attachment-size 676443}},
     :meta
     {:creator-summary "Efroni et al.",
      :parsed-date     "2019-02-17",
      :num-children    2},
     :data
     {:tags
      [{:tag "Computer Science - Artificial Intelligence", :type 1}
       {:tag "Computer Science - Machine Learning", :type 1}
       {:tag "Statistics - Machine Learning", :type 1}],
      :creators
      [{:creator-type "author", :first-name "Yonathan", :last-name "Efroni"}
       {:creator-type "author", :first-name "Gal", :last-name "Dalal"}
       {:creator-type "author", :first-name "Bruno", :last-name "Scherrer"}
       {:creator-type "author", :first-name "Shie", :last-name "Mannor"}],
      :date                 "2019-02-17",
      :issn                 "",
      :archive-location     "",
      :series-text          "",
      :issue                "",
      :key                  "JAHCZRNB",
      :series-title         "",
      :relations            {},
      :series               "",
      :date-modified        "2021-07-12T08:04:52Z",
      :extra                "arXiv: 1809.01843\nCitation Key: efroniHowCombineTreeSearch2019",
      :doi                  "",
      :collections          ["ILULWK4S"],
      :title                "How to Combine Tree-Search Methods in Reinforcement Learning",
      :pages                "",
      :volume               "",
      :item-type            "journalArticle",
      :access-date          "2021-07-12T08:04:51Z",
      :call-number          "",
      :rights               "",
      :language             "en",
      :url                  "http://arxiv.org/abs/1809.01843",
      :short-title          "",
      :abstract-note
      "Finite-horizon lookahead policies are abundantly used in Reinforcement Learning and demonstrate impressive empirical success. Usually, the lookahead policies are implemented with speciﬁc planning methods such as Monte Carlo Tree Search (e.g. in AlphaZero (Silver et al. 2017b)). Referring to the planning problem as tree search, a reasonable practice in these implementations is to back up the value only at the leaves while the information obtained at the root is not leveraged other than for updating the policy. Here, we question the potency of this approach. Namely, the latter procedure is non-contractive in general, and its convergence is not guaranteed. Our proposed enhancement is straightforward and simple: use the return from the optimal tree path to back up the values at the descendants of the root. This leads to a γh-contracting procedure, where γ is the discount factor and h is the tree depth. To establish our results, we ﬁrst introduce a notion called multiple-step greedy consistency. We then provide convergence rates for two algorithmic instantiations of the above enhancement in the presence of noise injected to both the tree search stage and value estimation stage.",
      :publication-title    "arXiv:1809.01843 [cs, stat]",
      :date-added           "2021-07-12T08:04:51Z",
      :version              37,
      :archive              "",
      :journal-abbreviation "",
      :library-catalog      "arXiv.org"}})
  (extract test-item))
