(ns frontend.util.url
  "Util fns related to protocol url"
  (:require [clojure.string :as string]
            [frontend.util.repo :as repo-util]))

;; Keep same as electron/electron.core
(def LSP_SCHEME "logseq")

;; Keep same as electron/electron.url
(def encode js/encodeURI)
(def encode-param js/encodeURIComponent)

(defn get-local-repo-identifier
  [repo]
  (let [repo-name (repo-util/get-repo-name repo)]
    (repo-util/get-short-repo-name repo-name)))

(defn get-repo-id-url
  "Get Logseq protocol URL, w/o param (v0.1).
   host: set to `nil` for local graph
   protocol?: if true, returns URL with protocol prefix"
  ([host action repo-identifier]
   (get-repo-id-url host action repo-identifier true))
  ([host action repo-identifier protocol?]
   (str (when protocol? (str LSP_SCHEME "://"))
        (when host (str host "/"))
        action "/"
        (encode repo-identifier))))

(defn get-logseq-graph-url
  "The URL represents an graph, for example:
   logseq://graph/abc
   Ensure repo is valid before hand.
   host: set to `nil` for local graph
   protocol?: if true, returns URL with protocol prefix"
  ([host repo]
   (get-logseq-graph-url host repo true))
  ([host repo protocol?]
   (let [repo-identifier (if host
                           repo ;; resolve remote repo identifier here
                           (get-local-repo-identifier repo))]
     (get-repo-id-url host "graph" repo-identifier protocol?))))

(defn get-logseq-graph-uuid-url
  "The URL represents an entity in graph with uuid, for example:
   logseq://graph/abc?block-id=<uuid>
   Ensure repo and uuid are valid before hand.
   host: set to `nil` for local graph
   protocol?: if true, returns URL with protocol prefix"
  ([host repo uuid]
   (get-logseq-graph-uuid-url host repo uuid true))
  ([host repo uuid protocol?]
   (str (get-logseq-graph-url host repo protocol?)
        "?block-id=" uuid)))

(defn- strip-trailing-slash
  [s]
  (string/replace s #"/+$" ""))

(defn- required-url-part!
  [k v]
  (when-not (and (string? v) (not (string/blank? v)))
    (throw (js/Error. (str "Missing " (name k)))))
  v)

(defn get-logseq-web-page-url
  "Canonical web URL for a page. Page routes must always carry `graph-id`."
  [app-base-url graph-id page-id]
  (str (strip-trailing-slash (required-url-part! :app-base-url app-base-url))
       "/page/" (encode-param (required-url-part! :page-id page-id))
       "?graph-id=" (encode-param (required-url-part! :graph-id graph-id))))

(defn get-logseq-web-block-url
  "Canonical web URL for a block. Block routes must always carry `graph-id`."
  [app-base-url graph-id block-id]
  (str (strip-trailing-slash (required-url-part! :app-base-url app-base-url))
       "/block/" (encode-param (required-url-part! :block-id block-id))
       "?graph-id=" (encode-param (required-url-part! :graph-id graph-id))))

(defn- route-from-path-parts
  [path-parts]
  (case (first path-parts)
    "page" (when-let [page-id (second path-parts)]
             {:to :page
              :page-id (js/decodeURIComponent page-id)})
    "block" (when-let [block-id (second path-parts)]
              {:to :block
               :block-id (js/decodeURIComponent block-id)})
    nil))

(defn- path-parts
  [path]
  (->> (string/split path #"/")
       (remove string/blank?)
       vec))

(defn- hash-route-url
  [parsed-url]
  (let [hash (.-hash parsed-url)]
    (when (string/starts-with? hash "#/")
      (js/URL. (subs hash 1) "https://logseq.com"))))

(defn parse-web-url-target
  [url]
  (let [parsed-url (js/URL. url "https://logseq.com")
        hash-url (hash-route-url parsed-url)
        graph-id (or (some-> hash-url .-searchParams (.get "graph-id"))
                     (.get (.-searchParams parsed-url) "graph-id"))
        graph-identifier (when (string/blank? graph-id)
                           (or (some-> hash-url .-searchParams (.get "graph"))
                               (.get (.-searchParams parsed-url) "graph")))
        route (or (some-> hash-url .-pathname path-parts route-from-path-parts)
                  (route-from-path-parts (path-parts (.-pathname parsed-url))))]
    (cond-> {}
      (not (string/blank? graph-id))
      (assoc :graph-id graph-id)

      (not (string/blank? graph-identifier))
      (assoc :graph-identifier graph-identifier)

      route
      (assoc :route route))))
