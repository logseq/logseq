(ns logseq.shui.icon.v2
  (:require
   ["@tabler/icons-react" :as tabler-icons]
   [camel-snake-kebab.core :as csk]
   [clojure.string :as string]
   [goog.object :as gobj]
   [goog.string :as gstring]
   [io.factorhouse.hsx.core :as hsx]
   [logseq.shui.util :as shui-utils]))

(defn- font-icon
  [name extension? opts]
  [:span.ui__icon (merge {:class
                          (gstring/format
                           (str "%s-" name
                                (when (:class opts)
                                  (str " " (string/trim (:class opts)))))
                           (if extension? "tie tie" "ti ti"))}
                         (dissoc opts :class :extension? :font?))])

(defn- svg-icon
  [icons name icon-component-name class opts]
  (let [f (shui-utils/component-wrap icons icon-component-name)]
    [:span.ui__icon.ti
     {:class (str "ls-icon-" name " " class)}
     (f (merge {:size 18} (shui-utils/map-keys->camel-case (dissoc opts :class))))]))

(hsx/defc root
  ([name] (root name nil))
  ([name {:keys [extension? font? class] :as opts}]
   (when (and (string? name)
           (not (string/blank? name)))
     (let [^js js-tabler-icons (gobj/get js/window "tablerIcons")
           icon-component-name (str "Icon" (csk/->PascalCase name))]
       (cond
         (or extension? font?)
         (font-icon name extension? opts)

         (and js-tabler-icons (gobj/get js-tabler-icons icon-component-name))
         (svg-icon js-tabler-icons name icon-component-name class opts)

         (gobj/get tabler-icons icon-component-name)
         (svg-icon tabler-icons name icon-component-name class opts)

         (nil? js-tabler-icons)
         (font-icon name false opts))))))
