const obj: BattleActionBuilder = {
    id: 'atk_potion_t1',
    name: 'Offensivtrank',
    priority: 8,
    type: 'item/atk',
    description: 'Ein Trank, der bei Verwendung die Angriffskraft erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Offensivtrank',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'Angriff',
            value: 1
        }
    ],
    purchasable: true,
    value: 2000,
}

export default obj