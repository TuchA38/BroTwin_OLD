document.addEventListener('DOMContentLoaded', function() {
    function replaceSingleLettersWithNbsp(node) {
        // Sprawdzenie, czy węzeł to tekstowy węzeł i przetworzenie go
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;

            // --- 0) Normalizacja: zamień różne niełamiące/zero-width spacje na zwykłą spację
            // (ułatwia dalsze reguły; zapobiega kumulacji różnych NBSP)
            text = text.replace(/[\u00A0\u202F\u2007\u2060]+/g, ' ');

            // --- 1) Usuń wielokrotne spacje
            text = text.replace(/ {2,}/g, ' ');

            // --- 2) Niełamliwy myślnik wewnątrz wyrazów (kot-pies -> kot\u2011pies)
            text = text.replace(/([A-Za-zÀ-ž0-9])\-([A-Za-zÀ-ž0-9])/g, '$1\u2011$2');

            // --- 3) Dash (krótkie, en, em) między wyrazami — bardzo odporne zabezpieczenie:
            // dopasuj sytuacje: <nie-biała>* <dash> <nie-biała>*
            // i wstaw: non-breaking-space + word-joiner + dash + word-joiner + non-breaking-space
            // To utrzyma dash przy lewym i prawym wyrazie, nawet jeśli wcześniej były różne spacje.
            text = text.replace(/(\S)\s*([-\u2013\u2014])\s*(\S)/g, function(_, left, dash, right) {
                // zostaw odstęp wizualny jako NBSP, ale dodaj także WORD JOINER (\u2060) blisko dash
                return left + '\u00A0\u2060' + dash + '\u2060\u00A0' + right;
            });

            // --- 4) Pojedyncze literki (wyrazy jednowyrazowe) — zamieniamy "a " -> "a&nbsp;"
            // dopasowanie: początek linii lub spacja, potem 1 litera z listy, potem spacja
            // Używamy grup (nie lookbehind) dla kompatybilności.
            text = text.replace(/(^|\s)([awziouAWZIOU])\s+/g, function(_, before, letter) {
                return before + letter + '\u00A0';
            });

            // --- 5) Cyfry (pojedyncze cyfry) - "5 " -> "5&nbsp;"
            text = text.replace(/([0-9])\s+/g, '$1\u00A0');

            // --- 6) Usuń zbędne NBSP przed/po pauzach/znakach interpunkcyjnych, jeśli powstały (tuning)
            // (np. zamienimy " , " -> ", " ale tu ostrożnie - nie usuwamy tych przy dashach)
            text = text.replace(/\u00A0([,.:;?!])/g, '$1'); // usuń NBSP przed przecinkiem itp.

            // zapisz
            node.nodeValue = text;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Sprawdź, czy element jest zabroniony
            const forbiddenTags = ['A', 'HEADER', 'FOOTER', 'IMG', 'SCRIPT'];
            if (!forbiddenTags.includes(node.tagName)) {
                // Iteruj przez dzieci węzła
                node.childNodes.forEach(child => replaceSingleLettersWithNbsp(child));
            }
        }
    }

    function processBodyAndInfo() {
        // Przetwórz zawartość body
        replaceSingleLettersWithNbsp(document.body);
        // Przetwórz zawartość diva z id="info"
        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            replaceSingleLettersWithNbsp(infoDiv);
        }
        // Przetwórz elementy z klasą "akapit"
        const akapitElements = document.querySelectorAll('.akapit');
        akapitElements.forEach(el => replaceSingleLettersWithNbsp(el));

        const informacjaDiv = document.getElementById('informacja');
        if (informacjaDiv) {
            replaceSingleLettersWithNbsp(informacjaDiv);
        }

    }

    // Funkcja do monitorowania zmian w divie
    function observeInfoDiv() {
        const infoDiv = document.getElementById('info');
        if (infoDiv) {
            // Tworzenie obiektu MutationObserver
            const observer = new MutationObserver(() => {
                replaceSingleLettersWithNbsp(infoDiv);
            });

            // Konfiguracja obserwatora
            const config = { childList: true, subtree: true };
            observer.observe(infoDiv, config);
        }
    }

    function observeInformacjaDiv() {
        const informacjaDiv = document.getElementById('informacja');
        if (informacjaDiv) {
            // Tworzenie obiektu MutationObserver
            const observer = new MutationObserver(() => {
                replaceSingleLettersWithNbsp(informacjaDiv);
            });

            // Konfiguracja obserwatora
            const config = { childList: true, subtree: true };
            observer.observe(informacjaDiv, config);
        }
    }

    // Przetwórz początkowy stan
    processBodyAndInfo();
    // Rozpocznij obserwację zmian w divie
    observeInfoDiv();

    observeInformacjaDiv();
});