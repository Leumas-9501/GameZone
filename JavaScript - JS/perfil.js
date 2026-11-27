import { auth, db } from "./firebase-config.js";
import { supabase } from "./supabase-config.js";

import {
    onAuthStateChanged,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    verifyBeforeUpdateEmail,
    updatePassword,
    reload,
    deleteUser,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";


// ==================================================
// ELEMENTOS DA PÁGINA
// ==================================================

// Informações exibidas
const nomeExibicao = document.getElementById("nome-exibicao");
const emailExibicao = document.getElementById("email-exibicao");

const perfilNome = document.getElementById("perfil-nome");
const perfilSobrenome = document.getElementById("perfil-sobrenome");
const perfilCpf = document.getElementById("perfil-cpf");
const perfilNascimento = document.getElementById("perfil-nascimento");
const perfilEmail = document.getElementById("perfil-email");
const perfilDataCriacao = document.getElementById("perfil-data-criacao");

// Foto de Perfil
const fotoPerfil = document.getElementById("foto-perfil");
const botaoFotoPerfil = document.getElementById("botao-foto-perfil");
const arquivoFotoPerfil = document.getElementById("arquivo-foto-perfil");
const acoesFotoPerfil = document.getElementById("acoes-foto-perfil");
const salvarFotoPerfil = document.getElementById("salvar-foto-perfil");
const cancelarFotoPerfil = document.getElementById("cancelar-foto-perfil");
const removerFotoPerfil = document.getElementById("remover-foto-perfil");
const mensagemFotoPerfil = document.getElementById("mensagem-foto-perfil");

const AVATAR_PADRAO = "Imagens/avatar-padrao.png";

let fotoSelecionada = null;
let fotoOriginal = AVATAR_PADRAO;
let urlPreviaFoto = null;

// Formulário de edição
const formEditarPerfil = document.getElementById("form-editar-perfil");

const editarNome = document.getElementById("editar-nome");
const editarSobrenome = document.getElementById("editar-sobrenome");

const botaoSalvarPerfil = document.getElementById("salvar-dados-perfil");
const mensagemEditarPerfil = document.getElementById("mensagem-editar-perfil");

//Segurança da conta
const formAlterarEmail = document.getElementById("form-alterar-email");
const novoEmail = document.getElementById("novo-email");
const senhaConfirmarEmail = document.getElementById("senha-confirmar-email");
const botaoSalvarEmail = document.getElementById("salvar-novo-email");
const mensagemAlterarEmail = document.getElementById("mensagem-alterar-email");

const formAlterarSenha = document.getElementById("form-alterar-senha");
const senhaAtual = document.getElementById("senha-atual");
const novaSenha = document.getElementById("nova-senha");
const confirmarNovaSenha = document.getElementById("confirmar-nova-senha");
const botaoSalvarSenha = document.getElementById("salvar-nova-senha");
const mensagemAlterarSenha = document.getElementById("mensagem-alterar-senha");

// Logout
const botaoLogout = document.getElementById("botao-logout");
const mensagemLogout = document.getElementById("mensagem-logout");

//Exclusão da conta
const formExcluirConta = document.getElementById("form-excluir-conta");
const senhaExcluirConta = document.getElementById("senha-excluir-conta");
const confirmarExclusao = document.getElementById("confirmar-exclusao");
const botaoExcluirConta = document.getElementById("botao-excluir-conta");
const mensagemExcluirConta = document.getElementById("mensagem-excluir-conta");

//Aparência
const temaAparencia = document.getElementById("tema-aparencia");
const mensagemAparencia = document.getElementById("mensagem-aparencia");

const THEME_KEY = "gamezone-theme";


// ==================================================
// VARIÁVEIS
// ==================================================

let usuarioAtual = null;


// ==================================================
// FUNÇÕES AUXILIARES
// ==================================================

function formatarData(data) {

    if (!data) {
        return "Não informada";
    }

    if (typeof data === "string") {

        const [ano, mes, dia] = data.split("-");

        if (ano && mes && dia) {
            return `${dia}/${mes}/${ano}`;
        }

        return data;
    }

    return "Não informada";
}


function formatarCpf(valor) {
    const numeros = String(valor || "").replace(/\D/g, "").slice(0, 11);

    if (!numeros) {
        return "";
    }

    return numeros
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
}


function formatarDataCriacao(dataCriacao) {

    if (!dataCriacao) {
        return "Não disponível";
    }

    return dataCriacao.toLocaleDateString("pt-BR");
}


// ==================================================
// PREENCHER INFORMAÇÕES DO PERFIL
// ==================================================

function preencherPerfil(dadosUsuario, email) {

    const nome = dadosUsuario.nome || "";
    const sobrenome = dadosUsuario.sobrenome || "";

    // Resumo do usuário
    nomeExibicao.textContent =
        nome
            ? `${nome} ${sobrenome}`.trim()
            : "Não informado";

    emailExibicao.textContent = email;

    // Informações detalhadas
    perfilNome.textContent = nome || "Não informado";

    perfilSobrenome.textContent =
        sobrenome || "Não informado";

    perfilCpf.textContent =
        formatarCpf(dadosUsuario.cpf) || "Não informado";

    perfilNascimento.textContent =
        formatarData(dadosUsuario.dataNascimento);

    perfilEmail.textContent = email;

    // Carrega a foto de perfil salva
    fotoOriginal = dadosUsuario.imagem || AVATAR_PADRAO;
    fotoPerfil.src = fotoOriginal;
    fotoPerfil.alt = dadosUsuario.imagem
        ? "Foto de perfil do usuário"
        : "Foto de perfil padrão";

    // Preenchimento do formulário
    editarNome.value = nome;

    editarSobrenome.value = sobrenome;
}


// ==================================================
// CARREGAR PERFIL
// ==================================================

onAuthStateChanged(auth, async (usuario) => {

    // Verifica se existe usuário autenticado
    if (!usuario) {

        usuarioAtual = null;

        window.location.replace("login.html");

        return;
    }

    usuarioAtual = usuario;


    try {

        // Atualiza os dados mais recentes do Authentication
        await reload(usuario);

        const emailAtualizado =
            usuario.email || "Não informado";

        // Referência ao documento do usuário no Firestore
        const referenciaUsuario = doc(
            db,
            "usuarios",
            usuario.uid
        );

        const documentoUsuario = await getDoc(
            referenciaUsuario
        );

        let dadosUsuario = {};

        if (documentoUsuario.exists()) {

            dadosUsuario = documentoUsuario.data();

            // Sincroniza o e-mail com o Firestore, se necessário
            if (dadosUsuario.email !== emailAtualizado) {

                await updateDoc(referenciaUsuario, {
                    email: emailAtualizado
                });

                dadosUsuario.email = emailAtualizado;
            }
        }

        // Preenche a página e o formulário
        preencherPerfil(dadosUsuario, emailAtualizado);

        // Data de criação da conta
        perfilDataCriacao.textContent =
            formatarDataCriacao(
                usuario.metadata.creationTime
                    ? new Date(usuario.metadata.creationTime)
                    : null
            );

    } catch (erro) {

        console.error(
            "Erro ao carregar o perfil:",
            erro
        );

        nomeExibicao.textContent = "Erro ao carregar";

        emailExibicao.textContent =
            "Tente novamente mais tarde.";

    }


});


// ========================================
// FOTO DE PERFIL
// ========================================

// Abre o seletor de arquivos ao clicar no avatar
botaoFotoPerfil.addEventListener("click", () => {
    arquivoFotoPerfil.click();
});

// Seleciona e mostra a prévia da imagem
arquivoFotoPerfil.addEventListener("change", () => {
    const arquivo = arquivoFotoPerfil.files[0];

    if (!arquivo) return;

    const formatosPermitidos = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
        mensagemFotoPerfil.textContent =
            "Formato inválido. Utilize PNG, JPEG ou WebP.";

        arquivoFotoPerfil.value = "";
        return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
        mensagemFotoPerfil.textContent =
            "A imagem deve ter no máximo 2 MB.";

        arquivoFotoPerfil.value = "";
        return;
    }

    // Libera uma prévia anterior, se existir
    if (urlPreviaFoto) {
        URL.revokeObjectURL(urlPreviaFoto);
    }

    fotoSelecionada = arquivo;
    urlPreviaFoto = URL.createObjectURL(arquivo);

    fotoPerfil.src = urlPreviaFoto;
    fotoPerfil.alt = "Prévia da nova foto de perfil";

    acoesFotoPerfil.hidden = false;
    mensagemFotoPerfil.textContent =
        "Prévia carregada. Clique em salvar para confirmar.";
});


