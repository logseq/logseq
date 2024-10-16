import fsp from 'fs/promises'
import { ConsoleMessage, Locator, expect } from "@playwright/test"
import { createRandomPage } from "./utils"
import { test, graphDir } from "./fixtures"
import path from "path"
// https://github.com/aghassemi/amphtml/blob/bc101c6a67f7ef882b4842e49853263feec0cbab/src/service/video-manager-impl.js#L358-L367
//  >  The following video file is an h.264 encoded two-second video with four
//  >  black frames generated with wide decoding compatibility in mind.
//  >  $ffmpeg -f lavfi -i color=color=black:rate=2:size=100x100 -t 2
//  >  -profile:v baseline -preset slow
//  >  -pix_fmt yuv420p -vcodec libx264 /tmp/small.mp4
const TINY_MP4_BASE64 = 'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAFttZGF0AAAAMmWIhD///8PAnFAAFPf3333331111111111111111111111111111111111111111114AAAABUGaOeDKAAAABkGaVHgygAAAAAZBmnZ4MoAAAAMKbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAjt0cmFrAAAAXHRraGQAAAAPAAAAAAAAAAAAAAABAAAAAAAAB9AAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAGQAAABkAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAfQAAAAAAABAAAAAAGzbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAAAgAAAARVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABXm1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAR5zdGJsAAAAlnN0c2QAAAAAAAAAAQAAAIZhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAGQAZABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMGF2Y0MBQsAK/+EAGGdCwArZhz+efARAAAADAEAAAAMBA8SJmgEABWjJYPLIAAAAGHN0dHMAAAAAAAAAAQAAAAQAAAABAAAAFHN0c3MAAAAAAAAAAQAAAAEAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAQAAAABAAAAJHN0c3oAAAAAAAAAAAAAAAQAAAA2AAAACQAAAAoAAAAKAAAAFHN0Y28AAAAAAAAAAQAAADAAAABbdWR0YQAAAFNtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAACZpbHN0AAAAHql0b28AAAAWZGF0YQAAAAEAAAAAR29vZ2xl'


test.describe('embedded video', () => {
    const assets_dir = path.resolve(graphDir, 'assets')
    console.log("ASSETS DIRECTORY: ", assets_dir)

    // Save tiny mp4 to assets folder for testing local assets
    test.beforeAll(async () => {
        await fsp.mkdir(assets_dir, { recursive: true })
        await fsp.writeFile(`${assets_dir}/tiny.mp4`, TINY_MP4_BASE64, { encoding: 'base64' })
        await fsp.writeFile(`${assets_dir}/per%20cent.mp4`, TINY_MP4_BASE64, { encoding: 'base64' })
    })
    test.afterAll(async () => {
        test.setTimeout(60000)
        await fsp.rm(assets_dir, { recursive: true })
    })

    // Test each video embed syntax with each source video
    const testSyntax = [['video-macro', '{{video $1}}'], ['markdown-link', '![video]($1)']]
    const testVideos = [
        ['URL with .mp4 extension', 'http://web.archive.org/web/20230130024806id_/https://freetestdata.com/wp-content/uploads/2022/02/Free_Test_Data_1MB_MP4.mp4/'],
        // FIXME(backend): ['not handled: URL with video/mp4 MIME Type without extension', 'https://api.raindrop.io/v2/raindrop/591997788/file?type=video/mp4'],
        // FIXME(backend): embedding an invalid absolute filepath = empty iframe with ERR_FILE_NOT_FOUND in console
        ['URL with video/mp4 MIME Type using #.mp4', 'https://api.raindrop.io/v2/raindrop/591997788/file?type=video/mp4#.mp4'],
        ['local asset mp4', '../assets/tiny.mp4'],
        ['local asset mp4 with URL-Encoded filename', '../assets/per%20cent.mp4'],
        ['local asset mp4 with absolute filepath', path.join(assets_dir, 'tiny.mp4')],
    ]

    const VIDEO_TIMEOUT = 1000 // each video can take up to 1s
    // extend test timeout due to so many video loads
    test.setTimeout(testSyntax.length * testVideos.length * VIDEO_TIMEOUT)

    for (const [vDesc, videoSrc] of testVideos) {
        for (const [sDesc, embedSyntax] of testSyntax) {
            test(`${sDesc} of ${vDesc}`, async ({ page, block }) => {
                test.slow();
                await createRandomPage(page)

                // Handle relevant exceptions thrown by Chrome
                let consoleWatcher = (msg: ConsoleMessage) => {
                    const text = msg.text()
                    if (text.startsWith("Failed to load resource:")) {
                        throw new Error(`From Chrome: ${text}`)
                    }
                }
                page.on('console', consoleWatcher)

                // type syntax and videoSrc into block
                let inputText = embedSyntax.replace('$1', videoSrc)
                console.log("INPUT TEXT: ", inputText)
                await block.mustFill(inputText)
                await block.escapeEditing()

                // Wait for video to load
                let blockRender: Locator = page.locator('.block-content-inner div span').first()
                // await blockRender.waitFor({ timeout: VIDEO_TIMEOUT })
                // await page.waitForLoadState('domcontentloaded')

                // this method of checking the innerHTML handles <iframe>, <video> and <span>
                const renderHtml = await blockRender.innerHTML({ timeout: VIDEO_TIMEOUT })

                expect(renderHtml, "must embed video").toContain('<video')
                expect(renderHtml, "must not autoplay").not.toContain('autoplay')

                page.removeListener('console', consoleWatcher)
            })
        }
    }
})
