(ns capacitor.components.common)

(defn stop [e]
  (when e (doto e (.preventDefault) (.stopPropagation))))

(defn get-dom-block-uuid
  [^js el]
  (some-> el
    (.closest "[data-blockid]")
    (.-dataset) (.-blockid)
    (uuid)))

(defn get-dom-page-scroll
  [^js el]
  (some-> el (.closest "[part=scroll]")))

(defn current-page-scroll
  []
  (some-> (js/document.querySelector "ion-nav > .ion-page:not(.ion-page-hidden)")
    (.querySelector "ion-content")
    (.-shadowRoot)
    (.querySelector "[part=scroll]")))

(defn keep-keyboard-open
  [^js e]
  (try
    (.keepKeyboardOpen js/window)
    (some-> e (stop))
    (catch js/Error e'
      (js/console.error e'))))