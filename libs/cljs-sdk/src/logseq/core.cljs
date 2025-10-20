;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.core
  (:require [cljs-bean.core :as bean]))

(defn convert-arg [spec value]
  (if (:bean-to-js spec) (bean/->js value) value))

(defn- normalize-result [result]
  (if (instance? js/Promise result)
    (.then result (fn [value] (normalize-result value)))
    (bean/->clj result)))

(defn call-method [method args]
  (when-not method
    (throw (js/Error. "Missing method on logseq namespace")))
  (normalize-result (.apply method (to-array args))))

(defn- ready-impl
  [model callback]
  (let [method (aget js/logseq "ready")
        arg-model (convert-arg {:bean-to-js true} model)
        arg-callback (convert-arg {:bean-to-js true} callback)
        args [arg-model arg-callback]]
    (call-method method args)))

(defn ready
  ([]
   (ready-impl nil nil))
  ([model]
   (ready-impl model nil))
  ([model callback]
   (ready-impl model callback)))

(defn ensure-connected
  []
  (let [method (aget js/logseq "ensureConnected")
        args []]
    (call-method method args)))

(defn beforeunload
  [callback]
  (let [method (aget js/logseq "beforeunload")
        arg-callback (convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (call-method method args)))

(defn provide-model
  [model]
  (let [method (aget js/logseq "provideModel")
        arg-model (convert-arg {:bean-to-js true} model)
        args [arg-model]]
    (call-method method args)))

(defn provide-theme
  [theme]
  (let [method (aget js/logseq "provideTheme")
        arg-theme theme
        args [arg-theme]]
    (call-method method args)))

(defn provide-style
  [style]
  (let [method (aget js/logseq "provideStyle")
        arg-style style
        args [arg-style]]
    (call-method method args)))

(defn provide-ui
  [ui]
  (let [method (aget js/logseq "provideUI")
        arg-ui (convert-arg {:bean-to-js true} ui)
        args [arg-ui]]
    (call-method method args)))

(defn use-settings-schema
  [schema]
  (let [method (aget js/logseq "useSettingsSchema")
        arg-schema schema
        args [arg-schema]]
    (call-method method args)))

(defn update-settings
  [attrs]
  (let [method (aget js/logseq "updateSettings")
        arg-attrs (convert-arg {:bean-to-js true} attrs)
        args [arg-attrs]]
    (call-method method args)))

(defn on-settings-changed
  [cb]
  (let [method (aget js/logseq "onSettingsChanged")
        arg-cb cb
        args [arg-cb]]
    (call-method method args)))

(defn show-settings-ui
  []
  (let [method (aget js/logseq "showSettingsUI")
        args []]
    (call-method method args)))

(defn hide-settings-ui
  []
  (let [method (aget js/logseq "hideSettingsUI")
        args []]
    (call-method method args)))

(defn set-main-ui-attrs
  [attrs]
  (let [method (aget js/logseq "setMainUIAttrs")
        arg-attrs (convert-arg {:bean-to-js true} attrs)
        args [arg-attrs]]
    (call-method method args)))

(defn set-main-ui-inline-style
  [style]
  (let [method (aget js/logseq "setMainUIInlineStyle")
        arg-style style
        args [arg-style]]
    (call-method method args)))

(defn- hide-main-ui-impl
  [opts]
  (let [method (aget js/logseq "hideMainUI")
        arg-opts opts
        args [arg-opts]]
    (call-method method args)))

(defn hide-main-ui
  ([]
   (hide-main-ui-impl nil))
  ([opts]
   (hide-main-ui-impl opts)))

(defn- show-main-ui-impl
  [opts]
  (let [method (aget js/logseq "showMainUI")
        arg-opts opts
        args [arg-opts]]
    (call-method method args)))

(defn show-main-ui
  ([]
   (show-main-ui-impl nil))
  ([opts]
   (show-main-ui-impl opts)))

(defn toggle-main-ui
  []
  (let [method (aget js/logseq "toggleMainUI")
        args []]
    (call-method method args)))

(defn resolve-resource-full-url
  [file-path]
  (let [method (aget js/logseq "resolveResourceFullUrl")
        arg-file-path file-path
        args [arg-file-path]]
    (call-method method args)))
