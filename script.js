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

const nomeBanco = "juventusPresencaDB";
const versaoBanco = 1;
const nomeStore = "presencas";
const chaveConfigFirebase = "juventusFirebaseConfig";
const chaveProximoJogoLocal = "juventusProximoJogoLocal";
let bancoPresencaPromise = null;
let painelAdminVisivel = false;
let firestore = null;
let firebaseStorage = null;
let removerListenerFirebase = null;
let removerListenerJogo = null;
let estadoProximoJogoAtual = obterProximoJogoPadrao();

// =========================
// CARREGAR JOGADORES
// =========================

window.onload = async function(){

    preencherFormularioFirebase();

    carregarProximoJogoFormulario();

    await inicializarArmazenamento();

    await sincronizarBancoComJogadores();

    await carregarProximoJogo();

    carregarJogadores();

    atualizarResumo();

    atualizarPainelAdmin();
};

// =========================
// CONFIGURAÇÃO FIREBASE
// =========================

function obterConfiguracaoFirebaseSalva(){

    try{

        const dados = localStorage.getItem(chaveConfigFirebase);

        return dados ? JSON.parse(dados) : null;

    }catch(erro){

        return null;

    }

}

function preencherFormularioFirebase(){

    const config = obterConfiguracaoFirebaseSalva();

    if(!config){
        return;
    }

    const apiKey = document.getElementById("firebaseApiKey");
    const authDomain = document.getElementById("firebaseAuthDomain");
    const projectId = document.getElementById("firebaseProjectId");
    const storageBucket = document.getElementById("firebaseStorageBucket");
    const messagingSenderId = document.getElementById("firebaseMessagingSenderId");
    const appId = document.getElementById("firebaseAppId");

    if(apiKey) apiKey.value = config.apiKey || "";
    if(authDomain) authDomain.value = config.authDomain || "";
    if(projectId) projectId.value = config.projectId || "";
    if(storageBucket) storageBucket.value = config.storageBucket || "";
    if(messagingSenderId) messagingSenderId.value = config.messagingSenderId || "";
    if(appId) appId.value = config.appId || "";

}

function coletarConfiguracaoFirebase(){

    return {
        apiKey: document.getElementById("firebaseApiKey").value.trim(),
        authDomain: document.getElementById("firebaseAuthDomain").value.trim(),
        projectId: document.getElementById("firebaseProjectId").value.trim(),
        storageBucket: document.getElementById("firebaseStorageBucket").value.trim(),
        messagingSenderId: document.getElementById("firebaseMessagingSenderId").value.trim(),
        appId: document.getElementById("firebaseAppId").value.trim()
    };

}

function atualizarStatusFirebase(texto, erro = false){

    const status = document.getElementById("statusFirebase");

    if(!status){
        return;
    }

    status.textContent = texto;
    status.className = erro ? "status-firebase erro" : "status-firebase";

}

function obterProximoJogoPadrao(){

    return {
        adversario: "ADVERSÁRIO",
        imagemAdversario: "images/adversario.png",
        data: "2026-06-15",
        hora: "09:00",
        local: "Campo"
    };

}

function obterProximoJogoLocal(){

    try{

        const dados = localStorage.getItem(chaveProximoJogoLocal);

        return dados ? {
            ...obterProximoJogoPadrao(),
            ...JSON.parse(dados)
        } : obterProximoJogoPadrao();

    }catch(erro){

        return obterProximoJogoPadrao();

    }

}

function salvarProximoJogoLocal(dados){

    localStorage.setItem(
        chaveProximoJogoLocal,
        JSON.stringify(dados)
    );

}

function preencherFormularioProximoJogo(dados = obterProximoJogoPadrao()){

    const campoAdversario = document.getElementById("jogoAdversario");
    const campoImagem = document.getElementById("jogoImagem");
    const campoData = document.getElementById("jogoData");
    const campoHora = document.getElementById("jogoHora");
    const campoLocal = document.getElementById("jogoLocal");

    if(campoAdversario) campoAdversario.value = dados.adversario || "";
    if(campoImagem) campoImagem.value = dados.imagemAdversario || "";
    if(campoData) campoData.value = dados.data || "";
    if(campoHora) campoHora.value = dados.hora || "";
    if(campoLocal) campoLocal.value = dados.local || "";

}

function coletarProximoJogoFormulario(){

    return {
        adversario: document.getElementById("jogoAdversario").value.trim(),
        imagemAdversario: document.getElementById("jogoImagem").value.trim(),
        data: document.getElementById("jogoData").value,
        hora: document.getElementById("jogoHora").value,
        local: document.getElementById("jogoLocal").value.trim()
    };

}

