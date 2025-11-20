;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.core
  (:require ["@logseq/libs"]
            [cljs-bean.core :as bean]
            [com.logseq.util :as util]))

(defn- normalize-result [result]
  (if (instance? js/Promise result)
    (.then result (fn [value] (normalize-result value)))
    (util/->clj-tagged result)))

(defn call-method [owner method args]
  (when-not method
    (throw (js/Error. "Missing method on logseq namespace")))
  (normalize-result (.apply method owner (bean/->js args))))

(def api-proxy js/logseq)

(defn- ready-impl
  [model callback]
  (let [method (aget api-proxy "ready")
        args [model callback]]
    (-> (call-method api-proxy method args)
        (.then (fn []
                 (js/logseq._execCallableAPIAsync
                  "setSDKMetadata"
                  #js {:runtime "cljs"}))))))

(defn ready
  ([]
   (ready-impl nil nil))
  ([model]
   (ready-impl model nil))
  ([model callback]
   (ready-impl model callback)))

(defn ensure-connected
  []
  (let [method (aget api-proxy "ensureConnected")
        args []]
    (call-method api-proxy method args)))

(defn beforeunload
  [callback]
  (let [method (aget api-proxy "beforeunload")
        args [callback]]
    (call-method api-proxy method args)))

(defn provide-model
  [model]
  (let [method (aget api-proxy "provideModel")
        args [model]]
    (call-method api-proxy method args)))

(defn provide-theme
  [theme]
  (let [method (aget api-proxy "provideTheme")
        args [theme]]
    (call-method api-proxy method args)))

(defn provide-style
  [style]
  (let [method (aget api-proxy "provideStyle")
        args [style]]
    (call-method api-proxy method args)))

(defn provide-ui
  [ui]
  (let [method (aget api-proxy "provideUI")
        args [ui]]
    (call-method api-proxy method args)))

(defn use-settings-schema
  [schema]
  (let [method (aget api-proxy "useSettingsSchema")
        args [schema]]
    (call-method api-proxy method args)))

(defn update-settings
  [attrs]
  (let [method (aget api-proxy "updateSettings")
        args [attrs]]
    (call-method api-proxy method args)))

(defn on-settings-changed
  [cb]
  (let [method (aget api-proxy "onSettingsChanged")
        args [cb]]
    (call-method api-proxy method args)))

(defn show-settings-ui
  []
  (let [method (aget api-proxy "showSettingsUI")
        args []]
    (call-method api-proxy method args)))

(defn hide-settings-ui
  []
  (let [method (aget api-proxy "hideSettingsUI")
        args []]
    (call-method api-proxy method args)))

(defn set-main-ui-attrs
  [attrs]
  (let [method (aget api-proxy "setMainUIAttrs")
        args [attrs]]
    (call-method api-proxy method args)))

(defn set-main-ui-inline-style
  [style]
  (let [method (aget api-proxy "setMainUIInlineStyle")
        args [style]]
    (call-method api-proxy method args)))

(defn- hide-main-ui-impl
  [opts]
  (let [method (aget api-proxy "hideMainUI")
        args [opts]]
    (call-method api-proxy method args)))

(defn hide-main-ui
  ([]
   (hide-main-ui-impl nil))
  ([opts]
   (hide-main-ui-impl opts)))

(defn- show-main-ui-impl
  [opts]
  (let [method (aget api-proxy "showMainUI")
        args [opts]]
    (call-method api-proxy method args)))

(defn show-main-ui
  ([]
   (show-main-ui-impl nil))
  ([opts]
   (show-main-ui-impl opts)))

(defn toggle-main-ui
  []
  (let [method (aget api-proxy "toggleMainUI")
        args []]
    (call-method api-proxy method args)))

(defn resolve-resource-full-url
  [file-path]
  (let [method (aget api-proxy "resolveResourceFullUrl")
        args [file-path]]
    (call-method api-proxy method args)))
