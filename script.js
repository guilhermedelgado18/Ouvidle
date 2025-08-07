let audioAtual = null;
let musicaAtual = null;
let todasMusicasDoArtista = [];


//alterando a logo por meio de JS
const logo = document.querySelector('.logo')

if(window.innerWidth <= 1100) {
    logo.textContent = "👂"
  } else {
    logo.textContent = "👂OUVIDLE"
}

window.addEventListener('resize', () => {

  if(window.innerWidth <= 1100) {
    logo.textContent = "👂"
  } else {
    logo.textContent = "👂OUVIDLE"
  }
})

//guardando o estado atual do jogo
let estadoJogo = {
  artista: getArtistaSelecionado(),
  musicaAtual: null,
  audioAtual: null,
  tentativasRestantes: 6,
  tentativaAtual: 1,
  tempoPreview: [1, 2, 4, 7, 11, 16],
  status() {
    console.log(this.musicaAtual)
    console.log(this.audioAtual)
  }
}

function resetaUI() {
  document.querySelector(`.t${nivelPreview+1}`).classList.remove('ativa')
  document.querySelector('.t1').classList.add('ativa')

  document.querySelector('.t1').innerHTML = 'TENTATIVA 1'
  document.querySelector('.t2').innerHTML = 'TENTATIVA 2'
  document.querySelector('.t3').innerHTML = 'TENTATIVA 3'
  document.querySelector('.t4').innerHTML = 'TENTATIVA 4'
  document.querySelector('.t5').innerHTML = 'TENTATIVA 5'
  document.querySelector('.t6').innerHTML = 'TENTATIVA 6'

  resposta.classList.add('escondido')

  botaoPular.innerHTML = 'PULAR (+1s)'
  botaoPular.style.color = 'black'
  botaoPular.style.backgroundColor = 'white'
  botaoPular.disabled = false;

  botaoChute.disabled = false;

  inputChute.disabled = false;

  botaoChute.classList.remove('escondido')
  botaoNovoJogo.classList.add('escondido')
}

//função para buscar o artista do local storage
function getArtistaSelecionado() {
  const salvo = localStorage.getItem("artistaSelecionado");
  try {
    return salvo ? JSON.parse(salvo) : null;
  } catch (e) {
    console.error("Erro ao ler artista do localStorage:", e);
    return null;
  }
}

//guardando o artista em uma variável e colocando o nome na tela
let nomeArtista = document.querySelector('.nome-artista')
let artistaSelecionado = getArtistaSelecionado();

if (artistaSelecionado) {
  nomeArtista.innerHTML = artistaSelecionado.name;
  buscarMusicaDoArtista(artistaSelecionado.id).then(() => {
    escolherMusica()
  })
} else {
  nomeArtista.innerHTML = "Selecione um artista 🎧";
}

//lógica para pesquisar e selecionar o artista
const inputArtista = document.querySelector(".pesquisa-artista");
const listaArtista = document.querySelector(".sugestoes-artistas");

inputArtista.addEventListener("input", () => {
  const termo = inputArtista.value.trim();

  if (termo.length < 2) {
    listaArtista.innerHTML = "";
    return;
  }

  const antigo = document.getElementById("jsonp-script");
  if (antigo) antigo.remove();

  window.deezerCallback = function (res) {
    listaArtista.innerHTML = "";

    if (!res.data || res.data.length === 0) {
      listaArtista.innerHTML = "<li>Nenhum artista encontrado</li>";
      return;
    }

    res.data.forEach((artista) => {
      const li = document.createElement("li");
      li.textContent = artista.name;

      li.addEventListener("click", () => {
        inputArtista.value = artista.name;
        listaArtista.innerHTML = "";
        artistaSelecionado = artista;
        localStorage.setItem("artistaSelecionado", JSON.stringify(artista));

        window.location.reload();
        
      });

      listaArtista.appendChild(li);
    });
  };

  const script = document.createElement("script");
  script.id = "jsonp-script";
  script.src = `https://api.deezer.com/search/artist?q=${encodeURIComponent(
    termo
  )}&output=jsonp&callback=deezerCallback`;

  document.body.appendChild(script);
});

//lógica para buscar as músicas do artista e selecionar uma aleatória


async function buscarMusicaDoArtista(artistaId) {
  try {
    const res = await fetch(`https://ouvidle-api.onrender.com/api/musicas?artistaId=${artistaId}`);
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      alert("Nenhuma música encontrada para este artista.");
      return;
    }

    todasMusicasDoArtista = json.data

  } catch (err) {
    console.error("Erro ao carregar música do artista salvo:", err);
    return;
  }
}

