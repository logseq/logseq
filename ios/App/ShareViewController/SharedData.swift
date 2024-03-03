//
//  SharedData.swift
//  ShareViewController
//
//  Created by Mono Wang on 5/22/23.
//

import Foundation

public struct SharedResource: Decodable, Encodable {
    var name: String?
    var ext: String?
    var type: String?
    var url: URL?
}

public struct SharedData: Decodable, Encodable {
    var text: String?
    var resources: [SharedResource]
    
    mutating func empty() {
        text = nil
        resources = []
    }
}
