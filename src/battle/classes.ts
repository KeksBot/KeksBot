const classes: PlayerClass[] = [
    {
        id: 'swordsman',
        translations: {
            de: 'Schwertkämpfer'
        },
        description: {
            de: 'Ein klassischer Kämpfer, der sich auf Nahkampf spezialisiert hat.'
        },
        fullDescription: {
            de: 'Ein klassischer Kämpfer, der sich auf Nahkampf spezialisiert hat. Er verfügt über ausgezeichnete offensive Fähigkeiten und eine hohe Geschwindikeit, hat aber eine schwache Verteidigung und keine magischen Fähigkeiten'
        },
        baseStats: {
            hp: 260,
            attack: 280, 
            defense: 180,
            speed: 200,
            mana: 0,
            mAttack: 0,
            mDefense: 160,
            critRate: .05,
            critDamage: 1.4,
            accuracy: .94,
            regeneration: 1
        },
        statIncrement: {
            hp: 10,
            attack: 8,
            defense: 7,
            speed: 5,
            mDefense: 5,
            critDamage: .1,
        },
        statIncrementDelta: {
            hp: 6,
            attack: 3,
            defense: 2,
            speed: 2,
            mDefense: 2
        }
    },
    {
        id: 'knight',
        translations: {
            de: 'Ritter'
        },
        description: {
            de: 'Ein Krieger, der sich auf Nahkampf spezialisiert hat.'
        },
        fullDescription: {
            de: 'Ein Krieger, der sich auf Nahkampf spezialisiert hat. Durch intensives Training hat er eine hohe Angriffs- und Verteidigungskraft aufgebaut, ist jedoch langsamer als andere Klassen und in Magiekämpfen machtlos'
        },
        baseStats: {
            hp: 340,
            attack: 230,
            defense: 240,
            speed: 100,
            mana: 0,
            mAttack: 0,
            mDefense: 200,
            critRate: .05,
            critDamage: 1.3,
            accuracy: .90,
            regeneration: 1
        },
        statIncrement: {
            hp: 12,
            attack: 6,
            defense: 7,
            speed: 3,
            mDefense: 6,
            critDamage: .1,
        },
        statIncrementDelta: {
            hp: 6,
            attack: 3,
            defense: 2,
            speed: 2,
            mDefense: 2
        }
    },
    {
        id: 'mage',
        translations: {
            de: 'Magier'
        },
        description: {
            de: 'Ein Magier, der sich auf die Anwendung von Magie spezialisiert hat.'
        },
        fullDescription: {
            de: 'Ein Magier, der sich auf die Anwendung von Magie spezialisiert hat. Er verfügt über ausgezeichnete magische Fähigkeiten, ist jedoch in Nahkämpfen unterlegen.',
        },
        baseStats: {
            hp: 300,
            attack: 160,
            defense: 200, 
            speed: 120,
            mana: 300,
            mAttack: 240,
            mDefense: 200,
            critRate: .05,
            critDamage: 1.3,
            accuracy: .90,
            regeneration: 1
        },
        statIncrement: {
            hp: 10,
            attack: 5,
            defense: 5,
            speed: 4,
            mDefense: 6,
            mAttack: 6,
            mana: 5,
            critDamage: .1,
        },
        statIncrementDelta: {
            hp: 6,
            attack: 3,
            defense: 2,
            speed: 2,
            mDefense: 2,
            mAttack: 2,
        }
    }
]

export default classes