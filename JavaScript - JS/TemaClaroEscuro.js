const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const html = document.documentElement;

const THEME_KEY = "gamezone-theme";

function applyTheme(theme) {
    // Aceita somente os dois temas disponíveis.
    if (theme !== "light" && theme !== "dark") {
        theme = "dark";
    }

    html.dataset.theme = theme;

    if (themeIcon) {
        themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
    }

    if (themeToggle) {
        const nextTheme = theme === "dark" ? "claro" : "escuro";

        themeToggle.setAttribute(
            "aria-label",
            `Alternar para o tema ${nextTheme}`
        );
    }

    const themeColor = document.querySelector(
        'meta[name="theme-color"]'
    );

    if (themeColor) {
        themeColor.setAttribute(
            "content",
            theme === "dark" ? "#0d0d12" : "#f4f3f8"
        );
    }
}

// Recupera o tema salvo.
const savedTheme = localStorage.getItem(THEME_KEY);

const initialTheme =
    savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : "dark";

applyTheme(initialTheme);

// Alternância pelo botão do cabeçalho.
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const currentTheme = html.dataset.theme;
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    });
}

// Recebe alterações feitas pelo seletor do perfil.
window.addEventListener("gamezone-theme-change", (event) => {
    const newTheme = event.detail?.theme;

    if (newTheme !== "light" && newTheme !== "dark") {
        return;
    }

    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
});

// Sincroniza o tema caso ele seja alterado em outra aba.
window.addEventListener("storage", (event) => {
    if (event.key === THEME_KEY) {
        const newTheme =
            event.newValue === "light" ? "light" : "dark";

        applyTheme(newTheme);
    }
});