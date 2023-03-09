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
           (string/starts-with? s "logseq://") ;; reserved for future fs protocl
           (string/starts-with? s "s3://"))))



(defn filename
  "File name of a path or URL.
   Returns nil when it's a path."
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
  (let [fname (filename path)
        pos (string/last-index-of fname ".")]
    (if-not (or (nil? pos) (zero? pos))
      [(subs fname 0 pos)
       (string/lower-case (subs fname (+ pos 1)))]
      [fname ""])))

(defn file-stem
  "File name without extension"
  [path]
  (first (split-ext path)))

(defn file-ext
  "File extension, lowercased"
  [path]
  (second (split-ext path)))

(defn safe-filename?
  "Safe filename on all platforms"
  [fname]
  (and (not (string/blank? fname))
       (< (count fname) 255)
       (not (or (re-find #"[\/?<>\\:*|\"]" fname)
                (re-find #"^\.+$" fname)
                (re-find #"[\. ]$" fname)
                (re-find #"(?i)^(COM[0-9]|CON|LPT[0-9]|NUL|PRN|AUX|com[0-9]|con|lpt[0-9]|nul|prn|aux)\..+" fname)
                (re-find #"[\u0000-\u001f\u0080-\u009f]" fname)))))


(defn- path-join-internal
  "Joins the given path segments into a single path, handling relative paths,
  '..' and '.' normalization."
  [& segments]
  (let [segments (remove nil? segments) ;; handle (path-join nil path)
        _ (prn ::seg segments)
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
  "Segments are not URL-ecoded"
  [base-url & segments]
  (let [^js url (.parse Uri base-url)
        scheme (.getScheme url)
        domain (.getDomain url)
        path (.getPath url)
        new-path (apply path-join-internal path segments)
        ;; opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase
        new-url (.create Uri scheme nil domain nil new-path nil nil nil)]
    (.toString new-url)))


(defn path-join
  "Join path segments, or URL base and path segments"
  [base & segments]
  (prn base segments)
  (if (is-file-url base)
    (apply url-join base segments)
    (apply path-join-internal base segments)))


(defn- path-normalize-internal
  "Normalize path using path-join, break into segment and re-join"
  [path]
  (path-join path))


(defn url-normalize
  [url]
  (let [^js uri (.parse Uri url)
        scheme (.getScheme uri)
        domain (.getDomain uri)
        path (.getPath uri)
        new-path (path-normalize-internal path)
        ;; opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase
        new-uri (.create Uri scheme nil domain nil new-path nil nil nil)]
    (.toString new-uri)))

(defn path-normalize
  "Normalize path or URL"
  [path]
  (if (is-file-url path)
    (url-normalize path)
    (path-normalize-internal path)))

(defn trim-dir-prefix
  "Trim dir prefix from path"
  [base sub]
  (let [base (path-normalize base)
        path (path-normalize sub)]
    (if (string/starts-with? path base)
      (string/replace (subs path (count base)) #"^/+", "")
      (do
        (js/console.error "unhandled trim-base" base path)
        path))))


(defn relative-path
  "Get relative path from base path.
   Works for both path and URL."
  [base-path sub-path]
  (let [base-path (path-normalize base-path)
        is-url (is-file-url base-path)
        sub-path (path-normalize sub-path)]
    (if (string/starts-with? sub-path base-path)
      (string/replace (subs sub-path (count base-path)) #"^/+", "")
       ;; append as many .. 
      (let [base-segs (string/split base-path #"/" -1)
            path-segs (string/split sub-path #"/" -1)
            common-segs (take-while #(= (first %) (second %)) (map vector base-segs path-segs))
            base-segs (drop (count common-segs) base-segs)
            path-segs (drop (count common-segs) path-segs)
            base-prefix (repeat (max 0 (dec (count base-segs))) "../")]
        #_{:clj-kondo/ignore [:path-invalid-construct/string-join]}
        (str (concat base-prefix (string/join "/" path-segs)))))))


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
  (path-normalize-internal (str path "/..")))

