import SQLiteModuleFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite/src/sqlite-api.js';
// import { OriginPrivateFileSystemVFS } from 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js';

import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
import * as Comlink from 'comlink';


let sqlite3;
let dbMap = {};


class AsyncLock {
    constructor() {
        this.disable = (_) => { }
        this.promise = Promise.resolve()
    }

    enable() {
        this.promise = new Promise(resolve => this.disable = resolve)
    }
}

const lock = new AsyncLock()

// uuid, type, page_uuid, page_journal_day, name, content,datoms, created_at, updated_at
const rowToBlock = (row) => {
    return {
        uuid: row[0],
        type: row[1],
        page_uuid: row[2],
        page_journal_day: row[3],
        name: row[4],
        content: row[5],
        datoms: row[6],
        created_at: row[7],
        updated_at: row[8]
    }
}

const SQLiteDB = {
    inc() {
        return 233;
    },

    async init() {
        console.log("[worker] calling init");
        const module = await SQLiteModuleFactory();
        sqlite3 = SQLite.Factory(module);
        // OPFS is not supported in shared worker
        // const vfs = new OriginPrivateFileSystemVFS();
        const vfs = new IDBBatchAtomicVFS("logseq-VFS");
        await vfs.isReady;
        sqlite3.vfs_register(vfs, true);
        console.log("[worker] SQLite vfs init ok")
        return;
    },
    // aka. newDB and openDB
    // :db-new
    async newDB(dbName) {
        console.log("[worker] SQLite newDB", dbName);
        const db = await sqlite3.open_v2(dbName ?? 'demo');
        // create-blocks-table!

        const str = sqlite3.str_new(db, `CREATE TABLE IF NOT EXISTS blocks (
            uuid TEXT PRIMARY KEY NOT NULL,
            type INTEGER NOT NULL,
            page_uuid TEXT,
            page_journal_day INTEGER,
            name TEXT UNIQUE,
            content TEXT,
            datoms TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
            )`);
        let prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(str));
        console.log("debug 1 stmt", prepared);
        const rc = await sqlite3.step(prepared.stmt);
        sqlite3.str_finish(str);
        sqlite3.finalize(prepared.stmt);
        // 101, done

        console.log("debug 2 rc", rc);
        console.log("[worker] SQLite newDB create table", rc);

        const idxSqlStr = sqlite3.str_new(db, `CREATE INDEX IF NOT EXISTS block_type ON blocks(type)`)
        prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(idxSqlStr));
        const idxRc = await sqlite3.step(prepared.stmt);
        sqlite3.str_finish(idxSqlStr);
        sqlite3.finalize(prepared.stmt);

        dbMap[dbName] = db;
        return;
    },

    async deleteBlocks(dbName, uuids = []) {
        const db = dbMap[dbName];
        if (!db) {
            await this.newDB(dbName);
        }
        if (db && uuids.length > 0) {
            const sql = sqlite3.str_new(db, "DELETE from blocks WHERE uuid IN (");
            sqlite3.str_appendall(sql, uuids.map(_ => "?").join(","));
            sqlite3.str_appendall(sql, ")");
            const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(sql));

            sqlite3.reset(prepared.stmt);
            sqlite3.bind_collection(prepared.stmt, uuids);

            const rows = [];
            while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
                const row = sqlite3.row(prepared.stmt);
                rows.push(row);
            }
            sqlite3.str_finish(sql);
            sqlite3.finalize(prepared.stmt);
            return rows;
        }
    },

    async upsertBlocks(dbName, blocks) {
        console.log("[worker] inserting blocks ", blocks);
        let db = dbMap[dbName];
        if (!db) {
            await this.newDB(dbName);
            db = dbMap[dbName];
        }

        await lock.promise;
        lock.enable();

        const before = await sqlite3.changes(db);

        let rc;
        try {
            rc = await sqlite3.exec(db, "BEGIN"); // todo check rc
            console.log("begin transaction", rc);
        } catch (e) {
            console.error("begin transaction error", e);
            lock.disable();
            throw e;
        }

        const str = sqlite3.str_new(db, `
            INSERT INTO blocks (uuid, type, page_uuid, page_journal_day, name, content,datoms, created_at, updated_at)
            VALUES (@uuid, @type, @page_uuid, @page_journal_day, @name, @content, @datoms, @created_at, @updated_at)
            ON CONFLICT (uuid)
            DO UPDATE
                SET (type, page_uuid, page_journal_day, name, content, datoms, created_at, updated_at)
                = (@type, @page_uuid, @page_journal_day, @name, @content, @datoms, @created_at, @updated_at)
        `);
        const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(str));
        for (const block of blocks) {
            console.log("upsert block", block);
            await sqlite3.reset(prepared.stmt);
            sqlite3.bind_collection(prepared.stmt, block);
            try {
                rc = await sqlite3.step(prepared.stmt);
                console.log("upsert block step rc", rc);
            } catch (e) {
                console.error("upsert block error", e);

                await sqlite3.exec(db, "ROLLBACK");
                lock.disable();
            }
        }

        rc = await sqlite3.exec(db, "COMMIT");
        console.log("commit transaction", rc);

        const after = await sqlite3.changes(db);
        console.log(`[worker] SQLite upsertBlocks: ${before} -> ${after}`);

        lock.disable();
        return after - before;
    },

    async fetchAllPages(dbName) {
        console.log("featch all pages");
        let db = dbMap[dbName];
        if (!db) {
            await this.newDB(dbName);
            db = dbMap[dbName];
        }
        const sql = sqlite3.str_new(db, "SELECT * FROM blocks WHERE type = 2");
        const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(sql));
        const allPages = [];
        while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(prepared.stmt);
            allPages.push(row);
        }
        sqlite3.str_finish(sql);
        sqlite3.finalize(prepared.stmt);
        console.log("all pages", allPages);
        // uuid, type, page_uuid, page_journal_day, name, content,datoms, created_at, updated_at
        return allPages.map(rowToBlock);
    },

    async fetchAllBlocks(dbName) {
        console.log("fetch all blocks");
        let db = dbMap[dbName];
        if (!db) {
            await this.newDB(dbName);
            db = dbMap[dbName];
        }
        const sql = sqlite3.str_new(db, "SELECT uuid, page_uuid FROM blocks");
        const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(sql));
        const rows = [];
        while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(prepared.stmt);
            rows.push(row);
        }
        sqlite3.str_finish(sql);
        sqlite3.finalize(prepared.stmt);
        console.log("all blocks", rows);

        return rows.map(row => {
            return { uuid: row[0], page_uuid: row[1] }
        });
    },

    async fetchRecentJournalBlocks(dbName) {
        let db = dbMap[dbName];
        if (!db) {
            await this.newDB(dbName);
            db = dbMap[dbName];
        }
        let sql = sqlite3.str_new(db, "SELECT uuid FROM blocks WHERE type = 2 ORDER BY page_journal_day DESC LIMIT 3");
        let prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(sql));
        const rows = [];
        while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(prepared.stmt);
            rows.push(row);
        }
        sqlite3.str_finish(sql);
        sqlite3.finalize(prepared.stmt);
        const recentJournalIds = rows.map(row => row[0]);
        console.log("recent journal blocks", rows, recentJournalIds);

        if (recentJournalIds.length === 0) {
            return [];
        }

        sql = "SELECT * FROM blocks WHERE type = 1 AND page_uuid IN (";
        // join recentJournalIds
        sql += recentJournalIds.map(_ => "?").join(",");
        sql += ")";
        sql = sqlite3.str_new(db, sql);
        prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(sql));
        sqlite3.reset(prepared.stmt);
        sqlite3.bind_collection(prepared.stmt, recentJournalIds);

        const blocks = [];
        while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(prepared.stmt);
            blocks.push(row);
        }
        sqlite3.str_finish(sql);
        sqlite3.finalize(prepared.stmt);
        console.log("recent journal blocks", blocks);

        return blocks.map(rowToBlock);
    },

    async fetchInitData(dbName) {
        let db = dbMap[dbName];
        if (!db) {
            await this.newDB(dbName);
            db = dbMap[dbName];
        }
        // all required types
        const sql = sqlite3.str_new(db, "SELECT * FROM blocks WHERE type IN (3, 4, 5, 6)");
        const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(sql));
        const rows = [];
        while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(prepared.stmt);
            rows.push(row);
        }
        sqlite3.str_finish(sql);
        sqlite3.finalize(prepared.stmt);
        console.log("all required types", rows);
        return rows.map(rowToBlock);
    },

    async fetchBlocksExcluding(dbName, excludeUUIDs) {
        let db = dbMap[dbName];
        if (!db) {
            await this.newDB(dbName);
            db = dbMap[dbName];
        }
        const sql = sqlite3.str_new(db, "SELECT * FROM blocks WHERE TYPE = 1 AND uuid NOT IN (");
        sqlite3.str_appendall(sql, excludeUUIDs.map(_ => "?").join(","));
        sqlite3.str_appendall(sql, ")");
        const prepared = await sqlite3.prepare_v2(db, sqlite3.str_value(sql));
        sqlite3.reset(prepared.stmt);
        sqlite3.bind_collection(prepared.stmt, excludeUUIDs);

        const blocks = [];
        while (await sqlite3.step(prepared.stmt) === SQLite.SQLITE_ROW) {
            const row = sqlite3.row(prepared.stmt);
            blocks.push(row);
        }
        sqlite3.str_finish(sql);
        sqlite3.finalize(prepared.stmt);
        console.log("fetch blocks", blocks);

        return blocks.map(rowToBlock);
    },
};

onconnect = function (event) {
    const port = event.ports[0];
    Comlink.expose(SQLiteDB, port);
};

