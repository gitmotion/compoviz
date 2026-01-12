import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from './sanitizeSvg';

describe('sanitizeSvg', () => {
    it('removes scripts, event handlers, and javascript hrefs', () => {
        const svg = [
            '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">',
            '<script>alert(1)</script>',
            '<a href="javascript:alert(1)">link</a>',
            '<rect width="10" height="10" onclick="alert(2)" />',
            '</svg>',
        ].join('');

        const sanitized = sanitizeSvg(svg);

        expect(sanitized).not.toBeNull();
        expect(sanitized.querySelector('script')).toBeNull();
        expect(sanitized.getAttribute('onload')).toBeNull();
        expect(sanitized.querySelector('a')?.getAttribute('href')).toBeNull();
        expect(sanitized.querySelector('rect')?.getAttribute('onclick')).toBeNull();
    });
});
