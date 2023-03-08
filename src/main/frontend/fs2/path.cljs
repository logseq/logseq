(ns frontend.fs2.path
  "Path manipulation functions, use '/' on all platforms.
   Also handles URL paths."
  (:require [clojure.string :as string]
            [goog :refer [Uri]]
            [logseq.graph-parser.util :as gp-util]))


(defn is-file-url
  [s]
  (and (string? s)
       (or (string/starts-with? s "file://")
           (string/starts-with? s "content://")
           (string/starts-with? s "s3://"))))



(defn file-name
  "File name of a path or URL"
  [path]
  (let [fname (if (string/ends-with? path "/")
                nil
                (last (string/split path #"/")))]
    (if (and (not-empty fname) (is-file-url path))
      (gp-util/safe-decode-uri-component fname)
      fname)))


(defn split-ext
  "Split file name into stem and extension, for both path and URL"
  [path]
  (let [fname (file-name path)
        pos (string/last-index-of fname ".")]
    (if-not (or (nil? pos) (zero? pos))
      [(subs fname 0 pos)
       (subs fname (+ pos 1))]
      [fname ""])))

(defn file-stem
  "File name without extension"
  [path]
  (first (split-ext path)))

(defn file-ext
  "File extension"
  [path]
  (second (split-ext path)))

(defn safe-file-name?
  "Safe path on all platforms"
  [fname]
  (and (not (string/blank? fname))
       (< (count fname) 255)
       (not (or (re-find #"[\/?<>\\:*|\"]" fname)
                (re-find #"^\.+$" fname)
                (re-find #"[\. ]$" fname)
                (re-find #"(?i)^(COM[0-9]|CON|LPT[0-9]|NUL|PRN|AUX|com[0-9]|con|lpt[0-9]|nul|prn|aux)\..+" fname)
                (re-find #"[\u0000-\u001f\u0080-\u009f]" fname)))))

(comment defn inspect [x]
         (prn ::inspect x)
         x)

(defn path-join
  "Joins the given path segments into a single path, handling relative paths,
  '..' and '.' normalization."
  [& segments]
  (let [segments (remove nil? segments) ;; handle (path-join nil path)
        segments (map #(string/replace % #"[/\\]+" "/") segments)
        ;; a fix for clojure.string/split
        split-fn (fn [s]
                   (if (= s "/")
                     [""]
                     (string/split s #"/")))
        join-fn (fn [segs]
                  (case segs
                    []   "."
                    [""] "/"
                    #_{:clj-kondo/ignore [:path-invalid-construct/string-join]}
                    (string/join "/" segs)))]
    (->> (filter not-empty segments)
         (mapcat split-fn)
         (reduce (fn [acc segment]
                   (cond
                     (= "" segment)
                     [segment]

                     (= ".." segment)
                     (case (last acc)
                       ".." (conj acc segment)
                       ""   acc
                       nil  [".."]
                       (pop acc))

                     (= "." segment)
                     acc

                     :else
                     (conj acc segment)))
                 [])
         (join-fn))))

(defn url-join
  [base-url & segments]
  (let [^js url (.parse Uri base-url)
        scheme (.getScheme url)
        domain (.getDomain url)
        path (.getPath url)
        new-path (apply path-join path segments)
        ;; opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase
        new-url (.create Uri scheme nil domain nil new-path nil nil nil)]
    (.toString new-url)))

(defn path-normalize
  "Normalize path using path-join, break into segment and re-join"
  [path]
  (path-join path))


(defn url-normalize
  [url]
  (let [^js uri (.parse Uri url)
        scheme (.getScheme uri)
        domain (.getDomain uri)
        path (.getPath uri)
        new-path (path-normalize path)
        ;; opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase
        new-uri (.create Uri scheme nil domain nil new-path nil nil nil)]
    (.toString new-uri)))


(defn relative-path
  "Get relative path from base path"
  [base path]
  (let [base (path-normalize base)
        path (path-normalize path)]
    (if (string/starts-with? path base)
      (string/replace (subs path (count base)) #"^/+", "")
      (do
        (js/console.error "unhandled relative path" base path)
        path))))

(defn decoded-relative-uri
  "Get relative uri from base url, url-decoded"
  [base-url path-url]
  (let [base-url (url-normalize base-url)
        path-url (url-normalize path-url)]
    (if (string/starts-with? path-url base-url)
      (gp-util/safe-decode-uri-component (string/replace (subs path-url (count base-url)) #"^/+", ""))
      (do
        (js/console.error "unhandled relative path" base-url path-url)
        path-url))))

(defn parent
  [path]
  ;; ugly but works
  (path-normalize (str path "/..")))

