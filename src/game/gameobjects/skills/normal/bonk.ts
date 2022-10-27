const obj: BattleActionBuilder = {
    id: 'bonk',
    name: 'Bonk',
    type: 'atk/normal',
    description: 'Ein leichter Schlag auf den Hinterkopf. Senkt möglicherweise die Genauigkeit des Gegners',
    uses: 30,
    strength: 50,
    accuracy: 100,
    targets: 0,
    priority: 0,
    modifiedSkills: [
        {
            name: 'Genauigkeit',
            value: -1,
            probability: 0.1
        }
    ]
}

export default obj