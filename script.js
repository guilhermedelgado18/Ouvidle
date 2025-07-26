const sliderVolume = document.getElementById("controle-volume");

sliderVolume.addEventListener("input", () => {
  if (audioAtual) {
    audioAtual.volume = parseFloat(sliderVolume.value);
  }
});


let nomeArtista = document.querySelector('.nome-artista')
const artistaSalvo = JSON.parse(localStorage.getItem("artistaSelecionado"))

nomeArtista.innerHTML = artistaSalvo.name

function getArtistaSelecionado() {
  const salvo = localStorage.getItem("artistaSelecionado");
  try {
    return salvo ? JSON.parse(salvo) : null;
  } catch (e) {
    console.error("Erro ao ler artista do localStorage:", e);
    return null;
  }
}

let artistaSelecionado = getArtistaSelecionado();


let audioAtual = null;
let musicaAtual = null;
let tocando = false;
let nivelPreview = 0;
let tempoPreview = [1, 2, 4, 7, 11, 16];
let tempoMaximo = tempoPreview[nivelPreview];
let timeoutCorte = null;
let intervaloBarra = null;

let previewFinalizado = false;

function tocarPreview() {
  if (!audioAtual) return;

  // Se está tocando, pausa normalmente
  if (!audioAtual.paused) {
    audioAtual.pause();
    tocando = false;
    atualizarIconePlay(false);
    clearTimeout(timeoutCorte);
    clearInterval(intervaloBarra);
    previewFinalizado = false;
    return;
  }

  // Se preview já terminou, volta ao início
  if (previewFinalizado) {
    audioAtual.currentTime = 0;
    previewFinalizado = false;
  }

  // Retoma ou inicia a reprodução
  audioAtual.play().then(() => {
    tocando = true;
    atualizarIconePlay(true);
    atualizarBarra();

    const tempoRestante = (tempoMaximo - audioAtual.currentTime) * 1000;
    timeoutCorte = setTimeout(() => {
      audioAtual.pause();
      tocando = false;
      atualizarIconePlay(false);
      clearInterval(intervaloBarra);
      previewFinalizado = true; // marca que chegou ao fim do preview
    }, tempoRestante);
  }).catch((e) => {
    console.error("Erro ao tocar o áudio:", e);
  });
}




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

function atualizarIconePlay(tocando) {
  const botao = document.querySelector(".botao-player");
  if (tocando) {
    botao.classList.add("tocando");
  } else {
    botao.classList.remove("tocando");
  }
}

document.querySelector(".botao-player").addEventListener("click", () => {
  if (!musicaAtual || !audioAtual) {
    alert("Selecione um artista primeiro.");
    return;
  }

  tempoMaximo = tempoPreview[nivelPreview];
  tocarPreview();
});

const botaoPular = document.querySelector(".btn-pular");
botaoPular.innerHTML = `PULAR (+1s)`;

botaoPular.addEventListener("click", () => {
  
});

const input = document.querySelector(".pesquisa-artista");
const lista = document.querySelector(".sugestoes-artistas");

input.addEventListener("input", () => {
  const termo = input.value.trim();

  if (termo.length < 2) {
    lista.innerHTML = "";
    return;
  }

  const antigo = document.getElementById("jsonp-script");
  if (antigo) antigo.remove();

  window.deezerCallback = function (res) {
    lista.innerHTML = "";

    if (!res.data || res.data.length === 0) {
      lista.innerHTML = "<li>Nenhum artista encontrado</li>";
      return;
    }

    res.data.forEach((artista) => {
      const li = document.createElement("li");
      li.textContent = artista.name;

      li.addEventListener("click", () => {
        input.value = artista.name;
        lista.innerHTML = "";
        artistaSelecionado = artista;
        localStorage.setItem("artistaSelecionado", JSON.stringify(artista));

        window.location.reload();
        
      });

      lista.appendChild(li);
    });
  };

  const script = document.createElement("script");
  script.id = "jsonp-script";
  script.src = `https://api.deezer.com/search/artist?q=${encodeURIComponent(
    termo
  )}&output=jsonp&callback=deezerCallback`;

  document.body.appendChild(script);
});

input.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    artistaSelecionado = getArtistaSelecionado();
    
    if (!artistaSelecionado) {
      alert("Selecione um artista da lista.");
      return;
    }

    // Resetar estado
    if (audioAtual) {
      audioAtual.pause();
      audioAtual = null;
    }

    musicaAtual = null;
    nivelPreview = 0;
    tempoMaximo = tempoPreview[nivelPreview];
    resetarBarra();

    botaoPular.disabled = false;
    botaoPular.style.backgroundColor = "";
    botaoPular.style.cursor = "pointer";
    botaoPular.innerHTML = "PULAR (+1s)";

    // Salva no localStorage e carrega música
    localStorage.setItem("artistaSelecionado", JSON.stringify(artistaSelecionado));
    await buscarMusicaDoArtista(artistaSelecionado.id);
  }
});

