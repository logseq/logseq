(ns frontend.rum
  (:require [clojure.string :as s]
            [clojure.set :as set]
            [clojure.walk :as w]))

;; copy from https://github.com/priornix/antizer/blob/35ba264cf48b84e6597743e28b3570d8aa473e74/src/antizer/core.cljs

(defn kebab-case->camel-case
  "Converts from kebab case to camel case, eg: on-click to onClick"
  [input]
  (let [words (s/split input #"-")
        capitalize (->> (rest words)
                        (map #(apply str (s/upper-case (first %)) (rest %))))]
    (apply str (first words) capitalize)))

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

;; adapted from https://github.com/tonsky/rum/issues/20
(defn adapt-class [react-class]
     (fn [& args]
       (let [[opts children] (if (map? (first args))
                               [(first args) (rest args)]
                               [{} args])
             type# (first children)
             ;; we have to make sure to check if the children is sequential
             ;; as a list can be returned, eg: from a (for)
             new-children (if (sequential? type#)
                            (let [result (sablono.interpreter/interpret children)]
                              (if (sequential? result)
                                result
                                [result]))
                            children)
             ;; convert any options key value to a react element, if
             ;; a valid html element tag is used, using sablono
             vector->react-elems (fn [[key val]]
                                   (if (sequential? val)
                                     [key (sablono.interpreter/interpret val)]
                                     [key val]))
             new-options (into {} (map vector->react-elems opts))]
         ;; (.dir js/console new-children)
         (apply js/React.createElement react-class
           ;; sablono html-to-dom-attrs does not work for nested hashmaps
           (clj->js (map-keys->camel-case new-options :html-props true))
           new-children))))
