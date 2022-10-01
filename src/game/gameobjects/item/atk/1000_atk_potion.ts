const obj: BattleActionBuilder = {
    id: 1000,
    name: 'Offensivtrank',
    priority: 8,
    type: 'item/atk',
    description: 'Ein Trank, der bei Verwendung die Angriffskraft erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Offensivtrank',
    modifiedSkills: [
        {
            name: 'Angriff',
            value: 1
        }
    ]
}

export default obj