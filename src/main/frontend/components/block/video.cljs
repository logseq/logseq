(ns frontend.components.block.video
  "Helpers for block-level video macro layout."
  (:require [clojure.string :as string]
            [medley.core :as medley]))

(def ^:private video-macro-names #{"video" "youtube" "vimeo" "bilibili"})

(defn video-macro-inline?
  [item]
  (and (vector? item)
       (= "Macro" (first item))
       (contains? video-macro-names (get-in item [1 :name]))))

(defn contains-video-macro?
  [x]
  (boolean
   (cond
     (video-macro-inline? x) true
     (coll? x) (some contains-video-macro? x)
     :else false)))

(defn video-macro-key
  [item]
  (let [{:keys [name arguments]} (second item)]
    (str "video-macro-" name "-" (first arguments))))

(defn- parse-positive-int
  [s]
  (when (string? s)
    (let [n (js/parseInt s 10)]
      (when (and (not (js/isNaN n))
                 (pos? n))
        n))))

(defn- video-width-argument?
  [argument]
  (and (string? argument)
       (string/starts-with? argument "w=")))

(defn video-width
  [arguments]
  (some (fn [argument]
          (some-> (and (string? argument)
                       (second (re-matches #"^w=(\d+)$" argument)))
                  parse-positive-int))
        arguments))

(defn set-video-width-argument
  [arguments width]
  (let [[url-or-id & more] (vec arguments)
        more (remove video-width-argument? more)
        width (when (and (number? width)
                         (pos? width))
                (js/Math.round width))]
    (cond
      (nil? url-or-id)
      []

      width
      (into [url-or-id (str "w=" width)] more)

      :else
      (into [url-or-id] more))))

(def ^:private video-macro-pattern
  #"(^|[\s])(\{\{(youtube|vimeo|bilibili|video)(?:\s+([^{}]*?))?\}\})")

(defn- parse-raw-video-arguments
  [raw-arguments]
  (->> (string/split (or raw-arguments "") #"\s*,\s*")
       (remove string/blank?)
       vec))

(defn- video-macro-text
  [name arguments]
  (if (seq arguments)
    (str "{{" name " " (string/join ", " arguments) "}}")
    (str "{{" name "}}")))

(defn update-video-macro-width-in-content
  [content {:keys [name arguments occurrence]} width]
  (if (and (string? content)
           (contains? video-macro-names name)
           (seq arguments))
    (let [target-url-or-id (first arguments)
          target-occurrence (or occurrence 0)
          *occurrence (atom -1)]
      (string/replace
       content
       video-macro-pattern
       (fn [[match prefix _macro raw-name raw-arguments]]
         (let [raw-arguments (parse-raw-video-arguments raw-arguments)]
           (if (and (= name raw-name)
                    (= target-url-or-id (first raw-arguments)))
             (do
               (swap! *occurrence inc)
               (if (= @*occurrence target-occurrence)
                 (str prefix
                      (video-macro-text raw-name
                                        (set-video-width-argument raw-arguments width)))
                 match))
             match)))))
    content))

(defn video-inline-segments
  [items]
  (loop [remaining items
         inline-items []
         segments []]
    (if-let [item (first remaining)]
      (if (video-macro-inline? item)
        (recur (rest remaining)
               []
               (cond-> segments
                 (seq inline-items)
                 (conj {:type :inline
                        :items inline-items})
                 true
                 (conj {:type :video
                        :item item})))
        (recur (rest remaining)
               (conj inline-items item)
               segments))
      (cond-> segments
        (seq inline-items)
        (conj {:type :inline
               :items inline-items})))))

(defn video-inline-segments-cp
  [inline-f map-inline-f items]
  (for [[idx {:keys [type items item]}] (medley/indexed (video-inline-segments items))]
    (case type
      :video
      [:div.video-embed-block
       {:key (video-macro-key item)
        :data-video-macro-name (get-in item [1 :name])
        :data-video-macro-id (first (get-in item [1 :arguments]))}
       (inline-f item)]

      :inline
      (into [:div.video-inline-text
             {:key (str "video-inline-text-" idx)}]
            (map-inline-f items)))))
