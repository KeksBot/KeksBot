const obj: BattleActionBuilder = {
    id: 1002,
    name: 'Tempotrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, dessen Wirkung die Geschwindigkeit erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Tempotrank',
    emote: 'potion',
    modifiedSkills: [
        {
            name: 'Geschwindigkeit',
            value: 1
        }
    ]
}

export default obj