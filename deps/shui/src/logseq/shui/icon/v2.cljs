(ns logseq.shui.icon.v2
  (:require
   [camel-snake-kebab.core :as csk]
   [cljs-bean.core :as bean]
   [clojure.set :as set]
   [clojure.string :as string]
   [clojure.walk :as w]
   [daiquiri.interpreter :as interpreter]
   [goog.object :as gobj]
   [goog.string :as gstring]
   [logseq.shui.util :as shui-utils]
   [rum.core :as rum]))

(def get-adapt-icon-class
  (memoize (fn [klass] (shui-utils/react->rum klass true))))

(rum/defc root
  ([name] (root name nil))
  ([name {:keys [extension? font? class] :as opts}]
   (when-not (string/blank? name)
     (let [^js jsTablerIcons (gobj/get js/window "tablerIcons")]
       (if (or extension? font? (not jsTablerIcons))
         [:span.ui__icon (merge {:class
                                 (gstring/format
                                   (str "%s-" name
                                     (when (:class opts)
                                       (str " " (string/trim (:class opts)))))
                                   (if extension? "tie tie" "ti ti"))}
                           (dissoc opts :class :extension? :font?))]

         ;; tabler svg react
         (when-let [klass (gobj/get js/tablerIcons (str "Icon" (csk/->PascalCase name)))]
           (let [f (shui-utils/component-wrap js/tablerIcons (str "Icon" (csk/->PascalCase name)))]
             [:span.ui__icon.ti
              {:class (str "ls-icon-" name " " class)}
              (f (merge {:size 18} (shui-utils/map-keys->camel-case (dissoc opts :class))))])))))))
