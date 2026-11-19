(ns frontend.worker.input-test-helper
  "Builds raw-content requests used by the worker's input regression fixtures."
  (:require [logseq.outliner.input :as input]))

(defn apply-ops!
  "Submits editor text through generic content operations or an atomic preview.

  | Option | Meaning |
  | --- | --- |
  | `:preview?` | Build a generic preview request instead of committing. |

  Other options follow [[logseq.outliner.input/apply-ops!]]."
  [conn ops options]
  (let [ops (mapv (fn [[op args]]
                    [(case op
                       :save-block (if (contains? (first args) :block/title) :logseq.outliner/save-block-input :save-block)
                       :insert-blocks :logseq.outliner/insert-blocks-input
                       op) args]) ops)]
    (input/apply-ops! conn (if (:preview? options) [[:logseq.outliner/preview-ops [ops]]] ops)
                      (cond-> (dissoc options :preview?)
                        (and (> (count ops) 1) (nil? (:outliner-op options)))
                        (assoc :outliner-op :apply-outliner-ops)))))
