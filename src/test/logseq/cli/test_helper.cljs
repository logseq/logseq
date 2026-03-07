(ns logseq.cli.test-helper
  (:require [goog.object :as gobj]
            [promesa.core :as p]))

(defn with-js-property-override
  "Temporarily override a JS object property for the duration of an async body.

  Restores the original property value after the returned promise settles. Use
  this for process/module globals that cannot be handled by `with-redefs`.
  Resource cleanup still belongs in outer `p/finally` blocks."
  [obj prop value f]
  (let [original (gobj/get obj prop)]
    (gobj/set obj prop value)
    (-> (f)
        (p/finally (fn []
                     (gobj/set obj prop original))))))

(defn with-stderr-write-capture
  "Capture writes to `process.stderr.write` for the duration of an async body.

  Calls `f` with an atom containing the accumulated stderr output."
  [f]
  (let [stderr (.-stderr js/process)
        buffer (atom "")]
    (with-js-property-override stderr "write"
      (fn [chunk]
        (swap! buffer str chunk)
        true)
      (fn []
        (f buffer)))))