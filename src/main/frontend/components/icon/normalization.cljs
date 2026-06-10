(ns frontend.components.icon.normalization
  "Normalization of stored icon values into the unified icon-item shape,
   plus the storage projection and the renderability check shared by the
   picker and every icon render site."
  (:require [camel-snake-kebab.core :as csk]
            [clojure.string :as string]
            [frontend.components.icon.utils :as icon-utils]
            [goog.object :as gobj]))

(defn normalize-icon
  "Convert various icon formats to the unified icon-item shape:
   {:id string, :type :emoji|:icon, :label string,
    :data {:value string, :color string (optional)}}"
  [v]
  (cond
    ;; Already unified shape? (has :data key)
    (and (map? v) (keyword? (:type v)) (contains? v :data))
    v

    ;; Legacy map with :type
    (map? v)
    (let [type-kw (cond
                    (keyword? (:type v)) (:type v)
                    (string? (:type v)) (keyword (:type v))
                    :else nil)
          id (or (:id v) (:value v))
          value (or (:value v) (:id v))
          color (:color v)
          label (or (:name v) (:label v) value)]
      (case type-kw
        :emoji {:type :emoji
                :id (or id (str "emoji-" value))
                :label (or label value)
                :data {:value value}}
        :tabler-icon {:type :icon
                      :id (or id (str "icon-" value))
                      :label (or label value)
                      :data (cond-> {:value value}
                              color (assoc :color color))}
        :icon {:type :icon
               :id (or id (str "icon-" value))
               :label (or label value)
               :data (cond-> {:value value}
                       color (assoc :color color))}
        ;; Fallback: try to guess from value
        (or (icon-utils/guess-from-value v)
            {:type :icon
             :id (str "icon-" (or value "unknown"))
             :label (or label value "unknown")
             :data {:value (or value "")}})))

    ;; Plain string: detect emoji vs icon name
    (string? v)
    (if (icon-utils/emoji-char? v)
      {:type :emoji
       :id (str "emoji-" v)
       :label v
       :data {:value v}}
      {:type :icon
       :id (str "icon-" v)
       :label v
       :data {:value v}})

    :else nil))

(defn icon-data-for-storage
  "Strip a picker-emitted icon down to fields persisted on a block. Mirrors
   `normalize-icon` (which targets rendering) but inverts intent — keep only
   what the renderer will need to reconstruct the icon, drop ephemeral
   picker state."
  [icon-data]
  (select-keys icon-data [:id :type :color]))

(defn renderable-icon?
  "True when icon-value would produce a visible element via `icon`. For :icon
   type this includes verifying that the underlying Tabler component actually
   exists, which catches stored values whose :id no longer resolves (e.g.
   data saved from a stale picker entry before the tabler-icons filter was
   added). Types this build does not render (incl. the `:none` suppression
   sentinel some richer builds store) fall through to false — stored foreign
   data stays invisible rather than broken."
  [icon-value]
  (boolean
   (when-let [normalized (normalize-icon icon-value)]
     (case (:type normalized)
       :none false
       :emoji (not (string/blank? (get-in normalized [:data :value])))
       :icon (when-let [v (get-in normalized [:data :value])]
               (and (exists? js/tablerIcons)
                    (some? (gobj/get js/tablerIcons (str "Icon" (csk/->PascalCase v))))))
       false))))
