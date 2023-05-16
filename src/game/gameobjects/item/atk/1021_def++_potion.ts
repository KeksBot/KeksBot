const obj: BattleActionBuilder = {
    id: 'atk_potion_t4',
    name: 'Defensivessenz',
    type: 'item/atk',
    priority: 8,
    description: 'Durch ein verbessertes Konzentrationsverfahren der Vorgängerstufen erhöht diese Essenz die Verteidigung extrem',
    fightUsable: true,
    usageMessage: '{user} verwendet eine Defensivessenz',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'Verteidigung',
            value: 3
        }
    ]
}

export default obj