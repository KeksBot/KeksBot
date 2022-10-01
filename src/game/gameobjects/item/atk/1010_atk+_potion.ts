const obj: BattleActionBuilder = {
    id: 1010,
    name: 'konzentrierter Offensivtrank',
    type: 'item/atk',
    description: 'Ein Trank, der bei Verwendung den Angriff stark erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Offensivtrank',
    modifiedSkills: [
        {
            name: 'Angriff',
            value: 2
        }
    ]
}

export default obj