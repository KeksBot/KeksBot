const obj: BattleActionBuilder = {
    id: 'spd_potion_t2',
    name: 'konzentrierter Tempotrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, dessen Wirkung die Geschwindigkeit stark erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Tempotrank',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'Geschwindigkeit',
            value: 2
        }
    ],
    purchasable: true,
    value: 8000,
}

export default obj