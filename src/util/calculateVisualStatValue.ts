export default function (name: Stats, stat: UserData['battle']['stats']['attack']): string {
    let s = (stat.base + stat.increment + stat.absModifier) * stat.randomness * (stat.priority || 1) * stat.relModifier
    let out: string
    switch (name) {
        case 'critRate':
        case 'critDamage':
        case 'accuracy':
            out = `${Math.round(s * 100)}%`; break
        default: out = `${Math.round(s)}`
    }
    return out
}