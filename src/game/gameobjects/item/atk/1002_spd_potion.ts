const obj: BattleActionBuilder = {
    id: 1002,
    name: 'Tempotrank',
    type: 'item/atk',
    description: 'Ein Trank, dessen Wirkung die Geschwindigkeit erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Tempotrank',
    modifiedSkills: [
        {
            name: 'Geschwindigkeit',
            value: 1
        }
    ]
}

export default obj