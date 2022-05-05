//
//  Payload.swift
//  Logseq
//
//  Created by Mono Wang on 4/8/R4.
//

import Foundation

struct GetFilesResponse: Decodable {
    let PresignedFileUrls: [String: String]
}

struct DeleteFilesResponse: Decodable {
    let TXId: Int
    let DeleteSuccFiles: [String]
    let DeleteFailedFiles: [String: String]
}

public struct S3Credential: Decodable {
    let AccessKeyId: String
    let Expiration: String
    let SecretKey: String
    let SessionToken: String
}

struct GetTempCredentialResponse: Decodable {
    let Credentials: S3Credential
    let S3Prefix: String
}

struct UpdateFilesResponse: Decodable {
    let TXId: Int
    let UpdateSuccFiles: [String]
    let UpdateFailedFiles: [String: String]
}
