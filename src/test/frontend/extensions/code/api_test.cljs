(ns frontend.extensions.code.api-test
  (:require ["@codemirror/state" :refer [EditorState]]
            [cljs.test :refer [async deftest is testing]]
            [frontend.extensions.code :as code-editor]
            [frontend.extensions.code.editor :as code-editor-view]
            [frontend.extensions.code.api :as api]))

(defn- noop [& _])

(deftest enhancer-payload-exposes-versioned-cm6-contract
  (let [payload (api/make-enhancer-payload
                 {:editor-id "editor-1"
                  :view {:cm6-view true}
                  :dispatch! noop
                  :language {:id :clojure
                             :names #{"clojure" "clj"}
                             :source :nextjournal
                             :package "@nextjournal/lezer-clojure"
                             :entry :parser}
                  :register-extension! noop
                  :register-language! noop
                  :get-language (constantly nil)})
        js-payload (api/enhancer-payload->js payload)]
    (is (= 1 (:api-version payload)))
    (is (contains? (:capabilities payload) :code-editor/cm6))
    (is (contains? (:capabilities payload) :code-editor/extensions))
    (is (contains? (:capabilities payload) :code-editor/language-registry))
    (is (= "editor-1" (:editor-id payload)))
    (is (true? (api/valid-enhancer-payload? payload)))
    (is (= 1 (.-apiVersion js-payload)))
    (is (= "codemirror-6" (.-enhancerType js-payload)))
    (is (= #{"code-editor/cm6"
             "code-editor/extensions"
             "code-editor/language-registry"}
           (set (js->clj (.-capabilities js-payload)))))
    (is (= "editor-1" (.-editorId js-payload)))
    (is (= "clojure" (.. js-payload -language -id)))
    (is (fn? (.-dispatch js-payload)))
    (is (fn? (.-registerExtension js-payload)))
    (is (fn? (.-registerLanguage js-payload)))
    (is (fn? (.-getLanguage js-payload)))))

(deftest enhancer-payload-rejects-cm5-shaped-integrations
  (testing "CM6 plugins must receive a versioned host API, not window.CodeMirror"
    (is (false? (api/valid-enhancer-payload? js/window.CodeMirror)))
    (is (false? (api/valid-enhancer-payload?
                 {:CodeMirror js/window.CodeMirror})))
    (is (false? (api/valid-enhancer-payload?
                 {:api-version 1
                  :capabilities #{:code-editor/cm6}
                  :register-extension! noop})))))

(deftest code-editor-context-exposes-controlled-entrypoints
  (testing "The CM6 context module loads without exposing a CM5 editor object"
    (is (fn? code-editor-view/create-context!))
    (is (fn? code-editor/get-value))
    (is (fn? code-editor/set-value!))
    (is (fn? code-editor/set-selection-by-offset!))
    (is (fn? code-editor/destroy!))
    (is (fn? code-editor-view/render!))))

