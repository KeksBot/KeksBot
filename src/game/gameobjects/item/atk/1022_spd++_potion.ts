const obj: BattleActionBuilder = {
    id: 'atk_potion_t5',
    name: 'Tempoessenz',
    type: 'item/atk',
    priority: 8,
    description: 'Dank eines technisch hochkomplexen Konzentrationsverfahrens erhöht diese Essenz die Geschwindigkeit extrem',
    fightUsable: true,
    usageMessage: '{user} verwendet eine Tempoessenz',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'speed',
            value: 3
        }
    ]
}

export default obj