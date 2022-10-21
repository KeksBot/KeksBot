const fs = require('fs')
const path = require('path')
const _files: any = {}
const objects: Map<string, any> = new Map()

const loadFiles = (dir: string) => {
    const files = fs.readdirSync(path.join(__dirname, dir))
    for(const file of files) {
        const stat = fs.lstatSync(path.join(__dirname, dir, file))
        if(stat.isDirectory()) {
            loadFiles(path.join(dir, file))
        } else {
            if(file.endsWith('.js')) {
                const options = require(path.join(__dirname, dir, file))
                _files[options.default.id] = path.join(__dirname, dir, file)
                delete require.cache[require.resolve(path.join(__dirname, dir, file))]
            }
        }
    }
}

loadFiles('./gameobjects')

export default (id: string[]) => {
    for(const i of id) {
        if(_files[i]) {
            objects.set(i, require(_files[i]).default)
            objects.get(i).timeout && clearTimeout(objects.get(i).timeout)
            objects.get(i).timeout = setTimeout((i: any) => {
                delete require.cache[require.resolve(_files[i])]
                objects.delete(i)
            }, 3600000)
        }
    }
    return objects
}