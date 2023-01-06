import { BrowserContext, ElectronApplication, Locator, Page } from '@playwright/test';

/**
 * Block provides helper functions for Logseq's block testing.
 */
export interface Block {
  /** Must fill some text into a block, use `textarea >> nth=0` as selector. */
  mustFill(value: string): Promise<void>;
  /**
   * Must type input some text into an **empty** block.
   * **DO NOT USE** this if there's auto-complete
   */
  mustType(value: string, options?: { delay?: number, toBe?: string }): Promise<void>;
  /**
   * Press Enter and go to next block, require cursor to be in current block(editing mode).
   * When cursor is not at the end of block, trailing text will be moved to the next block.
   */
  enterNext(): Promise<Locator>;
  /** Click `.add-button-link-wrap` and create the next block. */
  clickNext(): Promise<Locator>;
  /** Indent block, return whether it's success. */
  indent(): Promise<boolean>;
  /** Unindent block, return whether it's success. */
  unindent(): Promise<boolean>;
  /** Await for a certain number of blocks, with default timeout. */
  waitForBlocks(total: number): Promise<void>;
  /** Await for a certain number of selected blocks, with default timeout. */
  waitForSelectedBlocks(total: number): Promise<void>;
  /** Escape editing mode, modal popup and selection. */
  escapeEditing(): Promise<void>;
  /** Active block editing, by click */
  activeEditing(nth: number): Promise<void>;
  /** Is editing block now? */
  isEditing(): Promise<boolean>;
  /** Find current selectionStart, i.e. text cursor position. */
  selectionStart(): Promise<number>;
  /** Find current selectionEnd. */
  selectionEnd(): Promise<number>;
}

export interface autocompleteMenu {
  // Expect or wait for autocomplete menu to be or become visible
  expectVisible(modalName?: string): Promise<void>
  // Expect or wait for autocomplete menu to be or become hidden
  expectHidden(modalName?: string): Promise<void>
}

export interface LogseqFixtures {
  page: Page;
  block: Block;
  autocompleteMenu: autocompleteMenu;
  context: BrowserContext;
  app: ElectronApplication;
  graphDir: string;
}
