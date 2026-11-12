// Shared math sanitization & explanation formatting for solve sheets (admin.html) and result views (result.html).

function sanitizeMathInner(inner) {
    let s = String(inner || '').replace(/<br\s*\/?>/gi, ' ').replace(/\r?\n/g, ' ').trim();
    // Fix subscripts/superscripts inside \text{...}/\textbf{...}/\mathrm{...} which trigger red KaTeX ParseErrors.
    s = s.replace(/\\(text|textbf|textit|mathrm)\{([^{}]*)\}/g, function(full, cmd, body) {
        if (!/[_^]/.test(body)) return full;
        const fixedBody = body
            .replace(/([A-Za-z0-9]+)_([A-Za-z0-9]+)/g, '}$1_{$2}\\' + cmd + '{')
            .replace(/([A-Za-z0-9]+)\^([A-Za-z0-9]+)/g, '}$1^{$2}\\' + cmd + '{');
        return ('\\' + cmd + '{' + fixedBody + '}').replace(/\\(?:text|textbf|textit|mathrm)\{\}/g, '');
    });
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tokenizeMathAndText(raw) {
    const tokens = [];
    let i = 0;
    const len = raw.length;
    let textBuf = '';

    const flushText = function() {
        if (textBuf) {
            tokens.push({ type: 'text', val: textBuf });
            textBuf = '';
        }
    };

    while (i < len) {
        if (raw[i] === '\\' && raw[i + 1] === '[') {
            const end = raw.indexOf('\\]', i + 2);
            if (end !== -1) {
                flushText();
                tokens.push({ type: 'math', val: sanitizeMathInner(raw.slice(i + 2, end)), display: true });
                i = end + 2;
                continue;
            }
        }
        if (raw[i] === '\\' && raw[i + 1] === '(') {
            const end = raw.indexOf('\\)', i + 2);
            if (end !== -1) {
                flushText();
                tokens.push({ type: 'math', val: sanitizeMathInner(raw.slice(i + 2, end)), display: false });
                i = end + 2;
                continue;
            }
        }
        if (raw[i] === '$') {
            if (raw[i + 1] === '$') {
                const nextDollar = raw.indexOf('$$', i + 2);
                const between = nextDollar !== -1 ? raw.slice(i + 2, nextDollar) : '';
                if (nextDollar !== -1 && between.trim().length > 0 && !between.includes('$')) {
                    flushText();
                    tokens.push({ type: 'math', val: sanitizeMathInner(between), display: true });
                    i = nextDollar + 2;
                    continue;
                }
                textBuf += ' ';
                i += 2;
                continue;
            }
            let j = i + 1;
            let foundEnd = -1;
            while (j < len) {
                if (raw[j] === '\\' && raw[j + 1] === '$') {
                    j += 2;
                    continue;
                }
                if (raw[j] === '$') {
                    foundEnd = j;
                    break;
                }
                j++;
            }
            if (foundEnd !== -1) {
                flushText();
                tokens.push({ type: 'math', val: sanitizeMathInner(raw.slice(i + 1, foundEnd)), display: false });
                i = foundEnd + 1;
                continue;
            }
        }
        textBuf += raw[i];
        i++;
    }
    flushText();
    return tokens;
}

function sanitizeInlineLatex(raw) {
    if (!raw) return '';
    return tokenizeMathAndText(String(raw)).map(function(tok) {
        if (tok.type === 'text') return tok.val;
        return tok.display ? '$$' + tok.val + '$$' : '$' + tok.val + '$';
    }).join('');
}

function formatExplanationTextChunk(txt) {
    let t = txt.replace(/\r?\n/g, '<br>');
    t = t.replace(/।([^\s<])/g, '। $1');
    t = t.replace(/([^\d\s]):\s*(?=$|\S)/g, function(m, prev, offset, str) {
        const beforeColon = str.slice(0, offset + 1);
        if (/ধাপ\s*[০-৯\d]+$/.test(beforeColon)) return prev + ': ';
        const after = str.slice(offset + m.length);
        if (after === '' || after.startsWith('<br>') || after.length >= 12) return prev + ':<br>';
        return prev + ': ';
    });
    t = t.replace(/\s*(ধাপ\s*[০-৯\d]+\s*:)/g, '<br>$1');
    t = t.replace(/।\s*(অথবা,|বিকল্প:|শর্টকাট:|বিশেষ নোট:)/g, '।<br>$1');
    return t;
}

function formatExplanationHtml(raw) {
    if (!raw) return '';
    const s = String(raw).replace(/\r\n/g, '\n').trim();
    const tokens = tokenizeMathAndText(s);

    const expanded = [];
    tokens.forEach(function(tok) {
        if (tok.type === 'math' && !tok.display && /\\(Rightarrow|implies)\b/.test(tok.val)) {
            const parts = tok.val.split(/(?=\\(?:Rightarrow|implies)\b)/g);
            if (parts.length > 1 && parts[0].includes('=') && parts[0].trim().length > 8) {
                parts.forEach(function(part, idx) {
                    const pTrim = part.trim();
                    if (pTrim) {
                        if (idx > 0) expanded.push({ type: 'break' });
                        expanded.push({ type: 'math', val: pTrim, display: false });
                    }
                });
                return;
            }
        }
        expanded.push(tok);
    });

    let out = '';
    let charsSinceBreak = 0;

    for (let k = 0; k < expanded.length; k++) {
        const cur = expanded[k];
        const prev = k > 0 ? expanded[k - 1] : null;

        if (cur.type === 'break') {
            if (!out.endsWith('<br>')) out += '<br>';
            charsSinceBreak = 0;
            continue;
        }

        if (cur.type === 'math') {
            if (prev && prev.type === 'math') {
                const startsStep = /^(=|\\Rightarrow|\\implies|\\therefore|\\approx|[a-zA-Z]\s*=)/.test(cur.val);
                if (startsStep || (prev.val.includes('=') && cur.val.includes('='))) {
                    if (!out.endsWith('<br>')) out += '<br>';
                    charsSinceBreak = 0;
                } else {
                    out += ' ';
                }
            } else if (prev && prev.type === 'text') {
                if (out && !/[\s>(<\[{'"“‘-]$/.test(out)) out += ' ';
            }

            const isOwnLine = cur.display || out === '' || out.endsWith('<br>') || (prev && prev.type === 'break');
            cur._wasOwnLine = isOwnLine;

            if (cur.display) {
                out += '<div style="margin:4px 0;">$$' + cur.val + '$$</div>';
                charsSinceBreak = 0;
            } else {
                out += '$' + cur.val + '$';
                charsSinceBreak = isOwnLine ? cur.val.length : (charsSinceBreak + cur.val.length);
            }
            continue;
        }

        let chunk = formatExplanationTextChunk(cur.val);

        if (prev && prev.type === 'math' && !prev.display) {
            const isStepEq = /^(=|\\Rightarrow|\\implies|\\therefore|\\approx)/.test(prev.val) || (prev._wasOwnLine && prev.val.includes('='));
            const trimmedChunk = chunk.replace(/^[\s।,.;]+/, '');
            const isParticle = /^(এর|এ|তে|কে|র|হলে|থেকে|হতে|দ্বারা|দিয়ে|নিয়ে|এবং|ও|বা|অর্থাৎ|যা|যার|যেখানে|ভিন্ন|সমান|বর্গ|একক|মিটার|সেমি|লিটার|গ্রাম|মোল|ডাইন|নিউটন|জুল|ওয়াট|ভোল্ট|অ্যাম্পিয়ার|ওহম|হার্জ|সেকেন্ড|মিনিট|ঘণ্টা)\b/.test(trimmedChunk);
            if (isStepEq && trimmedChunk.length > 0 && !isParticle) {
                chunk = chunk.replace(/^\s*(?:।\s*)?/, function(m) { return (m.includes('।') ? '।' : '') + '<br>'; });
            }
        }

        if (prev && prev.type === 'math' && chunk && !/^[\s।,.;:?!)\]}>"'”’<-]/.test(chunk)) {
            chunk = ' ' + chunk;
        }

        if (prev && prev.type === 'math' && prev.val.includes('=') && /^\s*(?:।\s*)?(অতএব|সুতরাং)[,\s]/.test(chunk)) {
            chunk = chunk.replace(/^(\s*।)?\s*(অতএব|সুতরাং)/, function(_, dari, word) {
                return (dari ? '।' : '') + '<br>' + word;
            });
        }

        let finalChunk = '';
        const parts = chunk.split(/(<br>)/);
        for (let pIdx = 0; pIdx < parts.length; pIdx++) {
            const part = parts[pIdx];
            if (part === '<br>') {
                if (!out.endsWith('<br>') && !finalChunk.endsWith('<br>')) finalChunk += '<br>';
                charsSinceBreak = 0;
            } else {
                const sentences = part.split(/(। )/);
                let rebuilt = '';
                for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
                    const piece = sentences[sIdx];
                    rebuilt += piece;
                    charsSinceBreak += piece.length;
                    if (piece === '। ' && charsSinceBreak >= 170) {
                        const upcoming = sentences.slice(sIdx + 1).join('');
                        if (upcoming.trim() && !upcoming.trim().startsWith('©')) {
                            rebuilt += '<br>';
                            charsSinceBreak = 0;
                        }
                    }
                }
                finalChunk += rebuilt;
            }
        }
        out += finalChunk;
    }

    return out.replace(/(<br>\s*)+/g, '<br>').replace(/^<br>|<br>$/g, '').trim();
}
