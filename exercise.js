
function form_validate_hour(h) {
    var bg = window.document.getElementById('introduction')
    var msg = window.document.getElementById('msg')
    var img = window.document.getElementById('img-container')
    var data = new Date()
    var hora = data.getHours()
    
    msg.innerHTML = `Lembre-se, agora são ${hora} horas`

    if(document.getElementById("fstart").value != ""){
        var hora = window.document.getElementById("fstart");
    }

    if (h || document.getElementById("fstart").value != ""){
        switch (true) {
            case (4 > hora && hora >= 0):
                img.innerHTML = `<img src="00hours.png">` 
                break;
            case (6 > hora && hora >= 4):
                img.innerHTML = `<img src="04hours.png">` 
                break;
            case (12 > hora && hora >= 6):
                img.innerHTML = `<img src="06hours.png">` 
                break;
            case (17 > hora && hora >= 12):
                img.innerHTML = `<img src="12hours.png">` 
                break;
            case (20 > hora && hora >= 17):
                img.innerHTML = `<img src="17hours.png">` 
                break;
            case (23 > hora && hora >= 20):
                img.innerHTML = `<img src="20hours.png">` 
                break;
        }
    }
}