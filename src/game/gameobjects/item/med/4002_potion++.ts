const obj: BattleActionBuilder = {
    id: 'Potion_t3',
    type: 'item/med',
    name: 'verbesserter Trank',
    priority: 8,
    description: 'Eine verbesserte Version des Tranks\nStellt bei Verwendung 2000 HP wieder her',
    fightUsable: true,
    usageMessage: '{user} verwendet einen verbesserten Trank',
    emote: 'healPotion',
    aHeal: {
        value: 2000,
    },
    inventoryUsable: true,
    purchasable: true,
    value: 3000,
}

export default obj