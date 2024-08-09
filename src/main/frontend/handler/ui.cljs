(ns ^:no-doc frontend.handler.ui
  (:require [clojure.string :as string]
            [dommy.core :as dom]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.react :as react]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.loader :refer [load]]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [logseq.shui.dialog.core :as shui-dialog]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.path :as path]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

;; sidebars
(def *right-sidebar-resized-at (atom (js/Date.now)))

(defn persist-right-sidebar-width!
  [width]
  (state/set-state! :ui/sidebar-width width)
  (storage/set "ls-right-sidebar-width" width))

(defn restore-right-sidebar-width!
  []
  (when-let [width (storage/get "ls-right-sidebar-width")]
    (state/set-state! :ui/sidebar-width width)))

(defn close-left-sidebar!
  []
  (when-let [elem (gdom/getElement "close-left-bar")]
    (.click elem)))

(defn toggle-right-sidebar!
  []
  (when-not (:ui/sidebar-open? @state/state) (restore-right-sidebar-width!))
  (state/toggle-sidebar-open?!))

(defn persist-right-sidebar-state!
  []
  (let [sidebar-open? (:ui/sidebar-open? @state/state)
        data (if sidebar-open? {:blocks (:sidebar/blocks @state/state)
                                :collapsed (:ui/sidebar-collapsed-blocks @state/state)
                                :open? true} {:open? false})]
    (storage/set "ls-right-sidebar-state" data)))

