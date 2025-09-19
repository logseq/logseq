import UIKit
import Capacitor
import Intents

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

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
}
