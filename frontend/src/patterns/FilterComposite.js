/**
 * Composite pattern (dashboard layer): search / filter tree.
 *
 * Each FilterLeaf encapsulates one filter criterion.
 * FilterComposite treats leaves uniformly when narrowing a profile list.
 *
 * SOLID: SRP per filter, OCP add new leaves, LSP same apply() interface.
 */

class FilterNode {
    apply(list) { return list; }
}

export class TextFilterLeaf extends FilterNode {
    constructor(fieldKey, value) {
        super();
        this.fieldKey = fieldKey;
        this.value = (value || '').trim().toLowerCase();
    }
    apply(list) {
        if (!this.value) return list;
        return list.filter(p => (p[this.fieldKey] || '').toLowerCase().includes(this.value));
    }
}

export class SearchQueryLeaf extends FilterNode {
    constructor(query, fields = ['displayName', 'bio', 'email', 'username']) {
        super();
        this.query = (query || '').trim().toLowerCase();
        this.fields = fields;
    }
    apply(list) {
        if (!this.query) return list;
        return list.filter((p) => {
            if (this.fields.some((f) => String(p[f] ?? '').toLowerCase().includes(this.query))) {
                return true;
            }
            return String(p.id ?? '').includes(this.query);
        });
    }
}

export class FilterComposite extends FilterNode {
    constructor(children = []) {
        super();
        this.children = children;
    }
    add(child) { this.children.push(child); return this; }
    apply(list) { return this.children.reduce((r, n) => n.apply(r), list); }
}

export const buildSearchFilters = (filters, query = '') => {
    const c = new FilterComposite();
    if (query) c.add(new SearchQueryLeaf(query));
    if (filters.location) c.add(new TextFilterLeaf('location', filters.location));
    if (filters.sect) c.add(new TextFilterLeaf('sect', filters.sect));
    if (filters.caste) c.add(new TextFilterLeaf('caste', filters.caste));
    if (filters.education) c.add(new TextFilterLeaf('education', filters.education));
    return c;
};
