//
//  ShareViewController.swift
//  ShareViewController
//
//  Created by leizhe on 2022/3/17.
//


import MobileCoreServices
import Social
import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {

    private var sharedData: SharedData = SharedData.init(resources: [])

    var groupContainerUrl: URL? {
        return FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.logseq.logseq")
    }

    override public func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
            self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
        }
    }

    private func sendData() {
        let encoder: JSONEncoder = JSONEncoder()
        let data = try? encoder.encode(self.sharedData)
        let queryPayload = String(decoding: data!, as: UTF8.self)

        let queryItems =
            [
                URLQueryItem(
                    name: "payload",
                    value: queryPayload.addingPercentEncoding(withAllowedCharacters: .urlHostAllowed) ?? ""),
            ]
        var urlComps = URLComponents(string: "logseq://shared?")!
        urlComps.queryItems = queryItems
        openURL(urlComps.url!)
    }

    fileprivate func createSharedFileUrl(_ url: URL?) -> URL? {
        let tempFilename = url!
            .lastPathComponent.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!
        let copyFileUrl = groupContainerUrl!.appendingPathComponent(tempFilename)
        try? Data(contentsOf: url!).write(to: copyFileUrl)
        return copyFileUrl
    }

    // Screenshots, shared images from some system App are passed as UIImage
    func saveUIImage(_ image: UIImage) -> URL? {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd-HH-mm-ss"
        let filename = dateFormatter.string(from: Date()) + ".png"

        let copyFileUrl = groupContainerUrl!.appendingPathComponent(filename)

        do {
            try image.pngData()?.write(to: copyFileUrl)
            return copyFileUrl
        } catch {
            print(error.localizedDescription)
            return nil
        }
    }

    // Can be a path or a web URL
    fileprivate func handleTypeUrl(_ attachment: NSItemProvider)
    async throws -> SharedResource
    {
        let results = try await attachment.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil)
        let url = results as! URL?

        var res = SharedResource()

        if url!.isFileURL {
            res.name = url!.lastPathComponent
            res.ext = url!.pathExtension
            res.type = url!.pathExtensionAsMimeType()
            res.url = createSharedFileUrl(url)
        } else {
            res.name = url!.absoluteString
            res.type = "text/plain"
        }

        return res
    }

    fileprivate func handleTypeText(_ attachment: NSItemProvider)
    async throws -> SharedResource?
    {
        let item = try await attachment.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil)
        self.sharedData.text = item as? String
        return nil
    }

    fileprivate func handleTypeMovie(_ attachment: NSItemProvider)
    async throws -> SharedResource
    {
        let results = try await attachment.loadItem(forTypeIdentifier: kUTTypeMovie as String, options: nil)

        let url = results as! URL?

        let name = url!.lastPathComponent
        let ext = url!.pathExtension.lowercased()
        let type = url!.pathExtensionAsMimeType()
        let sharedUrl = createSharedFileUrl(url)

        let res = SharedResource(name: name, ext: ext, type: type, url: sharedUrl)

        return res
    }

    fileprivate func handleTypeImage(_ attachment: NSItemProvider)
    async throws -> SharedResource
    {
        let data = try await attachment.loadItem(forTypeIdentifier: kUTTypeImage as String, options: nil)

        var res = SharedResource()

        switch data {
        case let image as UIImage:
            res.url = self.saveUIImage(image)
            res.ext = "png"
            res.name = res.url?.lastPathComponent
            res.type = res.url?.pathExtensionAsMimeType()
        case let url as URL:
            res.name = url.lastPathComponent
            res.ext = url.pathExtension.lowercased()
            res.type = url.pathExtensionAsMimeType()
            res.url = self.createSharedFileUrl(url)
        default:
            print("Unexpected image data:", type(of: data))
        }

        return res
    }


    override public func viewDidLoad() {
        super.viewDidLoad()

        sharedData.empty()
        let inputItems = extensionContext?.inputItems as! [NSExtensionItem]
        Task {
            try await withThrowingTaskGroup(
                of: SharedResource?.self,
                body: { taskGroup in
                    for extensionItem in inputItems {
                        for attachment in extensionItem.attachments! {
                            if attachment.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                                taskGroup.addTask {
                                    return try await self.handleTypeUrl(attachment)
                                }
                            } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                                taskGroup.addTask {
                                    return try await self.handleTypeText(attachment)
                                }
                            } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeMovie as String) {
                                taskGroup.addTask {
                                    return try await self.handleTypeMovie(attachment)
                                }
                            } else if attachment.hasItemConformingToTypeIdentifier(kUTTypeImage as String) {
                                taskGroup.addTask {
                                    return try await self.handleTypeImage(attachment)
                                }
                            }
                        }
                    }

                    for try await item in taskGroup {
                        if let item = item {
                            self.sharedData.resources.append(item)
                        }
                    }
                })

            self.sendData()

        }
    }

    @discardableResult
    @objc func openURL(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                return application.perform(#selector(openURL(_:)), with: url) != nil
            }
            responder = responder?.next
        }
        return false
    }


}

extension URL {
    func pathExtensionAsMimeType() -> String? {
        let type = UTType(filenameExtension: self.pathExtension)
        return type?.preferredMIMEType
    }
}