// Salva a nova imagem no Supabase
salvarFotoPerfil.addEventListener("click", async () => {
    if (!fotoSelecionada || !usuarioAtual) {
        mensagemFotoPerfil.textContent =
            "Selecione uma imagem antes de salvar.";
        return;
    }

    salvarFotoPerfil.disabled = true;
    cancelarFotoPerfil.disabled = true;

    mensagemFotoPerfil.textContent = "Enviando imagem...";

    try {

        const extensoes = {
            "image/png": "png",
            "image/jpeg": "jpg",
            "image/webp": "webp"
        };

        const referenciaUsuario = doc(db, "usuarios", usuarioAtual.uid);

        const documentoAnterior = await getDoc(referenciaUsuario);

        const caminhoImagemAntiga = documentoAnterior.exists()
            ? documentoAnterior.data().imagemPath
            : null;

        const extensao = extensoes[fotoSelecionada.type];

        // Cada imagem recebe um nome único
        const caminhoImagem =
            `${usuarioAtual.uid}/perfil-${Date.now()}.${extensao}`;

        // Envia a imagem
        const { error: erroUpload } = await supabase
            .storage
            .from("fotos-perfil")
            .upload(caminhoImagem, fotoSelecionada, {
                contentType: fotoSelecionada.type,
                upsert: false
            });

        if (erroUpload) {
            throw erroUpload;
        }

        // Obtém o endereço público da imagem
        const { data } = supabase
            .storage
            .from("fotos-perfil")
            .getPublicUrl(caminhoImagem);

        const urlImagem = data.publicUrl;

        // Guarda a URL e o caminho no Firestore
        await updateDoc(doc(db, "usuarios", usuarioAtual.uid), {
            imagem: urlImagem,
            imagemPath: caminhoImagem
        });

        // Remove a imagem anterior depois de salvar a nova
        if (caminhoImagemAntiga) {
            const { error } = await supabase
                .storage
                .from("fotos-perfil")
                .remove([caminhoImagemAntiga]);

            if (error) {
                console.warn("Não foi possível remover a foto antiga:", error);
            }
        }

        // Atualiza a foto exibida
        fotoOriginal = urlImagem;
        fotoPerfil.src = urlImagem;
        fotoPerfil.alt = "Foto de perfil do usuário";

        // A imagem atual já foi atualizada.
        // A limpeza de arquivos antigos será feita separadamente.

        fotoSelecionada = null;
        arquivoFotoPerfil.value = "";
        acoesFotoPerfil.hidden = true;

        if (urlPreviaFoto) {
            URL.revokeObjectURL(urlPreviaFoto);
            urlPreviaFoto = null;
        }

        mensagemFotoPerfil.textContent =
            "Foto de perfil atualizada com sucesso!";

    } catch (erro) {
        console.error("Erro ao salvar foto:", erro);

        mensagemFotoPerfil.textContent =
            "Não foi possível salvar a foto. Verifique sua conexão e tente novamente.";

        fotoPerfil.src = fotoOriginal;

    } finally {
        salvarFotoPerfil.disabled = false;
        cancelarFotoPerfil.disabled = false;
    }
});


