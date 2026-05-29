(ns frontend.extensions.code-cm6.api
  (:require [clojure.set :as set]))

(def api-version 1)

(def enhancer-type :codemirror-6)
(def legacy-enhancer-type :codemirror)

(def capabilities
  #{:code-editor/cm6
    :code-editor/extensions
    :code-editor/language-registry})

(def required-fn-keys
  #{:get-language
    :register-extension!
    :register-language!})

(def cm5-option-adapter-keys
  #{:autoCloseBrackets
    :extraKeys
    :lineNumbers
    :lineWrapping
    :matchBrackets
    :readOnly
    :styleActiveLine
    :theme
    :viewportMargin})

(defn make-enhancer-payload
  [context]
  (merge
   {:api-version api-version
    :enhancer-type enhancer-type
    :capabilities capabilities}
   (select-keys context
                [:block-uuid
                 :dispatch!
                 :editor-id
                 :get-language
                 :language
                 :register-extension!
                 :register-language!
                 :state
                 :view])))

(defn valid-enhancer-payload?
  [payload]
  (and (map? payload)
       (= api-version (:api-version payload))
       (= enhancer-type (:enhancer-type payload))
       (set/subset? capabilities (set (:capabilities payload)))
       (every? #(fn? (get payload %)) required-fn-keys)))

(defn cm5-option-keys
  [options]
  (->> (keys options)
       (filter cm5-option-adapter-keys)
       set))
