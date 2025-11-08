
export const getCurrencySymbol = (currencyCode: string): string => {
    const symbols: { [key: string]: string } = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CHF': 'Fr',
        'MXN': '$',
        'ARS': '$',
        'CLP': '$',
        'COP': '$',
        'PEN': 'S/',
        'UYU': '$U',
        'BOB': 'Bs.',
        'CRC': '₡',
        'CUP': '$',
        'DOP': 'RD$',
        'GTQ': 'Q',
        'HNL': 'L',
        'NIO': 'C$',
        'PAB': 'B/.',
        'PYG': '₲',
        'VES': 'Bs.S.',
    };
    return symbols[currencyCode] || currencyCode;
};
