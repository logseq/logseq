import fsp from 'fs/promises';
import path from 'path';
import { expect } from '@playwright/test'
import { test } from './fixtures';
import { searchPage, captureConsoleWithPrefix, closeSearchBox, createPage, IsWindows, randomString } from './utils';

test('create file on disk then delete', async ({ page, block, graphDir }) => {
  // Since have to wait for file watchers
  test.slow();

  // Special page names: namespaced, chars require escaping, chars require unicode normalization, "%" chars, "%" with 2 hexdigests
  const testCases = [
    {pageTitle: "User:John", fileName: "User%3AJohn"},
    // invalid url decode escaping as %ff is not parsable but match the common URL encode regex
    {pageTitle: "#%ff", fileName: "#%ff"},
    // valid url decode escaping
    {pageTitle: "#%23", fileName: "#%2523"},
    {pageTitle: "@!#%", fileName: "@!#%"},
    {pageTitle: "aàáâ", fileName: "aàáâ"},
    {pageTitle: "#%gggg", fileName: "#%gggg"}
  ]
  if (!IsWindows)
    testCases.push({pageTitle: "User:Bob", fileName: "User:Bob"})

  function getFullPath(fileName: string) {
    return path.join(graphDir, "pages", `${fileName}.md`);
  }

  // Test putting files on disk
  for (const {pageTitle, fileName} of testCases) {
    // Put the file on disk
    const filePath = getFullPath(fileName);
    await fsp.writeFile(filePath, `- content for ${pageTitle}`);
    await captureConsoleWithPrefix(page, "Parsing finished:", 5000)

    // Check that the page is created
    const results = await searchPage(page, pageTitle);
    const firstResultRow = await results[0].innerText()
    expect(firstResultRow).toContain(pageTitle);
    expect(firstResultRow).not.toContain("Create");
    await closeSearchBox(page);
  }

  // Test removing files on disk
  for (const {pageTitle, fileName} of testCases) {
    // Remove the file on disk
    const filePath = getFullPath(fileName);
    await fsp.unlink(filePath);
    await captureConsoleWithPrefix(page, "Delete page:", 5000);

    // Test that the page is deleted
    const results = await searchPage(page, pageTitle);
    const firstResultRow = await results[0].innerText()
    // expect(firstResultRow).toContain("Create");
    await closeSearchBox(page);
  }
});

test("Rename file on disk", async ({ page, block, graphDir }) => {
  // Since have to wait for file watchers
  test.slow();

  const testCases = [
    // Normal -> NameSpace
    {pageTitle: "User:John", fileName: "User%3AJohn",
    newPageTitle: "User/John", newFileName: "User___John"},
    // NameSpace -> Normal
    {pageTitle: "#/%23", fileName: "#___%2523",
    newPageTitle: "#%23", newFileName: "#%2523"}
  ]
  if (!IsWindows)
    testCases.push({pageTitle: "User:Bob", fileName: "User:Bob",
      newPageTitle: "User/Bob", newFileName: "User___Bob"})

  function getFullPath(fileName: string) {
    return path.join(graphDir, "pages", `${fileName}.md`);
  }

  // Test putting files on disk
  for (const {pageTitle, fileName} of testCases) {
    // Put the file on disk
    const filePath = getFullPath(fileName);
    await fsp.writeFile(filePath, `- content for ${pageTitle}`);
    await captureConsoleWithPrefix(page, "Parsing finished:", 5000)

    // Check that the page is created
    const results = await searchPage(page, pageTitle);
    const firstResultRow = await results[0].innerText()
    expect(firstResultRow).toContain(pageTitle);
    expect(firstResultRow).not.toContain("Create");
    await closeSearchBox(page);
  }

  // Test renaming files on disk
  for (const {pageTitle, fileName, newPageTitle, newFileName} of testCases) {
    // Rename the file on disk
    const filePath = getFullPath(fileName);
    const newFilePath = getFullPath(newFileName);
    await fsp.rename(filePath, newFilePath);
    await captureConsoleWithPrefix(page, "Parsing finished:", 5000);

    await page.waitForTimeout(500);

    // Test that the page is renamed
    const results = await searchPage(page, newPageTitle);
    const firstResultRow = await results[0].innerText()
    expect(firstResultRow).toContain(newPageTitle);
    expect(firstResultRow).not.toContain(pageTitle);
    expect(firstResultRow).not.toContain("Create");
    await closeSearchBox(page);
  }
})

test('special page names', async ({ page, block, graphDir }) => {
  const testCases = [
    {pageTitle: "User:John", fileName: "User%3AJohn"},
    {pageTitle: "_#%ff", fileName: "_%23%25ff"},
    {pageTitle: "@!#%", fileName: "@!%23%"},
    {pageTitle: "aàáâ", fileName: "aàáâ"},
    {pageTitle: "_#%gggg", fileName: "_%23%gggg"}
  ]

  // Test putting files on disk
  for (const {pageTitle, fileName} of testCases) {
    const prefix = randomString(10)
    const fullTitle = `${prefix}${pageTitle}`
    // Create page in Logseq
    await createPage(page, fullTitle)
    const text = `content for ${pageTitle}`
    await block.mustFill(text)
    await page.keyboard.press("Enter", { delay: 50 })
    await page.keyboard.press("Escape", { delay: 50 })

    // Wait for the file to be created on disk
    await page.waitForTimeout(2500);
    // Validate that the file is created on disk with the content
    const filePath = path.join(graphDir, "pages", `${prefix}${fileName}.md`);
    const fileContent = await fsp.readFile(filePath, "utf8");
    expect(fileContent).toContain(text);
  }
});
