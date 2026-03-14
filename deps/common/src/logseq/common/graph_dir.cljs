(ns logseq.common.graph-dir
  "Platform-agnostic graph directory naming helpers."
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]))

(defn encode-graph-dir-name
  [graph-name]
  (let [encoded (js/encodeURIComponent (or graph-name ""))]
    (-> encoded
        (string/replace "~" "%7E")
        (string/replace "%" "~"))))

(defn decode-graph-dir-name
  [dir-name]
  (when-not (and (string? dir-name)
                 (or (string/includes? dir-name "++")
                     (string/includes? dir-name "+3A+")))
    (when (some? dir-name)
      (try
        (js/decodeURIComponent (string/replace dir-name "~" "%"))
        (catch :default _
          nil)))))

(def ^:private legacy-dir-pattern #"(?:\+\+|\+3A\+|%)")

(defn decode-legacy-graph-dir-name
  [dir-name]
  (when (and (string? dir-name)
             (re-find legacy-dir-pattern dir-name))
    (let [compat-name (-> dir-name
                          (string/replace "+3A+" ":")
                          (string/replace "++" "/"))]
      (try
        (let [decoded (js/decodeURIComponent compat-name)]
          (when (seq decoded)
            decoded))
        (catch :default _
          nil)))))

(defn repo->graph-dir-key
  [repo]
  (when (seq repo)
    (if (string/starts-with? repo common-config/db-version-prefix)
      (subs repo (count common-config/db-version-prefix))
      repo)))

(defn graph-dir-key->encoded-dir-name
  [graph-dir-key]
  (when (some? graph-dir-key)
    (encode-graph-dir-name graph-dir-key)))

(defn repo->encoded-graph-dir-name
  [repo]
  (some-> repo
          repo->graph-dir-key
          graph-dir-key->encoded-dir-name))
