
function form_validate_hour(h) {
    var bg = window.document.getElementById('introduction')
    var msg = window.document.getElementById('msg')
    var img = window.document.getElementById('img-container')
    var data = new Date()
    var hora = data.getHours()
    
    msg.innerHTML = `Escolha um horário e prepare-se para o pouso`
    img.innerHTML = `<p><i>Estamos viajando a uma velocidade incrível pela orbita da terra...</i></p><img src="img/exercise-sample1/primaryhours.png"><p> Desenvolvi este exercício com o objetivo de treinar e demonstrar a manipulação dos horários do sistema através do Java Sclipt. Escolha o horário e pousaremos em algum lugar de acordo com a escolha...<p>
    ` 

    if(!h && document.getElementById("fstart").value != ""){
        var hora = window.document.getElementById("fstart").value;
    }

    if (h || document.getElementById("fstart").value != ""){
        switch (true) {
            case (4 > hora && hora >= 0):
                img.innerHTML = `<p><i>${hora} hora(s)- Noite Profunda</i></p><img src="img/exercise-sample1/00hours.png"><p>Se perguntarem por mim, desci da nave e fui ali fora ver a lua...<p>` 
                break;
            case (6 > hora && hora >= 4):
                img.innerHTML = `<p><i>${hora} hora(s)- A aurora é uma mistura mágica de cores</i></p><img src="img/exercise-sample1/04hours.png"><p> Um rastro de luz começa a surgir no céu, o frio da madrugada se intensifica<p>` 
                break;
            case (12 > hora && hora >= 6):
                img.innerHTML = `<p><i>${hora} hora(s)- Bom dia</i></p><img src="img/exercise-sample1/06hours.png"><p>Toda manhã nesse planeta é um previlégio e sempre descobrimos muitas oportunidades<p>` 
                break;
            case (17 > hora && hora >= 12):
                img.innerHTML = `<p><i>${hora} hora(s)- Boa tarde</i></p><img src="img/exercise-sample1/12hours.png"><p>Descemos em uma região com calor escaldante, não sairei dessa nave por nada!<p>` 
                break;
            case (20 > hora && hora >= 17):
                img.innerHTML = `<p><i>${hora} hora(s)- Um lugar para ver o crepusculo</i></p><img src="img/exercise-sample1/16hours.png"><p> Está entardecendo, vamos procurar um local para apreciar o por do sol?<p>` 
                break;
            case (24 > hora && hora >= 20):
                img.innerHTML = `<p><i>${hora} hora(s)- Vamos recorrer as estrelas</i></p><img src="img/exercise-sample1/20hours.png"><p> Anoiteceu, o horizonte é lindo desse ponto do mundo, observe o céu veja a infinidade de estrelas que temos para nos guiar<p>` 
                break;
        }
    }
}