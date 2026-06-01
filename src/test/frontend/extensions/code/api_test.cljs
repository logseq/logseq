(ns frontend.extensions.code.api-test
  (:require ["@codemirror/state" :refer [EditorState]]
            [cljs.test :refer [deftest is testing]]
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
                             :package "@nextjournal/lang-clojure"
                             :entry :clojure}
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

(deftest cm5-option-audit-marks-options-that-need-adapters
  (let [options {:lineNumbers true
                 :matchBrackets true
                 :theme "solarized dark"
                 :readOnly false
                 :autoCloseBrackets true
                 :extraKeys {"Ctrl-Space" "autocomplete"}}]
    (is (= #{:autoCloseBrackets
             :extraKeys
             :lineNumbers
             :matchBrackets
             :readOnly
             :theme}
           (api/cm5-option-keys options)))))

(deftest code-editor-context-exposes-controlled-entrypoints
  (testing "The CM6 context module loads without exposing a CM5 editor object"
    (is (fn? code-editor/create-context!))
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
         (code-editor/apply-enhancers!
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
    (code-editor/apply-enhancers!
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
  (let [context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}
        calls (atom [])]
    (code-editor/apply-enhancers!
     context
     [{:key :plugin-a
       :enhancer (fn [^js payload]
                   ((.-registerLanguage payload)
                    #js {:id "racket"
                         :names #js ["racket" "rkt"]
                         :source "legacy"
                         :extensions #js ["rkt"]
                         :package "@codemirror/legacy-modes"
                         :entry "scheme"})
                   (let [^js language ((.-getLanguage payload) "rkt")]
                     (swap! calls conj (.-id language))))}])
    (is (= ["racket"] @calls))
    (is (= {:id :racket
            :names #{"racket" "rkt"}
            :source :legacy
            :extensions #{"rkt"}
            :package "@codemirror/legacy-modes"
            :entry :scheme}
           (get-in @(:*state context) [:plugin-languages :racket])))))

(deftest cm6-enhancers-reject-legacy-cm5-enhancer-type
  (let [legacy-called? (atom false)
        context {:editor-id "editor-1"
                 :view #js {}
                 :*state (atom {:plugin-extensions {}
                                :plugin-languages {}})}]
    (is (identical?
         context
         (code-editor/apply-enhancers!
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
         (api/validate-user-options!
          {:line-wrapping? true
           :line-numbers? false})))
  (is (thrown-with-msg?
       js/Error
       #"Unsupported CodeMirror 5 option"
       (api/validate-user-options! {:lineNumbers true})))
  (is (thrown-with-msg?
       js/Error
       #"Unsupported CodeMirror option"
       (api/validate-user-options! {:read-only? true})))
  (is (thrown-with-msg?
       js/Error
       #"Unsupported CodeMirror option"
       (api/validate-user-options! {:tab-size 2})))
  (is (thrown-with-msg?
       js/Error
       #"Unsupported CodeMirror option"
       (api/validate-user-options! {:unknown-option true}))))
