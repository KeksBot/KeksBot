export default function (stat: StatOptions) {
    return (stat.base + stat.increment + stat.absModifier) * stat.randomness * (stat.priority || 1) * stat.relModifier
}