function escolherMusica() {
    const index = Math.floor(Math.random() * todasMusicasDoArtista.length);

    musicaAtual = todasMusicasDoArtista[index];
    audioAtual = new Audio(musicaAtual.preview);
    audioAtual.volume = volumeSalvo;

    document.querySelector(".info-imagem").innerHTML = `
      <img src="${musicaAtual.album.cover_medium}" />
    `;

    document.querySelector(".info-desc").innerHTML = `
      <p class='info-titulo'>${musicaAtual.title}</p>
      <div class='info-baixo'>
        <p class='info-artista'>${musicaAtual.artist.name}</p>
        <p class='info-album'>${musicaAtual.album.title}</p>
      </div>
    `; 

    if(!musicaAtual) return;
}

//lógica slider de volume
const sliderVolume = document.getElementById("controle-volume");
const chaveVolume = "volume";

if (localStorage.getItem(chaveVolume) === null) {
  localStorage.setItem(chaveVolume, "1");
}

const volumeSalvo = parseFloat(localStorage.getItem(chaveVolume));
sliderVolume.value = volumeSalvo;

if (audioAtual) {
  audioAtual.volume = volumeSalvo;
}

sliderVolume.addEventListener("input", () => {
  const volume = parseFloat(sliderVolume.value);
  if (audioAtual) {
    audioAtual.volume = volume;
  }
  localStorage.setItem(chaveVolume, volume);
});

//lógica de preview da música
let tocando = false;

let nivelPreview = 0;
let tempoPreview = [1, 2, 4, 7, 11, 16];
let tempoMaximo = tempoPreview[nivelPreview];
let timeoutCorte = null;
let intervaloBarra = null;

let previewFinalizado = false;

function tocarPreview() {
  if (!audioAtual) return;

  // Se o preview estiver tocando, pausa
  if (!audioAtual.paused) {
    audioAtual.pause();
    tocando = false;
    clearTimeout(timeoutCorte);
    clearInterval(intervaloBarra);
    previewFinalizado = false;
    return;
  }

  // Se o preview já terminou, volta ao início
  if (previewFinalizado) {
    audioAtual.currentTime = 0;
    previewFinalizado = false;
  }

  // Retoma ou inicia a reprodução
  audioAtual.play().then(() => {
    tocando = true;
    atualizarBarra();

    const tempoRestante = (tempoMaximo - audioAtual.currentTime) * 1000;
    timeoutCorte = setTimeout(() => {
      audioAtual.pause();
      tocando = false;
      clearInterval(intervaloBarra);
      previewFinalizado = true;
    }, tempoRestante);
  }).catch((e) => {
    console.error("Erro ao tocar o áudio:", e);
  });
}

//lógica do botão de play
const botaoPlayer = document.querySelector('.botao-player')

botaoPlayer.addEventListener("click", () => {
  if (!musicaAtual || !audioAtual) {
    setTimeout(() => {
      tocarPreview();
    }, 1000)
  }

  if(artistaSelecionado === null) {
    alert("Selecione um artista primeiro")
    return
  }

  if(localStorage.getItem("volume" === null)) {
    localStorage.setItem("volume", "1")
  }

  tempoMaximo = tempoPreview[nivelPreview];
  tocarPreview();
});

//lógica para atualizar a barra de tempo da música
function atualizarBarra() {
  const barra = document.querySelector(".tempo-barra");
  intervaloBarra = setInterval(() => {
    if (!audioAtual || audioAtual.paused) return;
    const progresso = (audioAtual.currentTime / tempoMaximo) * 100;
    barra.style.width = `${Math.min(progresso, 100)}%`;
  }, 100);
}

function resetarBarra() {
  document.querySelector(".tempo-barra").style.width = "0%";
}

//lógica de avançar o preview da música
let caixaPulada = document.querySelector(`.t${nivelPreview+1}`)
let caixaChute = document.querySelector(`.t${nivelPreview+2}`)

function avancarPreview() {
  nivelPreview++;
  tempoMaximo = tempoPreview[nivelPreview];
  previewFinalizado = true;
  audioAtual.currentTime = 0;
  tocarPreview();
  caixaPulada = document.querySelector(`.t${nivelPreview+1}`)
  caixaChute = document.querySelector(`.t${nivelPreview+2}`)
}

//lógica de escolher a música para chutar
const inputChute = document.querySelector(".chute-input");
const listaSugestoes = document.querySelector(".sugestoes-musicas");

inputChute.addEventListener("input", () => {
  const termo = inputChute.value.trim().toLowerCase();
  listaSugestoes.innerHTML = "";

  if (!termo || termo.length < 2 || !todasMusicasDoArtista) return;

  const filtradas = todasMusicasDoArtista.filter(m =>
    m.title.toLowerCase().includes(termo)
  );

  filtradas.slice(0, 5).forEach(musica => {
    const li = document.createElement("li");
    li.textContent = musica.title;

    li.addEventListener("click", () => {
      inputChute.value = musica.title;
      listaSugestoes.innerHTML = "";
    });

    listaSugestoes.appendChild(li);
  });
});

