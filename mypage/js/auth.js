import { supabase } from "./supabase.js";

export let currentUser = null;
export let userEmail = null;

export async function initAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showCustomAlert("ログインしてください", false);
        throw new Error("Not logged in");
    }
    currentUser = user;
    userEmail = user.email;
}