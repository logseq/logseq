(ns frontend.fs2.path
  "Path manipulation functions, use '/' on all platforms.
   Also handles URL paths."
  (:require [clojure.string :as string]
            [logseq.graph-parser.util :as gp-util]))


(defn is-file-url
  [s]
  (and (string? s)
       (or (string/starts-with? s "file://") ;; mobile platform
           (string/starts-with? s "content://") ;; android only
           (string/starts-with? s "assets://") ;; FIXME: Electron asset, not urlencoded
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
  (let [segments (remove string/blank? segments) ;; handle (path-join nil path)
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

(defn- uri-path-join-internal
  "Joins the given URI path segments into a single path, handling relative paths,
  '..' and '.' normalization."
  [& segments]
  (let [segments (remove nil? segments) ;; handle (path-join nil path)
        ; _ (prn ::uri-join-seg segments)
        ; _ (js/console.trace)
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
         (map #(js/encodeURIComponent %))
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
  (let [^js url (js/URL. base-url)
        scheme (.-protocol url)
        domain (or (not-empty (.-host url)) "")
        path (gp-util/safe-decode-uri-component (.-pathname url))
        encoded-new-path (apply uri-path-join-internal path segments)]
    (str scheme "//" domain encoded-new-path)))


(defn path-join
  "Join path segments, or URL base and path segments"
  [base & segments]
  (prn ::join base segments)
  (when (string/blank? base)
    (prn ::SHOULD-NOT-JOIN-EMPTY)
    (js/console.trace))

  (if (is-file-url base)
    (apply url-join base segments)
    (apply path-join-internal base segments)))


(defn- path-normalize-internal
  "Normalize path using path-join, break into segment and re-join"
  [path]
  (path-join path))


(defn url-normalize
  [origin-url]
  (let [^js url (js/URL. origin-url)
        scheme (.-protocol url)
        domain (or (not-empty (.-host url)) "")
        path (gp-util/safe-decode-uri-component (.-pathname url))
        encoded-new-path (uri-path-join-internal path)]
    (str scheme "//" domain encoded-new-path)))

(defn path-normalize
  "Normalize path or URL"
  [path]
  (if (is-file-url path)
    (url-normalize path)
    (path-normalize-internal path)))

(defn trim-dir-prefix
  "Trim dir prefix from path"
  [base-path sub-path]
  (let [base-path (path-normalize base-path)
        sub-path (path-normalize sub-path)
        is-url? (is-file-url base-path)]
    (if (string/starts-with? sub-path base-path)
      (if is-url?
        (gp-util/safe-decode-uri-component (string/replace (subs sub-path (count base-path)) #"^/+", ""))
        (string/replace (subs sub-path (count base-path)) #"^/+", ""))
      (do
        (js/console.error "unhandled trim-base" base-path sub-path)
        sub-path))))

(defn url-to-path
  "Extract path part of a URL. decoded"
  [original-url]
  (let [^js url (js/URL. original-url)
        path (gp-util/safe-decode-uri-component (.-pathname url))]
    path))


(defn relative-path
  "Get relative path from base path.
   Works for both path and URL."
  [base-path sub-path]
  (prn :rel-path base-path sub-path)
  (let [base-path (path-normalize base-path)
        sub-path (path-normalize sub-path)
        is-url? (is-file-url base-path)]
    (prn :rel-path base-path sub-path)
    (if (string/starts-with? sub-path base-path)
      (if is-url?
        (gp-util/safe-decode-uri-component (string/replace (subs sub-path (count base-path)) #"^/+", ""))
        (string/replace (subs sub-path (count base-path)) #"^/+", ""))
       ;; append as many .. 
      ;; NOTE: buggy impl
      (let [base-segs (string/split base-path #"/" -1)
            path-segs (string/split sub-path #"/" -1)
            common-segs (take-while #(= (first %) (second %)) (map vector base-segs path-segs))
            base-segs (drop (count common-segs) base-segs)
            remain-segs (drop (count common-segs) path-segs)
            base-prefix (apply str (repeat (max 0 (dec (count base-segs))) "../"))]
        (js/console.error (js/Error. "buggy"))
        #_{:clj-kondo/ignore [:path-invalid-construct/string-join]}
        (if is-url?
          (gp-util/safe-decode-uri-component (str base-prefix (string/join "/" remain-segs)))
          (str base-prefix (string/join "/" remain-segs)))))))



(defn parent
  "Parent, containing directory"
  [path]
  (if (string/includes? path "/")
    ;; ugly but works
    (path-normalize (str path "/.."))
    nil))



(defn resolve-relative-path
  "Assume current-path is a file"
  [current-path rel-path]
  (if-let [base-dir (parent current-path)]
    (path-join base-dir rel-path)
    rel-path))

(defn get-relative-path
  "Assume current-path is a file, and target-path is a file or directory.
   Return relative path from current-path to target-path.
   Works for both path and URL. Also works for relative path.
   The opposite operation is `resolve-relative-path`"
  [current-path target-path]
  (let [base-path (parent current-path)
        sub-path (path-normalize target-path)
        is-url? (is-file-url base-path)
        base-segs (if base-path
                    (string/split base-path #"/" -1)
                    [])
        path-segs (string/split sub-path #"/" -1)
        common-segs (take-while #(= (first %) (second %)) (map vector base-segs path-segs))
        base-segs (drop (count common-segs) base-segs)
        remain-segs (drop (count common-segs) path-segs)
        base-prefix (apply str (repeat (max 0 (count base-segs)) "../"))]
    #_{:clj-kondo/ignore [:path-invalid-construct/string-join]}
    (if is-url?
      (gp-util/safe-decode-uri-component (str base-prefix (string/join "/" remain-segs)))
      (str base-prefix (string/join "/" remain-segs)))))

