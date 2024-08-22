(ns frontend.util.block-content
  "utils for text content residing in a block"
  (:require [clojure.string :as string]
            [frontend.format.mldoc :as mldoc]
            [logseq.graph-parser.mldoc :as gp-mldoc]))



(defn get-ast
  [content format]
  (mldoc/->edn content (gp-mldoc/default-config format)))

(defn has-title?
  [content format]
  (let [ast (get-ast content format)]
    (mldoc/block-with-title? (ffirst (map first ast)))))

(defn get-title&body
  "parses content and returns [title body]
   returns nil if no title"
  [content format]
  (let [lines (string/split-lines content)]
    (if (has-title? content format)
      [(first lines) (string/join "\n" (rest lines))]
      [nil (string/join "\n" lines)])))