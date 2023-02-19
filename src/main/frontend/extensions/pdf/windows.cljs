(ns frontend.extensions.pdf.windows
  (:require [frontend.state :as state]
            [rum.core :as rum]
            [frontend.storage :as storage]))

(def *active-win (atom nil))
(def *exit-pending? (atom false))

(defn resolve-styles!
  [^js doc]
  (doseq [r ["./css/style.css"]]
    (let [^js link (js/document.createElement "link")]
      (set! (.-rel link) "stylesheet")
      (set! (.-href link) r)
      (.appendChild (.-head doc) link))))

(defn resolve-own-document
  [^js viewer]
  (some-> viewer (.-viewer) (.-ownerDocument)))

(defn resolve-own-container
  [^js viewer]
  (some-> (resolve-own-document viewer)
          (.querySelector "body")))

(defn resolve-own-window
  [^js viewer]
  (some-> (resolve-own-document viewer)
          (.-defaultView)))

(defn check-viewer-in-system-win?
  [^js viewer]
  (some-> viewer (.-$inSystemWindow)))

;(defn get-base-root
;  [^js el]
;  (when-let [^js doc (and el (.-ownerDocument el))]
;    (when-let [base-uri (.-baseURI doc)]
;      (try
;        (let [^js url   (js/URL. base-uri)
;              hash-str  (.-hash url)
;              base-root (string/replace base-uri hash-str "")
;              base-root (subs base-root 0 (string/last-index-of base-root "/"))]
;          base-root)
;        (catch js/Error e
;          (js/console.error e))))))

(defn resolve-classes!
  [^js doc]
  (let [^js html (.-documentElement doc)]
    (doto (.-classList html)
      (.add "is-system-window"))))

(defn close-pdf-in-new-window!
  ([] (close-pdf-in-new-window! true))
  ([reset-current?]
   (when (and reset-current? (not @*exit-pending?))
     (state/set-state! :pdf/current nil))
   (state/set-state! :pdf/system-win? false)
   (reset! *active-win nil)
   (reset! *exit-pending? false)))

(defn exit-pdf-in-system-window!
  ([] (exit-pdf-in-system-window! true))
  ([restore?]
   (when-let [^js win @*active-win]
     (when restore? (reset! *exit-pending? true))
     (.close win))))

(defn open-pdf-in-new-window!
  [pdf-playground pdf-current]
  (when pdf-current
    (let [setup-win!
          (fn []
            (let [layouts (storage/get :ls-pdf-system-win-layout)
                  layouts (if (and (map? layouts)
                                   (contains? layouts :width)
                                   (contains? layouts :height))
                            (reduce (fn [a [k v]] (str a (name k) "=" v ",")) "" layouts)
                            "width=700,height=800")]
              (when-let [^js win (and (:key pdf-current)
                                      (js/window.open "about:blank" "_blank" layouts))]
                (let [^js doc    (.-document win)
                      ^js doc-el (.-documentElement doc)
                      ^js base   (js/document.createElement "base")
                      ^js main   (js/document.createElement "main")
                      theme-mode (:ui/theme @state/state)]
                  (set! (.-href base) js/location.href)
                  (.appendChild (.-head doc) base)
                  (set! (.-title doc) (or (:filename pdf-current) "Logseq"))
                  (set! (.-dataset doc-el) -theme (str theme-mode))
                  (resolve-classes! doc)
                  (resolve-styles! doc)
                  (.appendChild (.-body doc) main)
                  (rum/mount (pdf-playground pdf-current) main)

                  ;; events
                  (.addEventListener win "beforeunload" #(close-pdf-in-new-window!))
                  (.addEventListener win "resize" #(storage/set :ls-pdf-system-win-layout
                                                                {:height (.-clientHeight doc-el)
                                                                 :width  (.-clientWidth doc-el)
                                                                 :x      (.-screenX win)
                                                                 :y      (.-screenY win)})))

                (reset! *active-win win)
                (state/set-state! :pdf/system-win? true))))]

      (js/setTimeout
       (fn []
         (if-let [win @*active-win]
           (.focus win)
           (setup-win!)))
       16))))