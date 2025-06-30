(ns frontend.extensions.lightbox
  (:require [cljs-bean.core :as bean]))

(defn preview-images!
  [images]
  (let [options {:dataSource images :pswpModule js/window.PhotoSwipe :showHideAnimationType "fade"}
        ^js lightbox (js/window.PhotoSwipeLightbox. (bean/->js options))]
    (doto lightbox
      (.init)
      (.loadAndOpen 0))))
