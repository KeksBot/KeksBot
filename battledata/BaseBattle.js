module.exports = class BaseBattle {
    constructor(teams, private, message, color) {
        this.id = new Date().getTime()
        this.users = []
        for(i = 0; i < teams; i++) {
            this.users.push([])
        }
        this.private = private
        this.message = message
        this.client = message.client
        this.color = color
        this.client.battles.set(this.id, this)
    }

    async addUser(user, team) {
        if(team >= this.users.length) throw new Error('Team does not exist')
        
    }
}