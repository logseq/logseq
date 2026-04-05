(ns frontend.context.i18n
  "This ns is a system component that handles translation for the entire
  application. The ns dependencies for this ns must be small since it is used
  throughout the application."
  (:require [clojure.string :as string]
            [frontend.dicts :as dicts]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            [tongue.core :as tongue]))

(def rtl-locales
  #{:ar :fa})

(def dicts (merge dicts/dicts {:tongue/fallback :en}))

(def translate
  (tongue/build-translate dicts))

(defn preferred-locale
  []
  (or (some-> (state/sub :preferred-language) keyword) :en))

(defn locale-tag
  [language]
  (name (or (some-> language keyword) :en)))

(defn rtl-locale?
  [language]
  (contains? rtl-locales (or (some-> language keyword) :en)))

(defn locale-direction
  [language]
  (if (rtl-locale? language) "rtl" "ltr"))

(def ^:private placeholder-pattern
  #"\{(\d+)\}")

(def ^:private placeholder-split-pattern
  #"\{\d+\}")

(def ^:private rich-text-separator-by-locale
  {:ar "، "
   :fa "، "
   :ja "、"
   :zh-CN "，"
   :zh-Hant "，"})

(defn t
  [& args]
  (let [preferred-language (preferred-locale)]
    (try
      (apply translate preferred-language args)
      (catch :default e
        (log/error :failed-translation {:arguments args
                                        :lang preferred-language})
        (state/pub-event! [:capture-error {:error e
                                           :payload {:type :failed-translation
                                                     :arguments args
                                                     :lang preferred-language}}])
        (when (not= preferred-language :en)
          (apply translate :en args))))))

(defn tt
  [& keys]
  (some->
   (medley/find-first
    #(not (string/starts-with? (t %) "{Missing key"))
    keys)
   t))

(defn- append-line-break-fragments
  "Append `text` to `acc`, replacing newline characters with `[:br]` nodes."
  [acc text]
  (let [parts (string/split text #"\r?\n" -1)
        last-idx (dec (count parts))]
    (reduce-kv (fn [acc idx part]
                 (cond-> acc
                   (not (empty? part)) (conj part)
                   (< idx last-idx) (conj [:br])))
               acc
               parts)))

(defn- append-rich-text-fragment
  [acc fragment replace-newlines?]
  (cond
    (string? fragment)
    (if replace-newlines?
      (append-line-break-fragments acc fragment)
      (if (empty? fragment) acc (conj acc fragment)))

    (nil? fragment)
    acc

    :else
    (conj acc fragment)))

(defn interpolate-rich-text
  "Interpolate a translated template while allowing replacements to be hiccup
   nodes or other non-string values.

   When `replace-newlines?` is true, newline characters in string fragments are
   replaced with `[:br]` nodes."
  ([template replacements]
   (interpolate-rich-text template replacements false))
  ([template replacements replace-newlines?]
   (if-not (string? template)
     [template]
     (let [segments (string/split template placeholder-split-pattern)
           placeholder-ids (map second (re-seq placeholder-pattern template))]
       (reduce (fn [acc [segment placeholder-id]]
                 (let [acc' (append-rich-text-fragment acc segment replace-newlines?)]
                   (if-not placeholder-id
                     acc'
                     (let [idx (dec (js/parseInt placeholder-id 10))
                           replacement (nth replacements idx nil)]
                       (if (nil? replacement)
                         (conj acc' (str "{" placeholder-id "}"))
                         (append-rich-text-fragment acc' replacement replace-newlines?))))))
               []
               (map vector segments (concat placeholder-ids [nil])))))))

(defn interpolate-rich-text-node
  "Interpolate a translated template and wrap the fragments in a fragment node.

   When `replace-newlines?` is true, newline characters in string fragments are
   replaced with `[:br]` nodes."
  ([template replacements]
   (interpolate-rich-text-node template replacements false))
  ([template replacements replace-newlines?]
   (into [:<>] (interpolate-rich-text template replacements replace-newlines?))))

(defn replace-newlines-with-br
  "Replace newline characters in a string or rich-text string fragments with
   `[:br]` nodes."
  [fragments]
  (let [fragments' (if (string? fragments) [fragments] fragments)]
    (reduce (fn [acc fragment]
              (if (string? fragment)
                (append-line-break-fragments acc fragment)
                (conj acc fragment)))
            []
            fragments')))

(defn locale-join-rich-text
  "Join rich-text fragments with a locale-aware separator."
  [fragments]
  (let [separator (get rich-text-separator-by-locale (preferred-locale) ", ")
        fragments' (vec (remove nil? fragments))]
    (vec (interpose separator fragments'))))

(defn locale-join-rich-text-node
  "Join rich-text fragments with a locale-aware separator and wrap them in a
   fragment node."
  [fragments]
  (into [:<>] (locale-join-rich-text fragments)))

(defn locale-format-number
  "Format a number using Intl.NumberFormat with the application locale."
  ([n] (locale-format-number n {}))
  ([n opts]
   (let [tag (locale-tag (state/sub :preferred-language))]
     (.format (js/Intl.NumberFormat. tag (clj->js opts)) n))))

(defn locale-format-date
  "Format a js/Date using Intl.DateTimeFormat with the application locale."
  ([d] (locale-format-date d {}))
  ([d opts]
   (let [tag (locale-tag (state/sub :preferred-language))]
     (.format (js/Intl.DateTimeFormat. tag (clj->js opts)) d))))

(defn locale-format-time
  "Format a js/Date as time string using Intl.DateTimeFormat with the
   application locale."
  [d]
  (locale-format-date d {:hour "2-digit" :minute "2-digit" :hourCycle "h23"}))

(defn- fetch-local-language []
  (.. js/window -navigator -language))

;; TODO: Fetch preferred language from backend if user is logged in
(defn start []
  (let [preferred-language (state/sub :preferred-language)]
    (when (nil? preferred-language)
      (state/set-preferred-language! (fetch-local-language)))))
