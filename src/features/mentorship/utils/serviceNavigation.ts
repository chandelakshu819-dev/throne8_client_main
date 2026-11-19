// src/features/mentorship/utils/serviceNavigation.ts
import TokenStorage from "@/lib/store/token.storage";
import { buildLoginRedirectUrl } from "@/shared/utils/safeRedirect";

/**
 * Service card ke "Book Session" / card click par call karo.
 * - Logged-in user  -> /mentorship/service/:id
 * - Logged-out user -> /login?redirect=/mentorship/service/:id
 *   (login ke baad user wapas isi service page par aayega)
 */
export const goToServiceDetails = (
    router: { push: (href: string) => void },
    serviceId: string
): void => {
    const target = `/mentorship/service/${serviceId}`;
    if (!TokenStorage.isAuthenticated()) {
        router.push(buildLoginRedirectUrl(target));
        return;
    }
    router.push(target);
};
