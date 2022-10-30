const obj: BattleActionBuilder = {
    id: 'potion_t2',
    type: 'item/med',
    name: 'Trank',
    priority: 8,
    description: 'Ein gewöhnlicher Trank\nStellt bei Verwendung 1000 HP wieder her',
    fightUsable: true,
    usageMessage: '{user} verwendet einen Trank',
    emote: 'healPotion',
    aHeal: {
        value: 1000,
    },
    inventoryUsable: true,
    purchasable: true,
    value: 1200,
}

export default obj