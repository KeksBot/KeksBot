const obj: BattleActionBuilder = {
    id: 1003,
    name: 'Präzisionstrank',
    type: 'item/atk',
    description: 'Ein Trank, durch dessen Wirkung die Genauigkeit steigt',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Präzisionstrank',
    modifiedSkills: [
        {
            name: 'Genauigkeit',
            value: 1
        }
    ]
}

export default obj