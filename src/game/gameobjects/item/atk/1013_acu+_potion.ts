const obj: BattleActionBuilder = {
    id: 'acu_potion_t2',
    name: 'konzentrierter Präzisionstrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, durch dessen Wirkung die Genauigkeit stark steigt',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Präzisionstrank',
    emote: 'potion',
    modifiedSkills: [
        {
            name: 'Genauigkeit',
            value: 2
        }
    ]
}

export default obj