import Foundation
import Capacitor
import SwiftUI
import WebKit

@objc(LiquidTabsPlugin)
public class LiquidTabsPlugin: CAPPlugin, CAPBridgedPlugin {
    // So SwiftUI can notify JS
    static weak var shared: LiquidTabsPlugin?

    private let store = LiquidTabsStore.shared
    private var keyboardHackScriptInstalled = false
    private let keyboardHackHandlerName = "keyboardHackKey"

    public let identifier = "LiquidTabsPlugin"
    public let jsName = "LiquidTabsPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
      CAPPluginMethod(name: "configureTabs", returnType: CAPPluginReturnPromise),
      CAPPluginMethod(name: "selectTab", returnType: CAPPluginReturnPromise)
    ]

    public override func load() {
        super.load()
        LiquidTabsPlugin.shared = self
        installKeyboardHackScript()
    }

    // MARK: - Methods from JS

    /// Configure tabs from JS.
    /// Expected args:
    /// { tabs: [{ id, title, systemImage, role }] }
    @objc func configureTabs(_ call: CAPPluginCall) {
        guard let tabsArray = call.getArray("tabs") as? [[String: Any]] else {
            call.reject("Missing 'tabs'")
            return
        }

        let tabs: [LiquidTab] = tabsArray.compactMap { dict in
            guard
                let id = dict["id"] as? String,
                let title = dict["title"] as? String
            else { return nil }

            let systemImage = dict["systemImage"] as? String ?? "square"
            let roleStr = dict["role"] as? String ?? "normal"
            let role: LiquidTab.Role = (roleStr == "search") ? .search : .normal

            return LiquidTab(id: id, title: title, systemImage: systemImage, role: role)
        }

        DispatchQueue.main.async {
            self.store.tabs = tabs
            if let firstId = tabs.first?.id {
                self.store.selectedId = firstId
            }
        }

        call.resolve()
    }

    /// Programmatically select a tab by id.
    /// { id: string }
    @objc func selectTab(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing 'id'")
            return
        }

        DispatchQueue.main.async {
            self.store.selectedId = id
        }

        call.resolve()
    }

    // MARK: - Events to JS

    func notifyTabSelected(id: String) {
        notifyListeners("tabSelected", data: ["id": id])
    }

    func notifySearchChanged(query: String) {
        notifyListeners("searchChanged", data: ["query": query])
    }

    func notifyKeyboardHackKey(key: String) {
        notifyListeners("keyboardHackKey", data: ["key": key])
    }

    private func installKeyboardHackScript() {
        guard !keyboardHackScriptInstalled,
              let controller = bridge?.webView?.configuration.userContentController else {
            return
        }

        keyboardHackScriptInstalled = true
        controller.removeScriptMessageHandler(forName: keyboardHackHandlerName)
        controller.add(self, name: keyboardHackHandlerName)

        let source = """
        (function() {
          if (window.__logseqKeyboardHackInstalled) return;
          window.__logseqKeyboardHackInstalled = true;
          window.addEventListener('keydown', function(e) {
            var k = null;
            switch (e.key) {
              case 'Backspace':
                k = 'backspace';
                break;
              case 'Enter':
              case 'Return':
                k = 'enter';
                break;
              default:
                if (e.keyCode === 8) k = 'backspace';
                else if (e.keyCode === 13) k = 'enter';
                break;
            }
            if (!k) return;
            try {
              window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.\(keyboardHackHandlerName).postMessage({ key: k });
            } catch (_) {}
          }, true);
        })();
        """

        let script = WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        controller.addUserScript(script)
    }
}

extension LiquidTabsPlugin: WKScriptMessageHandler {
    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == keyboardHackHandlerName else { return }

        if let body = message.body as? [String: Any],
           let key = body["key"] as? String {
            notifyKeyboardHackKey(key: key)
        }
    }
}