function atualizarTelaProximoJogo(dados){

    const jogo = {
        ...obterProximoJogoPadrao(),
        ...dados
    };

    estadoProximoJogoAtual = jogo;

    const adversario = document.getElementById("adversario");
    const imagem = document.getElementById("imagemAdversario");
    const preview = document.getElementById("previewImagemAdversario");
    const data = document.getElementById("dataJogo");
    const hora = document.getElementById("horaJogo");
    const local = document.getElementById("localJogo");

    if(adversario) adversario.textContent = jogo.adversario || "ADVERSÁRIO";
    if(imagem) imagem.src = jogo.imagemAdversario || "images/adversario.png";
    if(preview) preview.src = jogo.imagemAdversario || "images/adversario.png";
    if(data) data.textContent = jogo.data ? formatarDataBR(jogo.data) : "-";
    if(hora) hora.textContent = jogo.hora || "-";
    if(local) local.textContent = jogo.local || "-";

}

function abrirSeletorImagemAdversario(){

    const seletor = document.getElementById("arquivoImagemAdversario");

    if(seletor){
        seletor.click();
    }

}

async function processarImagemAdversario(input){

    const arquivo = input.files && input.files[0];

    if(!arquivo){
        return;
    }

    atualizarStatusJogo("Carregando imagem do aparelho...");

    try{

        let enderecoImagem = "";

        if(usarFirebase() && firebaseStorage){

            const nomeArquivo = `escudos/${Date.now()}-${arquivo.name}`;
            const referencia = firebaseStorage.ref(nomeArquivo);

            await referencia.put(arquivo);

            enderecoImagem = await referencia.getDownloadURL();

        }else{

            enderecoImagem = await converterArquivoParaDataURL(arquivo);

        }

        document.getElementById("jogoImagem").value = enderecoImagem;

        atualizarTelaProximoJogo({
            ...estadoProximoJogoAtual,
            imagemAdversario: enderecoImagem
        });

        await salvarProximoJogo();

        atualizarStatusJogo("Escudo carregado do celular e salvo com sucesso.");

    }catch(erro){

        atualizarStatusJogo("Não foi possível carregar a imagem escolhida.", true);

    }finally{

        input.value = "";

    }

}

function converterArquivoParaDataURL(arquivo){

    return new Promise((resolve, reject) => {

        const leitor = new FileReader();

        leitor.onload = function(){
            resolve(leitor.result);
        };

        leitor.onerror = function(){
            reject(leitor.error);
        };

        leitor.readAsDataURL(arquivo);

    });

}