let todasMusicasDoArtista = [];

async function buscarMusicaDoArtista(artistaId) {
  try {
    const res = await fetch(`http://localhost:3001/api/musicas?artistaId=${artistaId}`);
    const json = await res.json();

    if (!json.data || json.data.length === 0) {
      alert("Nenhuma música encontrada para este artista.");
      return;
    }

    todasMusicasDoArtista = json.data;

     const index = Math.floor(Math.random() * todasMusicasDoArtista.length);
    musicaAtual = todasMusicasDoArtista[index];
    audioAtual = new Audio(musicaAtual.preview);

    document.querySelector(".info-imagem").innerHTML = `
      <img src="${musicaAtual.album.cover_medium}" />
    `;

    document.querySelector(".info-desc").innerHTML = `
      <p class='info-titulo'>${musicaAtual.title}</p>
      <p class='info-artista'>${musicaAtual.artist.name}</p>
      <p class='info-album'>${musicaAtual.album.title}</p>
    `;


  } catch (err) {
    console.error("Erro ao carregar música do artista salvo:", err);
  }

  console.log("Música carregada:", musicaAtual.title, musicaAtual.preview);
}

document.addEventListener("DOMContentLoaded", () => {
  artistaSelecionado = getArtistaSelecionado();
  if (artistaSelecionado) {
    buscarMusicaDoArtista(artistaSelecionado.id);
  }
});


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

const botaoChute = document.querySelector('.btn-chutar')
const resposta = document.querySelector('.info')
const resultado = document.querySelector('.resultado')

botaoChute.addEventListener('click', function funcaoBotaoChute() {
  if (!musicaAtual) {
    alert("Nenhuma música está tocando!");
    return;
  }

  const ativa = document.querySelector('.ativa')
  const chute = inputChute.value.trim().toLowerCase();
  const nomeCorreto = musicaAtual.title.trim().toLowerCase();

  if (chute === nomeCorreto) {
    ativa.innerHTML = `✅ ${musicaAtual.title}`
    
    resposta.classList.remove('escondido')
    inputChute.disabled = true;
    botaoPular.disabled = true;
    botaoChute.disabled = true;
    botaoPular.style.cursor = 'default'

    if(nivelPreview === 5) {
      botaoPular.style.backgroundColor = "#9e0101ff";
    }

    resultado.innerHTML = 'BOA PINGU 👏🐧'
    resultado.style.backgroundColor = '#03a616'
    resultado.classList.add('trigger-animation')

    botaoNovo()

  } else {
    if(nivelPreview < 5) {
      avancarPreview();
      ativa.innerHTML = `❌ ${inputChute.value.trim()}`
    } else {
      const ultima = document.querySelector('.t6')
      ultima.innerHTML = `❌ ${inputChute.value.trim()}`
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

  inputChute.value = ""; // limpa o input
})


function avancarPreview() {
  let caixaPulada = document.querySelector(`.t${nivelPreview+1}`)
  let caixaChute = document.querySelector(`.t${nivelPreview+2}`)
  
  if (nivelPreview < 4) {
    caixaChute.classList.add('ativa')
    caixaPulada.classList.remove('ativa')
    caixaPulada.innerHTML = "⏭️ pulou, covarde"
    
    nivelPreview++;
    tempoMaximo = tempoPreview[nivelPreview];
    previewFinalizado = true;
    tocarPreview();
    botaoPular.innerHTML = `PULAR (+${nivelPreview + 1}s)`;
  } else if (nivelPreview === 4) {
    caixaChute.classList.add('ativa')
    caixaPulada.classList.remove('ativa')
    caixaPulada.innerHTML = "⏭️ pulou, covarde"
    
    nivelPreview++;
    tempoMaximo = tempoPreview[nivelPreview];
    previewFinalizado = true;
    tocarPreview();
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
}

const botaoNovoJogo = document.querySelector('.btn-novo-jogo')

function botaoNovo() {
  botaoChute.classList.add('escondido')
  botaoNovoJogo.classList.remove('escondido')
  botaoNovoJogo.addEventListener('click', () => {
    window.location.reload();
  })
}

botaoPular.addEventListener('click', avancarPreview)