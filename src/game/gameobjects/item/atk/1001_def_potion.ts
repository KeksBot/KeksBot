const obj: BattleActionBuilder = {
    id: 'def_potion_t1',
    name: 'Defensivtrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, der bei Verwendung die Verteidigung erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Defensivtrank',
    emote: 'potion',
    modifiedSkills: [
        {
            name: 'Verteidigung',
            value: 1
        }
    ]
}

export default obj