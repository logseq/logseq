import fs from 'fs';

export function readFiles(repo) {
    let files = []
    readFilesInternal(repo, files, "")
    return files
}

function readFilesInternal(dir, files, prefix) {
    let dirFiles = fs.readdirSync(dir);
    for(let i in dirFiles) {
        let file = dirFiles[i]
        let path = dir + '/' + file
        if(fs.statSync(path).isDirectory()) {
            readFilesInternal(path, files, prefix + file + '/')
        }else{
            let content = fs.readFileSync(path, "utf8")
            files.push({
                "file/path": prefix + file,
                "file/content": content
            })
        }
    }
}