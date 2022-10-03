const obj: BattleActionBuilder = {
    id: 1023,
    name: 'Präzisionsessenz',
    type: 'item/atk',
    priority: 8,
    description: 'Diese hochkonzentrierte Essenz führt zu einer extremen Steigerung der Genauigkeit von Attacken',
    fightUsable: true,
    usageMessage: '{user} verwendet eine Präzisionsessenz',
    emote: 'potion',
    modifiedSkills: [
        {
            name: 'Genauigkeit',
            value: 3
        }
    ]
}

export default obj