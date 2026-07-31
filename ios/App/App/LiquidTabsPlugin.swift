import Foundation
import Capacitor
import SwiftUI
import UIKit
import WebKit

@objc(LiquidTabsPlugin)
public class LiquidTabsPlugin: CAPPlugin, CAPBridgedPlugin {
    // So SwiftUI can notify JS
    static weak var shared: LiquidTabsPlugin?
    private static let maxPhoneContentTabs = 4

    private let store = LiquidTabsStore.shared
    private var keyboardHackScriptInstalled = false
    private let keyboardHackHandlerName = "keyboardHackKey"

    public let identifier = "LiquidTabsPlugin"
    public let jsName = "LiquidTabsPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
      CAPPluginMethod(name: "configureTabs", returnType: CAPPluginReturnPromise),
      CAPPluginMethod(name: "selectTab", returnType: CAPPluginReturnPromise),
      CAPPluginMethod(name: "updateNativeSearchResults", returnType: CAPPluginReturnPromise),
      CAPPluginMethod(name: "updateNativeGraphs", returnType: CAPPluginReturnPromise),
      CAPPluginMethod(name: "markTabContentReady", returnType: CAPPluginReturnPromise),
    ]

    public override func load() {
        super.load()
        LiquidTabsPlugin.shared = self
        installKeyboardHackScript()
    }

    private static func visibleContentTabs(_ tabs: [LiquidTab]) -> [LiquidTab] {
        guard UIDevice.current.userInterfaceIdiom == .phone else {
            return tabs
        }

        return Array(tabs.prefix(maxPhoneContentTabs))
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

            let rawSystemImage = dict["systemImage"] as? String ?? "square"

            let systemImage: String = {
                if UIImage(systemName: rawSystemImage) != nil {
                    return rawSystemImage
                } else {
                    return "square"
                }
            }()

            let roleStr = dict["role"] as? String ?? "normal"
            let role: LiquidTab.Role = (roleStr == "search") ? .search : .normal

            return LiquidTab(id: id, title: title, systemImage: systemImage, role: role)
        }

        DispatchQueue.main.async {
            let selectedId = self.store.selectedId
            let visibleTabs = Self.visibleContentTabs(tabs)
            self.store.tabs = visibleTabs
            if let selectedId = selectedId,
               selectedId == "search" || visibleTabs.contains(where: { $0.id == selectedId }) {
                self.store.selectedId = selectedId
            } else {
                self.store.selectedId = visibleTabs.first?.id
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

    /// Update native search results list from JS.
    /// { results: [{ id, title, subtitle? }] }
    @objc func updateNativeSearchResults(_ call: CAPPluginCall) {
        guard let resultDicts = call.getArray("results", JSObject.self) else {
            call.reject("Missing 'results'")
            return
        }

        let mapped: [NativeSearchResult] = resultDicts.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let title = dict["title"] as? String else {
                return nil
            }
            let subtitle = dict["subtitle"] as? String
            return NativeSearchResult(id: id, title: title, subtitle: subtitle)
        }

        store.updateSearchResults(mapped)
        call.resolve()
    }

    // MARK: - Events to JS

    func notifyTabSelected(id: String, reselected: Bool = false) {
        notifyListeners("tabSelected", data: ["id": id, "reselected": reselected])
    }

    func notifySearchChanged(query: String) {
        notifyListeners("searchChanged", data: ["query": query])
    }

    func notifyKeyboardHackKey(key: String) {
        notifyListeners("keyboardHackKey", data: ["key": key])
    }

    func openResult(id: String, nativePush: Bool = true) {
        notifyListeners("openSearchResultBlock", data: [
            "id": id,
            "nativePush": nativePush
        ])
    }

    /// Update native graph list from JS.
    /// { sections: [{ id, title, refreshable?, graphs: [...] }], labels: { refresh, preparing, downloading }, refreshing? }
    @objc func updateNativeGraphs(_ call: CAPPluginCall) {
        guard let sectionDicts = call.getArray("sections", JSObject.self) else {
            call.reject("Missing 'sections'")
            return
        }

        let labelDict = call.getObject("labels") ?? [:]
        let labels = NativeGraphLabels(
            refresh: labelDict["refresh"] as? String ?? "",
            preparing: labelDict["preparing"] as? String ?? "",
            downloading: labelDict["downloading"] as? String ?? ""
        )

        let sections: [NativeGraphSection] = sectionDicts.compactMap { sectionDict in
            guard let id = sectionDict["id"] as? String,
                  let title = sectionDict["title"] as? String else {
                return nil
            }

            let graphDicts = sectionDict["graphs"] as? [[String: Any]] ?? []
            let graphs: [NativeGraphItem] = graphDicts.compactMap { graphDict in
                guard let itemId = graphDict["id"] as? String,
                      let displayName = graphDict["displayName"] as? String else {
                    return nil
                }

                let actionDicts = graphDict["actions"] as? [[String: Any]] ?? []
                let actions: [NativeGraphAction] = actionDicts.compactMap { actionDict in
                    guard let id = actionDict["id"] as? String,
                          let title = actionDict["title"] as? String,
                          let confirmTitle = actionDict["confirmTitle"] as? String,
                          let confirmMessage = actionDict["confirmMessage"] as? String,
                          let confirmButton = actionDict["confirmButton"] as? String,
                          let cancelButton = actionDict["cancelButton"] as? String else {
                        return nil
                    }

                    return NativeGraphAction(
                        id: id,
                        title: title,
                        destructive: actionDict["destructive"] as? Bool ?? false,
                        confirmTitle: confirmTitle,
                        confirmMessage: confirmMessage,
                        confirmButton: confirmButton,
                        cancelButton: cancelButton
                    )
                }

                return NativeGraphItem(
                    id: itemId,
                    url: graphDict["url"] as? String,
                    displayName: displayName,
                    subtitle: graphDict["subtitle"] as? String,
                    remote: graphDict["remote"] as? Bool ?? false,
                    local: graphDict["local"] as? Bool ?? false,
                    readyForUse: graphDict["readyForUse"] as? Bool ?? true,
                    downloading: graphDict["downloading"] as? Bool ?? false,
                    e2ee: graphDict["e2ee"] as? Bool ?? false,
                    graphName: graphDict["graphName"] as? String,
                    graphUUID: graphDict["graphUUID"] as? String,
                    graphSchemaVersion: graphDict["graphSchemaVersion"] as? String,
                    actions: actions
                )
            }

            return NativeGraphSection(
                id: id,
                title: title,
                refreshable: sectionDict["refreshable"] as? Bool ?? false,
                graphs: graphs
            )
        }

        store.updateGraphs(
            sections: sections,
            labels: labels,
            visible: call.getBool("visible"),
            refreshing: call.getBool("refreshing")
        )
        call.resolve()
    }

    /// Clear the native transition cover after JS has rendered a WebView-backed tab.
    /// { id: string }
    @objc func markTabContentReady(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Missing 'id'")
            return
        }

        store.markWebTabReady(id)
        call.resolve()
    }

    func openGraph(_ graph: NativeGraphItem) {
        notifyListeners("nativeGraphAction", data: [
            "action": "open",
            "url": graph.url ?? ""
        ])
    }

    func downloadGraph(_ graph: NativeGraphItem) {
        notifyListeners("nativeGraphAction", data: [
            "action": "download",
            "graphName": graph.graphName ?? "",
            "graphUUID": graph.graphUUID ?? "",
            "graphSchemaVersion": graph.graphSchemaVersion ?? "",
            "graphE2ee": graph.e2ee
        ])
    }

    func refreshGraphs() {
        store.startGraphRefresh()
        notifyListeners("nativeGraphAction", data: ["action": "refresh"])
    }

    func performGraphAction(_ action: NativeGraphAction, graph: NativeGraphItem) {
        notifyListeners("nativeGraphAction", data: [
            "action": action.id,
            "url": graph.url ?? "",
            "graphName": graph.graphName ?? "",
            "graphUUID": graph.graphUUID ?? "",
            "graphSchemaVersion": graph.graphSchemaVersion ?? "",
            "graphE2ee": graph.e2ee
        ])
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
