const obj: BattleActionBuilder = {
    id: 'def_potion_t1',
    name: 'Defensivtrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, der bei Verwendung die Verteidigung erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Defensivtrank',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'defense',
            value: 1
        }
    ],
    purchasable: true,
    value: 2000,
}

export default obj