// Cancela a seleção da imagem
cancelarFotoPerfil.addEventListener("click", () => {
    fotoSelecionada = null;
    arquivoFotoPerfil.value = "";

    fotoPerfil.src = fotoOriginal;
    fotoPerfil.alt = fotoOriginal === AVATAR_PADRAO
        ? "Foto de perfil padrão"
        : "Foto de perfil do usuário";

    acoesFotoPerfil.hidden = true;
    mensagemFotoPerfil.textContent = "";

    if (urlPreviaFoto) {
        URL.revokeObjectURL(urlPreviaFoto);
        urlPreviaFoto = null;
    }
});


// Restaura o avatar padrão
removerFotoPerfil.addEventListener("click", async () => {
    if (!usuarioAtual) return;

    const confirmar = confirm(
        "Deseja realmente restaurar a foto de perfil padrão?"
    );

    if (!confirmar) return;

    removerFotoPerfil.disabled = true;
    mensagemFotoPerfil.textContent = "Restaurando foto...";

    try {
        const referenciaUsuario = doc(
            db,
            "usuarios",
            usuarioAtual.uid
        );

        const dados = await getDoc(referenciaUsuario);
        const dadosUsuario = dados.exists() ? dados.data() : {};

        // Remove o arquivo antigo do Storage, se existir
        if (dadosUsuario.imagemPath) {
            const { error } = await supabase
                .storage
                .from("fotos-perfil")
                .remove([dadosUsuario.imagemPath]);

            if (error) throw error;
        }

        // Limpa os dados da foto no Firestore
        await updateDoc(referenciaUsuario, {
            imagem: null,
            imagemPath: null
        });

        fotoOriginal = AVATAR_PADRAO;
        fotoPerfil.src = AVATAR_PADRAO;
        fotoPerfil.alt = "Foto de perfil padrão";

        fotoSelecionada = null;
        arquivoFotoPerfil.value = "";
        acoesFotoPerfil.hidden = true;

        if (urlPreviaFoto) {
            URL.revokeObjectURL(urlPreviaFoto);
            urlPreviaFoto = null;
        }

        mensagemFotoPerfil.textContent =
            "Foto de perfil restaurada com sucesso!";

    } catch (erro) {
        console.error("Erro ao restaurar foto:", erro);

        mensagemFotoPerfil.textContent =
            "Não foi possível restaurar a foto. Tente novamente.";

    } finally {
        removerFotoPerfil.disabled = false;
    }
});



