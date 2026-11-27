import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// ==================================================
// ELEMENTOS DA PÁGINA
// ==================================================

const form = document.getElementById("form-login");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-senha");
const messageElement = document.getElementById("mensagem-login");
const googleButton = document.getElementById("google-login-btn");

const RETURN_KEY = "gamezone-login-return";

// ==================================================
// MENSAGENS
// ==================================================

function mostrarMensagem(mensagem, tipo = "erro") {
    if (!messageElement) {
        return;
    }

    messageElement.textContent = mensagem;
    messageElement.className = "login-message";
    messageElement.classList.add(`login-message-${tipo}`);
    messageElement.hidden = false;
}

function limparMensagem() {
    if (!messageElement) {
        return;
    }

    messageElement.textContent = "";
    messageElement.className = "login-message";
    messageElement.hidden = true;
}

function traduzirErro(error) {
    switch (error.code) {
        case "auth/invalid-email":
            return "O formato do e-mail é inválido.";

        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "E-mail ou senha incorretos.";

        case "auth/user-disabled":
            return "Esta conta foi desativada.";

        case "auth/too-many-requests":
            return "Muitas tentativas. Aguarde um pouco e tente novamente.";

        case "auth/popup-closed-by-user":
            return "A janela de autenticação foi fechada antes de concluir.";

        case "auth/popup-blocked":
            return "O navegador bloqueou a janela de login. Permita pop-ups e tente novamente.";

        case "auth/network-request-failed":
            return "Falha na conexão. Verifique sua internet.";

        case "auth/operation-not-allowed":
            return "Este método de login não está habilitado no Firebase.";

        default:
            console.error("Erro de autenticação:", error);
            return "Não foi possível entrar. Tente novamente.";
    }
}

// ==================================================
// DESTINO APÓS O LOGIN
// ==================================================

function obterDestinoAposLogin() {
    try {
        const destino = sessionStorage.getItem(RETURN_KEY);

        sessionStorage.removeItem(RETURN_KEY);

        if (!destino) {
            return "index.html";
        }

        // Aceita somente caminhos internos do próprio site.
        // Evita redirecionamentos para sites externos.
        if (
            destino.startsWith("/") &&
            !destino.startsWith("//") &&
            !destino.startsWith("/\\")
        ) {
            return destino;
        }

        if (
            !destino.startsWith("/") &&
            !destino.includes(":") &&
            !destino.startsWith("\\") &&
            !destino.startsWith("?") &&
            !destino.startsWith("#")
        ) {
            return destino;
        }
    } catch (error) {
        console.warn("Não foi possível recuperar a página de retorno:", error);
    }

    return "index.html";
}

function redirecionarAposLogin() {
    window.location.assign(obterDestinoAposLogin());
}

// ==================================================
// LOGIN COM E-MAIL E SENHA
// ==================================================

if (form && emailInput && passwordInput) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        limparMensagem();

        const email = emailInput.value.trim();
        const senha = passwordInput.value;

        if (!email || !senha) {
            mostrarMensagem("Preencha o e-mail e a senha.");
            return;
        }

        const botaoSubmit = form.querySelector(
            'button[type="submit"], input[type="submit"]',
        );

        const textoOriginal = botaoSubmit ? botaoSubmit.textContent : "";

        if (botaoSubmit) {
            botaoSubmit.disabled = true;
            botaoSubmit.textContent = "Entrando...";
        }

        if (googleButton) {
            googleButton.disabled = true;
        }

        try {
            await signInWithEmailAndPassword(auth, email, senha);

            mostrarMensagem("Login realizado! Redirecionando...", "sucesso");

            setTimeout(() => {
                redirecionarAposLogin();
            }, 1000);
        } catch (error) {
            mostrarMensagem(traduzirErro(error));
        } finally {
            if (botaoSubmit) {
                botaoSubmit.disabled = false;

                if (textoOriginal) {
                    botaoSubmit.textContent = textoOriginal;
                }
            }

            if (googleButton) {
                googleButton.disabled = false;
            }
        }
    });
} else {
    console.error(
        "Formulário de login não encontrado. Confira os IDs do login.html.",
    );
}

// ==================================================
// LOGIN COM GOOGLE
// ==================================================

if (googleButton) {
    googleButton.addEventListener("click", async () => {
        limparMensagem();

        googleButton.disabled = true;

        if (form) {
            const botaoSubmit = form.querySelector(
                'button[type="submit"], input[type="submit"]',
            );

            if (botaoSubmit) {
                botaoSubmit.disabled = true;
            }
        }

        try {
            const provider = new GoogleAuthProvider();

            provider.setCustomParameters({
                prompt: "select_account",
            });

            const resultado = await signInWithPopup(auth, provider);
            const usuario = resultado.user;

            const referenciaUsuario = doc(db, "usuarios", usuario.uid);
            const documentoUsuario = await getDoc(referenciaUsuario);


            if (!documentoUsuario.exists()) {
                const partesNome = (usuario.displayName || "").trim().split(" ");

                await setDoc(referenciaUsuario, {
                    nome: partesNome.shift() || "Usuário",
                    sobrenome: partesNome.join(" "),
                    email: usuario.email || "",
                    cpf: "",
                    dataNascimento: "",
                    imagem: usuario.photoURL || null,
                    imagemPath: null,
                    criadoEm: serverTimestamp(),
                    provider: "google",
                    tipoUsuario: "cliente"
                });
            }


            mostrarMensagem("Login realizado! Redirecionando...", "sucesso");
            redirecionarAposLogin();
        } catch (error) {
            mostrarMensagem(traduzirErro(error));
        } finally {
            googleButton.disabled = false;

            if (form) {
                const botaoSubmit = form.querySelector(
                    'button[type="submit"], input[type="submit"]',
                );

                if (botaoSubmit) {
                    botaoSubmit.disabled = false;
                }
            }
        }
    });
}
