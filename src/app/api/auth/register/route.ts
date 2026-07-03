import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/mongo/users";
import type { UserRole, AgeGroup } from "@/types";

const VALID_ROLES: UserRole[] = ["credente", "madre", "padre", "ospite_chiesa"];
const VALID_AGE_GROUPS: AgeGroup[] = ["0-11", "12-18", "19-29", "30-45", "46-65", "65+"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, password, nome, cognome, role, ageGroup, chiesa, requestAdmin } = body;

    // --- Validazione ---
    if (!email || !username || !password || !nome || !cognome || !role || !ageGroup) {
      return NextResponse.json(
        { success: false, error: "Tutti i campi obbligatori devono essere compilati" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@") || email.length > 254) {
      return NextResponse.json(
        { success: false, error: "Email non valida" },
        { status: 400 }
      );
    }

    if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 20 || !/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      return NextResponse.json(
        { success: false, error: "Username non valido (3-20 caratteri, solo lettere, numeri, _ -)" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { success: false, error: "La password deve essere tra 8 e 128 caratteri" },
        { status: 400 }
      );
    }

    const passwordRules = validatePasswordRules(password);
    if (Object.values(passwordRules).some((rule) => !rule)) {
      return NextResponse.json(
        { success: false, error: "La password deve contenere almeno una lettera maiuscola, una lettera minuscola, un numero e un carattere speciale" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Ruolo non valido" },
        { status: 400 }
      );
    }

    if (!VALID_AGE_GROUPS.includes(ageGroup)) {
      return NextResponse.json(
        { success: false, error: "Fascia d'età non valida" },
        { status: 400 }
      );
    }

    if (typeof nome !== "string" || nome.length < 1 || nome.length > 100) {
      return NextResponse.json(
        { success: false, error: "Nome non valido" },
        { status: 400 }
      );
    }

    if (typeof cognome !== "string" || cognome.length < 1 || cognome.length > 100) {
      return NextResponse.json(
        { success: false, error: "Cognome non valido" },
        { status: 400 }
      );
    }

    // --- Controlla duplicati ---
    const existingEmail = await findUserByEmail(email.toLowerCase().trim());
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email già registrata" },
        { status: 409 }
      );
    }

    const existingUsername = await findUserByUsername(username.trim());
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: "Username già in uso" },
        { status: 409 }
      );
    }

    // --- Crea utente ---
    const passwordHash = await hashPassword(password);
    const user = await createUser({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
      nome: nome.trim(),
      cognome: cognome.trim(),
      role,
      ageGroup,
      chiesa: chiesa?.trim() || undefined,
      adminRequest: requestAdmin === true,
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    console.error("Errore registrazione:", err);
    // Controlla errori di duplicato MongoDB
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return NextResponse.json(
        { success: false, error: "Email o username già in uso" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Errore del server" },
      { status: 500 }
    );
  }
}
