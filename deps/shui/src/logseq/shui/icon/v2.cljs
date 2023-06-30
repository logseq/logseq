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
    [rum.core :as rum]))

;; this is taken from frontend.rum, and should be properly abstracted
(defn kebab-case->camel-case
  "Converts from kebab case to camel case, eg: on-click to onClick"
  [input]
  (string/replace input #"-([a-z])" (fn [[_ c]] (string/upper-case c))))

;; this is taken from frontend.rum, and should be properly abstracted
(defn map-keys->camel-case
  "Stringifys all the keys of a cljs hashmap and converts them
   from kebab case to camel case. If :html-props option is specified,
   then rename the html properties values to their dom equivalent
   before conversion"
  [data & {:keys [html-props]}]
  (let [convert-to-camel (fn [[key value]]
                           [(kebab-case->camel-case (name key)) value])]
    (w/postwalk (fn [x]
                  (if (map? x)
                    (let [new-map (if html-props
                                    (set/rename-keys x {:class :className :for :htmlFor})
                                    x)]
                      (into {} (map convert-to-camel new-map)))
                    x))
                data)))

;; this is taken from frontend.rum, and should be properly abstracted
(defn adapt-class
  ([react-class]
   (adapt-class react-class false))
  ([react-class skip-opts-transform?]
   (fn [& args]
    (let [[opts children] (if (map? (first args))
                            [(first args) (rest args)]
                            [{} args])
          type# (first children)
          ;; we have to make sure to check if the children is sequential
          ;; as a list can be returned, eg: from a (for)
          new-children (if (sequential? type#)
                         (let [result (interpreter/interpret children)]
                           (if (sequential? result)
                             result
                             [result]))
                         children)
          ;; convert any options key value to a react element, if
          ;; a valid html element tag is used, using sablono
          vector->react-elems (fn [[key val]]
                                (if (sequential? val)
                                  [key (interpreter/interpret val)]
                                  [key val]))
          new-options (into {}
                            (if skip-opts-transform?
                              opts
                              (map vector->react-elems opts)))]
      (apply js/React.createElement react-class
        ;; sablono html-to-dom-attrs does not work for nested hashmaps
        (bean/->js (map-keys->camel-case new-options :html-props true))
        new-children)))))

(def get-adapt-icon-class
  (memoize (fn [klass] (adapt-class klass))))

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
           (let [f (get-adapt-icon-class klass)]
             [:span.ui__icon.ti
              {:class (str "ls-icon-" name " " class)}
              (f (merge {:size 18} (map-keys->camel-case (dissoc opts :class))))])))))))
