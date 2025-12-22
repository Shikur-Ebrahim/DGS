import { Language } from "./translations";

export interface Country {
    name: string;
    code: string;
    callingCode: string;
    flag: string;
    preferredLanguage?: Language;
}

export const countries: Country[] = [
    { name: "United States", code: "US", callingCode: "+1", flag: "/Flag_of_the_United_States.png", preferredLanguage: "en" },
    { name: "United Kingdom", code: "GB", callingCode: "+44", flag: "/United Kingdom.webp", preferredLanguage: "en" },
    { name: "Canada", code: "CA", callingCode: "+1", flag: "/Canada.png", preferredLanguage: "en" },
    { name: "Australia", code: "AU", callingCode: "+61", flag: "/Australia.webp", preferredLanguage: "en" },
    { name: "New Zealand", code: "NZ", callingCode: "+64", flag: "/Flag_of_New_Zealand.svg.png", preferredLanguage: "en" },
    { name: "China", code: "CN", callingCode: "+86", flag: "/China.png", preferredLanguage: "zh" },
    { name: "Taiwan", code: "TW", callingCode: "+886", flag: "/Taiwan.png", preferredLanguage: "zh" },
    { name: "Singapore", code: "SG", callingCode: "+65", flag: "/Singapore.webp", preferredLanguage: "zh" },
    { name: "Saudi Arabia", code: "SA", callingCode: "+966", flag: "/Saudi Arabia.png", preferredLanguage: "ar" },
    { name: "Egypt", code: "EG", callingCode: "+20", flag: "/Egypt.png", preferredLanguage: "ar" },
    { name: "United Arab Emirates", code: "AE", callingCode: "+971", flag: "/United Arab Emirates.png", preferredLanguage: "ar" },
    { name: "Morocco", code: "MA", callingCode: "+212", flag: "/Morocco.png", preferredLanguage: "ar" },
    { name: "Jordan", code: "JO", callingCode: "+962", flag: "/Jordan.webp", preferredLanguage: "ar" },
    { name: "Ethiopia", code: "ET", callingCode: "+251", flag: "/Ethiopia.png", preferredLanguage: "am" },
    { name: "Eritrea", code: "ER", callingCode: "+291", flag: "/Eritrea.png", preferredLanguage: "ti" },
    { name: "Spain", code: "ES", callingCode: "+34", flag: "/Spain.png", preferredLanguage: "es" },
    { name: "Mexico", code: "MX", callingCode: "+52", flag: "/Mexico.png", preferredLanguage: "es" },
    { name: "Colombia", code: "CO", callingCode: "+57", flag: "/Colombia.jpg", preferredLanguage: "es" },
    { name: "Argentina", code: "AR", callingCode: "+54", flag: "/Argentina.webp", preferredLanguage: "es" },
    { name: "France", code: "FR", callingCode: "+33", flag: "/France.png", preferredLanguage: "fr" },
    { name: "Belgium", code: "BE", callingCode: "+32", flag: "/Belgium.png", preferredLanguage: "fr" },
    { name: "Senegal", code: "SN", preferredLanguage: "fr", callingCode: "+221", flag: "/Senegal.webp" },
    { name: "Russia", code: "RU", callingCode: "+7", flag: "/Russia.png", preferredLanguage: "ru" },
    { name: "Belarus", code: "BY", callingCode: "+375", flag: "/Belarus.jpg", preferredLanguage: "ru" },
    { name: "Kazakhstan", code: "KZ", callingCode: "+7", flag: "/Kazakhstan.png", preferredLanguage: "ru" },
];
