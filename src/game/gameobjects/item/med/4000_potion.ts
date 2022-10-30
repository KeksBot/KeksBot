const obj: BattleActionBuilder = {
    id: 'potion_t1',
    type: 'item/med',
    name: 'einfacher Trank',
    priority: 8,
    description: 'Ein billiger, einfacher Trank\nStellt bei Verwendung 500 HP wieder her',
    fightUsable: true,
    usageMessage: '{user} verwendet einen einfachen Trank',
    emote: 'healPotion',
    aHeal: {
        value: 500,
    },
    inventoryUsable: true,
    purchasable: true,
    value: 500,
}

export default obj