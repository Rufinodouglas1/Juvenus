// =========================
// JUVENTUS F.C.
// SCRIPT PRINCIPAL
// =========================

const senhaAdmin = "Juventus";

const jogadores = [
    "Adailton",
    "Fofão",
    "Gere",
    "Willian",

    "Alan",
    "Douglas",
    "Júlio",

    "Moisés",
    "Vitor",
    "Gamarra",
    "Junio",

    "Jelsinho",
    "Márcio",
    "Lucas",

    "Carlinhos",
    "Gustavo",
    "Joan",
    "Miltinho",

    "Leandrinho"
];

// =========================
// CARREGAR JOGADORES
// =========================

window.onload = function(){

    carregarJogadores();

    atualizarResumo();
};

// =========================
// LISTA DE PRESENÇA
// =========================

function carregarJogadores(){

    const lista =
    document.getElementById("listaPresenca");

    lista.innerHTML = "";

    jogadores.forEach(nome => {

        let confirmado =
        localStorage.getItem(nome);

        let statusTexto =
        confirmado === "sim"
        ? "CONFIRMADO"
        : "PENDENTE";

        let statusCor =
        confirmado === "sim"
        ? "#2ecc71"
        : "#bdc3c7";

        lista.innerHTML += `

        <div class="jogador">

            <label>

                <input
                type="checkbox"
                onchange="alterarStatus('${nome}', this)"
                ${confirmado === "sim" ? "checked" : ""}>

                ${nome}

            </label>

            <span
            class="status"
            style="background:${statusCor};">

            ${statusTexto}

            </span>

        </div>

        `;
    });
}

// =========================
// ALTERAR STATUS
// =========================

function alterarStatus(nome, checkbox){

    if(checkbox.checked){

        localStorage.setItem(
            nome,
            "sim"
        );

    }else{

        localStorage.removeItem(nome);

    }

    carregarJogadores();

    atualizarResumo();
}

// =========================
// RESUMO
// =========================

function atualizarResumo(){

    let confirmados = 0;

    jogadores.forEach(nome => {

        if(
            localStorage.getItem(nome)
            === "sim"
        ){
            confirmados++;
        }

    });

    let pendentes =
    jogadores.length - confirmados;

    document.getElementById(
        "confirmados"
    ).innerText = confirmados;

    document.getElementById(
        "pendentes"
    ).innerText = pendentes;

    document.getElementById(
        "ausentes"
    ).innerText = 0;
}

// =========================
// SALVAR
// =========================

function salvarPresenca(){

    alert(
        "Presenças salvas com sucesso!"
    );
}

// =========================
// ADMIN
// =========================

function abrirAdmin(){

    let senha = prompt(
        "Digite a senha do administrador:"
    );

    if(senha === senhaAdmin){

        alert(
            "Acesso liberado!"
        );

        // Futuro painel admin

    }else{

        alert(
            "Senha incorreta!"
        );

    }
}

// =========================
// LIMPAR PRESENÇAS
// =========================

function limparPresencas(){

    let senha = prompt(
        "Senha Admin:"
    );

    if(senha !== senhaAdmin){

        alert("Senha incorreta");

        return;
    }

    jogadores.forEach(nome => {

        localStorage.removeItem(nome);

    });

    carregarJogadores();

    atualizarResumo();

    alert(
        "Presenças zeradas."
    );
}

// =========================
// ESTATÍSTICAS
// =========================

let estatisticas = {

    jogos:0,
    vitorias:0,
    empates:0,
    derrotas:0,
    golsPro:0,
    golsContra:0

};

// =========================
// AGENDA 70 JOGOS
// =========================

let agenda = [];

for(let i=1;i<=70;i++){

    agenda.push({

        numero:i,

        adversario:"",

        data:"",

        horario:"",

        local:"",

        resultado:""

    });

}

console.log(
    "Agenda criada:",
    agenda.length,
    "jogos"
);