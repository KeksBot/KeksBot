const obj: BattleActionBuilder = {
    id: 'atk_potion_t6',
    name: 'Präzisionsessenz',
    type: 'item/atk',
    priority: 8,
    description: 'Diese hochkonzentrierte Essenz führt zu einer extremen Steigerung der Genauigkeit von Attacken',
    fightUsable: true,
    usageMessage: '{user} verwendet eine Präzisionsessenz',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'Genauigkeit',
            value: 3
        }
    ]
}

export default obj