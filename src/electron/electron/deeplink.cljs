(ns electron.deeplink
  "Pure helpers for desktop protocol URLs (`logseq://...`)."
  (:require [clojure.string :as string]))

(def LSP_SCHEME "logseq")

(defn find-deeplink-url
  "Extract a deeplink URL from a sequence of command-line argument strings."
  [args]
  (some #(when (string/starts-with? % (str LSP_SCHEME ":")) %) args))

(defn parse-url
  "Parse a protocol URL into a destination or a translated link error."
  [url]
  (let [invalid {:i18n-key :deeplink/invalid-link-error}]
    (if-not (string? url)
      invalid
      (try
        (let [parsed-url (js/URL. url)]
          (if-not (= (str LSP_SCHEME ":") (.-protocol parsed-url))
            invalid
            (if (contains? #{"graph" "new-window"} (.-host parsed-url))
              (let [identifier (-> (.-pathname parsed-url)
                                   (string/replace #"^/+" "")
                                   js/decodeURIComponent)
                    params (.-searchParams parsed-url)]
                (if (string/blank? identifier)
                  {:i18n-key :electron/link-open-failed-missing-graph}
                  {:parsed-url parsed-url
                   :graph-identifier identifier
                   :page-name (.get params "page")
                   :block-id (.get params "block-id")}))
              {:parsed-url parsed-url})))
        (catch :default _
          invalid)))))

(defn startup-deeplink-url
  "Cold-start deeplink source of truth.

  macOS delivers the URL via open-url (possibly before ready). Windows/Linux
  pass it on argv. `pending-url` is any URL stashed from an early open-url."
  [pending-url argv mac?]
  (or pending-url
      (when-not mac?
        (find-deeplink-url (rest argv)))))
