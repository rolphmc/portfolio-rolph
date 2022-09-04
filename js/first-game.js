function FirstGameControl(){
    const screen = document.getElementById('screen')
    const context = screen.getContext('2d')
    
    const game = {
        players: {
            'player1': {x: 1, y: 1},
            'player2': {x: 9, y: 9}
        },
        fruits: {
            'fruit1': {x: 3, y: 1}
        }
    }

    renderScreen()

    function renderScreen() {
        for (var playerId in game.players) {
            const player = game.players[playerId]
            context.fillStyle = "blank"
            context.fillRect(player.x, player.y, 1, 1)
        }
    
        for (var fruitId in game.fruits){
            const fruit = game.fruits[fruitId]
            context.fillStyle = "green"
            context.fillRect(fruit.x, fruit.y, 1, 1)
        }
    }

}
