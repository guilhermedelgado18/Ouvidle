import { io } from 'socket.io-client'

console.log('tentando se conectar ao servidor...')

const socket = io('http://localhost:3001')

socket.on('connect', () => {
  console.log('Conectado ao servidor!');
});

const btnTeste = document.querySelector('.testar-socket')

btnTeste.addEventListener('click', () => {
    socket.emit('mensagem', 'Olá, servidor')
})

socket.on('resposta', (msg) => {
    document.querySelector('.resposta-servidor').textContent = msg
})


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

let salaAtual;

const criarSala = document.querySelector('.criar-sala')
const entrarSala = document.querySelector('.entrar-sala')
const conteudoCriar = document.querySelector('.conteudo-criar')
const conteudoEntrar = document.querySelector('.conteudo-entrar')
const btnCriarSala = document.querySelector('.btn-criar-sala')
const usernameInput = document.querySelector('.input-username')
const maxJogadoresInput = document.querySelector('.max-jogadores')
const senhaInput = document.querySelector('.senha-sala')
const btnEntrarSala = document.querySelector('.btn-entrar-sala')
const codigoInput = document.querySelector('.input-sala')


criarSala.addEventListener('click', () => {
    entrarSala.classList.remove('modo-escolhido')
    criarSala.classList.add('modo-escolhido')
    conteudoCriar.classList.remove('escondido')
    conteudoEntrar.classList.add('escondido')
})

entrarSala.addEventListener('click', () => {
    entrarSala.classList.add('modo-escolhido')
    criarSala.classList.remove('modo-escolhido')
    conteudoCriar.classList.add('escondido')
    conteudoEntrar.classList.remove('escondido')
})

function gerarCodigo() {
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let codigo = '';
      for (let i = 0; i < 5; i++) {
        const indice = Math.floor(Math.random() * caracteres.length);
        codigo += caracteres.charAt(indice);
      }
      return codigo;
}

btnCriarSala.addEventListener('click', () => {
    const username = usernameInput.value.toUpperCase().trim()
    const maxJogadores = maxJogadoresInput.value
    const senha = senhaInput.value.trim()
    const codigoGerado = gerarCodigo()

    if(!username) {
      usernameInput.setCustomValidity('Insira um nome')
      usernameInput.reportValidity();
      return
    }

    if(!maxJogadores) {
      maxJogadoresInput.setCustomValidity('Defina um máximo de jogadores')
      maxJogadoresInput.reportValidity();
      return
    }

    salaAtual = codigoGerado

    socket.emit('criarSala', { username, codigoGerado, maxJogadores, senha })

    chatTeste.classList.remove('escondido')
    escolherModo.classList.add('escondido')

    document.querySelector('.chat-codigo').textContent = `${salaAtual}`

    console.log(`Sala atual: ${salaAtual}`)

})

socket.on('salaCriada', (codigoGerado) => {
  console.log('Sala criada: ', codigoGerado)
})

btnEntrarSala.addEventListener('click', () => {
    const username = usernameInput.value.toUpperCase().trim()
    const codigoDigitado = codigoInput.value.trim().toUpperCase()
    
    if(!username) {
      usernameInput.setCustomValidity('Insira um nome')
      usernameInput.reportValidity();
      return
    }

    if(!codigoDigitado) {
      codigoInput.setCustomValidity('Insira o código da sala')
      codigoInput.reportValidity();
      return
    }

    console.log(username, codigoDigitado)

    socket.emit('entrarSala', { username, codigo: codigoDigitado })
})

socket.on('temSenha', (resposta) => {
  salaAtual = resposta.codigoSala
  if(resposta.temSenha === false) {
    console.log(`Tem senha: ${resposta.temSenha}, código: ${resposta.codigoSala}`)
    document.querySelector('.chat-codigo').textContent = `${salaAtual}`
    chatTeste.classList.remove('escondido')
    escolherModo.classList.add('escondido')
  } else {
    abrirModalSenha()
  }
})

//Lógica Modal

const chatTeste = document.querySelector('.chat-teste')
const escolherModo = document.querySelector('.escolher-modo')

const modal = document.getElementById('modal-senha');
const btnConfirmarModal = document.getElementById('btn-confirmar');
const btnCancelarModal = document.getElementById('btn-cancelar');
const inputSenhaModal = document.getElementById('input-senha');

// Abrir o modal
function abrirModalSenha() {
  modal.style.display = 'flex';
  inputSenhaModal.value = '';
  inputSenhaModal.focus();
};

btnCancelarModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

btnConfirmarModal.addEventListener('click', () => {
  const username = usernameInput.value.toUpperCase().trim()
  const senhaDigitadaModal = inputSenhaModal.value.trim();
  if (senhaDigitadaModal) {
    console.log(`Sala atual botão modal: ${salaAtual}. Senha: ${senhaDigitadaModal}`)
    socket.emit('verificarSenha', { username, codigo: salaAtual, senhaDigitada: senhaDigitadaModal })
    inputSenhaModal.value = ''
  } else {
    alert('Digite a senha!');
  }
});

socket.on('respostaSenha', (resposta) => {
  if(resposta.status === true) {
    salaAtual = resposta.codigoSala
    console.log(`Entrou na sala ${salaAtual}`)
    modal.style.display = 'none'
    document.querySelector('.chat-codigo').textContent = `${salaAtual}`
    chatTeste.classList.remove('escondido')
    escolherModo.classList.add('escondido')
  } else {
    console.log('Tente outra vez')
  }
})

socket.on('erroSala', (msg) => {
  alert(`Erro: ${msg}`)
})

//Lógica Sala chat teste


const chat = document.querySelector('.chat');
const inputMensagem = document.querySelector('.mensagem');

function adicionarMensagem(msg) {
  const p = document.createElement('p');
  p.textContent = msg;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

socket.on('mensagemSala', ({ username, texto}) => {
  adicionarMensagem(`${username}: ${texto}`);
});

inputMensagem.addEventListener('keydown', function(event) {
  if(event.key === 'Enter'){
    const msg = inputMensagem.value.trim();
    if (!msg) return;

    socket.emit('mensagemSala', { sala: salaAtual, texto: msg });
    adicionarMensagem(`Você: ${msg}`);
    inputMensagem.value = '';
  };
});