(deftest line-ch-and-offset-conversions-use-cm6-document-offsets
  (let [state (EditorState.create #js {:doc "abc\nxy"})
        context {:view #js {:state state}}]
    (is (= 0 (code-editor/line-ch->offset context {:line 0 :ch 0})))
    (is (= 2 (code-editor/line-ch->offset context {:line 0 :ch 2})))
    (is (= 4 (code-editor/line-ch->offset context {:line 1 :ch 0})))
    (is (= 6 (code-editor/line-ch->offset context {:line 1 :ch 10})))
    (is (= {:line 1 :ch 1} (code-editor/offset->line-ch context 5)))))

(deftest context-default-value-tracks-save-baseline-without-textarea
  (let [context {:*state (atom {:default-value "old"})}]
    (is (= "old" (code-editor/default-value context)))
    (is (identical? context (code-editor/set-default-value! context "new")))
    (is (= "new" (code-editor/default-value context)))))

(deftest change-listeners-are-removable
  (let [listener (fn [_value])
        context {:*state (atom {:change-listeners {}})}
        remove! (code-editor/add-change-listener! context listener)
        listener-id (ffirst (:change-listeners @(:*state context)))]
    (is (= listener (get-in @(:*state context) [:change-listeners listener-id])))
    (remove!)
    (is (empty? (:change-listeners @(:*state context))))))

(deftest cm6-enhancers-can-register-extensions-through-versioned-payload
  (let [context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}
        calls (atom [])]
    (is (identical?
         context
         (code-editor-view/apply-enhancers!
          context
          [{:key :plugin-a
            :enhancer (fn [^js payload]
                        (swap! calls conj {:api-version (.-apiVersion payload)
                                           :enhancer-type (.-enhancerType payload)
                                           :editor-id (.-editorId payload)})
                        ((.-registerExtension payload) "plugin-a/keymap" [:extension]))}])))
    (is (= [{:api-version 1
             :enhancer-type "codemirror-6"
             :editor-id "editor-1"}]
           @calls))
    (is (= [:extension]
           (get-in @(:*state context) [:plugin-extensions "plugin-a/keymap"])))))

(deftest cm6-enhancers-can-register-extension-factories
  (let [context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}
        calls (atom [])]
    (code-editor-view/apply-enhancers!
     context
     [{:key :plugin-a
       :enhancer (fn [^js payload]
                   ((.-registerExtension payload)
                    "plugin-a/factory"
                    (fn [^js factory-context]
                      (swap! calls conj (.-editorId factory-context))
                      [:factory-extension])))}])
    (is (= ["editor-1"] @calls))
    (is (= [:factory-extension]
           (get-in @(:*state context) [:plugin-extensions "plugin-a/factory"])))))

(deftest cm6-enhancers-can-register-js-language-descriptors
  (let [support #js {:opaque "language-support-instance"}
        context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}
        calls (atom [])]
    (code-editor-view/apply-enhancers!
     context
     [{:key :plugin-a
       :enhancer (fn [^js payload]
                   ((.-registerLanguage payload)
                    #js {:id "racket"
                         :names #js ["racket" "rkt"]
                         :source "plugin"
                         :extensions #js ["rkt"]
                         :support support})
                   (let [^js language ((.-getLanguage payload) "rkt")]
                     (swap! calls conj (.-id language))))}])
    (is (= ["racket"] @calls))
    (let [descriptor (get-in @(:*state context) [:plugin-languages :racket])]
      (is (= {:id :racket
              :names #{"racket" "rkt"}
              :source :plugin
              :extensions #{"rkt"}}
             (dissoc descriptor :support)))
      (is (identical? support (:support descriptor))))))

(deftest cm6-enhancers-cannot-register-unresolvable-language-descriptors
  ;; native/legacy descriptors only carry package metadata for the statically
  ;; generated built-in table — they would register successfully but install
  ;; no parser at runtime.
  (let [context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}]
    (doseq [source ["legacy" "native" "nextjournal"]]
      (is (thrown? js/Error
                   (code-editor-view/apply-enhancers!
                    context
                    [{:key :plugin-a
                      :enhancer (fn [^js payload]
                                  ((.-registerLanguage payload)
                                   #js {:id "racket"
                                        :names #js ["racket"]
                                        :source source
                                        :package "@codemirror/legacy-modes"
                                        :entry "scheme"}))}]))
          (str source " descriptors cannot be resolved at runtime")))
    (is (empty? (:plugin-languages @(:*state context))))))

(deftest cm6-plugin-language-descriptors-keep-opaque-support-and-load
  (let [support #js {:opaque "language-support-instance"}
        load (fn [_descriptor] support)
        context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}]
    (code-editor-view/apply-enhancers!
     context
     [{:key :plugin-a
       :enhancer (fn [^js payload]
                   ((.-registerLanguage payload)
                    #js {:id "mydsl"
                         :names #js ["mydsl"]
                         :source "plugin"
                         :support support
                         :load load}))}])
    (let [descriptor (get-in @(:*state context) [:plugin-languages :mydsl])]
      (is (= :plugin (:source descriptor)))
      (is (identical? support (:support descriptor))
          "opaque support instance survives normalization untouched")
      (is (identical? load (:load descriptor))))
    (is (thrown? js/Error
                 ((fn []
                    (code-editor-view/apply-enhancers!
                     {:editor-id "editor-1"
                      :view #js {}
                      :*state (atom {:plugin-extensions {}
                                     :plugin-languages {}})}
                     [{:key :plugin-b
                       :enhancer (fn [^js payload]
                                   ((.-registerLanguage payload)
                                    #js {:id "badlang"
                                         :names #js ["badlang"]
                                         :source "plugin"}))}]))))
        "plugin source requires :support or :load")))

