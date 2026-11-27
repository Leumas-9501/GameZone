import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import { auth } from "./firebase-config.js";

// Dados do projeto Supabase
const SUPABASE_URL = "https://vkggqgocicxxlyqhqmpx.supabase.co";
const SUPABASE_KEY = "sb_publishable_yv2uOzrxKJJeoJy55e4lDA_dC2ZTurH";

// Conexão com o Supabase
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        accessToken: async () => {
            const usuario = auth.currentUser;

            return usuario
                ? await usuario.getIdToken()
                : null;
        }
    }
);