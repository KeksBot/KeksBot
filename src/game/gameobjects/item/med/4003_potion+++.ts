const obj: BattleActionBuilder = {
    id: 'potion_t4',
    type: 'item/med',
    name: 'konzentrierter Trank',
    priority: 8,
    description: 'Die beste Version des Tranks\nStellt bei Verwendung 5000 HP wieder her',
    fightUsable: true,
    usageMessage: '{user} verwendet einen konzentrierten Trank',
    emote: 'healPotion',
    aHeal: {
        value: 5000,
    },
    inventoryUsable: true
}

export default obj