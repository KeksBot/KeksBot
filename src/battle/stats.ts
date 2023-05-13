export default ["hp", "attack", "defense", "speed", "accuracy", "critRate", "critDamage", "regeneration", "mana", "mAttack", "mDefense"]
const hidden: Partial<Record<Stats, true>> = {
    'regeneration': true,
}
export { hidden }