const obj: BattleActionBuilder = {
    id: 'spd_potion_t1',
    name: 'Tempotrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, dessen Wirkung die Geschwindigkeit erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Tempotrank',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'speed',
            value: 1
        }
    ],
    purchasable: true,
    value: 2000,
}

export default obj