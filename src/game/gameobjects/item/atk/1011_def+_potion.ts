const obj: BattleActionBuilder = {
    id: 'def_potion_t2',
    name: 'konzentrierter Defensivtrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, der bei Verwendung die Verteidigung stark erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Defensivtrank',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'Verteidigung',
            value: 2
        }
    ],
    purchasable: true,
    value: 8000,
}

export default obj