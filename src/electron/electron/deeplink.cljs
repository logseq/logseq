(ns electron.deeplink
  "Pure helpers for desktop protocol URLs (`logseq://...`)."
  (:require [clojure.string :as string]))

(def LSP_SCHEME "logseq")

(defn find-deeplink-url
  "Extract a deeplink URL from a sequence of command-line argument strings."
  [args]
  (some #(when (string/starts-with? % (str LSP_SCHEME ":")) %) args))

(defn graph-identifier-from-url
  "Return the graph identifier for `logseq://graph/<id>`, else nil."
  [url]
  (when (string? url)
    (when-let [parsed-url (try (js/URL. url)
                               (catch :default _
                                 nil))]
      (when (and (= (str LSP_SCHEME ":") (.-protocol parsed-url))
                 (= "graph" (.-host parsed-url)))
        (let [identifier (-> (.-pathname parsed-url)
                             (string/replace #"^/+" "")
                             js/decodeURI)]
          (when-not (string/blank? identifier)
            identifier))))))

(defn startup-deeplink-url
  "Cold-start deeplink source of truth.

  macOS delivers the URL via open-url (possibly before ready). Windows/Linux
  pass it on argv. `pending-url` is any URL stashed from an early open-url."
  [pending-url argv mac?]
  (or pending-url
      (when-not mac?
        (find-deeplink-url (rest argv)))))
