const obj: BattleActionBuilder = {
    id: 'atk_potion_t2',
    name: 'konzentrierter Offensivtrank',
    type: 'item/atk',
    priority: 8,
    description: 'Ein Trank, der bei Verwendung den Angriff stark erhöht',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Offensivtrank',
    emote: 'potion',
    modifiedStats: [
        {
            name: 'Angriff',
            value: 2
        }
    ],
    purchasable: true,
    value: 8000,
}

export default obj