import { createHash } from 'crypto';

const hash = createHash('md5')

function sortObject(o: any) {
    if(!o) return null
    var sorted: any = {},
    key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) { //@ts-ignore
        if(o[a[key]] instanceof Object && Object.keys(o[a[key]]).length) sorted[a[key]] = sortObject(o[a[key]]);
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}

export default function generateUniqueItemId(item: DbInventoryItem) {
    let sortedMetadata = sortObject(item.metadata) || item.id
    hash.update(JSON.stringify(sortedMetadata))
    return hash.copy().digest('base64')
}