(ns frontend.components.avatar
  (:require [clojure.string :as string]
            [logseq.shui.ui :as shui]
            [logseq.shui.util :as shui-util]
            [rum.core :as rum]))

(defn initials
  ([name]
   (initials name 2))
  ([name n]
   (when (some? name)
     (let [name (string/trim (str name))]
       (when-not (string/blank? name)
         (-> (subs name 0 (min n (count name)))
             string/upper-case))))))

(rum/defc user-avatar
  [{:keys [name title uuid avatar-src class style fallback fallback-length fallback-props image-props]
    :or {fallback-length 2}}]
  (let [color (when uuid (shui-util/uuid-color uuid))
        fallback-text (or fallback (initials name fallback-length))
        fallback-style (cond-> (:style fallback-props)
                         (and color (nil? (:background-color (:style fallback-props))))
                         (assoc :background-color (str color "50")))
        fallback-props' (cond-> fallback-props
                          (seq fallback-style)
                          (assoc :style fallback-style))]
    (shui/avatar
     (cond-> {}
       class (assoc :class class)
       style (assoc :style style)
       title (assoc :title title))
     (when (seq avatar-src)
       (shui/avatar-image (merge {:src avatar-src} image-props)))
     (if (seq fallback-props')
       (shui/avatar-fallback fallback-props' fallback-text)
       (shui/avatar-fallback fallback-text)))))
