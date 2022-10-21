const obj: BattleActionBuilder = {
    id: 'atk_potion_t3',
    name: 'Offensivessenz',
    type: 'item/atk',
    priority: 8,
    description: 'Durch ein optimiertes Konzentrationsverfahren der Vorgängerstufen erhöht diese Essenz die Angriffskraft extrem',
    fightUsable: true,
    usageMessage: '{user} verwendet eine Offensivessenz',
    emote: 'potion',
    modifiedSkills: [
        {
            name: 'Angriff',
            value: 3
        }
    ]
}

export default obj