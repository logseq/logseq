import UIKit
import Capacitor
import Intents
import SwiftUI

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UINavigationControllerDelegate {

    var window: UIWindow?
    var navController: UINavigationController?
    private var pathStack: [String] = ["/"]
    private var ignoreRoutePopCount = 0
    private lazy var navigationSwipeGesture: UISwipeGestureRecognizer = {
        let gesture = UISwipeGestureRecognizer(target: self, action: #selector(handleNavigationSwipe(_:)))
        gesture.direction = .right // allow back/open without edge-only gesture
        gesture.cancelsTouchesInView = false
        return gesture
    }()
    private lazy var sidebarCloseGesture: UISwipeGestureRecognizer = {
        let gesture = UISwipeGestureRecognizer(target: self, action: #selector(handleSidebarCloseSwipe(_:)))
        gesture.direction = .left // right-to-left swipe to close
        gesture.cancelsTouchesInView = false
        return gesture
    }()

    private func isOnFirstTab() -> Bool {
        let store = LiquidTabsStore.shared
        guard let firstId = store.tabs.first?.id,
              let selectedId = store.effectiveSelectedId() else {
            return false
        }
        return firstId == selectedId
    }

    private func isNavigationStackEmpty() -> Bool {
        if let nav = navController {
            return nav.viewControllers.count <= 1
        }
        return pathStack.count <= 1
    }

    private func shouldAllowSidebarOpen(_ path: String) -> Bool {
        guard path == "/left-sidebar" else { return true }
        return isOnFirstTab() && isNavigationStackEmpty()
    }

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        if let shortcutItem = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            DispatchQueue.main.async {
                _ = self.handleShortcutItem(shortcutItem)
            }
        }
        return true
    }

    func application(_ application: UIApplication,
                     performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        let handled = handleShortcutItem(shortcutItem)
        completionHandler(handled)
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }

    func application(_ application: UIApplication,
                     didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // no-op, unless you want to clean anything up
    }

    private func handleShortcutItem(_ shortcutItem: UIApplicationShortcutItem) -> Bool {
        switch shortcutItem.type {
        case "logseq.quickadd":
            donateQuickAddShortcut()
            openURL("logseq://mobile/go/quick-add")
            return true
        case "logseq.voice":
            donateAudioShortcut()
            openURL("logseq://mobile/go/audio")
            return true
        default:
            return false
        }
    }

    func application(_ application: UIApplication,
                 continue userActivity: NSUserActivity,
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {

        // Case 1: custom NSUserActivities
        if userActivity.activityType == "com.logseq.quickadd" {
            openURL("logseq://mobile/go/quick-add")
            return true
        }
        if userActivity.activityType == "com.logseq.audio" {
            openURL("logseq://mobile/go/audio")
            return true
        }

        // Case 2: Universal Links
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
           let url = userActivity.webpageURL {
            print("🌐 Universal link opened:", url)
        }

        // Default: let Capacitor handle other cases
        return ApplicationDelegateProxy.shared.application(application,
                                                           continue: userActivity,
                                                           restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("🔥 opened with URL:", url)

        // Forward to Capacitor
        return ApplicationDelegateProxy.shared.application(application,
                                                           open: url,
                                                           options: options)
    }
    private func openURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }

    private func normalizedPath(_ raw: String?) -> String {
        guard let raw = raw, !raw.isEmpty else { return "/" }
        return raw
    }

    private func pushIfNeeded(path: String, animated: Bool) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }
        if pathStack.last == path {
            return
        }
        let vc = NativePageViewController(path: path, push: true)
        pathStack.append(path)
        nav.pushViewController(vc, animated: animated)
    }

    private func replaceTop(path: String) {
        let path = normalizedPath(path)
        guard let nav = navController else { return }
        _ = pathStack.popLast()
        let vc = NativePageViewController(path: path, push: false)
        pathStack.append(path)
        var stack = nav.viewControllers
        if stack.isEmpty {
            stack = [vc]
        } else {
            stack[stack.count - 1] = vc
        }
        nav.setViewControllers(stack, animated: false)
    }

    private func popIfNeeded(animated: Bool) {
        guard let nav = navController else { return }
        if nav.viewControllers.count > 1 {
            _ = pathStack.popLast()
            nav.popViewController(animated: animated)
        }
    }

    func navigationController(_ navigationController: UINavigationController, willShow viewController: UIViewController, animated: Bool) {
        guard let toVC = viewController as? NativePageViewController else { return }
        guard let coordinator = navigationController.transitionCoordinator else { return }
        let vcs = navigationController.viewControllers
        let toIndex = vcs.firstIndex(of: toVC)
        let fromVC = coordinator.viewController(forKey: .from) as? NativePageViewController
        let fromIndex = fromVC.flatMap { vcs.firstIndex(of: $0) }

        let isPop = if let toIdx = toIndex, let fromIdx = fromIndex {
            toIdx < fromIdx
        } else {
            // fallback: compare counts
            vcs.count < pathStack.count
        }

        print("navigationController willShow isPop:", isPop,
              "from:", fromVC?.targetPath ?? "nil",
              "to:", toVC.targetPath)

        if isPop {
            // Keep native bookkeeping aligned with the upcoming pop
            if pathStack.count > 1 {
                _ = pathStack.popLast()
            }
            if let last = pathStack.last, last != toVC.targetPath {
                pathStack[pathStack.count - 1] = toVC.targetPath
            }

            // Move shared webview to destination before pop completes, but leave a snapshot
            // on the previous screen so the transition doesn't show a blank page.
            SharedWebViewController.instance.attach(
                to: toVC,
                leavePlaceholderInPreviousParent: fromVC != nil
            )

            // Trigger browser back so Reitit updates route-match while attached to destination
            if let webView = SharedWebViewController.instance.bridgeController.bridge?.webView,
               webView.canGoBack {
                ignoreRoutePopCount += 1
                webView.goBack()
            } else {
                // Fallback: ask JS to render without adding history
                ignoreRoutePopCount += 1
            }

            coordinator.animate(alongsideTransition: nil) { _ in
                SharedWebViewController.instance.clearPlaceholder()
            }
        }
    }

    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        guard let current = viewController as? NativePageViewController else { return }
        SharedWebViewController.instance.clearPlaceholder()
        SharedWebViewController.instance.attach(to: current)
        attachNavigationSwipeGesture()
        updateSidebarGestureAttachment(for: current)
    }

    func navigationController(_ navigationController: UINavigationController,
                              animationControllerFor operation: UINavigationController.Operation,
                              from fromVC: UIViewController,
                              to toVC: UIViewController) -> UIViewControllerAnimatedTransitioning? {
        let involvesSidebar = isLeftSidebar(fromVC) || isLeftSidebar(toVC)
        return involvesSidebar ? LeftSidebarAnimator(operation: operation) : nil
    }

    private func isLeftSidebar(_ vc: UIViewController) -> Bool {
        guard let pageVC = vc as? NativePageViewController else { return false }
        return pageVC.targetPath == "/left-sidebar"
    }

    private func attachNavigationSwipeGesture() {
        guard let nav = navController else { return }
        if let edgePan = nav.interactivePopGestureRecognizer {
            navigationSwipeGesture.require(toFail: edgePan)
        }
        if navigationSwipeGesture.view !== nav.view {
            nav.view.addGestureRecognizer(navigationSwipeGesture)
        }
    }

    private func updateSidebarGestureAttachment(for vc: NativePageViewController) {
        guard let nav = navController else { return }
        if isLeftSidebar(vc) {
            if sidebarCloseGesture.view !== nav.view {
                nav.view.addGestureRecognizer(sidebarCloseGesture)
            }
        } else if sidebarCloseGesture.view != nil {
            nav.view.removeGestureRecognizer(sidebarCloseGesture)
        }
    }

    @objc private func handleNavigationSwipe(_ gesture: UISwipeGestureRecognizer) {
        guard gesture.state == .ended else { return }
        guard let nav = navController else { return }

        if nav.viewControllers.count > 1 {
            nav.popViewController(animated: true)
            return
        }

        if shouldAllowSidebarOpen("/left-sidebar") {
            print("debug open left sidebar")
            openURL("logseq://mobile/go/left-sidebar")
        }
    }

    @objc private func handleSidebarCloseSwipe(_ gesture: UISwipeGestureRecognizer) {
        guard gesture.state == .ended else { return }
        guard let nav = navController,
              let top = nav.topViewController as? NativePageViewController,
              isLeftSidebar(top) else { return }
        // Let navigation delegate handle stack bookkeeping and JS back sync.
        nav.popViewController(animated: true)
    }

    private func observeRouteChanges() {
        NotificationCenter.default.addObserver(
            forName: UILocalPlugin.routeChangeNotification,
            object: nil,
            queue: OperationQueue.main
        ) { [weak self] notification in
            guard let self else { return }
            let path = self.normalizedPath(notification.userInfo?["path"] as? String)
            let allowSidebar = self.shouldAllowSidebarOpen(path)
            print("observeRouteChanges path:", path,
                  "allowSidebar:", allowSidebar,
                  "firstTab:", self.isOnFirstTab(),
                  "navEmpty:", self.isNavigationStackEmpty())
            guard self.shouldAllowSidebarOpen(path) else {
                print("Ignoring left sidebar request: requires first tab and empty navigation stack")
                return
            }
            let navigationType = (notification.userInfo?["navigationType"] as? String) ?? "push"
            print("navigation type:", navigationType)
            switch navigationType {
            case "replace":
                self.replaceTop(path: path)
            case "pop":
                if self.ignoreRoutePopCount > 0 {
                    self.ignoreRoutePopCount -= 1
                    return
                }
                // JS popped browser history; align native stack if needed.
                if self.pathStack.count > 1 {
                    self.popIfNeeded(animated: true)
                }
            default:
                // push
                self.pushIfNeeded(path: path, animated: true)
            }
        }
    }

}