(defn restore-right-sidebar-state!
  []
  (when-let [data' (storage/get "ls-right-sidebar-state")]
    (let [{:keys [open? collapsed blocks]} data']
      (when open?
        (state/set-state! :ui/sidebar-open? open?)
        (state/set-state! :sidebar/blocks blocks)
        (state/set-state! :ui/sidebar-collapsed-blocks collapsed)
        (restore-right-sidebar-width!)))))

(defn toggle-contents!
  []
  (when-let [current-repo (state/get-current-repo)]
    (let [id "contents"]
      (if (state/sidebar-block-exists? id)
        (state/sidebar-remove-block! id)
        (state/sidebar-add-block! current-repo id :contents)))))

(defn toggle-help!
  []
  (state/toggle! :ui/help-open?))

(defn toggle-settings-modal!
  []
  (when-not (:srs/mode? @state/state)
    (state/toggle-settings!)))

(defn re-render-root!
  ([]
   (re-render-root! {}))
  ([{:keys [clear-query-state?]
     :or {clear-query-state? true}}]
   {:post [(nil? %)]}
   (when clear-query-state?
     (react/clear-query-state!))
   (doseq [component (keys @react/query-components)]
     (rum/request-render component))
   (when-let [component (state/get-root-component)]
     (rum/request-render component))
   nil))

(defn highlight-element!
  [fragment]
  (let [id (and
            (> (count fragment) 36)
            (subs fragment (- (count fragment) 36)))]
    (if (and id (util/uuid-string? id))
      (let [elements (array-seq (js/document.getElementsByClassName (str "id" id)))]
        (when (first elements)
          (util/scroll-to-element (gobj/get (first elements) "id")))
        (state/exit-editing-and-set-selected-blocks! elements))
      (when-let [element (gdom/getElement fragment)]
        (util/scroll-to-element fragment)
        (dom/add-class! element "block-highlight")
        (js/setTimeout #(dom/remove-class! element "block-highlight")
                       4000)))))

(defn add-style-if-exists!
  []
  (when-let [style (or (state/get-custom-css-link)
                       (db-model/get-custom-css))]
    (if (config/db-based-graph? (state/get-current-repo))
      (p/let [style (assets-handler/<expand-assets-links-for-db-graph style)]
        (util/add-style! style))
      (some-> (config/expand-relative-assets-path style)
              (util/add-style!)))))

(defn reset-custom-css!
  []
  (when-let [el-style (gdom/getElement "logseq-custom-theme-id")]
    (dom/remove! el-style))
  (add-style-if-exists!))

(def *js-execed (atom #{}))

(defn exec-js-if-exists-&-allowed!
  [t]
  (when-let [href (or
                   (state/get-custom-js-link)
                   (config/get-custom-js-path))]
    (let [k (str "ls-js-allowed-" href)
          execed #(swap! *js-execed conj href)
          execed? (contains? @*js-execed href)
          ask-allow #(let [r (js/confirm (t :plugin/custom-js-alert))]
                       (if r
                         (storage/set k (js/Date.now))
                         (storage/set k false))
                       r)
          allowed! (storage/get k)
          should-ask? (or (nil? allowed!)
                          (> (- (js/Date.now) allowed!) 604800000))
          exec-fn #(when-let [scripts (and % (string/trim %))]
                     (when-not (string/blank? scripts)
                       (when (or (not should-ask?) (ask-allow))
                         (try
                           (js/eval scripts)
                           (execed)
                           (catch :default e
                             (js/console.error "[custom js]" e))))))]
      (when (and (not execed?)
                 (not= false allowed!))
        (cond
          (string/starts-with? href "http")
          (when (or (not should-ask?)
                    (ask-allow))
            (load href #(do (js/console.log "[custom js]" href) (execed))))

          (config/db-based-graph? (state/get-current-repo))
          (when-let [script (db/get-file href)]
            (exec-fn script))

          :else
          (let [repo-dir (config/get-repo-dir (state/get-current-repo))
                rpath (path/relative-path repo-dir href)]
            (p/let [exists? (fs/file-exists? repo-dir rpath)]
              (when exists?
                (util/p-handle
                 (fs/read-file repo-dir rpath)
                 exec-fn)))))))))

(defn toggle-wide-mode!
  []
  (storage/set :ui/wide-mode (not (state/get-wide-mode?)))
  (state/toggle-wide-mode!))

;; auto-complete
(defn auto-complete-prev
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (cond
      (>= @current-idx 1)
      (swap! current-idx dec)
      (= @current-idx 0)
      (reset! current-idx (dec (count matched)))
      :else nil)
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [modal (gobj/get (gdom/getElement "ui__ac") "parentElement")
            height (or (gobj/get modal "offsetHeight") 300)
            scroll-top (- (gobj/get element "offsetTop") (/ height 2))]
        (set! (.-scrollTop modal) scroll-top)))))

(defn auto-complete-next
  [state e]
  (let [current-idx (get state :frontend.ui/current-idx)
        matched (first (:rum/args state))]
    (util/stop e)
    (let [total (count matched)]
      (if (>= @current-idx (dec total))
        (reset! current-idx 0)
        (swap! current-idx inc)))
    (when-let [element (gdom/getElement (str "ac-" @current-idx))]
      (let [modal (gobj/get (gdom/getElement "ui__ac") "parentElement")
            height (or (gobj/get modal "offsetHeight") 300)
            scroll-top (- (gobj/get element "offsetTop") (/ height 2))]
        (set! (.-scrollTop modal) scroll-top)))))

(defn auto-complete-complete
  [state e]
  (let [[matched {:keys [on-chosen on-enter]}] (:rum/args state)
        current-idx (get state :frontend.ui/current-idx)]
    (util/stop e)
    (if (and (seq matched)
             (> (count matched)
                @current-idx))
      (on-chosen (nth matched @current-idx) e)
      (and on-enter (on-enter state)))))

(defn auto-complete-shift-complete
  [state e]
  (let [[matched {:keys [on-chosen on-shift-chosen on-enter]}] (:rum/args state)
        current-idx (get state :frontend.ui/current-idx)]
    (util/stop e)
    (if (and (seq matched)
             (> (count matched)
                @current-idx))
      ((or on-shift-chosen on-chosen) (nth matched @current-idx) false)
      (and on-enter (on-enter state)))))

(defn toggle-cards!
  []
  (if (shui-dialog/get-modal :srs)
    (shui/dialog-close!)
    (state/pub-event! [:modal/show-cards])))

(defn open-new-window-or-tab!
  "Open a new Electron window."
  [repo target-repo]
  (when-not (= repo target-repo)        ; TODO: remove this once we support multi-tabs OPFS access
    (when target-repo
      (if (util/electron?)
       (ipc/ipc "openNewWindow" target-repo)
       (js/window.open (str config/app-website "#/?graph=" target-repo) "_blank")))))
