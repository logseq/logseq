(ns logseq.common.path
  "Path manipulation functions, use '/' sep on all platforms.
   Also handles URL paths."
  (:require [clojure.string :as string]))

(defn- safe-decode-uri-component
  [uri]
  (try
    (js/decodeURIComponent uri)
    (catch :default _
      (js/console.error "decode-uri-component-failed" uri)
      uri)))

(defn is-file-url?
  [s]
  (and (string? s)
       (or (string/starts-with? s "file://") ;; mobile platform
           (string/starts-with? s "content://") ;; android only
           (string/starts-with? s "assets://") ;; Electron asset, urlencoded
           (string/starts-with? s "logseq://") ;; reserved for future fs protocol
           (string/starts-with? s "memory://") ;; special memory fs
           (string/starts-with? s "s3://"))))

(defn filename
  "File name of a path or URL.
   Returns nil when it's a directory that ends with '/'."
  [path]
  (let [fname (if (string/ends-with? path "/")
                nil
                (last (string/split path #"/")))]
    (if (and (seq fname) (is-file-url? path))
      (safe-decode-uri-component fname)
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
    (->> (filter seq segments)
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
    (->> (filter seq segments)
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
        path (safe-decode-uri-component (.-pathname url))
        encoded-new-path (apply uri-path-join-internal path segments)]
    (str scheme "//" domain encoded-new-path)))


(defn path-join
  "Join path segments, or URL base and path segments"
  [base & segments]

  (cond
    ;; For debugging
    ; (nil? base)
    ; (js/console.log "path join with nil global directory" segments)
    (= base "")
    (js/console.error "BUG: should not join with empty dir" segments)
    :else
    nil)

  (if (is-file-url? base)
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
        path (safe-decode-uri-component (.-pathname url))
        encoded-new-path (uri-path-join-internal path)]
    (str scheme "//" domain encoded-new-path)))

(defn path-normalize
  "Normalize path or URL"
  [path]
  (if (is-file-url? path)
    (url-normalize path)
    (path-normalize-internal path)))

(defn url-to-path
  "Extract path part of a URL, decoded.

   The reverse operation is (path-join protocol:// path)"
  [original-url]
  (if (is-file-url? original-url)
    ;; NOTE: URL type is not consistent across all protocols
    ;; Check file:// and assets://, pathname behavior is different
    (let [^js url (js/URL. (string/replace original-url "assets://" "file://"))
          path (safe-decode-uri-component (.-pathname url))
          path (if (string/starts-with? path "///")
                 (subs path 2)
                 path)
          path (if (re-find #"(?i)^/[a-zA-Z]:" path) ;; Win path fix
                 (subs path 1)
                 path)]
      path)
    original-url))

(defn trim-dir-prefix
  "Trim dir prefix from path"
  [base-path sub-path]
  (let [base-path (path-normalize base-path)
        sub-path (path-normalize sub-path)
        is-url? (is-file-url? base-path)]
    (if (string/starts-with? sub-path base-path)
      (if is-url?
        (safe-decode-uri-component (string/replace (subs sub-path (count base-path)) #"^/+", ""))
        (string/replace (subs sub-path (count base-path)) #"^/+", ""))
      (do
        (js/console.error "unhandled trim-base" base-path sub-path)
        nil))))

(defn relative-path
  "Get relative path from base path.
   Works for both path and URL."
  [base-path sub-path]
  (let [base-path (path-normalize base-path)
        sub-path (path-normalize sub-path)
        is-url? (is-file-url? base-path)]
    (if (string/starts-with? sub-path base-path)
      (if is-url?
        (safe-decode-uri-component (string/replace (subs sub-path (count base-path)) #"^/+", ""))
        (string/replace (subs sub-path (count base-path)) #"^/+", ""))
      ;; append as many ..
      ;; NOTE: This is a buggy impl, relative-path is different when base-path is a file or a dir
      (let [base-segs (string/split base-path #"/" -1)
            path-segs (string/split sub-path #"/" -1)
            common-segs (take-while #(= (first %) (second %)) (map vector base-segs path-segs))
            base-segs (drop (count common-segs) base-segs)
            remain-segs (drop (count common-segs) path-segs)
            base-prefix (apply str (repeat (max 0 (dec (count base-segs))) "../"))]
        (js/console.error (js/Error. "buggy relative-path") base-path sub-path)
        #_{:clj-kondo/ignore [:path-invalid-construct/string-join]}
        (if is-url?
          (safe-decode-uri-component (str base-prefix (string/join "/" remain-segs)))
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
        is-url? (is-file-url? base-path)
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
      (safe-decode-uri-component (str base-prefix (string/join "/" remain-segs)))
      (str base-prefix (string/join "/" remain-segs)))))

;; compat
(defn basename
  [path]
  (let [path (string/replace path #"/$" "")]
    (filename path)))

(defn dirname
  [path]
  (parent path))

(defn absolute?
  "Whether path `p` is absolute."
  [p]
  (let [p (path-normalize p)]
    (boolean (or (is-file-url? p)
                 (string/starts-with? p "/")
                 ;; is windows dir
                 (re-find #"^[a-zA-Z]:[/\\]" p)))))

(defn protocol-url?
  "Whether path `p` is a protocol URL.

   This is a loose check, it only checks if there is a valid protocol prefix."
  [p]
  (boolean (and (re-find #"^[a-zA-Z0-9_+\-\.]{2,}:" p) ;; HACK: avoid matching windows drive
                (not (string/includes? p " ")))))
