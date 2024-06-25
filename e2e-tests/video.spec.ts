import { expect } from "@playwright/test";
import { createRandomPage } from "./utils";
import { test } from "./fixtures";

test('video macro should not autoplay', async ({page, block}) => {
    await createRandomPage(page)

    await block.mustFill(`{{video https://freetestdata.com/wp-content/uploads/2022/02/Free_Test_Data_1MB_MP4.mp4}}`)
    await block.escapeEditing();

    // try locate video either under iframe or directly under block-content
    let video;
    try {
        video = page.locator('.block-content').locator('iframe').frameLocator(':scope').locator('video');
        await video.waitFor({timeout: 300})
    } catch {
        video = page.locator('.block-content').locator('video')
        await video.waitFor({timeout: 300})
    }

    // check html for autoplay
    const video_html = await video.evaluate(() => document.documentElement.outerHTML)
    expect(video_html).not.toContain('autoplay')

})