//lógica do botão de pular
const botaoPular = document.querySelector(".btn-pular");

botaoPular.addEventListener("click", () => {
  if (nivelPreview < 4) {
    caixaChute.classList.add('ativa')
    caixaPulada.classList.remove('ativa')
    caixaPulada.innerHTML = "⏭️ pulou, covarde"
    
    avancarPreview()

    botaoPular.innerHTML = `PULAR (+${nivelPreview + 1}s)`;
  } else if (nivelPreview === 4) {
    caixaChute.classList.add('ativa')
    caixaPulada.classList.remove('ativa')
    caixaPulada.innerHTML = "⏭️ pulou, covarde"
    
    avancarPreview()

    botaoPular.style.backgroundColor = "#d30101";
    botaoPular.style.color = 'white'
    botaoPular.innerHTML = "DESISTIR";
  } else if (nivelPreview === 5) {
    resposta.classList.remove('escondido')
    inputChute.disabled = true;
    botaoPular.disabled = true;
    botaoPular.style.cursor = 'default';
    botaoPular.style.backgroundColor = "#9e0101ff";
    botaoPular.style.color = '#bdbdbdff'
    botaoChute.disabled = true;

    caixaPulada.innerHTML = "⏭️ pulou, covarde"
    resultado.style.backgroundColor = "#e4cd00ff"
    resultado.innerHTML = 'COVARDE! 🙈🏳️'
    resultado.classList.add('trigger-animation')

    botaoNovo();
  }
});

//lógica botão de chutar
const botaoChute = document.querySelector('.btn-chutar')
const resposta = document.querySelector('.info')
const resultado = document.querySelector('.resultado')

botaoChute.addEventListener('click', () => {
  if (!musicaAtual) {
    alert("Nenhuma música está tocando!");
    return;
  }

  const chute = inputChute.value.trim().toLowerCase();
  const nomeCorreto = musicaAtual.title.trim().toLowerCase();

  if (chute === nomeCorreto) {
    caixaPulada.innerHTML = `✅ ${musicaAtual.title}`
    
    resposta.classList.remove('escondido')
    inputChute.disabled = true;
    botaoPular.disabled = true;
    botaoChute.disabled = true;
    botaoPular.style.cursor = 'default'

    if(nivelPreview === 5) {
      botaoPular.style.backgroundColor = "#9e0101ff";
      botaoPular.style.color = '#bdbdbdff'
      botaoPular.innerHTML = "DESISTIR"
    }

    todasMusicasDoArtista = todasMusicasDoArtista.filter(musica => musica.id !== musicaAtual.id)

    tempoMaximo = 16;
    tocarPreview()

    resultado.innerHTML = 'BOA PINGU 👏🐧'
    resultado.style.backgroundColor = '#03a616'
    resultado.classList.add('trigger-animation')

    botaoNovo()

  } else {
    if(nivelPreview < 4) {
      caixaChute.classList.add('ativa')
      caixaPulada.classList.remove('ativa')
      caixaPulada.innerHTML = `❌ ${inputChute.value.trim()}`
      avancarPreview();
      botaoPular.innerHTML = `PULAR (+${nivelPreview + 1}s)`;
    } else if (nivelPreview === 4){
      caixaChute.classList.add('ativa')
      caixaPulada.classList.remove('ativa')
      caixaPulada.innerHTML = `❌ ${inputChute.value.trim()}`
      avancarPreview();

      botaoPular.style.backgroundColor = "#d30101";
      botaoPular.style.color = 'white'
      botaoPular.innerHTML = "DESISTIR"
    } else if (nivelPreview === 5) {
      caixaPulada.innerHTML = `❌ ${inputChute.value.trim()}`
      resposta.classList.remove('escondido')
      inputChute.disabled = true;
      botaoPular.disabled = true;
      botaoChute.disabled = true;
  
      botaoPular.style.cursor = 'default';
      botaoPular.style.backgroundColor = "#9e0101ff";
      botaoPular.style.color = '#bdbdbdff'

      resultado.innerHTML = 'PERDEU 🫵😂'
      resultado.classList.add('trigger-animation')

      botaoNovo()
    }
  }
  inputChute.value = "";
})

//lógica do botão de novo jogo
const botaoNovoJogo = document.querySelector('.btn-novo-jogo')

function botaoNovo() {
  botaoChute.classList.add('escondido')
  botaoNovoJogo.classList.remove('escondido')
  botaoNovoJogo.addEventListener('click', () => {
    resetaUI()
    nivelPreview = 0
    caixaPulada = document.querySelector(`.t${nivelPreview+1}`)
    caixaChute = document.querySelector(`.t${nivelPreview+2}`)
    audioAtual.pause()
    escolherMusica()
  })
}

function removerFeats() {
  todasMusicasDoArtista = todasMusicasDoArtista.filter(musica => musica.artist.name !== artistaSelecionado.name)
}