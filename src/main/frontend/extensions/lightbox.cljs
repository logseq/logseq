(ns frontend.extensions.lightbox
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.loader :refer [load]]))

(defn js-load$
  [url]
  (p/create
    (fn [resolve]
      (load url resolve))))

(def JS_ROOT
  (if (= js/location.protocol "file:")
    "./js"
    "./static/js"))

(defn load-base-assets$
  []
  (js-load$ (str JS_ROOT "/photoswipe.js")))

(defn preview-images!
  [images]

  (p/let [_ (load-base-assets$)]
    (let [options {:dataSource images :pswpModule js/window.photoswipe.default :showHideAnimationType "fade"}
          _ (js/console.log (bean/->js options))
          ^js lightbox (js/window.photoswipe.PhotoSwipeLightbox. (bean/->js options))]
      (doto lightbox
        (.init)
        (.loadAndOpen 0)))))