(ns logseq.e2e.playwright-page
  "operations on playwright pages."
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.config :as config]
            [wally.main :as w]))

(defn get-pages
  [pw-ctx]
  (.pages pw-ctx))

(defn open-pages
  "Pages in same pw-ctx share cookies and storages"
  [pw-ctx n]
  (let [url (str "http://localhost:" @config/*port)]
    (dotimes [_i n]
      (let [page (.newPage pw-ctx)]
        (.navigate page url)
        ;; wait the demo graph loaded
        (w/with-page page
          (assert/assert-graph-loaded?))))))

(defn close-pages
  [pages]
  (doseq [p pages]
    (.close p)))
