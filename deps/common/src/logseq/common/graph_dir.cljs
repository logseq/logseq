(ns logseq.common.graph-dir
  "Platform-agnostic graph directory naming helpers."
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]))

(defn encode-graph-dir-name
  [graph-name]
  (let [encoded (js/encodeURIComponent (string/trim (or graph-name "")))]
    (-> encoded
        (string/replace "%20" " ")
        (string/replace "~" "%7E")
        (string/replace "%" "~"))))

(defn decode-graph-dir-name
  [dir-name]
  (when-not (and (string? dir-name)
                 (or (string/includes? dir-name "++")
                     (string/includes? dir-name "+3A+")))
    (when (some? dir-name)
      (try
        (let [decoded (js/decodeURIComponent (string/replace dir-name "~" "%"))
              trimmed (string/trim decoded)]
          (when (= decoded trimmed)
            (not-empty trimmed)))
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
        (let [decoded (string/trim (js/decodeURIComponent compat-name))]
          (when (seq decoded)
            decoded))
        (catch :default _
          nil)))))

(defn repo->graph-dir-key
  [repo]
  (some-> repo common-config/strip-leading-db-version-prefix not-empty))

(defn repo-identity
  "Return the canonical value used for repo identity comparison.

  Repo identity comparison is based on the graph directory key, so `demo` and
  `logseq_db_demo` identify the same graph. Use this helper, or `same-repo?`,
  whenever code needs to decide whether two repo names represent the same graph."
  [repo]
  (repo->graph-dir-key repo))

(defn same-repo?
  "Return true when two repo names identify the same graph."
  [a b]
  (let [a' (repo-identity a)
        b' (repo-identity b)]
    (and (some? a')
         (some? b')
         (= a' b'))))

(defn graph-dir-key->encoded-dir-name
  [graph-dir-key]
  (when (some? graph-dir-key)
    (encode-graph-dir-name graph-dir-key)))

(defn repo->encoded-graph-dir-name
  [repo]
  (some-> repo
          repo->graph-dir-key
          graph-dir-key->encoded-dir-name))

(defn decode-canonical-graph-dir-key
  [encoded-graph-dir-key]
  (let [decoded (decode-graph-dir-name encoded-graph-dir-key)]
    (when (and (seq decoded)
               (not (string/starts-with? decoded common-config/db-version-prefix)))
      decoded)))
