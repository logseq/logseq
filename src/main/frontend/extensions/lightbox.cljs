(ns frontend.extensions.lightbox
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            [frontend.util :as util]))

(defn load-base-assets$
  []
  (util/js-load$ (str util/JS_ROOT "/photoswipe.umd.min.js"))
  (util/js-load$ (str util/JS_ROOT "/photoswipe-lightbox.umd.min.js")))

(defn preview-images!
  [images]

  (p/let [_ (load-base-assets$)]
    (let [options {:dataSource images :pswpModule js/window.PhotoSwipe :showHideAnimationType "fade"}
          ^js lightbox (js/window.PhotoSwipeLightbox. (bean/->js options))]
      (doto lightbox
        (.init)
        (.loadAndOpen 0)))))
