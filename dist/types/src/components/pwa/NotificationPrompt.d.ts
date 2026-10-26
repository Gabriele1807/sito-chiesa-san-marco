/**
 * Invito ad attivare le notifiche degli avvisi, mostrato solo dentro l'app
 * installata (su iPhone le notifiche esistono solo lì) e solo se il
 * permesso non è ancora stato chiesto. Il permesso viene chiesto dal tocco
 * su "Attiva notifiche", come richiedono i browser. Dopo "Non ora" torna
 * dopo 14 giorni; se il permesso è stato negato non compare più.
 */
export default function NotificationPrompt(): import("react/jsx-runtime").JSX.Element | null;
