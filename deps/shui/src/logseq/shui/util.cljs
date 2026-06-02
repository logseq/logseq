(ns logseq.shui.util
  (:require
   ["uniqolor" :as uniqolor]
   ["react" :as react]
   [cljs-bean.core :as bean]
   [clojure.set :refer [rename-keys]]
   [clojure.string :as string]
   [clojure.walk :as w]
   [goog.object :as gobj]
   [io.factorhouse.hsx.core :as hsx]
   [logseq.shui.components :as components]
   [logseq.shui.hooks :as hooks]))

(goog-define NODETEST false)

(defn kebab-case->camel-case
  "Converts from kebab case to camel case, eg: on-click to onClick"
  [input]
  (let [words (string/split input #"-")
        capitalize (->> (rest words)
                        (map #(apply str (string/upper-case (first %)) (rest %))))]
    (apply str (first words) capitalize)))

(defn map-keys->camel-case
  "Stringify all the keys of a cljs hashmap and converts them
   from kebab case to camel case. If :html-props option is specified,
   then rename the html properties values to their dom equivalent
   before conversion"
  [data & {:keys [html-props]}]
  (let [convert-to-camel (fn [[key value]]
                           (let [k (name key)]
                             [(if-not (or (string/starts-with? k "data-")
                                          (string/starts-with? k "aria-"))
                                (kebab-case->camel-case k) k) value]))]
    (w/postwalk (fn [x]
                  (if (map? x)
                    (let [new-map (if html-props
                                    (rename-keys x {:class :className :for :htmlFor})
                                    x)]
                      (into {} (map convert-to-camel new-map)))
                    x))
                data)))

(def dev? goog.DEBUG)

(defn uuid-color
  [uuid-str]
  (some-> (uniqolor uuid-str
                    #js {:saturation #js [55, 70]
                         :lightness 70
                         :differencePoint 60})
          (aget "color")))

(defn get-path
  "Returns the component path."
  [component-name]
  (string/split (name component-name) #"\."))

(defn adapt-class [react-class & args]
  (let [[opts children] (if (map? (first args))
                          [(first args) (rest args)]
                          [{} args])
        children (some->> children (remove nil?))
        children (map hsx/create-element children)

        ;; convert any options key value to a React element, if
        ;; a valid html element tag is used.
        vector->react-elems (fn [[key val]]
                              (if (sequential? val)
                                [key (hsx/create-element val)]
                                [key val]))
        new-options (into {} (map vector->react-elems opts))
        react-class (if dev? (react-class) react-class)]
    (apply react/createElement react-class
      ;; sablono html-to-dom-attrs does not work for nested hash-maps
           (bean/->js (map-keys->camel-case new-options :html-props true))
           children)))

(def use-atom hooks/use-atom)
(def use-mounted hooks/use-mounted)

(defn- same-args?
  [^js prev-props ^js next-props]
  (= (.-args prev-props)
     (.-args next-props)))

(defn react->component [c static?]
  (if static?
    (let [class (fn [^js props]
                  (apply adapt-class c (.-args props)))
          memo-class (if-some [memo (.-memo react)]
                       (memo class same-args?)
                       class)]
      (fn [& args]
        (react/createElement memo-class #js {:args args})))
    (partial adapt-class c)))

(defn component-wrap
  "Returns the component by the given component name."
  [^js ns name & {:keys [static?] :or {static? false}}]
  (let [path (get-path name)
        ;; lazy calculating is for HMR from ts
        cp #(gobj/getValueByKeys ns (clj->js path))]
    (react->component (if dev? cp (cp)) static?)))

(def ui-wrap
  (partial component-wrap components/registry))

(defn ui-get
  [name]
  (if NODETEST
    #js {}
    (some-> components/registry (aget name))))
