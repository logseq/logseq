(ns ^:no-doc frontend.util.drawer
  (:require [clojure.string :as string]
            [frontend.util :as util]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property]
            [frontend.format.mldoc :as mldoc]))

(defn drawer-start
  [typ]
  (util/format ":%s:" (string/upper-case typ)))

(defonce drawer-end ":END:")

(defonce logbook-start ":LOGBOOK:")

(defn build-drawer-str
  ([typ]
   (build-drawer-str typ nil))
  ([typ value]
   (if value
     (string/join "\n" [(drawer-start typ) value drawer-end])
     (string/join "\n" [(drawer-start typ) drawer-end]))))

(defn get-drawer-ast
  [format content typ]
  (let [ast (mldoc/->edn content (gp-mldoc/default-config format))
        typ-drawer (ffirst (filter (fn [x]
                                     (mldoc/typ-drawer? x typ)) ast))]
    typ-drawer))

(defn insert-drawer
  [format content typ value]
  (when (string? content)
    (try
      (let [ast (mldoc/->edn content (gp-mldoc/default-config format))
            has-properties? (some (fn [x] (mldoc/properties? x)) ast)
            has-typ-drawer? (some (fn [x] (mldoc/typ-drawer? x typ)) ast)
            lines (string/split-lines content)
            title (first lines)
            body (rest lines)
            scheduled (filter #(string/starts-with? % "SCHEDULED") lines)
            deadline (filter #(string/starts-with? % "DEADLINE") lines)
            body-without-timestamps (vec
                                     (filter
                                      #(not (or (string/starts-with? % "SCHEDULED")
                                                (string/starts-with? % "DEADLINE")))
                                      body))
            start-idx (.indexOf body-without-timestamps (drawer-start typ))
            end-idx (let [[before after] (split-at start-idx body-without-timestamps)]
                      (+ (count before) (.indexOf after drawer-end)))
            result  (cond
                      (not has-typ-drawer?)
                      (let [drawer (build-drawer-str typ value)]
                        (if has-properties?
                          (cond
                            (= :org format)
                            (let [prop-start-idx (.indexOf body-without-timestamps gp-property/properties-start)
                                  prop-end-idx (.indexOf body-without-timestamps gp-property/properties-end)
                                  properties (subvec body-without-timestamps prop-start-idx (inc prop-end-idx))
                                  after (subvec body-without-timestamps (inc prop-end-idx))]
                              (string/join "\n" (concat [title] scheduled deadline properties [drawer] after)))

                            :else
                            (let [properties-count (count (second (first (second ast))))
                                  properties (subvec body-without-timestamps 0 properties-count)
                                  after (subvec body-without-timestamps properties-count)]
                              (string/join "\n" (concat [title] scheduled deadline properties [drawer] after))))
                          (string/join "\n" (concat [title] scheduled deadline [drawer] body-without-timestamps))))

                      (and has-typ-drawer?
                           (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
                      (let [before (subvec body-without-timestamps 0 start-idx)
                            middle (conj
                                    (subvec body-without-timestamps (inc start-idx) end-idx)
                                    value)
                            after (subvec body-without-timestamps (inc end-idx))
                            lines (concat [title] scheduled deadline before
                                          [(drawer-start typ)] middle [drawer-end] after)]
                        (string/join "\n" lines))

                      :else
                      content)]
        (string/trimr result))
      (catch :default e
        (js/console.error e)
        content))))

(defn contains-logbook?
  [content]
  (and (util/safe-re-find (re-pattern (str "(?i)" logbook-start)) content)
       (util/safe-re-find (re-pattern (str "(?i)" drawer-end)) content)))

;; TODO: DRY
(defn remove-logbook
  [content]
  (when content
    (if (contains-logbook? content)
      (let [lines (string/split-lines content)
            [title-lines body] (split-with (fn [l]
                                             (not (string/starts-with? (string/upper-case (string/triml l)) ":LOGBOOK:")))
                                           lines)
            body (drop-while (fn [l]
                               (let [l' (string/lower-case (string/trim l))]
                                 (or
                                  (not (string/starts-with? l' ":end:"))
                                  (string/blank? l))))
                             body)
            body (if (and (seq body)
                          (string/starts-with? (string/lower-case (string/triml (first body))) ":end:"))
                   (let [line (string/replace (first body) #"(?i):end:\s?" "")]
                     (if (string/blank? line)
                       (rest body)
                       (cons line (rest body))))
                   body)]
        (->> (concat title-lines body)
             (string/join "\n")))
      content)))

(defn get-logbook
  [body]
  (-> (filter (fn [v] (and (vector? v)
                          (= (first v) "Drawer")
                          (= (second v) "logbook"))) body)
      first))

(defn with-logbook
  [block content]
  (let [new-clocks (last (get-drawer-ast (:block/format block) content "logbook"))
        logbook (get-logbook (:block/body block))]
    (if logbook
      (let [content (remove-logbook content)
            clocks (->> (concat new-clocks (when-not new-clocks (last logbook)))
                        (distinct))
            clocks (->> (map string/trim clocks)
                        (remove string/blank?)
                        (string/join "\n"))]
        (if (:block/title block)
          (insert-drawer (:block/format block) content "LOGBOOK" clocks)
          content))
      content)))
