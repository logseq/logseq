(ns frontend.extensions.code.api
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

(def supported-user-option-keys
  #{:line-numbers?
    :line-wrapping?})

(def default-user-options
  {:line-numbers? true
   :line-wrapping? false})

(defn external-name
  [value]
  (cond
    (keyword? value)
    (subs (str value) 1)

    (some? value)
    (str value)

    :else
    nil))

(defn- string-set
  [values]
  (cond
    (nil? values)
    nil

    (set? values)
    (set (map str values))

    (sequential? values)
    (set (map str values))

    (array? values)
    (set (map str (array-seq values)))

    :else
    #{(str values)}))

(defn normalize-language-descriptor
  [descriptor]
  (let [descriptor (if (map? descriptor)
                     descriptor
                     (js->clj descriptor :keywordize-keys true))]
    (cond-> descriptor
      (:id descriptor)
      (update :id keyword)

      (:source descriptor)
      (update :source keyword)

      (:entry descriptor)
      (update :entry keyword)

      (:names descriptor)
      (update :names string-set)

      (:extensions descriptor)
      (update :extensions string-set))))

(defn language-descriptor->js
  [descriptor]
  (when descriptor
    (let [descriptor (normalize-language-descriptor descriptor)]
      #js {:id (external-name (:id descriptor))
           :names (clj->js (sort (or (:names descriptor) [])))
           :source (external-name (:source descriptor))
           :extensions (clj->js (sort (or (:extensions descriptor) [])))
           :package (:package descriptor)
           :entry (external-name (:entry descriptor))
           :options (clj->js (:options descriptor))})))

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

(defn enhancer-payload->js
  [payload]
  (let [dispatch! (:dispatch! payload)
        get-language (:get-language payload)
        register-extension! (:register-extension! payload)
        register-language! (:register-language! payload)]
    #js {:apiVersion (:api-version payload)
         :enhancerType (external-name (:enhancer-type payload))
         :capabilities (clj->js (sort (map external-name (:capabilities payload))))
         :blockUuid (some-> (:block-uuid payload) str)
         :editorId (:editor-id payload)
         :view (:view payload)
         :state (:state payload)
         :language (language-descriptor->js (:language payload))
         :dispatch (fn [transaction-spec]
                     (when dispatch!
                       (dispatch! transaction-spec)))
         :getLanguage (fn [language-name]
                        (some-> (get-language language-name)
                                language-descriptor->js))
         :registerExtension (fn [key extension]
                              (register-extension! key extension))
         :registerLanguage (fn [descriptor]
                             (register-language!
                              (normalize-language-descriptor descriptor)))}))

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

(defn validate-user-options!
  [options]
  (let [options (or options {})
        cm5-keys (cm5-option-keys options)
        unsupported-keys (->> (keys options)
                              (remove supported-user-option-keys)
                              set)]
    (cond
      (seq cm5-keys)
      (throw (ex-info "Unsupported CodeMirror 5 option"
                      {:keys cm5-keys}))

      (seq unsupported-keys)
      (throw (ex-info "Unsupported CodeMirror option"
                      {:keys unsupported-keys}))

      :else
      options)))