// ==================================================
// ATUALIZAR DADOS DO PERFIL NO FIRESTORE
// ==================================================

if (formEditarPerfil) {

    formEditarPerfil.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        // Verifica a autenticação
        if (!usuarioAtual || !auth.currentUser ||
            usuarioAtual.uid !== auth.currentUser.uid) {

            mensagemEditarPerfil.textContent =
                "Sua sessão expirou. Entre novamente.";

            return;
        }

        // Captura os valores dos campos
        const nome = editarNome.value.trim();

        const sobrenome = editarSobrenome.value.trim();

        // Validação dos campos
        if (!nome || !sobrenome) {

            mensagemEditarPerfil.textContent =
                "Preencha todos os campos antes de salvar.";

            return;
        }

        try {

            // Desabilita o botão durante o salvamento
            botaoSalvarPerfil.disabled = true;

            mensagemEditarPerfil.textContent =
                "Salvando alterações...";

            // Referência ao documento do usuário autenticado
            const referenciaUsuario = doc(
                db,
                "usuarios",
                usuarioAtual.uid
            );

            // Atualiza os dados no Firestore
            await updateDoc(referenciaUsuario, {

                nome: nome,

                sobrenome: sobrenome,

            });

            // Atualiza as informações exibidas na página
            preencherPerfil({
                nome: nome,
                sobrenome: sobrenome,
                imagem: fotoOriginal
            }, usuarioAtual.email || "Não informado");

            // Mensagem de confirmação
            mensagemEditarPerfil.textContent =
                "Seus dados foram atualizados com sucesso!";

        } catch (erro) {

            console.error(
                "Erro ao atualizar os dados do perfil:",
                erro
            );

            if (erro.code === "not-found") {

                mensagemEditarPerfil.textContent =
                    "O cadastro não foi encontrado no banco de dados.";

            } else if (erro.code === "permission-denied") {

                mensagemEditarPerfil.textContent =
                    "Você não tem permissão para alterar esses dados.";

            } else {

                mensagemEditarPerfil.textContent =
                    "Não foi possível salvar as alterações. Tente novamente.";

            }

        } finally {

            botaoSalvarPerfil.disabled = false;

        }

    });

}

