(ns playground.rum
  (:require [clojure.string :as s]
            [clojure.set :as set]
            [clojure.walk :as w]
            [rum.core :refer [use-state use-effect!] :as rum]
            [daiquiri.interpreter :as interpreter]
            [cljs-bean.core :as bean]))

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
                                   [key (daiquiri.interpreter/interpret val)]
                                   [key val]))
           new-options (into {}
                             (if skip-opts-transform?
                               opts
                               (map vector->react-elems opts)))]
       (apply js/React.createElement react-class
        ;; sablono html-to-dom-attrs does not work for nested hashmaps
              (bean/->js (map-keys->camel-case new-options :html-props true))
              new-children)))))

(defn use-atom-fn
  [a getter-fn setter-fn]
  (let [[val set-val] (use-state (getter-fn @a))]
    (use-effect!
     (fn []
       (let [id (str (random-uuid))]
         (add-watch a id (fn [_ _ prev-state next-state]
                           (let [prev-value (getter-fn prev-state)
                                 next-value (getter-fn next-state)]
                             (when-not (= prev-value next-value)
                               (set-val next-value)))))
         #(remove-watch a id)))
     [])
    [val #(swap! a setter-fn %)]))

(defn use-atom
  "(use-atom my-atom)"
  [a]
  (use-atom-fn a identity (fn [_ v] v)))

(defn use-mounted
  []
  (let [*mounted (rum/use-ref false)]
    (use-effect!
     (fn []
       (rum/set-ref! *mounted true)
       #(rum/set-ref! *mounted false))
     [])
    #(rum/deref *mounted)))
