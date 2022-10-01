const obj: BattleActionBuilder = {
    id: 1011,
    name: 'konzentrierter Defensivtrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, der bei Verwendung die Verteidigung stark erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Defensivtrank',
    modifiedSkills: [
        {
            name: 'Verteidigung',
            value: 2
        }
    ]
}

export default obj