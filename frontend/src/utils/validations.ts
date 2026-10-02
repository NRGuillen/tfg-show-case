const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIE_PREFIX: Record<string, string> = { X: '0', Y: '1', Z: '2' };

const CIF_LETTERS = 'JABCDEFGHI';
const CIF_FORMAT = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;

const normalizeId = (value: string) => value.trim().toUpperCase().replace(/[\s.-]/g, '');

const dniControlLetter = (digits: string): string =>
    DNI_LETTERS[parseInt(digits, 10) % 23];

/** DNI español: 8 dígitos + letra de control. */
export const validateDNI = (dni: string): boolean => {
    const normalized = normalizeId(dni);
    if (!/^\d{8}[A-Z]$/.test(normalized)) return false;
    return normalized[8] === dniControlLetter(normalized.slice(0, 8));
};

/** NIE español: X/Y/Z + 7 dígitos + letra de control. */
export const validateNIE = (nie: string): boolean => {
    const normalized = normalizeId(nie);
    if (!/^[XYZ]\d{7}[A-Z]$/.test(normalized)) return false;
    const digits = NIE_PREFIX[normalized[0]] + normalized.slice(1, 8);
    return normalized[8] === dniControlLetter(digits);
};

/** DNI o NIE español. */
export const validateDniNie = (value: string): boolean => {
    const normalized = normalizeId(value);
    if (/^\d{8}[A-Z]$/.test(normalized)) return validateDNI(normalized);
    if (/^[XYZ]\d{7}[A-Z]$/.test(normalized)) return validateNIE(normalized);
    return false;
};

/**
 * Número de Afiliación a la Seguridad Social (12 dígitos).
 * Provincias válidas: 01–52.
 * Dígito de control (2 dígitos): 97 - (primeros 10 dígitos % 97).
 */
export const validateNSS = (nss: string): boolean => {
    const digits = nss.replace(/\D/g, '');
    if (digits.length !== 12) return false;

    const province = parseInt(digits.slice(0, 2), 10);
    if (province < 1 || province > 52) return false; // 53 no existe

    const base = BigInt(digits.slice(0, 10));
    const control = parseInt(digits.slice(10, 12), 10);
    const expected = 97 - Number(base % 97n);

    return control === expected;
};

/** CIF español: 1 letra + 7 dígitos + dígito/letra de control (9 caracteres). */
export const validateCIF = (cif: string): boolean => {
    const normalized = cif.trim().toUpperCase().replace(/[\s.-]/g, '');

    if (normalized.length !== 9 || !CIF_FORMAT.test(normalized)) {
        return false;
    }

    const type = normalized[0];
    const digits = normalized.slice(1, 8);
    const control = normalized[8];

    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        const n = parseInt(digits[i], 10);
        if (i % 2 === 0) {
            const doubled = n * 2;
            sum += Math.floor(doubled / 10) + (doubled % 10);
        } else {
            sum += n;
        }
    }

    const controlDigit = (10 - (sum % 10)) % 10;
    const expectedLetter = CIF_LETTERS[controlDigit];
    const expectedDigit = String(controlDigit);

    if ('PQRSNW'.includes(type)) {
        return control === expectedLetter;
    }
    if ('ABEH'.includes(type)) {
        return control === expectedDigit || control === expectedLetter;
    }
    return control === expectedDigit;
};

export const validateLuhn = (cardNumber: string): boolean => {
    const cleanNumber = cardNumber.replace(/\D/g, '');

    // La mayoría de las tarjetas tienen entre 13 y 19 dígitos
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber.charAt(i));

        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return (sum % 10) === 0;
};