(ns logseq.cli.style
  "CLI styling helpers based on picocolors."
  (:require ["picocolors" :as pc]
            [clojure.string :as string]))

(def ansi-pattern
  #"\u001b\[[0-9;]*m")

(def ^:dynamic *color-enabled?*
  nil)

(defn- term-dumb?
  []
  (= "dumb" (some-> js/process .-env (aget "TERM"))))

(defn- color-supported?
  []
  (and (some-> js/process .-stdout .-isTTY)
       (.-isColorSupported pc)
       (not (term-dumb?))))

(defn- color-enabled?
  []
  (if (some? *color-enabled?*)
    (boolean *color-enabled?*)
    (color-supported?)))

(defn- ->text
  [value]
  (if (nil? value)
    ""
    (str value)))

(defn strip-ansi
  [value]
  (string/replace (or value "") ansi-pattern ""))

(defn- colors
  []
  (.createColors pc (color-enabled?)))

(defn- apply-style
  [style-key value]
  (let [text (->text value)]
    (if (seq text)
      (let [palette (colors)
            style-fn (aget palette style-key)]
        (if (fn? style-fn)
          (style-fn text)
          text))
      text)))

(defn bold [value] (apply-style "bold" value))
(defn dim [value] (apply-style "dim" value))
(defn green [value] (apply-style "green" value))
