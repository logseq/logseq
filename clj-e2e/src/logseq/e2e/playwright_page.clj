(ns logseq.e2e.playwright-page
  (:require [logseq.e2e.config :as config]
            [wally.main :as w]))

(defn get-pages
  [pw-ctx]
  (.pages pw-ctx))

(defn open-pages
  [pw-ctx n]
  (let [url (str "http://localhost:" @config/*port)]
    (dotimes [_i n]
      (let [page (.newPage pw-ctx)]
        (.navigate page url)
        ;; wait the demo graph loaded
        (w/with-page page
          (w/wait-for "span.block-title-wrap"))))))

(defn close-pages
  [pages]
  (doseq [p pages]
    (.close p)))
