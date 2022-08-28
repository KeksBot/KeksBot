export default {
    '000000': {
        name: 'Angriff',
        type: 'atk/normal',
        description: 'Eine ganz gewöhnliche Attacke mit vollem Körpereinsatz.',
        uses: 40,
        strength: 40,
        accuracy: 100,
        targets: 0
        /*
            target:
                0: Einzelnes Ziel Gegner
                1: Einzelnes Ziel: man selbst
                2: Einzelnes Ziel: Teammitglied
                3: Einzelnes Ziel: Irgendwer (exklusiv)
                4: Einzelnes Ziel: Irgendwer (inklusiv)
                5: Mehrere Ziele: eigenes Team (exklusiv)
                6: Mehrere Ziele: eigenes Team (inklusiv)
                7: Mehrere Ziele: gegnerisches Team
                8: Mehrere Ziele: alle Teilnehmer (exklusiv man selbst)
                9: Mehrere Ziele: alle Teilnehmer (inklusiv man selbst)
        */
    },
    '000001': {
        name: 'Spezi',
        type: 'item',
        description: 'Das einzigwahre Getränk dieser Welt. Leider aber eigentlich nur ein Platzhalter für ein Item. Hab keinen mehr im Keller :c',
    }
}   