// ==================================================
// ALTERAR E-MAIL DA CONTA
// ==================================================

if (formAlterarEmail) {

    formAlterarEmail.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        if (!usuarioAtual || !auth.currentUser) {
            mensagemAlterarEmail.textContent =
                "Sua sessão expirou. Entre novamente.";
            return;
        }

        const emailNovo = novoEmail.value.trim();
        const senha = senhaConfirmarEmail.value;

        if (!emailNovo || !senha) {
            mensagemAlterarEmail.textContent =
                "Preencha todos os campos.";
            return;
        }

        if (emailNovo === auth.currentUser.email) {
            mensagemAlterarEmail.textContent =
                "O novo e-mail deve ser diferente do atual.";
            return;
        }

        try {

            botaoSalvarEmail.disabled = true;

            mensagemAlterarEmail.textContent =
                "Confirmando sua identidade...";

            const credencial = EmailAuthProvider.credential(
                auth.currentUser.email,
                senha
            );

            await reauthenticateWithCredential(
                auth.currentUser,
                credencial
            );

            mensagemAlterarEmail.textContent =
                "Enviando solicitação de alteração...";

            await verifyBeforeUpdateEmail(
                auth.currentUser,
                emailNovo
            );

            mensagemAlterarEmail.textContent =
                "Solicitação enviada! Verifique a caixa de entrada do novo e-mail para confirmar a alteração.";

            formAlterarEmail.reset();

        } catch (erro) {

            console.error("Erro ao alterar e-mail:", erro);

            if (erro.code === "auth/wrong-password" ||
                erro.code === "auth/invalid-credential") {

                mensagemAlterarEmail.textContent =
                    "A senha atual está incorreta.";

            } else if (erro.code === "auth/email-already-in-use") {

                mensagemAlterarEmail.textContent =
                    "Esse e-mail já está sendo utilizado por outra conta.";

            } else if (erro.code === "auth/invalid-email") {

                mensagemAlterarEmail.textContent =
                    "O e-mail informado é inválido.";

            } else if (erro.code === "auth/requires-recent-login") {

                mensagemAlterarEmail.textContent =
                    "Faça login novamente para realizar essa alteração.";

            } else {

                mensagemAlterarEmail.textContent =
                    "Não foi possível solicitar a alteração do e-mail.";

            }

        } finally {

            botaoSalvarEmail.disabled = false;

        }

    });

}

// ==================================================
// ALTERAR SENHA DA CONTA
// ==================================================

