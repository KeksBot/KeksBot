const obj: BattleActionBuilder = {
    id: 'acu_potion_t2',
    name: 'konzentrierter Präzisionstrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, durch dessen Wirkung die Genauigkeit stark steigt',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Präzisionstrank',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'accuracy',
            value: 2
        }
    ],
    purchasable: true,
    value: 8000,
}

export default obj