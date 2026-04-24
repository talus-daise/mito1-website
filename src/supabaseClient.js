import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabaseUrl = "https://mgsbwkidyxmicbacqeeh.supabase.co";
export const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc2J3a2lkeXhtaWNiYWNxZWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NDA0MjIsImV4cCI6MjA1NTUxNjQyMn0.fNkFQykD9ezBirtJM_fOB7XEIlGU1ZFoejCgrYObElg";

const globalKey = "__mito1_supabase_singleton__";

const singleton = globalThis[globalKey] ?? (globalThis[globalKey] = {});

if (!singleton.client) {
    singleton.client = createClient(supabaseUrl, supabaseKey);
}

export const supabase = singleton.client;

if (!singleton.authCallPromises) {
    singleton.authCallPromises = {
        getUser: null,
        getSession: null
    };
}

function serializeAuthCall(key, fn) {
    const pending = singleton.authCallPromises[key];
    if (pending) return pending;

    const nextPromise = fn().finally(() => {
        if (singleton.authCallPromises[key] === nextPromise) {
            singleton.authCallPromises[key] = null;
        }
    });

    singleton.authCallPromises[key] = nextPromise;
    return nextPromise;
}

if (!singleton.authWrapped) {
    const originalGetUser = supabase.auth.getUser.bind(supabase.auth);
    const originalGetSession = supabase.auth.getSession.bind(supabase.auth);

    supabase.auth.getUser = (...args) => serializeAuthCall("getUser", () => originalGetUser(...args));
    supabase.auth.getSession = (...args) => serializeAuthCall("getSession", () => originalGetSession(...args));

    singleton.authWrapped = true;
}
