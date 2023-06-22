(ns frontend.components.shortcut
  (:require [clojure.string :as str]
            [frontend.context.i18n :refer [t]]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.highlight :as highlight]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]
            [rum.core :as rum]))

(rum/defcs customize-shortcut-dialog-inner <
  (rum/local "")
  (rum/local nil :rum/action)
  (shortcut/record!)
  [state k action-name current-binding]
  (let [*keypress         (:rum/local state)
        *action           (:rum/action state)
        keypressed?       (not= "" @*keypress)
        keyboard-shortcut (if-not keypressed? current-binding @*keypress)]
    [:<>
     [:div.sm:w-lsm
      [:p.mb-4 "Press any sequence of keys to set the shortcut for the " [:b action-name] " action."]
      [:p.mb-4.mt-4
       (ui/render-keyboard-shortcut (-> keyboard-shortcut
                                        (str/trim)
                                        (str/lower-case)
                                        (str/split  #" |\+")))
       " "
       (when keypressed?
         [:a.text-sm
          {:style    {:margin-left "12px"}
           :on-click (fn []
                       (dh/remove-shortcut k)
                       (shortcut/refresh!)
                       (swap! *keypress (constantly ""))          ;; Clear local state
                       )}
          "Reset"])]]
     [:div.cancel-save-buttons.text-right.mt-4
      (ui/button "Save" :on-click (fn []
                                    (reset! *action :save)
                                    (state/close-modal!)))
      [:a.ml-4
       {:on-click (fn []
                    (reset! *keypress (dh/binding-for-storage current-binding))
                    (reset! *action :cancel)
                    (state/close-modal!))} "Cancel"]]]))

(defn customize-shortcut-dialog [k action-name displayed-binding]
  (fn [_]
    (customize-shortcut-dialog-inner k action-name displayed-binding)))

(rum/defc shortcut-col [_category k binding configurable? action-name]
  (let [conflict?         (dh/potential-conflict? k)
        displayed-binding (dh/binding-for-display k binding)
        disabled?         (str/includes? displayed-binding "system default")]
    (if (not configurable?)
      [:td.text-right displayed-binding]
      [:td.text-right
       (ui/button
        displayed-binding
        :class "text-sm p-1"
        :style {:cursor (if disabled? "not-allowed" "pointer")}
        :title (if conflict?
                 "Shortcut conflict!"
                 (if disabled? "Cannot override system default" "Click to modify"))
        :background (if conflict? "pink" (when disabled? "gray"))
        :on-click (when-not disabled?
                    #(state/set-sub-modal!
                       (customize-shortcut-dialog k action-name displayed-binding)
                       {:center? true})))])))

(rum/defcs shortcut-table
  < rum/reactive
    (rum/local true ::folded?)
    {:will-mount (fn [state]
                   (let [name (first (:rum/args state))]
                     (cond-> state
                             (contains? #{:shortcut.category/basics}
                                        name)
                             (-> ::folded? (reset! false) (do state)))))}
  [state category configurable?]
  (let [*folded? (::folded? state)
        plugin?  (= category :shortcut.category/plugins)
        _        (state/sub [:config (state/get-current-repo) :shortcuts])]
    [:div.cp__shortcut-table-wrap
     [:a.fold
      {:on-click #(reset! *folded? (not @*folded?))}
      (ui/icon (if @*folded? "chevron-left" "chevron-down"))]
     [:table
      [:thead
       [:tr
        [:th.text-left [:b (t category)]]
        [:th.text-right]]]
      (when-not @*folded?
        [:tbody
         (map (fn [[k {:keys [binding]}]]
                (let [cmd   (dh/shortcut-cmd k)
                      label (cond
                              (string? (:desc cmd))
                              [:<>
                               [:code.text-xs (namespace k)]
                               [:small.pl-1 (:desc cmd)]]

                              (not plugin?) (-> k (dh/decorate-namespace) (t))
                              :else (str k))]
                  [:tr {:key (str k)}
                   [:td.text-left.flex.items-center label]
                   (shortcut-col category k binding configurable? label)]))
              (dh/binding-by-category category))])]]))

(rum/defc trigger-table []
  [:table
   [:thead
    [:tr
     [:th.text-left [:b (t :help/shortcuts-triggers)]]
     [:th.text-right [:b (t :help/shortcut)]]]]
   [:tbody
    [:tr
     [:td.text-left (t :help/slash-autocomplete)]
     [:td.text-right [:code "/"]]]
    [:tr
     [:td.text-left (t :help/block-content-autocomplete)]
     [:td.text-right [:code "<"]]]
    [:tr
     [:td.text-left (t :help/reference-autocomplete)]
     [:td.text-right [:code page-ref/left-and-right-brackets]]]
    [:tr
     [:td.text-left (t :help/block-reference)]
     [:td.text-right [:code block-ref/left-and-right-parens]]]
    [:tr
     [:td.text-left (t :help/open-link-in-sidebar)]
     [:td.text-right (ui/render-keyboard-shortcut ["shift" "click"])]]
    [:tr
     [:td.text-left (t :help/context-menu)]
     [:td.text-right (ui/render-keyboard-shortcut ["right" "click"])]]]])

(defn markdown-and-orgmode-syntax []
  (let [list [:bold :italics :del :mark :latex :code :link :pre :img]

        preferred-format (state/get-preferred-format) ; markdown/org

        title (case preferred-format
                :markdown (t :help/markdown-syntax)
                :org (t :help/org-mode-syntax))

        learn-more (case preferred-format
                     :markdown "https://www.markdownguide.org/basic-syntax"
                     :org "https://orgmode.org/worg/dev/org-syntax.html")

        raw (case preferred-format
              :markdown {:bold (str "**" (t :bold) "**")
                         :italics (str "_" (t :italics) "_")
                         :link "[Link](https://www.example.com)"
                         :del (str "~~" (t :strikethrough) "~~")
                         :mark (str "^^" (t :highlight) "^^")
                         :latex "$$E = mc^2$$"
                         :code (str "`" (t :code) "`")
                         :pre "```clojure\n  (println \"Hello world!\")\n```"
                         :img "![image](https://asset.logseq.com/static/img/logo.png)"}
              :org {:bold (str "*" (t :bold) "*")
                    :italics (str "/" (t :italics) "/")
                    :del (str "+" (t :strikethrough) "+")
                    :pre [:pre "#+BEGIN_SRC clojure\n  (println \"Hello world!\")\n#+END_SRC"]
                    :link "[[https://www.example.com][Link]]"
                    :mark (str "^^" (t :highlight) "^^")
                    :latex "$$E = mc^2$$"
                    :code "~Code~"
                    :img "[[https://asset.logseq.com/static/img/logo.png][image]]"})

        rendered {:italics [:i (t :italics)]
                  :bold [:b (t :bold)]
                  :link [:a {:href "https://www.example.com"} "Link"]
                  :del [:del (t :strikethrough)]
                  :mark [:mark (t :highlight)]
                  :latex (latex/latex "help-latex" "E = mc^2" true false)
                  :code [:code (t :code)]
                  :pre (highlight/highlight "help-highlight" {:data-lang "clojure"} "(println \"Hello world!\")")
                  :img [:img {:style {:float "right" :width 32 :height 32}
                              :src "https://asset.logseq.com/static/img/logo.png"
                              :alt "image"}]}]

    [:table
     [:thead
      [:tr
       [:th.text-left [:b title]]
       [:th.text-right [:a {:href learn-more} "Learn more →"]]]]
     [:tbody
      (map (fn [name]
             [:tr
              [:td.text-left [(if (= :pre name) :pre :code) (get raw name)]]
              [:td.text-right (get rendered name)]])
        list)]]))

(rum/defc keymap-tables
  []
  [:div.cp__keymap-tables
   (shortcut-table :shortcut.category/basics true)
   (shortcut-table :shortcut.category/navigating true)
   (shortcut-table :shortcut.category/block-editing true)
   (shortcut-table :shortcut.category/block-command-editing true)
   (shortcut-table :shortcut.category/block-selection true)
   (shortcut-table :shortcut.category/formatting true)
   (shortcut-table :shortcut.category/toggle true)
   (when (state/enable-whiteboards?) (shortcut-table :shortcut.category/whiteboard true))
   (shortcut-table :shortcut.category/plugins true)
   (shortcut-table :shortcut.category/others true)])

(rum/defc keymap-pane
  []
  (let [[ready?, set-ready!] (rum/use-state false)]
    (rum/use-effect!
      (fn [] (js/setTimeout #(set-ready! true) 32))
      [])

    [:div.cp__keymap-pane
     [:h1.pb-2.text-3xl.pt-2 "Keymap"]
     (if ready?
       (keymap-tables)
       [:p.flex.justify-center.py-20 (ui/loading "")])]))

(rum/defc shortcut-page
  [{:keys [show-title?]
    :or {show-title? true}}]
  [:div.cp__shortcut-page
   (when show-title? [:h1.title (t :help/shortcut-page-title)])
   (trigger-table)
   (markdown-and-orgmode-syntax)
   (keymap-tables)])
