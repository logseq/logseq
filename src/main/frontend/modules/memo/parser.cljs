;; src/main/frontend/modules/memo/parser.cljs
(ns frontend.modules.memo.parser
  (:require [clojure.string :as string]
            [cljs-yaml.core :as yaml]))

(defn parse-frontmatter [content]
  (if-let [[_ yaml-str] (re-find #"(?s)^---\n(.*?)\n---\n" content)]
    (let [data (yaml/parse-string yaml-str)]
      (-> data
          (update :type keyword)
          (update :importance keyword)
          (assoc :raw yaml-str)))
    {}))

(defn extract-relations [content]
  (let [link-pattern #"\[\[([^\]]+)\]\]"
        matches (re-seq link-pattern content)]
    (map (fn [match]
           (let [[_ link-text] match
                 parts (string/split link-text #"\s+")
                 target (first parts)
                 rel-type (if (= (count parts) 2)
                            (keyword (second parts))
                            :default)]
             {:target target :type rel-type}))
         matches)))

(defn parse-setting [file-path content]
  (let [frontmatter (parse-frontmatter content)
        ;; Find the end of frontmatter (after second --- line) and extract body
        lines (string/split content #"\n")
        frontmatter-end (some->> (range 1 (count lines))
                                  (some #(when (= (nth lines %) "---") %)))
        body (if frontmatter-end
               (string/join "\n" (drop (+ 2 frontmatter-end) lines))
               content)]
    {:file-path file-path
     :frontmatter frontmatter
     :body body
     :relations (extract-relations content)}))