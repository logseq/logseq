(ns logseq.shui.util
  (:require
   [clojure.string :as s]
   [rum.core :refer [use-state use-effect!] :as rum]
   [logseq.shui.rum :as shui-rum]
   [goog.object :refer [getValueByKeys] :as gobj]
   [clojure.set :refer [rename-keys]]
   [clojure.walk :as w]
   [cljs-bean.core :as bean]
   [goog.dom :as gdom]))

(goog-define NODETEST false)

(defn kebab-case->camel-case
  "Converts from kebab case to camel case, eg: on-click to onClick"
  [input]
  (let [words (s/split input #"-")
        capitalize (->> (rest words)
                     (map #(apply str (s/upper-case (first %)) (rest %))))]
    (apply str (first words) capitalize)))

(defn map-keys->camel-case
  "Stringify all the keys of a cljs hashmap and converts them
   from kebab case to camel case. If :html-props option is specified,
   then rename the html properties values to their dom equivalent
   before conversion"
  [data & {:keys [html-props]}]
  (let [convert-to-camel (fn [[key value]]
                           (let [k (name key)]
                             [(if-not (s/starts-with? k "data-")
                                (kebab-case->camel-case k) k) value]))]
    (w/postwalk (fn [x]
                  (if (map? x)
                    (let [new-map (if html-props
                                    (rename-keys x {:class :className :for :htmlFor})
                                    x)]
                      (into {} (map convert-to-camel new-map)))
                    x))
      data)))

(defn $LSUtils [] (aget js/window "LSUtils"))
(def dev? (some-> ($LSUtils) (aget "isDev")))

(defn uuid-color
  [uuid-str]
  (some-> ($LSUtils) (aget "uniqolor")
    (apply [uuid-str
            #js {:saturation #js [55, 70],
                 :lightness 70,
                 :differencePoint 60}])
    (aget "color")))

(defn get-path
  "Returns the component path."
  [component-name]
  (s/split (name component-name) #"\."))

(defn adapt-class [react-class & args]
  (let [[opts children] (if (map? (first args))
                          [(first args) (rest args)]
                          [{} args])
        type# (first children)
        ;; we have to make sure to check if the children is sequential
        ;; as a list can be returned, eg: from a (for)
        new-children (if (sequential? type#)
                       [(daiquiri.interpreter/interpret children)]
                       (daiquiri.interpreter/interpret children))
        ;; convert any options key value to a React element, if
        ;; a valid html element tag is used, using sablono (rum.daiquiri)
        vector->react-elems (fn [[key val]]
                              (if (sequential? val)
                                [key (daiquiri.interpreter/interpret val)]
                                [key val]))
        new-options (into {} (map vector->react-elems opts))
        react-class (if dev? (react-class) react-class)]
    (apply js/React.createElement react-class
      ;; sablono html-to-dom-attrs does not work for nested hash-maps
      (bean/->js (map-keys->camel-case new-options :html-props true))
      new-children)))

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

(defn react->rum [c static?]
  (if static?
    (rum/defc react->rum' < rum/static
      [& args]
      (apply adapt-class c args))
    (partial adapt-class c)))

(defn component-wrap
  "Returns the component by the given component name."
  [^js ns name & {:keys [static?] :or {static? false}}]
  (let [path (get-path name)
        ;; lazy calculating is for HMR from ts
        cp #(gobj/getValueByKeys ns (clj->js path))]
    (react->rum (if dev? cp (cp)) static?)))

(def lsui-wrap
  (partial component-wrap js/window.LSUI))

(defn lsui-get
  [name]
  (if NODETEST
    #js {}
    (aget js/window.LSUI name)))
