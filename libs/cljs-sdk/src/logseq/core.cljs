;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.core
  (:require ["@logseq/libs" :as logseq]
            [cljs-bean.core :as bean]))

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
  (let [method (aget logseq "ready")
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
  (let [method (aget logseq "ensureConnected")
        args []]
    (call-method method args)))

(defn beforeunload
  [callback]
  (let [method (aget logseq "beforeunload")
        arg-callback (convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (call-method method args)))

(defn provide-model
  [model]
  (let [method (aget logseq "provideModel")
        arg-model (convert-arg {:bean-to-js true} model)
        args [arg-model]]
    (call-method method args)))

(defn provide-theme
  [theme]
  (let [method (aget logseq "provideTheme")
        arg-theme theme
        args [arg-theme]]
    (call-method method args)))

(defn provide-style
  [style]
  (let [method (aget logseq "provideStyle")
        arg-style style
        args [arg-style]]
    (call-method method args)))

(defn provide-ui
  [ui]
  (let [method (aget logseq "provideUI")
        arg-ui (convert-arg {:bean-to-js true} ui)
        args [arg-ui]]
    (call-method method args)))

(defn use-settings-schema
  [schema]
  (let [method (aget logseq "useSettingsSchema")
        arg-schema schema
        args [arg-schema]]
    (call-method method args)))

(defn update-settings
  [attrs]
  (let [method (aget logseq "updateSettings")
        arg-attrs (convert-arg {:bean-to-js true} attrs)
        args [arg-attrs]]
    (call-method method args)))

(defn on-settings-changed
  [cb]
  (let [method (aget logseq "onSettingsChanged")
        arg-cb cb
        args [arg-cb]]
    (call-method method args)))

(defn show-settings-ui
  []
  (let [method (aget logseq "showSettingsUI")
        args []]
    (call-method method args)))

(defn hide-settings-ui
  []
  (let [method (aget logseq "hideSettingsUI")
        args []]
    (call-method method args)))

(defn set-main-ui-attrs
  [attrs]
  (let [method (aget logseq "setMainUIAttrs")
        arg-attrs (convert-arg {:bean-to-js true} attrs)
        args [arg-attrs]]
    (call-method method args)))

(defn set-main-ui-inline-style
  [style]
  (let [method (aget logseq "setMainUIInlineStyle")
        arg-style style
        args [arg-style]]
    (call-method method args)))

(defn- hide-main-ui-impl
  [opts]
  (let [method (aget logseq "hideMainUI")
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
  (let [method (aget logseq "showMainUI")
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
  (let [method (aget logseq "toggleMainUI")
        args []]
    (call-method method args)))

(defn resolve-resource-full-url
  [file-path]
  (let [method (aget logseq "resolveResourceFullUrl")
        arg-file-path file-path
        args [arg-file-path]]
    (call-method method args)))