(deftest registering-the-requested-language-re-resolves-the-editor
  (let [support #js {:opaque "plugin-language-support"}
        dispatched (atom [])
        plain-text {:id :plain-text :source :plain-text}
        context {:editor-id "editor-1"
                 :view #js {:dispatch (fn [tx] (swap! dispatched conj tx))
                            :state #js {}}
                 :language-compartment #js {:reconfigure (fn [extension] extension)}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}
                                :language plain-text
                                :requested-language-name "mydsl"})}]
    (code-editor-view/apply-enhancers!
     context
     [{:key :plugin-a
       :enhancer (fn [^js payload]
                   ((.-registerLanguage payload)
                    #js {:id "mydsl"
                         :names #js ["mydsl"]
                         :source "plugin"
                         :support support}))}])
    (let [language (:language @(:*state context))]
      (is (= :mydsl (:id language))
          "the fence language is re-resolved once its descriptor is registered")
      (is (identical? support (:support language)))
      (is (some #(identical? support (aget (.-effects ^js %) 0)) @dispatched)
          "plugin support is reconfigured onto the language compartment"))))

(deftest plugin-language-load-does-not-clobber-newer-selection
  (async done
         (let [loaded-ext #js {:opaque "loaded-extension"}
               dispatched (atom [])
               descriptor-a {:id :lang-a
                             :names #{"lang-a"}
                             :source :plugin
                             :load (fn [_] (js/Promise.resolve loaded-ext))}
               descriptor-b {:id :lang-b :names #{"lang-b"} :source :plain-text}
               context {:editor-id "editor-1"
                        :view #js {:dispatch (fn [tx] (swap! dispatched conj tx))
                                   :state #js {}}
                        :language-compartment #js {:reconfigure (fn [extension] extension)}
                        :*state (atom {:plugin-extensions {}
                                       :plugin-languages {:lang-a descriptor-a
                                                          :lang-b descriptor-b}
                                       :language {:id :plain-text :source :plain-text}
                                       :requested-language-name "lang-a"})}]
           (code-editor/set-language! context "lang-a")
           ;; The user picks another language before lang-a's :load settles.
           (code-editor/set-language! context "lang-b")
           (-> (js/Promise.resolve nil)
               (.then (fn [_] (js/Promise.resolve nil)))
               (.then (fn [_]
                        (is (= :lang-b (:id (:language @(:*state context)))))
                        (is (not-any? #(identical? loaded-ext (aget (.-effects ^js %) 0)) @dispatched)
                            "a stale load result is not reconfigured")
                        (done)))
               (.catch done)))))

(deftest plugin-language-load-reconfigures-while-selected
  (async done
         (let [loaded-ext #js {:opaque "loaded-extension"}
               dispatched (atom [])
               descriptor {:id :lang-a
                           :names #{"lang-a"}
                           :source :plugin
                           :load (fn [_] (js/Promise.resolve loaded-ext))}
               context {:editor-id "editor-1"
                        :view #js {:dispatch (fn [tx] (swap! dispatched conj tx))
                                   :state #js {}}
                        :language-compartment #js {:reconfigure (fn [extension] extension)}
                        :*state (atom {:plugin-extensions {}
                                       :plugin-languages {:lang-a descriptor}
                                       :language {:id :plain-text :source :plain-text}
                                       :requested-language-name "lang-a"})}]
           (code-editor/set-language! context "lang-a")
           (-> (js/Promise.resolve nil)
               (.then (fn [_] (js/Promise.resolve nil)))
               (.then (fn [_]
                        (is (some #(identical? loaded-ext (aget (.-effects ^js %) 0)) @dispatched)
                            "settled load result is reconfigured while selected")
                        (done)))
               (.catch done)))))

(deftest cm6-enhancers-reject-legacy-cm5-enhancer-type
  (let [legacy-called? (atom false)
        context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}]
    (is (identical?
         context
         (code-editor-view/apply-enhancers!
          context
          [{:key :legacy-plugin
            :type api/legacy-enhancer-type
            :enhancer (fn [_payload]
                        (reset! legacy-called? true))}])))
    (is (false? @legacy-called?))
    (is (empty? (:plugin-extensions @(:*state context))))))

(deftest user-options-are-limited-to-cm6-supported-contract
  (is (= {:line-wrapping? true
          :line-numbers? false}
         (api/sanitize-user-options
          {:line-wrapping? true
           :line-numbers? false})))
  (is (= {:line-wrapping? true}
         (api/sanitize-user-options
          {:line-wrapping? true
           :lineNumbers true
           :read-only? true
           :tab-size 2
           :unknown-option true}))))
