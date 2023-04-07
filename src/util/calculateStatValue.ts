export default function (stat: UserData['battle']['stats']['attack']) {
    return (stat.base + stat.increment + stat.absModifier) * stat.randomness * (stat.priority || 1) * stat.relModifier
}