extension NSUserActivity {
    static var quickAdd: NSUserActivity {
        let activity = NSUserActivity(activityType: "com.logseq.quickadd")
        activity.title = "Quick Add"
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.quickadd")
        activity.suggestedInvocationPhrase = "Quick Add in Logseq"
        return activity
    }

    static var recordAudio: NSUserActivity {
        let activity = NSUserActivity(activityType: "com.logseq.audio")
        activity.title = "Record Audio"
        activity.isEligibleForSearch = true
        activity.isEligibleForPrediction = true
        activity.persistentIdentifier = NSUserActivityPersistentIdentifier("com.logseq.audio")
        activity.suggestedInvocationPhrase = "Record in Logseq"
        return activity
    }
}

// Custom slide-in animation to open the left sidebar from left-to-right.
final class LeftSidebarAnimator: NSObject, UIViewControllerAnimatedTransitioning {
    private let operation: UINavigationController.Operation
    private let duration: TimeInterval = 0.28

    init(operation: UINavigationController.Operation) {
        self.operation = operation
    }

    func transitionDuration(using transitionContext: UIViewControllerContextTransitioning?) -> TimeInterval {
        duration
    }

    func animateTransition(using transitionContext: UIViewControllerContextTransitioning) {
        guard
            let fromView = transitionContext.view(forKey: .from),
            let toView = transitionContext.view(forKey: .to)
        else {
            transitionContext.completeTransition(false)
            return
        }

        let container = transitionContext.containerView
        let width = container.bounds.width
        let offscreenLeft = CGAffineTransform(translationX: -width, y: 0)
        let restingFromTransform = CGAffineTransform(translationX: width * 0.3, y: 0)

        switch operation {
        case .push:
            toView.transform = offscreenLeft
            container.addSubview(toView)
            UIView.animate(
                withDuration: duration,
                delay: 0,
                options: [.curveEaseOut],
                animations: {
                    fromView.transform = restingFromTransform
                    toView.transform = .identity
                },
                completion: { _ in
                    let completed = !transitionContext.transitionWasCancelled
                    fromView.transform = .identity
                    toView.transform = .identity
                    if !completed {
                        toView.removeFromSuperview()
                    }
                    transitionContext.completeTransition(completed)
                }
            )
        case .pop:
            container.insertSubview(toView, belowSubview: fromView)
            toView.transform = restingFromTransform
            UIView.animate(
                withDuration: duration,
                delay: 0,
                options: [.curveEaseOut],
                animations: {
                    fromView.transform = offscreenLeft
                    toView.transform = .identity
                },
                completion: { _ in
                    let completed = !transitionContext.transitionWasCancelled
                    fromView.transform = .identity
                    toView.transform = .identity
                    transitionContext.completeTransition(completed)
                }
            )
        default:
            transitionContext.completeTransition(!transitionContext.transitionWasCancelled)
        }
    }
}

extension AppDelegate {
    func donateQuickAddShortcut() {
        let activity = NSUserActivity.quickAdd
        window?.rootViewController?.userActivity = activity
        activity.becomeCurrent()
        print("✅ Donated Quick Add (NSUserActivity)")
    }

    func donateAudioShortcut() {
        let activity = NSUserActivity.recordAudio
        window?.rootViewController?.userActivity = activity
        activity.becomeCurrent()
        print("✅ Donated Record Audio (NSUserActivity)")
    }

    func startRouteObservation() {
        observeRouteChanges()
    }
}
