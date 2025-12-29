"use server";

export async function translateText(text: string, targetLang: 'am' | 'om') {
    try {
        // Using MyMemory API (free tier)
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`, {
            method: "GET",
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Translation API error:", errorText);
            throw new Error(`Translation failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.responseStatus !== 200) {
            throw new Error(data.responseDetails || "Translation provider error");
        }

        let translatedText = data.responseData.translatedText;

        // Improve quality by filtering matches
        if (data.matches && Array.isArray(data.matches)) {
            const matches = data.matches;
            // Prefer matches that are NOT from "Public Web" if possible
            const reliableMatches = matches.filter((m: any) => m['created-by'] !== 'Public Web' && m['created-by'] !== 'Turn');

            if (reliableMatches.length > 0) {
                // Sort by match score/quality
                reliableMatches.sort((a: any, b: any) => (b.match || 0) - (a.match || 0));
                translatedText = reliableMatches[0].translation;
            } else if (matches.length > 0) {
                // Fallback to best available if only Public Web exists
                matches.sort((a: any, b: any) => (b.match || 0) - (a.match || 0));
                translatedText = matches[0].translation;
            }
        }

        return { success: true, translatedText: translatedText };
    } catch (error: any) {
        console.error("Translation error details:", error);
        return { success: false, error: error.message || "Failed to translate message." };
    }
}