if (formAlterarSenha) {

    formAlterarSenha.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        if (!usuarioAtual || !auth.currentUser) {
            mensagemAlterarSenha.textContent =
                "Sua sessão expirou. Entre novamente.";
            return;
        }

        const senhaAntiga = senhaAtual.value;
        const senhaNova = novaSenha.value;
        const senhaConfirmacao = confirmarNovaSenha.value;

        if (!senhaAntiga || !senhaNova || !senhaConfirmacao) {
            mensagemAlterarSenha.textContent =
                "Preencha todos os campos.";
            return;
        }

        if (senhaNova.length < 8) {
            mensagemAlterarSenha.textContent =
                "A nova senha deve ter pelo menos 8 caracteres.";
            return;
        }

        if (senhaNova !== senhaConfirmacao) {
            mensagemAlterarSenha.textContent =
                "As novas senhas não coincidem.";
            return;
        }

        if (senhaAntiga === senhaNova) {
            mensagemAlterarSenha.textContent =
                "A nova senha deve ser diferente da atual.";
            return;
        }

        try {

            botaoSalvarSenha.disabled = true;

            mensagemAlterarSenha.textContent =
                "Confirmando sua identidade...";

            const credencial = EmailAuthProvider.credential(
                auth.currentUser.email,
                senhaAntiga
            );

            await reauthenticateWithCredential(
                auth.currentUser,
                credencial
            );

            mensagemAlterarSenha.textContent =
                "Atualizando senha...";

            await updatePassword(
                auth.currentUser,
                senhaNova
            );

            mensagemAlterarSenha.textContent =
                "Senha alterada com sucesso!";

            formAlterarSenha.reset();

        } catch (erro) {

            console.error("Erro ao alterar senha:", erro);

            if (erro.code === "auth/wrong-password" ||
                erro.code === "auth/invalid-credential") {

                mensagemAlterarSenha.textContent =
                    "A senha atual está incorreta.";

            } else if (erro.code === "auth/weak-password") {

                mensagemAlterarSenha.textContent =
                    "A nova senha não atende aos requisitos de segurança.";

            } else if (erro.code === "auth/requires-recent-login") {

                mensagemAlterarSenha.textContent =
                    "Faça login novamente antes de alterar a senha.";

            } else {

                mensagemAlterarSenha.textContent =
                    "Não foi possível alterar a senha. Tente novamente.";

            }

        } finally {

            botaoSalvarSenha.disabled = false;

        }

    });

}

