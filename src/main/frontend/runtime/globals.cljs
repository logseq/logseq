(ns frontend.runtime.globals
  "Installs npm-backed browser globals kept for the plugin runtime API."
  (:require ["react" :as react]
            ["react-dom" :as react-dom]
            ["react-dom/client" :as react-dom-client]
            ["react/jsx-runtime" :as react-jsx-runtime]))

(defn install!
  []
  (set! (.-React js/globalThis) react)
  (set! (.-ReactDOM js/globalThis) react-dom)
  (set! (.-ReactDOMClient js/globalThis) react-dom-client)
  (set! (.-ReactJSXRuntime js/globalThis) react-jsx-runtime))

(install!)
