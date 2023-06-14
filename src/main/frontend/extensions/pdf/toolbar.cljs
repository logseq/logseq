(ns frontend.extensions.pdf.toolbar
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [rum.core :as rum]
            [promesa.core :as p]
            [frontend.rum :refer [use-atom]]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.handler.editor :as editor-handler]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.notification :as notification]
            [frontend.extensions.pdf.windows :refer [resolve-own-container] :as pdf-windows]))

(declare make-docinfo-in-modal)

(def *area-dashed? (atom ((fnil identity false) (storage/get (str "ls-pdf-area-is-dashed")))))
(def *area-mode? (atom false))
(def *highlight-mode? (atom false))
#_:clj-kondo/ignore
(rum/defcontext *highlights-ctx*)

(rum/defc pdf-settings
  [^js viewer theme {:keys [hide-settings! select-theme! t]}]

  (let [*el-popup (rum/use-ref nil)
        [area-dashed? set-area-dashed?] (use-atom *area-dashed?)
        [hl-block-colored? set-hl-block-colored?] (rum/use-state (state/sub :pdf/block-highlight-colored?))]

    (rum/use-effect!
     (fn []
       (let [el-popup (rum/deref *el-popup)
             cb       (fn [^js e]
                        (and (= (.-which e) 27) (hide-settings!)))]

         (js/setTimeout #(.focus el-popup))
         (.addEventListener el-popup "keyup" cb)
         #(.removeEventListener el-popup "keyup" cb)))
     [])

    (rum/use-effect!
     (fn []
       (storage/set "ls-pdf-area-is-dashed" (boolean area-dashed?)))
     [area-dashed?])

    (rum/use-effect!
     (fn []
       (let [b (boolean hl-block-colored?)]
         (state/set-state! :pdf/block-highlight-colored? b)
         (storage/set "ls-pdf-hl-block-is-colored" b)))
     [hl-block-colored?])

    (rum/use-effect!
     (fn []
       (let [cb  #(let [^js target (.-target %)]
                    (when (and (not (some-> (rum/deref *el-popup) (.contains target)))
                               (nil? (.closest target ".ui__modal")))
                      (hide-settings!)))
             doc (resolve-own-container viewer)]
         (js/setTimeout
          #(.addEventListener doc "click" cb))
         #(.removeEventListener doc "click" cb)))
     [])

    [:div.extensions__pdf-settings.hls-popup-overlay.visible
     [:div.extensions__pdf-settings-inner.hls-popup-box
      {:ref       *el-popup
       :tab-index -1}

      [:div.extensions__pdf-settings-item.theme-picker
       (map (fn [it]
              [:button.flex.items-center.justify-center
               {:key it :class it :on-click #(select-theme! it)}
               (when (= theme it) (svg/check))])
            ["light", "warm", "dark"])]
      [:div.extensions__pdf-settings-item.toggle-input
       [:label (t :pdf/toggle-dashed)]
       (ui/toggle area-dashed? #(set-area-dashed? (not area-dashed?)) true)]

      [:div.extensions__pdf-settings-item.toggle-input.is-between
       [:label (t :pdf/hl-block-colored)]
       (ui/toggle hl-block-colored? #(set-hl-block-colored? (not hl-block-colored?)) true)]

      [:div.extensions__pdf-settings-item.toggle-input
       [:a.is-info.w-full.text-gray-500
        {:title    (t :pdf/doc-metadata)
         :on-click #(p/let [ret (pdf-utils/get-meta-data$ viewer)]
                      (state/set-modal! (make-docinfo-in-modal ret)))}

        [:span.flex.items-center.justify-between.w-full
         (t :pdf/doc-metadata)
         (svg/icon-info)]]]]]))

(rum/defc docinfo-display
  [info close-fn!]
  [:div#pdf-docinfo.extensions__pdf-doc-info
   [:div.inner-text
    (for [[k v] info
          :let [k (str (string/replace-first (pr-str k) #"^\:" "") "::")]]
      [:p {:key k} [:strong k] "  " [:i (pr-str v)]])]

   [:div.flex.items-center.justify-center.pt-2.pb--2
    (ui/button "Copy all"
               :on-click
               (fn []
                 (let [text (.-innerText (js/document.querySelector "#pdf-docinfo > .inner-text"))
                       text (string/replace text #"[\n\t]+" "\n")]
                   (util/copy-to-clipboard! text)
                   (notification/show! "Copied!" :success)
                   (close-fn!))))]])

(defn make-docinfo-in-modal
  [info]
  (fn [close-fn!]
    (docinfo-display info close-fn!)))

(defonce find-status
  {0 ::found
   1 ::not-found
   2 ::wrapped
   3 ::pending})

(rum/defc ^:large-vars/data-var pdf-finder
  [^js viewer {:keys [hide-finder!]}]

  (let [*el-finder    (rum/use-ref nil)
        *el-input     (rum/use-ref nil)
        ^js bus       (.-eventBus viewer)
        [case-sensitive?, set-case-sensitive?] (rum/use-state nil)
        [input, set-input!] (rum/use-state "")
        [matches, set-matches!] (rum/use-state {:current 0 :total 0})
        [find-state, set-find-state!] (rum/use-state {:status nil :current 0 :total 0 :query ""})
        [entered-active0?, set-entered-active0?] (rum/use-state false)
        [entered-active?, set-entered-active?] (rum/use-state false)

        reset-finder! (fn []
                        (.dispatch bus "findbarclose" nil)
                        (set-matches! nil)
                        (set-find-state! nil)
                        (set-entered-active? false)
                        (set-entered-active0? false))

        close-finder! (fn []
                        (reset-finder!)
                        (hide-finder!))

        do-find!      (fn [{:keys [type prev?] :as opts}]
                        (when-let [type (if (keyword? opts) opts type)]
                          (.dispatch bus "find"
                                     #js {:source          nil
                                          :type            (name type)
                                          :query           input
                                          :phraseSearch    true
                                          :caseSensitive   case-sensitive?
                                          :highlightAll    true
                                          :findPrevious    prev?
                                          :matchDiacritics false})))]

    (rum/use-effect!
     (fn []
       (when-let [^js doc (resolve-own-container viewer)]
         (let [handler (fn [^js e]
                         (when-let [^js target (and (string/blank? (.-value (rum/deref *el-input)))
                                                    (.-target e))]
                           (when (and (not= "Search" (.-title target))
                                      (not (some-> (rum/deref *el-finder) (.contains target))))
                             (close-finder!))))]
           (.addEventListener doc "click" handler)
           #(.removeEventListener doc "click" handler))))
     [viewer])

    (rum/use-effect!
     (fn []
       (when-let [^js bus (.-eventBus viewer)]
         (.on bus "updatefindmatchescount" (fn [^js e]
                                             (let [matches (bean/->clj (.-matchesCount e))]
                                               (set-matches! matches)
                                               (set-find-state! (fn [s] (merge s matches))))))
         (.on bus "updatefindcontrolstate" (fn [^js e]
                                             (set-find-state!
                                              (merge
                                               {:status (get find-status (.-state e))
                                                :query  (.-rawQuery e)}
                                               (bean/->clj (.-matchesCount e))))))))
     [viewer])

    (rum/use-effect!
     (fn []
       (when-not (nil? case-sensitive?)
         (do-find! :casesensitivitychange)))
     [case-sensitive?])

    [:div.extensions__pdf-finder-wrap.hls-popup-overlay.visible
     {:on-click #()}

     [:div.extensions__pdf-finder.hls-popup-box
      {:ref       *el-finder
       :tab-index -1}

      [:div.input-inner.flex.items-center
       [:div.input-wrap.relative
        [:input
         {:placeholder "search"
          :type        "text"
          :ref         *el-input
          :auto-focus  true
          :value       input
          :on-change   (fn [^js e]
                         (let [val (.-value (.-target e))]
                           (set-input! val)
                           (set-entered-active0? (not (string/blank? (util/trim-safe val))))
                           (set-entered-active? false)))

          :on-key-up   (fn [^js e]
                         (case (.-which e)
                           13                               ;; enter
                           (do
                             (do-find! :again)
                             (set-entered-active? true))

                           27                               ;; esc
                           (if (string/blank? input)
                             (close-finder!)
                             (do
                               (reset-finder!)
                               (set-input! "")))

                           :dune))}]

        (when entered-active0?
          (ui/button (ui/icon "arrow-back") :title "Enter to search" :class "icon-enter" :intent "true" :small? true))]

       (ui/button (ui/icon "letter-case")
                  :class (string/join " " (util/classnames [{:active case-sensitive?}]))
                  :intent "true" :small? true :on-click #(set-case-sensitive? (not case-sensitive?)))
       (ui/button (ui/icon "chevron-up") :intent "true" :small? true :on-click #(do (do-find! {:type :again :prev? true}) (util/stop %)))
       (ui/button (ui/icon "chevron-down") :intent "true" :small? true :on-click #(do (do-find! {:type :again}) (util/stop %)))
       (ui/button (ui/icon "x") :intent "true" :small? true :on-click close-finder!)]

      [:div.result-inner
       (when-let [status (and entered-active?
                              (not (string/blank? input))
                              (:status find-state))]
         (if-not (= ::not-found status)
           [:div.flex.px-3.py-3.text-xs.opacity-90
            (apply max (map :current [find-state matches])) " of "
            (:total find-state)
            (str " matches (\"" (:query find-state) "\")")]
           [:div.px-3.py-3.text-xs.opacity-80.text-red-600 "Not found."]))]]]))

(rum/defc pdf-outline-item
  [^js viewer
   {:keys [title items parent dest expanded]}
   {:keys [upt-outline-node!] :as ops}]
  (let [has-child? (seq items)
        expanded?  (boolean expanded)]

    [:div.extensions__pdf-outline-item
     {:class (util/classnames [{:has-children has-child? :is-expand expanded?}])}
     [:div.inner
      [:a
       {:data-dest (js/JSON.stringify (bean/->js dest))
        :on-click  (fn [^js/MouseEvent e]
                     (let [target (.-target e)]
                       (if (.closest target "i")
                         (let [path (map #(if (re-find #"\d+" %) (int %) (keyword %))
                                         (string/split parent #"\-"))]
                           (.preventDefault e)
                           (upt-outline-node! path {:expanded (not expanded?)}))
                         (when-let [^js dest (and dest (bean/->js dest))]
                           (.goToDestination (.-linkService viewer) dest)))))}

       [:i.arrow svg/arrow-right-v2]
       [:span title]]]

     ;; children
     (when (and has-child? expanded?)
       [:div.children
        (map-indexed
         (fn [idx itm]
           (let [parent (str parent "-items-" idx)]
             (rum/with-key
              (pdf-outline-item
               viewer
               (merge itm {:parent parent})
               ops) parent))) items)])]))

(rum/defc pdf-outline
  [^js viewer _visible? set-visible!]
  (when-let [^js pdf-doc (and viewer (.-pdfDocument viewer))]
    (let [*el-outline       (rum/use-ref nil)
          [outline-data, set-outline-data!] (rum/use-state [])
          upt-outline-node! (rum/use-callback
                             (fn [path attrs]
                               (set-outline-data! (update-in outline-data path merge attrs)))
                             [outline-data])]

      (rum/use-effect!
       (fn []
         (p/catch
          (p/let [^js data (.getOutline pdf-doc)]
            #_:clj-kondo/ignore
            (when-let [data (and data (.map data (fn [^js it]
                                                   (set! (.-href it) (.. viewer -linkService (getDestinationHash (.-dest it))))
                                                   (set! (.-expanded it) false)
                                                   it)))])
            (set-outline-data! (bean/->clj data)))

          (fn [e]
            (js/console.error "[Load outline Error]" e))))
       [pdf-doc])

      (rum/use-effect!
       (fn []
         (let [el-outline (rum/deref *el-outline)
               cb         (fn [^js e]
                            (and (= (.-which e) 27) (set-visible! false)))]

           (js/setTimeout #(.focus el-outline))
           (.addEventListener el-outline "keyup" cb)
           #(.removeEventListener el-outline "keyup" cb)))
       [])

      [:div.extensions__pdf-outline-list-content
       {:ref       *el-outline
        :tab-index -1}
       (if (seq outline-data)
         [:section
          (map-indexed (fn [idx itm]
                         (rum/with-key
                          (pdf-outline-item
                           viewer
                           (merge itm {:parent idx})
                           {:upt-outline-node! upt-outline-node!})
                          idx))
                       outline-data)]
         [:section.is-empty "No outlines"])])))

(rum/defc pdf-highlights-list
  [^js viewer]

  (let [[active, set-active!] (rum/use-state false)]
    (rum/with-context
     [hls-state *highlights-ctx*]
     (let [hls (sort-by :page (or (seq (:initial-hls hls-state))
                                  (:latest-hls hls-state)))]

       (for [{:keys [id content properties page] :as hl} hls
             :let [goto-ref! #(pdf-assets/goto-block-ref! hl)]]
         [:div.extensions__pdf-highlights-list-item
          {:key             id
           :class           (when (= active id) "active")
           :on-click        (fn []
                              (pdf-utils/scroll-to-highlight viewer hl)
                              (set-active! id))
           :on-double-click goto-ref!}
          [:h6.flex
           [:span.flex.items-center
            [:small {:data-color (:color properties)}]
            [:strong "Page " page]]

           [:button
            {:title    (t :pdf/linked-ref)
             :on-click goto-ref!}
            (ui/icon "external-link")]]


          (if-let [img-stamp (:image content)]
            (let [fpath (pdf-assets/resolve-area-image-file
                         img-stamp (state/get-current-pdf) hl)
                  fpath (editor-handler/make-asset-url fpath)]
              [:p.area-wrap
               [:img {:src fpath}]])
            [:p.text-wrap (:text content)])])))))

(rum/defc pdf-outline-&-highlights
  [^js viewer visible? set-visible!]
  (let [*el-container        (rum/use-ref nil)
        [active-tab, set-active-tab!] (rum/use-state "contents")
        set-outline-visible! #(set-active-tab! "contents")
        contents?            (= active-tab "contents")]

    (rum/use-effect!
     (fn []
       (when-let [^js doc (resolve-own-container viewer)]
         (let [cb (fn [^js e]
                    (when-let [^js target (.-target e)]
                      (when (and
                             (not= "Outline" (.-title target))
                             (not (some-> (rum/deref *el-container) (.contains target))))
                        (set-visible! false)
                        (set-outline-visible!))))]
           (.addEventListener doc "click" cb)
           #(.removeEventListener doc "click" cb))))
     [viewer])

    [:div.extensions__pdf-outline-wrap.hls-popup-overlay
     {:class (util/classnames [{:visible visible?}])}

     [:div.extensions__pdf-outline.hls-popup-box
      {:ref       *el-container
       :tab-index -1}

      [:div.extensions__pdf-outline-tabs
       [:div.inner
        [:button {:class    (when contents? "active")
                  :on-click #(set-active-tab! "contents")} "Contents"]
        [:button {:class    (when-not contents? "active")
                  :on-click #(set-active-tab! "highlights")} "Highlights"]]]

      [:div.extensions__pdf-outline-panels
       (if contents?
         (pdf-outline viewer contents? set-outline-visible!)
         (pdf-highlights-list viewer))]]]))

(rum/defc ^:large-vars/cleanup-todo pdf-toolbar
  [^js viewer {:keys [on-external-window!]}]
  (let [[area-mode?, set-area-mode!] (use-atom *area-mode?)
        [outline-visible?, set-outline-visible!] (rum/use-state false)
        [finder-visible?, set-finder-visible!] (rum/use-state false)
        [highlight-mode?, set-highlight-mode!] (use-atom *highlight-mode?)
        [settings-visible?, set-settings-visible!] (rum/use-state false)
        *page-ref         (rum/use-ref nil)
        [current-page-num, set-current-page-num!] (rum/use-state 1)
        [total-page-num, set-total-page-num!] (rum/use-state 1)
        [viewer-theme, set-viewer-theme!] (rum/use-state (or (storage/get "ls-pdf-viewer-theme") "light"))
        group-id          (.-$groupIdentity viewer)
        in-system-window? (.-$inSystemWindow viewer)
        doc               (pdf-windows/resolve-own-document viewer)]

    ;; themes hooks
    (rum/use-effect!
     (fn []
       (when-let [^js el (some-> doc (.getElementById (str "pdf-layout-container_" group-id)))]
         (set! (. (. el -dataset) -theme) viewer-theme)
         (storage/set "ls-pdf-viewer-theme" viewer-theme)
         #(js-delete (. el -dataset) "theme")))
     [viewer-theme])

    ;; export page state
    (rum/use-effect!
     (fn []
       (when viewer
         (.dispatch (.-eventBus viewer) (name :ls-update-extra-state)
                    #js {:page current-page-num})))
     [viewer current-page-num])

    ;; pager hooks
    (rum/use-effect!
     (fn []
       (when-let [total (and viewer (.-numPages (.-pdfDocument viewer)))]
         (let [^js bus (.-eventBus viewer)
               page-fn (fn [^js evt]
                         (let [num (.-pageNumber evt)]
                           (set-current-page-num! num)))]

           (set-total-page-num! total)
           (set-current-page-num! (.-currentPageNumber viewer))
           (.on bus "pagechanging" page-fn)
           #(.off bus "pagechanging" page-fn))))
     [viewer])

    (rum/use-effect!
     (fn []
       (let [^js input (rum/deref *page-ref)]
         (set! (. input -value) current-page-num)))
     [current-page-num])

    [:div.extensions__pdf-header
     [:div.extensions__pdf-toolbar
      [:div.inner
       [:div.r.flex.buttons

        ;; appearance
        [:a.button
         {:title    "More settings"
          :on-click #(set-settings-visible! (not settings-visible?))}
         (svg/adjustments 18)]

        ;; selection
        [:a.button
         {:title    (str "Area highlight (" (if util/mac? "⌘" "Shift") ")")
          :class    (when area-mode? "is-active")
          :on-click #(set-area-mode! (not area-mode?))}
         (svg/icon-area 18)]

        [:a.button
         {:title    "Highlight mode"
          :class    (when highlight-mode? "is-active")
          :on-click #(set-highlight-mode! (not highlight-mode?))}
         (svg/highlighter 16)]

        ;; zoom
        [:a.button
         {:title    "Zoom out"
          :on-click (partial pdf-utils/zoom-out-viewer viewer)}
         (svg/zoom-out 18)]

        [:a.button
         {:title    "Zoom in"
          :on-click (partial pdf-utils/zoom-in-viewer viewer)}
         (svg/zoom-in 18)]

        [:a.button
         {:title    "Outline"
          :on-click #(set-outline-visible! (not outline-visible?))}
         (svg/view-list 16)]

        ;; search
        [:a.button
         {:title    "Search"
          :on-click #(set-finder-visible! (not finder-visible?))}
         (svg/search2 19)]

        ;; annotations
        [:a.button
         {:title    "Annotations page"
          :on-click #(pdf-assets/goto-annotations-page! (:pdf/current @state/state))}
         (svg/annotations 16)]

        ;; system window
        [:a.button
         {:title    (if in-system-window?
                      "Open in app window"
                      "Open in external window")
          :on-click #(if in-system-window?
                       (pdf-windows/exit-pdf-in-system-window! true)
                       (on-external-window!))}
         (ui/icon (if in-system-window?
                    "window-minimize"
                    "window-maximize"))]

        ;; pager
        [:div.pager.flex.items-center.ml-1

         [:span.nu.flex.items-center.opacity-70
          [:input {:ref            *page-ref
                   :type           "number"
                   :min            1
                   :max            total-page-num
                   :class          (util/classnames [{:is-long (> (util/safe-parse-int current-page-num) 999)}])
                   :default-value  current-page-num
                   :on-mouse-enter #(.select ^js (.-target %))
                   :on-key-up      (fn [^js e]
                                     (let [^js input (.-target e)
                                           value     (util/safe-parse-int (.-value input))]
                                       (set-current-page-num! value)
                                       (when (and (= (.-keyCode e) 13) value (> value 0))
                                         (->> (if (> value total-page-num) total-page-num value)
                                              (set! (. viewer -currentPageNumber))))))}]
          [:small "/ " total-page-num]]

         [:span.ct.flex.items-center
          [:a.button {:on-click #(. viewer previousPage)} (svg/up-narrow)]
          [:a.button {:on-click #(. viewer nextPage)} (svg/down-narrow)]]]

        [:a.button
         {:on-click #(if in-system-window?
                       (pdf-windows/exit-pdf-in-system-window! false)
                       (state/set-current-pdf! nil))}
         (t :close)]]]

      ;; contents outline
      (pdf-outline-&-highlights viewer outline-visible? set-outline-visible!)

      ;; finder
      (when finder-visible?
        (pdf-finder viewer {:hide-finder! #(set-finder-visible! false)}))

      ;; settings
      (when settings-visible?
        (pdf-settings
         viewer
         viewer-theme
         {:t              t
          :hide-settings! #(set-settings-visible! false)
          :select-theme!  #(set-viewer-theme! %)}))]]))
