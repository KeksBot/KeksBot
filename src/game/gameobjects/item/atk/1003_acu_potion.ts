const obj: BattleActionBuilder = {
    id: 'acu_potion_t1',
    name: 'Präzisionstrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, durch dessen Wirkung die Genauigkeit steigt',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Präzisionstrank',
    emote: 'potion',
    modifiedSkills: [
        {
            name: 'Genauigkeit',
            value: 1
        }
    ]
}

export default obj