// Exclusão da conta
formExcluirConta.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    // Verifica se a confirmação foi marcada
    if (!confirmarExclusao.checked) {
        mensagemExcluirConta.textContent =
            "Marque a confirmação antes de continuar.";
        return;
    }

    // Verifica se a senha foi preenchida
    if (!senhaExcluirConta.value.trim()) {
        mensagemExcluirConta.textContent =
            "Digite sua senha para confirmar.";
        return;
    }

    mensagemExcluirConta.textContent = "";

    const usuario = auth.currentUser;

    if (!usuario || !usuario.email) {
        mensagemExcluirConta.textContent =
            "Não foi possível identificar sua conta. Faça login novamente.";
        return;
    }

    // Verifica os provedores de autenticação da conta
    const possuiLoginEmailSenha = usuario.providerData.some(
        provedor => provedor.providerId === "password"
    );

    let exclusaoConcluida = false;

    try {
        botaoExcluirConta.disabled = true;

        mensagemExcluirConta.textContent =
            "Confirmando sua identidade...";

        // Verifica se a conta utiliza e-mail e senha
        if (!possuiLoginEmailSenha) {
            mensagemExcluirConta.textContent =
                "Sua conta não utiliza login por senha. " +
                "O método de confirmação precisa ser adequado ao seu login.";

            return;
        }

        // Reautentica o usuário com e-mail e senha
        const credencial = EmailAuthProvider.credential(
            usuario.email,
            senhaExcluirConta.value
        );

        await reauthenticateWithCredential(usuario, credencial);

        mensagemExcluirConta.textContent =
            "Identidade confirmada. Preparando exclusão...";

        // Confirma se a sessão ainda pertence ao usuário que iniciou a exclusão
        if (!auth.currentUser || auth.currentUser.uid !== usuario.uid) {
            mensagemExcluirConta.textContent =
                "A sessão foi alterada. Faça login novamente antes de excluir a conta.";
            return;
        }

        // Recupera o documento do usuário
        const referenciaUsuario = doc(db, "usuarios", usuario.uid);
        const documentoUsuario = await getDoc(referenciaUsuario);

        const dadosUsuario = documentoUsuario.exists()
            ? documentoUsuario.data()
            : {};

        // Recupera o caminho da foto, caso exista
        const caminhoFoto = dadosUsuario.imagemPath || null;

        // Remove a foto do Storage, se existir
        if (caminhoFoto) {
            mensagemExcluirConta.textContent =
                "Removendo foto de perfil...";

            const { error: erroFoto } = await supabase
                .storage
                .from("fotos-perfil")
                .remove([caminhoFoto]);

            if (erroFoto) {
                throw erroFoto;
            }
        }

        // Remove o perfil do Firestore
        mensagemExcluirConta.textContent =
            "Removendo dados do perfil...";

        await deleteDoc(referenciaUsuario);

        // Exclui a conta do Firebase Authentication
        mensagemExcluirConta.textContent =
            "Finalizando exclusão da conta...";

        await deleteUser(usuario);

        exclusaoConcluida = true;

        mensagemExcluirConta.textContent =
            "Conta excluída com sucesso! Redirecionando...";

        window.location.replace("index.html");

    } catch (erro) {
        console.error("Erro ao excluir conta:", erro);

        switch (erro.code) {
            case "auth/wrong-password":
            case "auth/invalid-credential":
                mensagemExcluirConta.textContent =
                    "Senha incorreta. Verifique sua senha e tente novamente.";
                break;

            case "auth/requires-recent-login":
                mensagemExcluirConta.textContent =
                    "Sua sessão expirou. Entre novamente na conta e tente excluir.";
                break;

            case "auth/too-many-requests":
                mensagemExcluirConta.textContent =
                    "Muitas tentativas realizadas. Aguarde um pouco antes de tentar novamente.";
                break;

            default:
                mensagemExcluirConta.textContent =
                    "Ocorreu um erro ao excluir sua conta. " +
                    "Tente novamente mais tarde ou entre em contato com o suporte.";
                break;
        }

    } finally {
        if (!exclusaoConcluida) {
            botaoExcluirConta.disabled = false;
        }
    }
});

// ==================================================
// CONFIGURAÇÃO DE APARÊNCIA
// ==================================================

if (temaAparencia) {

    // Recupera a preferência salva.
    const temaSalvo = localStorage.getItem(THEME_KEY);

    temaAparencia.value =
        temaSalvo === "light" ? "claro" : "escuro";

    // Altera o tema quando o usuário seleciona uma opção.
    temaAparencia.addEventListener("change", () => {

        const novoTema =
            temaAparencia.value === "claro" ? "light" : "dark";

        // Comunica a alteração ao TemaClaroEscuro.js.
        window.dispatchEvent(
            new CustomEvent("gamezone-theme-change", {
                detail: {
                    theme: novoTema
                }
            })
        );

        if (mensagemAparencia) {
            mensagemAparencia.textContent =
                "Tema atualizado com sucesso!";
        }

    });

}


// ==================================================
// LOGOUT
// ==================================================

if (botaoLogout) {

    botaoLogout.addEventListener("click", async () => {

        try {

            botaoLogout.disabled = true;

            if (mensagemLogout) {

                mensagemLogout.textContent =
                    "Encerrando sessão...";

            }

            await signOut(auth);

            window.location.replace("index.html");

        } catch (erro) {

            console.error(
                "Erro ao sair da conta:",
                erro
            );

            if (mensagemLogout) {

                mensagemLogout.textContent =
                    "Não foi possível sair da conta. Tente novamente.";

            }

            botaoLogout.disabled = false;

        }

    });

}