import { h, type FunctionalComponent, type VNode } from 'vue';

/**
 * Safe renderer for the static SVG shape markup stored in `src/data/about.ts`.
 *
 * The icon strings are compile-time constants (never user input), but they are
 * still not fed through v-html: DOMParser (XML mode — no script execution)
 * plus an explicit shape tag allow-list means only plain SVG geometry can
 * reach the DOM, with its attributes carried over as inert strings.
 */

/** SVG shape elements an icon may consist of (feather-icons style). */
const ALLOWED_TAGS = new Set(['circle', 'ellipse', 'g', 'line', 'path', 'polygon', 'polyline', 'rect']);

/** Parse results are cached: icon strings are a fixed set of constants. */
const cache = new Map<string, VNode[]>();

function renderMarkup(markup: string): VNode[] {
    const cached = cache.get(markup);
    if (cached) return cached;

    const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,
        'image/svg+xml',
    );
    // A parser error document has no <svg> children, so malformed markup renders nothing
    const nodes: VNode[] = [];
    for (const el of Array.from(doc.documentElement.children)) {
        const tag = el.tagName.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) continue;
        const attrs: Record<string, string> = {};
        for (const attr of Array.from(el.attributes)) attrs[attr.name] = attr.value;
        nodes.push(h(tag, attrs));
    }
    cache.set(markup, nodes);
    return nodes;
}

const SvgMarkup: FunctionalComponent<{ markup: string }> = (props) => renderMarkup(props.markup);
SvgMarkup.displayName = 'SvgMarkup';
SvgMarkup.props = {
    markup: { type: String, required: true },
};

export default SvgMarkup;
