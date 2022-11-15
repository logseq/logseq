(ns logseq.publish.block
  (:require [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [clojure.string :as string]
            [logseq.publish.util :as util]))

(defn get-block-pattern
  [format]
  (gp-config/get-block-pattern format))

(defn parse-title-and-body
  [block-uuid format pre-block? content]
  (when-not (string/blank? content)
    (let [content (if pre-block? content
                      (str (get-block-pattern format) " " (string/triml content)))]
      (let [ast (->> (gp-mldoc/->edn content (gp-mldoc/default-config format))
                     (map first))
            title (when (gp-block/heading-block? (first ast))
                    (:title (second (first ast))))
            body (vec (if title (rest ast) ast))
            body (drop-while gp-property/properties-ast? body)]
        (cond->
          (if (seq body) {:block/body body} {})
          title
          (assoc :block/title title))))))

(defn break-line-paragraph?
  [[typ break-lines]]
  (and (= typ "Paragraph")
       (every? #(= % ["Break_Line"]) break-lines)))

(defn trim-paragraph-special-break-lines
  [ast]
  (let [[typ paras] ast]
    (if (= typ "Paragraph")
      (let [indexed-paras (map-indexed vector paras)]
        [typ (->> (filter
                   #(let [[index value] %]
                      (not (and (> index 0)
                                (= value ["Break_Line"])
                                (contains? #{"Timestamp" "Macro"}
                                           (first (nth paras (dec index)))))))
                   indexed-paras)
                  (map #(last %)))])
      ast)))

(defn trim-break-lines
  [ast]
  (drop-while break-line-paragraph?
              (map trim-paragraph-special-break-lines ast)))
