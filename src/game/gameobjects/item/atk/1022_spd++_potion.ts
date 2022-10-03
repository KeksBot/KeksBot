const obj: BattleActionBuilder = {
    id: 1022,
    name: 'Tempoessenz',
    type: 'item/atk',
    priority: 8,
    description: 'Dank eines technisch hochkomplexen Konzentrationsverfahrens erhöht diese Essenz die Geschwindigkeit extrem',
    fightUsable: true,
    usageMessage: '{user} verwendet eine Tempoessenz',
    emote: 'potion',
    modifiedSkills: [
        {
            name: 'Geschwindigkeit',
            value: 3
        }
    ]
}

export default obj