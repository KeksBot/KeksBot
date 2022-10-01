const obj: BattleActionBuilder = {
    id: 1001,
    name: 'Defensivtrank',
    type: 'item/atk',
    description: 'Ein Trank, der bei Verwendung die Verteidigung erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Defensivtrank',
    modifiedSkills: [
        {
            name: 'Verteidigung',
            value: 1
        }
    ]
}

export default obj