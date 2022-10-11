const obj: BattleActionBuilder = {
    id: 4000,
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
    inventoryUsable: true
}

export default obj