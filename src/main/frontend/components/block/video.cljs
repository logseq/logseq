(ns frontend.components.block.video
  "Helpers for block-level video macro layout.

  This namespace owns pure operations on mldoc inline AST: detecting video macros,
  splitting inline content around video macros, and building stable wrapper
  hiccup/key data. Keep provider parsing in `frontend.extensions.video`, YouTube
  player construction in `frontend.extensions.video.youtube`, and generic embed
  construction, block DB/editor lifecycle, and actual inline rendering in
  `frontend.components.block`."
  (:require [medley.core :as medley]))

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
       {:key (video-macro-key item)}
       (inline-f item)]

      :inline
      (into [:div.video-inline-text
             {:key (str "video-inline-text-" idx)}]
            (map-inline-f items)))))
