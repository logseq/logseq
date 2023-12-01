(ns logseq.shui.dialog.core
  (:require [rum.core :as rum]
            [logseq.shui.util :as util]
            [clojure.string :as string]))

;; provider
(def dialog (util/lsui-wrap "Dialog"))
(def dialog-portal (util/lsui-wrap "DialogPortal"))

;; ui
(def dialog-overlay (util/lsui-wrap "DialogOverlay"))
(def dialog-close (util/lsui-wrap "DialogClose"))
(def dialog-trigger (util/lsui-wrap "DialogTrigger"))
(def dialog-content (util/lsui-wrap "DialogContent"))
(def dialog-header (util/lsui-wrap "DialogHeader"))
(def dialog-footer (util/lsui-wrap "DialogFooter"))
(def dialog-title (util/lsui-wrap "DialogTitle"))
(def dialog-description (util/lsui-wrap "DialogDescription"))

;; apis
(defn open! []
  ;; FIXME
  )

(defn confirm! []
  ;; FIXME
  )

(defn alert! []
  ;; FIXME
  )

(defn close! []
  ;; FIXME
  )

(defn close-all! []
  ;; FIXME
  )