function formatarDataBR(dataISO){

    if(!dataISO){
        return "-";
    }

    const partes = dataISO.split("-");

    if(partes.length !== 3){
        return dataISO;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}

function atualizarStatusJogo(texto, erro = false){

    const status = document.getElementById("statusJogo");

    if(!status){
        return;
    }

    status.textContent = texto;
    status.className = erro ? "status-firebase erro" : "status-firebase";

}

async function salvarProximoJogo(){

    const dados = coletarProximoJogoFormulario();

    const payload = {
        ...obterProximoJogoPadrao(),
        ...dados,
        atualizadoEm: new Date().toISOString()
    };

    if(usarFirebase()){

        try{

            await firestore.collection("configuracoes").doc("proximoJogo").set(payload, {
                merge: true
            });

            atualizarStatusJogo("Próximo jogo salvo e sincronizado em tempo real.");

            atualizarTelaProximoJogo(payload);

            if(painelAdminVisivel){
                preencherFormularioProximoJogo(payload);
            }

            return;

        }catch(erro){

            atualizarStatusJogo("Falha ao salvar no Firebase. Usando armazenamento local.", true);

        }

    }

    salvarProximoJogoLocal(payload);

    atualizarStatusJogo("Próximo jogo salvo no dispositivo atual.");

    atualizarTelaProximoJogo(payload);

}

async function carregarProximoJogo(){

    if(usarFirebase()){

        try{

            const snapshot = await firestore.collection("configuracoes").doc("proximoJogo").get();

            if(snapshot.exists){

                const dados = snapshot.data();

                atualizarTelaProximoJogo(dados);

                preencherFormularioProximoJogo(dados);

                atualizarStatusJogo("Próximo jogo sincronizado com o Firebase.");

            }else{

                const padrao = obterProximoJogoLocal();

                atualizarTelaProximoJogo(padrao);

                preencherFormularioProximoJogo(padrao);

            }

        }catch(erro){

            const local = obterProximoJogoLocal();

            atualizarTelaProximoJogo(local);

            preencherFormularioProximoJogo(local);

            atualizarStatusJogo("Não foi possível buscar o jogo no Firebase.", true);

        }

        return;

    }

    const local = obterProximoJogoLocal();

    atualizarTelaProximoJogo(local);

    preencherFormularioProximoJogo(local);

    atualizarStatusJogo("Próximo jogo carregado do dispositivo atual.");

}

async function inicializarArmazenamento(){

    const config = obterConfiguracaoFirebaseSalva();

    if(config && config.apiKey && config.projectId && window.firebase){

        try{

            if(!firebase.apps.length){
                firebase.initializeApp(config);
            }

            firestore = firebase.firestore();
            firebaseStorage = firebase.storage();

            if(removerListenerFirebase){
                removerListenerFirebase();
            }

            removerListenerFirebase = firestore.collection("presencas").onSnapshot(() => {

                carregarJogadores();

                atualizarResumo();

                atualizarPainelAdmin();

            });

            if(removerListenerJogo){
                removerListenerJogo();
            }

            removerListenerJogo = firestore.collection("configuracoes").doc("proximoJogo").onSnapshot(snapshot => {

                const dados = snapshot.exists ? snapshot.data() : obterProximoJogoPadrao();

                atualizarTelaProximoJogo(dados);

                if(!painelAdminVisivel){
                    return;
                }

                preencherFormularioProximoJogo(dados);

            });

            atualizarStatusFirebase("Conectado ao Firebase em tempo real.");

        }catch(erro){

            firestore = null;

            atualizarStatusFirebase("Falha ao conectar ao Firebase. Usando armazenamento local.", true);

        }

    }else{

        firestore = null;

        atualizarStatusFirebase("Armazenamento local ativo. Configure o Firebase para sincronizar entre aparelhos.");

    }

}

async function salvarConfiguracaoFirebase(){

    const config = coletarConfiguracaoFirebase();

    localStorage.setItem(
        chaveConfigFirebase,
        JSON.stringify(config)
    );

    await conectarFirebase();

}

async function conectarFirebase(){

    await inicializarArmazenamento();

    if(firestore){

        alert("Firebase conectado com sucesso.");

        await sincronizarBancoComJogadores();

        await carregarProximoJogo();

        carregarJogadores();

        atualizarResumo();

        atualizarPainelAdmin();

    }else{

        alert("Não foi possível conectar ao Firebase. Confira a configuração.");

    }

}

function usarFirebase(){

    return Boolean(firestore);

}

// =========================
// BANCO DE DADOS
// =========================

function abrirBancoPresenca(){

    if(bancoPresencaPromise){
        return bancoPresencaPromise;
    }

    bancoPresencaPromise = new Promise((resolve, reject) => {

        const requisicao = indexedDB.open(nomeBanco, versaoBanco);

        requisicao.onupgradeneeded = function(evento){

            const banco = evento.target.result;

            if(!banco.objectStoreNames.contains(nomeStore)){

                banco.createObjectStore(nomeStore, {
                    keyPath: "nome"
                });

            }

        };

        requisicao.onsuccess = function(evento){
            resolve(evento.target.result);
        };

        requisicao.onerror = function(){
            reject(requisicao.error);
        };

    });

    return bancoPresencaPromise;

}

async function salvarRegistroPresenca(registro){

    if(usarFirebase()){

        await firestore.collection("presencas").doc(registro.nome).set(registro, {
            merge: true
        });

        return;

    }

    const banco = await abrirBancoPresenca();

    return new Promise((resolve, reject) => {

        const transacao = banco.transaction(nomeStore, "readwrite");
        const store = transacao.objectStore(nomeStore);
        const requisicao = store.put(registro);

        requisicao.onsuccess = function(){
            resolve();
        };

        requisicao.onerror = function(){
            reject(requisicao.error);
        };

    });

}

async function obterPresencasSalvas(){

    if(usarFirebase()){

        const snapshot = await firestore.collection("presencas").get();

        return snapshot.docs.map(doc => doc.data());

    }

    const banco = await abrirBancoPresenca();

    return new Promise((resolve, reject) => {

        const transacao = banco.transaction(nomeStore, "readonly");
        const store = transacao.objectStore(nomeStore);
        const requisicao = store.getAll();

        requisicao.onsuccess = function(){
            resolve(requisicao.result || []);
        };

        requisicao.onerror = function(){
            reject(requisicao.error);
        };

    });

}

async function sincronizarBancoComJogadores(){

    const registros = await obterPresencasSalvas();
    const existentes = new Set(registros.map(registro => registro.nome));

    for(const nome of jogadores){

        if(!existentes.has(nome)){

            await salvarRegistroPresenca({
                nome: nome,
                confirmado: false,
                atualizadoEm: new Date().toISOString()
            });

        }

    }

    if(usarFirebase()){

        atualizarStatusFirebase("Conectado ao Firebase em tempo real.");

    }

}

async function atualizarPresencaNoBanco(nome, confirmado){

    await salvarRegistroPresenca({
        nome: nome,
        confirmado: confirmado,
        atualizadoEm: new Date().toISOString()
    });

}

// =========================
// LISTA DE PRESENÇA
// =========================

async function carregarJogadores(){

    const lista =
    document.getElementById("listaPresenca");

    lista.innerHTML = "";

    const registros = await obterPresencasSalvas();
    const presencas = new Map(
        registros.map(registro => [registro.nome, registro.confirmado])
    );

    jogadores.forEach(nome => {

        let confirmado =
        presencas.get(nome) === true;

        let statusTexto =
        confirmado
        ? "CONFIRMADO"
        : "PENDENTE";

        let statusCor =
        confirmado
        ? "#2ecc71"
        : "#bdc3c7";

        lista.innerHTML += `

        <div class="jogador">

            <label>

                <input
                type="checkbox"
                onchange="alterarStatus('${nome}', this)"
                ${confirmado ? "checked" : ""}>

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

    atualizarPainelAdmin();
}

// =========================
// ALTERAR STATUS
// =========================

function alterarStatus(nome, checkbox){

    atualizarPresencaNoBanco(nome, checkbox.checked)
        .then(() => {

            carregarJogadores();

            atualizarResumo();

            atualizarPainelAdmin();

        })
        .catch(() => {

            alert("Não foi possível salvar a presença agora.");

        });
}

// =========================
// RESUMO
// =========================

async function atualizarResumo(){

    const registros = await obterPresencasSalvas();
    const presencas = new Map(
        registros.map(registro => [registro.nome, registro.confirmado])
    );

    let confirmados = 0;

    jogadores.forEach(nome => {

        if(presencas.get(nome) === true){
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

async function atualizarPainelAdmin(){

    const painel = document.getElementById("painelAdmin");

    if(!painel || painel.hidden){
        return;
    }

    const registros = await obterPresencasSalvas();
    const presencas = new Map(
        registros.map(registro => [registro.nome, registro])
    );

    const lista = document.getElementById("adminListaPresencas");
    const total = jogadores.length;
    let confirmados = 0;

    lista.innerHTML = "";

    jogadores.forEach(nome => {

        const registro = presencas.get(nome);
        const confirmado = registro?.confirmado === true;

        if(confirmado){
            confirmados++;
        }

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${nome}</td>
            <td><span class="admin-status ${confirmado ? "confirmado" : "pendente"}">${confirmado ? "CONFIRMADO" : "PENDENTE"}</span></td>
            <td>${registro?.atualizadoEm ? new Date(registro.atualizadoEm).toLocaleString("pt-BR") : "-"}</td>
        `;

        lista.appendChild(linha);

    });

    document.getElementById("adminTotal").innerText = total;
    document.getElementById("adminConfirmados").innerText = confirmados;
    document.getElementById("adminPendentes").innerText = total - confirmados;

}

// =========================
// SALVAR
// =========================

function salvarPresenca(){

    sincronizarBancoComJogadores()
        .then(() => {

            alert("Presenças salvas com sucesso!");

            carregarJogadores();

            atualizarResumo();

            atualizarPainelAdmin();

        })
        .catch(() => {

            alert("Não foi possível salvar as presenças agora.");

        });
}

// =========================
// ADMIN
// =========================

function abrirAdmin(){

    let senha = prompt(
        "Digite a senha do administrador:"
    );

    if(senha === senhaAdmin){

        painelAdminVisivel = true;

        const painel = document.getElementById("painelAdmin");
        painel.hidden = false;

        atualizarPainelAdmin();

        painel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        alert("Acesso liberado!");

        preencherFormularioFirebase();

        carregarProximoJogoFormulario();

        atualizarPainelAdmin();

    }else{

        alert(
            "Senha incorreta!"
        );

    }
}

function fecharAdmin(){

    const painel = document.getElementById("painelAdmin");

    if(painel){
        painel.hidden = true;
    }

    painelAdminVisivel = false;

}

function carregarProximoJogoFormulario(){

    preencherFormularioProximoJogo(estadoProximoJogoAtual);

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

    if(usarFirebase()){

        firestore.collection("presencas").get().then(snapshot => {

            const exclusoes = snapshot.docs.map(doc => doc.ref.delete());

            return Promise.all(exclusoes);

        }).then(() => {

            return sincronizarBancoComJogadores();

        }).then(() => {

            carregarJogadores();

            atualizarResumo();

            atualizarPainelAdmin();

            alert("Presenças zeradas.");

        });

        return;

    }

    abrirBancoPresenca().then(banco => {

        const transacao = banco.transaction(nomeStore, "readwrite");
        const store = transacao.objectStore(nomeStore);
        const requisicao = store.clear();

        requisicao.onsuccess = function(){

            sincronizarBancoComJogadores()
                .then(() => {

                    carregarJogadores();

                    atualizarResumo();

                    atualizarPainelAdmin();

                    alert("Presenças zeradas.");

                });

        };

    });
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