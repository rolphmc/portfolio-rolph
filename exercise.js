
function form_validate_hour(h) {
    var bg = window.document.getElementById('introduction')
    var msg = window.document.getElementById('msg')
    var img = window.document.getElementById('img')
    var data = new Date()
    var hora = data.getHours()
    
    if(document.getElementById("fstart").value != ""){
        var hora = document.getElementById("fstart");
    }
    
    
    /*var hora = 22
    msg.innerHTML = `Agora são ${hora} horas`*/
    if (h || document.getElementById("fstart").value != ""){
        switch (true) {
            case (04 > hora && hora >= 00):
                img.src = 'img/exercise-sample1/00hours.png'
                break;
            case (06 > hora && hora >= 04):
                img.src = 'img/exercise-sample1/04hours.png'
                break;
            case (12 > hora && hora >= 06):
                img.src = 'img/exercise-sample1/06hours.png'
                break;
            case (17 > hora && hora >= 12):
                img.src = 'img/exercise-sample1/12hours.png'
                break;
            case (20 > hora && hora >= 17):
                img.src = "img/exercise-sample1/17hours.png"
                break;
            case (23 > hora && hora >= 20):
                img.src = 'img/exercise-sample1/20hours.png'
                document.body.style.background = 'linear-gradient(to top, #375790, #96D6F2)'
                break;
        }
    }
}