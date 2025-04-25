(ns logseq.e2e.playwright-page
  (:require [logseq.e2e.config :as config]))

(defn get-pages
  [pw-ctx]
  (.pages pw-ctx))

(defn open-pages
  [pw-ctx n]
  (let [url (str "http://localhost:" @config/*port)]
    (dotimes [_i n]
      (.. pw-ctx newPage (navigate url)))))

(defn close-pages
  [pages]
  (doseq [p pages]
    (.close p)))

(defn close-pw-ctx
  [pw-ctx]
  (.close pw-ctx))
